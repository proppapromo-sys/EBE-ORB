/**
 * personality.ts — how EBE talks. The owner picks a mode; it shapes ORB's single voice (the
 * finalizer) only — never the risk gate, and EBE never reveals the models behind it.
 *
 * Signature personas map ORB's voice to the model people associate with that feel — but to the
 * user it's always one ORB:
 *   Executive → GPT feel (direct, strategic)   Advisor → Claude feel (thoughtful, analytical)
 *   Explorer  → Gemini feel (curious, connected)
 */
import type { BrainProvider } from './types.js';

export type Personality = 'executive' | 'advisor' | 'explorer' | 'friendly' | 'custom';

type Persona = { tone: string; provider?: BrainProvider };

const PERSONAS: Record<Exclude<Personality, 'custom'>, Persona> = {
  executive: { tone: 'Tone: EXECUTIVE — direct, strategic, productive. Crisp and decisive; lead with the action or the number. Few words.', provider: 'openai' },
  advisor:   { tone: 'Tone: ADVISOR — thoughtful, analytical, patient. Recommend the best next move with one clear line of why.', provider: 'anthropic' },
  explorer:  { tone: 'Tone: EXPLORER — curious and research-minded. Connect the dots, surface useful context, stay practical.', provider: 'gemini' },
  friendly:  { tone: 'Tone: FRIENDLY — warm, casual, encouraging, like a helpful friend. Natural and human.' }
};

// Custom sub-styles the user can pick.
const CUSTOM_STYLES: Record<string, string> = {
  formal: 'crisp and professional', concise: 'as brief as possible', detailed: 'thorough and complete',
  motivational: 'upbeat and encouraging', business: 'business-focused and ROI-minded', casual: 'relaxed and casual'
};

export function personaTone(p?: string, custom?: string): string {
  if (p === 'custom') {
    const style = custom && CUSTOM_STYLES[custom.toLowerCase()];
    return `Tone (custom): ${style || (custom && custom.trim()) || 'natural and helpful'}.`;
  }
  return (p && p in PERSONAS ? PERSONAS[p as Exclude<Personality, 'custom'>] : PERSONAS.friendly).tone;
}

/** Which model should voice ORB for this persona (still presented as one ORB). */
export function personaProvider(p?: string): BrainProvider | undefined {
  return p && p in PERSONAS ? PERSONAS[p as Exclude<Personality, 'custom'>].provider : undefined;
}
