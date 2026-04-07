import { GoogleGenAI } from '@google/genai';
import Contract from '../models/Contract.js';
import AgentTask from '../models/AgentTask.js';

// Initialize the new unified Gen AI client for Vertex AI
const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_LOCATION || 'us-central1'
});

/**
 * The Orchestrator: Slices text and creates the DAG tasks
 * @param {string} contractId - The MongoDB ID of the main Contract
 * @param {string} rawText - The massive text dump from Document AI
 */
export async function runPrimaryAgent(contractId, rawText) {
  console.log(`[Primary Agent] Initiating semantic slicing for Contract: ${contractId}`);

  try {
    // 1. Update status to processing
    await Contract.findByIdAndUpdate(contractId, { status: 'processing' });

    const prompt = `
      You are an expert Escrow Officer. Analyze this text and return a JSON object.
      Schema: { "parties_involved": "text", "property_description": "text", "financial_terms": "text" }
      TEXT: ${rawText}
    `;

    // 2. Call the model
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    // 3. CORRECT DATA EXTRACTION for @google/genai
    // We use the .text() method provided by the response object
    const rawJsonResponse = result.response.text(); 
    
    if (!rawJsonResponse) {
       throw new Error("Gemini returned an empty response.");
    }

    console.log("[Primary Agent] Raw AI Response received and parsed.");
    const slicedData = JSON.parse(rawJsonResponse);
    
    // 4. Create the DAG tasks
    const verifyTaskName = `verify_${contractId}`;
    const ecTaskName = `ec_${contractId}`;
    const stampTaskName = `stamp_${contractId}`;

    const tasksToInsert = [
      {
        contractId,
        taskName: verifyTaskName,
        assignedAgent: 'Verification_Agent',
        status: 'pending',
        inputPayload: { 
          parties: slicedData.parties_involved, 
          property: slicedData.property_description 
        }
      },
      {
        contractId,
        taskName: ecTaskName,
        assignedAgent: 'EC_Agent',
        status: 'pending',
        inputPayload: { 
          property: slicedData.property_description, 
          parties: slicedData.parties_involved 
        }
      },
      {
        contractId,
        taskName: stampTaskName,
        assignedAgent: 'Stamp_Duty_Agent',
        status: 'blocked', 
        dependsOn: [verifyTaskName], 
        inputPayload: { 
          financials: slicedData.financial_terms 
        }
      }
    ];

    await AgentTask.insertMany(tasksToInsert);
    console.log(`[Primary Agent] ✅ DAG Tasks injected into MongoDB.`);

  } catch (error) {
    console.error(`[Primary Agent] ❌ CRITICAL FAILURE:`, error);
    // Update MongoDB so the frontend knows why it stopped
    await Contract.findByIdAndUpdate(contractId, { 
      status: 'failed', 
      errorLog: `Primary Agent Error: ${error.message}` 
    });
  }
}