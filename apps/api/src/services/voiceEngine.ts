/**
 * voiceEngine.ts — client for ORB's OWN voice engine: a self-hosted, open-source cloning model
 * (XTTS, in /voice-engine) that YOU run. No third party, no per-use fees. Clone stores a short
 * reference sample; speak conditions on it. Enabled by ORB_VOICE_ENGINE_URL. Degrades gracefully.
 */
import 'dotenv/config';

const BASE = (process.env.ORB_VOICE_ENGINE_URL || '').replace(/\/$/, '');

export function engineConfigured(): boolean {
  return Boolean(BASE);
}

export async function engineClone(
  name: string, audio: Buffer, mimeType?: string
): Promise<{ available: boolean; voiceId?: string; note?: string }> {
  if (!BASE) return { available: false, note: 'ORB_VOICE_ENGINE_URL not set' };
  if (!audio || !audio.length) return { available: false, note: 'no audio provided' };
  try {
    const FD: any = (globalThis as any).FormData;
    const BlobC: any = (globalThis as any).Blob;
    const ext = mimeType && /wav/i.test(mimeType) ? 'wav'
      : mimeType && /webm/i.test(mimeType) ? 'webm'
      : mimeType && /m4a|mp4/i.test(mimeType) ? 'm4a' : 'mp3';
    const fd = new FD();
    fd.append('name', name || 'ORB Voice');
    fd.append('file', new BlobC([audio], { type: mimeType || 'audio/mpeg' }), `sample.${ext}`);
    const r = await fetch(`${BASE}/clone`, { method: 'POST', body: fd });
    if (!r.ok) return { available: false, note: `engine clone ${r.status}: ${(await r.text()).slice(0, 200)}` };
    const d = (await r.json()) as { voice_id?: string; voiceId?: string };
    const id = d.voice_id || d.voiceId;
    return id ? { available: true, voiceId: id, note: 'Cloned on your own engine.' } : { available: false, note: 'engine: no voice id returned' };
  } catch (e) {
    return { available: false, note: e instanceof Error ? e.message : 'engine clone error' };
  }
}

export async function engineSpeak(
  text: string, voiceId?: string
): Promise<{ available: boolean; audioUrl?: string; note?: string }> {
  if (!BASE) return { available: false, note: 'ORB_VOICE_ENGINE_URL not set' };
  const clean = (text || '').trim().slice(0, 5000);
  if (!clean) return { available: false, note: 'no text' };
  try {
    const r = await fetch(`${BASE}/speak`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'audio/wav' },
      body: JSON.stringify({ text: clean, voice_id: voiceId || 'default' })
    });
    if (!r.ok) return { available: false, note: `engine speak ${r.status}: ${(await r.text()).slice(0, 200)}` };
    const buf = Buffer.from(await r.arrayBuffer());
    return { available: true, audioUrl: `data:audio/wav;base64,${buf.toString('base64')}` };
  } catch (e) {
    return { available: false, note: e instanceof Error ? e.message : 'engine speak error' };
  }
}
