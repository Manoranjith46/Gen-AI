import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

export async function runVerificationAgent(payload) {
  console.log(`[Verification Agent] Analyzing identities and property data...`);

  const response = await openai.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are a meticulous Real Estate Verification Agent. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: `Review the following extracted data from a contract.
1. Check if the Grantor/Grantee names seem structurally valid.
2. Determine the likely property zone (Residential, Commercial, Agricultural) based on the description.

Respond with a JSON object matching this schema:
{
  "identities_valid": true/false,
  "zone_type": "Residential/Commercial/Agricultural/Unknown",
  "flagged_issues": ["list any missing IDs or suspicious details here"]
}

DATA TO VERIFY:
Parties: ${payload.parties}
Property: ${payload.property}`
      }
    ]
  });

  return JSON.parse(response.choices[0].message.content);
}
