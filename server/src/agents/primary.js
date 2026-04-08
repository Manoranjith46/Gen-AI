import OpenAI from 'openai';
import Contract from '../models/Contract.js';
import AgentTask from '../models/AgentTask.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

/**
 * The Orchestrator: Slices text and creates the DAG tasks
 */
export async function runPrimaryAgent(contractId, rawText) {
  console.log(`[Primary Agent] Initiating semantic slicing for Contract: ${contractId}`);
  console.log(`[Primary Agent] Raw text length: ${rawText.length} chars`);

  try {
    await Contract.findByIdAndUpdate(contractId, { status: 'processing' });

    const response = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an expert Escrow Officer. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: `Analyze this contract text and return a JSON object with this schema:
{ "parties_involved": "text", "property_description": "text", "financial_terms": "text" }

TEXT: ${rawText}`
        }
      ]
    });

    const rawJsonResponse = response.choices[0].message.content;

    if (!rawJsonResponse) {
      throw new Error("OpenAI returned an empty response.");
    }

    console.log("[Primary Agent] Raw AI Response received and parsed.");
    const slicedData = JSON.parse(rawJsonResponse);

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
    await Contract.findByIdAndUpdate(contractId, {
      status: 'failed',
      errorLog: `Primary Agent Error: ${error.message}`
    });
  }
}
