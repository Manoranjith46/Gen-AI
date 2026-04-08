import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

export async function runStampDutyAgent(payload) {
  console.log(`[Stamp Duty Agent] Calculating taxes from financials...`);

  const response = await openai.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are a strict Financial Auditor for real estate. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: `Extract the total sale price (consideration) from the text.
Calculate the following estimated taxes:
- Stamp Duty: 7% of the sale price
- Registration Fee: 1% of the sale price

Respond with a JSON object matching this schema:
{
  "extracted_sale_price": number,
  "estimated_stamp_duty": number,
  "estimated_registration_fee": number,
  "currency": "The currency mentioned, e.g., USD, INR"
}

FINANCIAL TEXT:
${payload.financials}`
      }
    ]
  });

  return JSON.parse(response.choices[0].message.content);
}
