import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

export async function runECAgent(payload) {
  console.log(`[EC Agent] Checking for encumbrances and liens...`);

  const response = await openai.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are a Title & Encumbrance Investigator. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: `Review the property and party details to identify any mentions of loans, mortgages, stays, or liens.

Respond with a JSON object matching this schema:
{
  "clear_title_likely": true/false,
  "risk_factors": ["list of potential liens, debts, or 'None found'"]
}

DATA TO VERIFY:
Property: ${payload.property}
Parties: ${payload.parties}`
      }
    ]
  });

  return JSON.parse(response.choices[0].message.content);
}
