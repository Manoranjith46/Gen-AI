import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_LOCATION || 'us-central1'
});

export async function runECAgent(payload) {
  console.log(`[EC Agent] Checking for encumbrances and liens...`);
  
  const prompt = `
    You are a Title & Encumbrance Investigator.
    Review the property and party details to identify any mentions of loans, mortgages, stays, or liens.
    
    Respond ONLY with a JSON object matching this schema:
    {
      "clear_title_likely": true/false,
      "risk_factors": ["list of potential liens, debts, or 'None found'"]
    }

    DATA TO VERIFY:
    Property: ${payload.property}
    Parties: ${payload.parties}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text);
}