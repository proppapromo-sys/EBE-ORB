/**
 * geminiImage.ts — let Gemini generate/refresh the ORB's core imagery.
 *
 * Uses Gemini's image-generation model (env ORB_IMAGE_MODEL). Degrades gracefully: with no
 * GEMINI_API_KEY or no egress it returns { available:false, note } instead of throwing.
 */
import 'dotenv/config';
import { getPlatformKey } from './platformKeys.js';

const MODEL = process.env.ORB_IMAGE_MODEL || 'gemini-2.5-flash-image-preview';

export function imageConfigured(): boolean {
  return Boolean(getPlatformKey('GEMINI_API_KEY') || getPlatformKey('GOOGLE_API_KEY'));
}

const DEFAULT_PROMPT =
  'A luminous translucent crystal sphere holding smooth glowing liquid plasma — deep sapphire ' +
  'blue and violet with a warm golden molten core, soft volumetric inner glow, gentle swirling ' +
  'nebula energy. Absolutely NO lightning, NO electric bolts, NO text. Dark studio background, ' +
  'perfectly centered, square composition, photorealistic 3D render, high detail.';

export async function generateOrbImage(prompt?: string): Promise<{ available: boolean; dataUrl?: string; note?: string }> {
  const key = getPlatformKey('GEMINI_API_KEY') || getPlatformKey('GOOGLE_API_KEY');
  if (!key) return { available: false, note: 'GEMINI_API_KEY not set' };
  const text = prompt && prompt.trim() ? prompt.trim() : DEFAULT_PROMPT;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: { responseModalities: ['IMAGE'] }
      })
    });
    if (!r.ok) return { available: false, note: `gemini ${r.status}: ${(await r.text()).slice(0, 200)}` };
    const d = (await r.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string }; inline_data?: { data?: string; mime_type?: string } }[] } }[];
    };
    const parts = d.candidates?.[0]?.content?.parts ?? [];
    for (const p of parts) {
      const inl = p.inlineData ?? p.inline_data;
      if (inl?.data) {
        const mt = (p.inlineData?.mimeType ?? p.inline_data?.mime_type) || 'image/png';
        return { available: true, dataUrl: `data:${mt};base64,${inl.data}` };
      }
    }
    return { available: false, note: 'no image in Gemini response (model may not support image output)' };
  } catch (e) {
    return { available: false, note: e instanceof Error ? e.message : 'gemini image error' };
  }
}
