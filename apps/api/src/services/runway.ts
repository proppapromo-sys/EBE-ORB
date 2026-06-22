/**
 * runway.ts — AI video via the RunwayML Developer API (Gen-4 Turbo). Runway is image-to-video, so
 * ORB first paints a starting frame with the Gemini image model, then Runway animates it from the
 * prompt. Async task: create → poll /v1/tasks → output URL. Degrades gracefully without a key.
 *
 * Auth: Bearer RUNWAY_API_KEY + header X-Runway-Version: 2024-11-06  (api.dev.runwayml.com).
 */
import 'dotenv/config';
import { generateOrbImage } from './geminiImage.js';
import type { VideoResult } from './video.js';

const BASE = 'https://api.dev.runwayml.com';
const VERSION = process.env.RUNWAY_API_VERSION || '2024-11-06';
const MODEL = process.env.RUNWAY_VIDEO_MODEL || 'gen4_turbo';
const MAX_WAIT_MS = Number(process.env.ORB_VIDEO_MAX_WAIT_MS || 150000);
const POLL_MS = Number(process.env.ORB_VIDEO_POLL_MS || 6000);

function key(): string | undefined {
  return process.env.RUNWAY_API_KEY || process.env.RUNWAYML_API_SECRET;
}
export function runwayConfigured(): boolean {
  return Boolean(key());
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// gen4_turbo accepts a fixed set of pixel ratios; map common aspects onto them.
function ratioFor(aspect?: string): string {
  if (aspect === '9:16' || aspect === '720:1280') return '720:1280';
  if (aspect === '1:1' || aspect === '960:960') return '960:960';
  return '1280:720';
}

export async function generateRunwayVideo(prompt: string, opts?: { aspectRatio?: string; promptImage?: string }): Promise<VideoResult> {
  const k = key();
  if (!k) return { available: false, note: 'RUNWAY_API_KEY not set' };
  if (!prompt || !prompt.trim()) return { available: false, note: 'no prompt' };
  const headers = { Authorization: `Bearer ${k}`, 'X-Runway-Version': VERSION, 'content-type': 'application/json' };
  try {
    // 1) Starting frame: caller-supplied, else paint one with Gemini from the same prompt.
    let promptImage = opts?.promptImage;
    if (!promptImage) {
      const img = await generateOrbImage(prompt.trim());
      if (!img.available || !img.dataUrl) return { available: false, note: `runway needs a start image; image gen failed (${img.note || 'no image'})` };
      promptImage = img.dataUrl;
    }

    // 2) Create the image-to-video task.
    const start = await fetch(`${BASE}/v1/image_to_video`, {
      method: 'POST', headers,
      body: JSON.stringify({ model: MODEL, promptImage, promptText: prompt.trim(), ratio: ratioFor(opts?.aspectRatio), duration: 5 })
    });
    if (!start.ok) {
      const txt = (await start.text()).slice(0, 240);
      const hint = /credit|quota|billing|payment|insufficient/i.test(txt) ? ' (check your Runway credits/billing.)' : '';
      return { available: false, note: `runway create ${start.status}: ${txt}${hint}` };
    }
    const task = (await start.json()) as { id?: string };
    if (!task.id) return { available: false, note: 'runway: no task id returned' };

    // 3) Poll until the task finishes.
    const deadline = Date.now() + MAX_WAIT_MS;
    while (Date.now() < deadline) {
      await sleep(POLL_MS);
      const pr = await fetch(`${BASE}/v1/tasks/${task.id}`, { headers });
      if (!pr.ok) continue;
      const pj = (await pr.json()) as { status?: string; output?: string[]; failure?: string; failureCode?: string };
      const st = (pj.status || '').toUpperCase();
      if (st === 'SUCCEEDED') {
        const url = Array.isArray(pj.output) ? pj.output[0] : undefined;
        return url ? { available: true, url, mimeType: 'video/mp4' } : { available: false, note: 'runway: succeeded but no output url' };
      }
      if (st === 'FAILED') return { available: false, note: `runway failed: ${pj.failure || pj.failureCode || 'unknown'}` };
    }
    return { available: false, note: 'runway: still rendering (timed out waiting) — try again shortly' };
  } catch (e) {
    return { available: false, note: e instanceof Error ? e.message : 'runway error' };
  }
}
