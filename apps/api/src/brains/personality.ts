/**
 * personality.ts — how EBE talks. The owner picks a mode; it shapes the voice (the finalizer),
 * never the risk gate. Executive · Friendly · Advisor · Custom.
 */
export type Personality = 'executive' | 'friendly' | 'advisor' | 'custom';

const TONES: Record<Exclude<Personality, 'custom'>, string> = {
  executive: 'Tone: EXECUTIVE — crisp, brief, decisive. Few words. Lead with the action or the number.',
  friendly: 'Tone: FRIENDLY — warm, casual, encouraging, like a helpful friend. Natural and human.',
  advisor: 'Tone: ADVISOR — thoughtful. Recommend the best next move with one line of why.'
};

export function toneFor(p?: string, custom?: string): string {
  if (p === 'custom' && custom && custom.trim()) return `Tone (custom): ${custom.trim()}`;
  if (p && p in TONES) return TONES[p as Exclude<Personality, 'custom'>];
  return TONES.friendly; // default
}
