import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_LOCATION || 'us-central1'
});

export async function runVerificationAgent(payload) {
  console.log(`[Verification Agent] Analyzing identities and property data...`);
  
  const prompt = `
    You are a meticulous Real Estate Verification Agent.
    Review the following extracted data from a contract.
    1. Check if the Grantor/Grantee names seem structurally valid.
    2. Determine the likely property zone (Residential, Commercial, Agricultural) based on the description.
    
    Respond ONLY with a JSON object matching this schema:
    {
      "identities_valid": true/false,
      "zone_type": "Residential/Commercial/Agricultural/Unknown",
      "flagged_issues": ["list any missing IDs or suspicious details here"]
    }

    DATA TO VERIFY:
    Parties: ${payload.parties}
    Property: ${payload.property}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text);
}