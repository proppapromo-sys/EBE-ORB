/**
 * stt.ts — speech-to-text via OpenAI Whisper. Powers true NATIVE voice input on mobile:
 * the app records audio (expo-av) → sends it here → gets text → convenes ORB. This is real
 * native functionality (not a webview), which is what satisfies Apple Guideline 4.2.
 */
import 'dotenv/config';
import { getPlatformKey } from './platformKeys.js';

export function sttConfigured(): boolean {
  return Boolean(getPlatformKey('OPENAI_API_KEY'));
}

export async function transcribe(base64Audio: string, mime = 'audio/m4a'): Promise<{ text: string; language?: string; note?: string }> {
  const key = getPlatformKey('OPENAI_API_KEY');
  if (!key) return { text: '', note: 'OPENAI_API_KEY not set' };
  try {
    const buf = Buffer.from(base64Audio, 'base64');
    const ext = (mime.split('/')[1] || 'm4a').replace('mpeg', 'mp3').replace(/;.*$/, '');
    const fd = new FormData();
    fd.append('file', new Blob([buf], { type: mime }), `audio.${ext}`);
    fd.append('model', 'whisper-1');
    // verbose_json returns the auto-detected language — Whisper handles 90+ languages natively, so
    // ORB transcribes whatever the user speaks, not just English, and learns which language it was.
    fd.append('response_format', 'verbose_json');
    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}` },
      body: fd
    });
    if (!r.ok) return { text: '', note: `stt ${r.status}: ${(await r.text()).slice(0, 150)}` };
    const d = (await r.json()) as { text?: string; language?: string };
    return { text: d.text ?? '', language: d.language };
  } catch (e) {
    return { text: '', note: e instanceof Error ? e.message : 'stt error' };
  }
}
