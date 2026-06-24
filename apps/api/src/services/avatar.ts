/**
 * avatar.ts — ORB's talking-head avatar (optional). Turns a real photo + ORB's words into a short
 * lip-synced video via a configurable provider (D-ID). This is the "build-your-avatar / use a real
 * pic" path: it stays OFF until an owner sets a D-ID key and an avatar image, and always degrades
 * gracefully — a missing key, missing image, or slow render returns a note, never throws.
 *
 * Honest scope: the orb's own audio-reactive lip-sync ships and works today; this humanoid avatar is a
 * third-party integration that needs a D-ID key and a publicly reachable photo URL to actually render.
 */
import { getPlatformKey } from './platformKeys.js';
import { getPlan } from '../billing/plans.js';

export type AvatarResult = { available: boolean; url?: string; id?: string; note?: string; disclosure?: string; locked?: boolean };

export function avatarConfigured(): boolean {
  return Boolean(getPlatformKey('DID_API_KEY'));
}

// Realistic talking avatars are a premium, sensitive feature — reserve them for the top tiers.
export function avatarAllowedFor(planId?: string): boolean {
  return ['executive', 'enterprise'].includes(getPlan(planId).id);
}

// Realistic avatars are always disclosed as AI — never passed off as a real recording.
const DISCLOSURE = 'AI-generated avatar';

// D-ID accepts the dashboard key either already-encoded or as "email:key" — handle both.
function authHeader(key: string): string {
  return key.includes(':') ? `Basic ${Buffer.from(key).toString('base64')}` : `Basic ${key}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Generate a lip-synced talking-head clip of `text` spoken by the face at `imageUrl`. */
export async function generateAvatar(text: string, imageUrl?: string): Promise<AvatarResult> {
  const key = getPlatformKey('DID_API_KEY');
  if (!key) return { available: false, note: 'Add a D-ID API key in the Keys tab to enable your talking avatar.' };
  const source = imageUrl || getPlatformKey('ORB_AVATAR_IMAGE_URL');
  if (!source) return { available: false, note: 'Set an avatar photo URL (ORB_AVATAR_IMAGE_URL) to use the talking avatar.' };
  if (/^data:/i.test(source)) return { available: false, note: 'The avatar photo must be a public image URL, not an inline image — D-ID fetches it directly.' };
  const headers = { authorization: authHeader(key), 'content-type': 'application/json' };
  try {
    const create = await fetch('https://api.d-id.com/talks', {
      method: 'POST', headers,
      body: JSON.stringify({ source_url: source, script: { type: 'text', input: text.slice(0, 800) } })
    });
    if (!create.ok) return { available: false, note: `avatar ${create.status}: ${(await create.text()).slice(0, 150)}` };
    const { id } = (await create.json()) as { id?: string };
    if (!id) return { available: false, note: 'Avatar render did not start.' };
    // Poll briefly for the finished clip (renders take a few seconds).
    for (let i = 0; i < 6; i++) {
      await sleep(1300);
      const r = await fetch(`https://api.d-id.com/talks/${id}`, { headers });
      if (!r.ok) continue;
      const d = (await r.json()) as { status?: string; result_url?: string };
      if (d.status === 'done' && d.result_url) return { available: true, url: d.result_url, id, disclosure: DISCLOSURE };
      if (d.status === 'error') return { available: false, note: 'Avatar render failed.', id };
    }
    return { available: false, id, note: 'Avatar is still rendering — try again in a moment.' };
  } catch (e) {
    return { available: false, note: e instanceof Error ? e.message : 'avatar error' };
  }
}
