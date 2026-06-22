import OpenAI from 'openai';
import 'dotenv/config';
import { getPlatformKey } from './platformKeys.js';

/** Build an OpenAI client from the current key (owner-set in-app, or env). Null if no key yet. */
export function getOpenAI(): OpenAI | null {
  const key = getPlatformKey('OPENAI_API_KEY');
  return key ? new OpenAI({ apiKey: key }) : null;
}

export async function completeOrbPrompt(system: string, user: string) {
  const client = getOpenAI();
  if (!client) {
    return 'AI is not configured yet. Add your OpenAI key in Settings to enable ORB intelligence.';
  }

  const response = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.2
  });

  return response.choices[0]?.message?.content ?? '';
}
