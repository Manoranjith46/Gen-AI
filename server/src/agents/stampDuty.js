import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_LOCATION || 'us-central1'
});

export async function runStampDutyAgent(payload) {
  console.log(`[Stamp Duty Agent] Calculating taxes from financials...`);
  
  const prompt = `
    You are a strict Financial Auditor for real estate.
    Extract the total sale price (consideration) from the text. 
    Calculate the following estimated taxes:
    - Stamp Duty: 7% of the sale price
    - Registration Fee: 1% of the sale price
    
    Respond ONLY with a JSON object matching this schema:
    {
      "extracted_sale_price": number,
      "estimated_stamp_duty": number,
      "estimated_registration_fee": number,
      "currency": "The currency mentioned, e.g., USD, INR"
    }

    FINANCIAL TEXT:
    ${payload.financials}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text);
}