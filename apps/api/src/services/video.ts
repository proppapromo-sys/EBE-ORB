/**
 * video.ts — ORB's video brain. One door, multiple engines: RunwayML (Gen-4) and Google Veo.
 * Picks the provider per request → ORB_VIDEO_PROVIDER env → whichever key is set (Runway preferred,
 * since it's opt-in). Tier-gated to the top plans (video is the priciest call). Always degrades
 * gracefully — a missing key/provider returns a note, never throws.
 */
import { getPlan } from '../billing/plans.js';
import { generateVeoVideo, veoConfigured } from './veo.js';
import { generateRunwayVideo, runwayConfigured } from './runway.js';

export type VideoProvider = 'runway' | 'veo';
export type VideoResult = {
  available: boolean;
  provider?: VideoProvider;
  url?: string;          // hosted video URL (Runway)
  dataUrl?: string;      // inline base64 video (Veo)
  mimeType?: string;
  locked?: boolean;
  note?: string;
};

/** Any video engine configured? */
export function videoConfigured(): boolean {
  return runwayConfigured() || veoConfigured();
}

/** Video is the priciest call — reserve it for the top tiers. */
export function videoAllowedFor(planId?: string): boolean {
  return ['executive', 'enterprise'].includes(getPlan(planId).id);
}

/** Resolve which engine to use. */
export function chooseProvider(requested?: string): VideoProvider | null {
  const want = (requested || process.env.ORB_VIDEO_PROVIDER || '').toLowerCase();
  if (want === 'runway') return runwayConfigured() ? 'runway' : (veoConfigured() ? 'veo' : null);
  if (want === 'veo') return veoConfigured() ? 'veo' : (runwayConfigured() ? 'runway' : null);
  if (runwayConfigured()) return 'runway';   // default preference: Runway when present
  if (veoConfigured()) return 'veo';
  return null;
}

export async function generateVideo(
  prompt: string,
  opts?: { aspectRatio?: string; provider?: string; promptImage?: string }
): Promise<VideoResult> {
  const provider = chooseProvider(opts?.provider);
  if (!provider) return { available: false, note: 'No video engine configured (set RUNWAY_API_KEY or GEMINI_API_KEY).' };
  const result = provider === 'runway'
    ? await generateRunwayVideo(prompt, { aspectRatio: opts?.aspectRatio, promptImage: opts?.promptImage })
    : await generateVeoVideo(prompt, { aspectRatio: opts?.aspectRatio });
  return { provider, ...result };
}
