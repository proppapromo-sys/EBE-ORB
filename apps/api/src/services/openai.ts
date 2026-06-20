import OpenAI from 'openai';
import 'dotenv/config';

export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function completeOrbPrompt(system: string, user: string) {
  if (!openai) {
    return 'AI is not configured yet. Add OPENAI_API_KEY to enable ORB intelligence.';
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.2
  });

  return response.choices[0]?.message?.content ?? '';
}
