/**
 * veo.ts — AI video generation via Google Veo, on the Gemini API. Uses the SAME key as image gen
 * (GEMINI_API_KEY from Google AI Studio) — no separate credential. Veo is a long-running op:
 * start → poll until done → download the result. Requires a PAID Gemini tier (Veo is metered per
 * second of video). Degrades gracefully: no key / no egress / not entitled → { available:false }.
 */
import 'dotenv/config';
import { getPlatformKey } from './platformKeys.js';
import type { VideoResult } from './video.js';

const MODEL = process.env.ORB_VIDEO_MODEL || 'veo-3.0-generate-preview';
const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MAX_WAIT_MS = Number(process.env.ORB_VIDEO_MAX_WAIT_MS || 150000);
const POLL_MS = Number(process.env.ORB_VIDEO_POLL_MS || 10000);
const MAX_INLINE_BYTES = 40 * 1024 * 1024; // don't inline videos larger than ~40MB

export function veoConfigured(): boolean {
  return Boolean(getPlatformKey('GEMINI_API_KEY') || getPlatformKey('GOOGLE_API_KEY'));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Walk an unknown Veo response shape for a video URI or inline bytes (shape varies by model/version). */
function findVideo(root: unknown): { uri?: string; b64?: string; mime?: string } | null {
  let found: { uri?: string; b64?: string; mime?: string } | null = null;
  const visit = (o: unknown): void => {
    if (found || !o || typeof o !== 'object') return;
    const obj = o as Record<string, any>;
    const vid = obj.video && typeof obj.video === 'object' ? obj.video : null;
    if (vid) {
      if (vid.uri) { found = { uri: String(vid.uri), mime: vid.mimeType || vid.mime_type }; return; }
      const b = vid.bytesBase64Encoded || vid.videoBytes || vid.data;
      if (b) { found = { b64: String(b), mime: vid.mimeType || vid.mime_type }; return; }
    }
    if (typeof obj.uri === 'string' && /(\.mp4|\.webm|video)/i.test(obj.uri)) { found = { uri: obj.uri, mime: obj.mimeType }; return; }
    const b = obj.bytesBase64Encoded || obj.videoBytes;
    if (b) { found = { b64: String(b), mime: obj.mimeType }; return; }
    for (const k of Object.keys(obj)) { visit(obj[k]); if (found) return; }
  };
  visit(root);
  return found;
}

export async function generateVeoVideo(prompt: string, opts?: { aspectRatio?: string }): Promise<VideoResult> {
  const key = getPlatformKey('GEMINI_API_KEY') || getPlatformKey('GOOGLE_API_KEY');
  if (!key) return { available: false, note: 'GEMINI_API_KEY not set' };
  if (!prompt || !prompt.trim()) return { available: false, note: 'no prompt' };
  try {
    // 1) Start the long-running generation.
    const start = await fetch(`${BASE}/models/${MODEL}:predictLongRunning?key=${key}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ instances: [{ prompt: prompt.trim() }], parameters: { aspectRatio: opts?.aspectRatio || '16:9' } })
    });
    if (!start.ok) {
      const txt = (await start.text()).slice(0, 240);
      const hint = /billing|quota|permission|not.*enabled|FAILED_PRECONDITION/i.test(txt) ? ' (Veo needs a paid Gemini tier — enable billing in Google AI Studio.)' : '';
      return { available: false, note: `veo start ${start.status}: ${txt}${hint}` };
    }
    const op = (await start.json()) as { name?: string };
    if (!op.name) return { available: false, note: 'veo: no operation name returned' };

    // 2) Poll until done (Veo typically takes ~1–2 minutes).
    const deadline = Date.now() + MAX_WAIT_MS;
    let done: any = null;
    while (Date.now() < deadline) {
      await sleep(POLL_MS);
      const pr = await fetch(`${BASE}/${op.name}?key=${key}`);
      if (!pr.ok) continue;
      const pj = (await pr.json()) as any;
      if (pj.done) { done = pj; break; }
    }
    if (!done) return { available: false, note: 'veo: still rendering (timed out waiting) — try again shortly' };
    if (done.error) return { available: false, note: `veo error: ${done.error.message || JSON.stringify(done.error).slice(0, 200)}` };

    // 3) Pull the video out and return it inline so the browser can play it.
    const v = findVideo(done.response ?? done);
    if (!v) return { available: false, note: 'veo: no video in response' };
    const mime = v.mime || 'video/mp4';
    if (v.b64) return { available: true, mimeType: mime, dataUrl: `data:${mime};base64,${v.b64}` };
    if (v.uri) {
      const sep = v.uri.includes('?') ? '&' : '?';
      const vr = await fetch(`${v.uri}${sep}key=${key}`);
      if (!vr.ok) return { available: false, note: `veo download ${vr.status}` };
      const buf = Buffer.from(await vr.arrayBuffer());
      if (buf.length > MAX_INLINE_BYTES) return { available: false, note: `veo: video too large to inline (${(buf.length / 1e6).toFixed(1)}MB)` };
      return { available: true, mimeType: mime, dataUrl: `data:${mime};base64,${buf.toString('base64')}` };
    }
    return { available: false, note: 'veo: no playable video found' };
  } catch (e) {
    return { available: false, note: e instanceof Error ? e.message : 'veo error' };
  }
}
