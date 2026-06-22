/**
 * tts.ts — ORB's real voice. Text-to-speech via ElevenLabs, the best voice-cloning engine: you
 * clone a voice once (in the ElevenLabs dashboard), set ELEVENLABS_VOICE_ID, and ORB speaks every
 * answer in that voice. Returns audio as a data URL the browser plays. Degrades gracefully: with no
 * key/voice the client just falls back to the built-in browser voice.
 */
import 'dotenv/config';
import { getPlatformKey } from './platformKeys.js';
import { engineConfigured, engineClone, engineSpeak, engineVerify } from './voiceEngine.js';

const DEFAULT_VOICE = process.env.ELEVENLABS_VOICE_ID;
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';

// A voice cloned at runtime (via /voice/clone) is used immediately, before any env is set.
let runtimeVoiceId: string | undefined;
export function setRuntimeVoice(id?: string): void { if (id) runtimeVoiceId = id; }
function activeVoice(): string | undefined { return runtimeVoiceId || DEFAULT_VOICE; }

function key(): string | undefined {
  return process.env.ELEVENLABS_API_KEY || getPlatformKey('ELEVENLABS_API_KEY');
}

/** A cloned voice is ready when ORB's own engine is up, or ElevenLabs has a key + voice id. */
export function ttsConfigured(): boolean {
  return engineConfigured() || Boolean(key() && activeVoice());
}

/** Create a cloned voice from audio. Prefers ORB's own engine; falls back to ElevenLabs. */
export async function cloneVoice(
  name: string, audio: Buffer, mimeType?: string
): Promise<{ available: boolean; voiceId?: string; note?: string }> {
  if (engineConfigured()) {
    const out = await engineClone(name, audio, mimeType);
    if (out.available) setRuntimeVoice(out.voiceId);  // speak in it immediately
    return out;
  }
  const k = key();
  if (!k) return { available: false, note: 'ELEVENLABS_API_KEY not set' };
  if (!audio || !audio.length) return { available: false, note: 'no audio provided' };
  try {
    const FD: any = (globalThis as any).FormData;
    const BlobC: any = (globalThis as any).Blob;
    const ext = mimeType && /wav/i.test(mimeType) ? 'wav' : mimeType && /m4a|mp4/i.test(mimeType) ? 'm4a' : 'mp3';
    const fd = new FD();
    fd.append('name', name || 'ORB Voice');
    fd.append('files', new BlobC([audio], { type: mimeType || 'audio/mpeg' }), `sample.${ext}`);
    const r = await fetch('https://api.elevenlabs.io/v1/voices/add', { method: 'POST', headers: { 'xi-api-key': k }, body: fd });
    if (!r.ok) return { available: false, note: `elevenlabs ${r.status}: ${(await r.text()).slice(0, 200)}` };
    const d = (await r.json()) as { voice_id?: string };
    if (!d.voice_id) return { available: false, note: 'no voice_id returned' };
    setRuntimeVoice(d.voice_id);  // start speaking in it right away
    return { available: true, voiceId: d.voice_id, note: 'Cloned. Set ELEVENLABS_VOICE_ID to this id to keep it after restarts.' };
  } catch (e) {
    return { available: false, note: e instanceof Error ? e.message : 'clone error' };
  }
}

/** Speaker recognition: does this clip match ORB's enrolled owner voice? Fails open (match:true). */
export async function verifySpeaker(
  audio: Buffer, mimeType?: string, voiceId?: string
): Promise<{ match: boolean; score?: number; enrolled?: boolean; note?: string }> {
  if (!engineConfigured()) return { match: true, note: 'no engine' };
  return engineVerify(audio, voiceId || activeVoice() || 'default', mimeType);
}

export async function synthesizeSpeech(
  text: string,
  opts?: { voiceId?: string }
): Promise<{ available: boolean; audioUrl?: string; note?: string }> {
  if (engineConfigured()) return engineSpeak(text, opts?.voiceId || activeVoice());
  const k = key();
  if (!k) return { available: false, note: 'ELEVENLABS_API_KEY not set' };
  const voice = opts?.voiceId || activeVoice();
  if (!voice) return { available: false, note: 'ELEVENLABS_VOICE_ID not set' };
  const clean = (text || '').trim().slice(0, 5000);
  if (!clean) return { available: false, note: 'no text' };
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: { 'xi-api-key': k, 'content-type': 'application/json', accept: 'audio/mpeg' },
      body: JSON.stringify({
        text: clean,
        model_id: MODEL,
        voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true }
      })
    });
    if (!r.ok) return { available: false, note: `elevenlabs ${r.status}: ${(await r.text()).slice(0, 200)}` };
    const buf = Buffer.from(await r.arrayBuffer());
    return { available: true, audioUrl: `data:audio/mpeg;base64,${buf.toString('base64')}` };
  } catch (e) {
    return { available: false, note: e instanceof Error ? e.message : 'tts error' };
  }
}
