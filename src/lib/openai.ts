import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSummary(articleText: string, prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: articleText },
    ],
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content || 'Failed to generate summary.';
}
