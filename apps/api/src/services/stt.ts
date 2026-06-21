/**
 * stt.ts — speech-to-text via OpenAI Whisper. Powers true NATIVE voice input on mobile:
 * the app records audio (expo-av) → sends it here → gets text → convenes ORB. This is real
 * native functionality (not a webview), which is what satisfies Apple Guideline 4.2.
 */
import 'dotenv/config';

export function sttConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function transcribe(base64Audio: string, mime = 'audio/m4a'): Promise<{ text: string; note?: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { text: '', note: 'OPENAI_API_KEY not set' };
  try {
    const buf = Buffer.from(base64Audio, 'base64');
    const ext = (mime.split('/')[1] || 'm4a').replace('mpeg', 'mp3');
    const fd = new FormData();
    fd.append('file', new Blob([buf], { type: mime }), `audio.${ext}`);
    fd.append('model', 'whisper-1');
    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}` },
      body: fd
    });
    if (!r.ok) return { text: '', note: `stt ${r.status}: ${(await r.text()).slice(0, 150)}` };
    const d = (await r.json()) as { text?: string };
    return { text: d.text ?? '' };
  } catch (e) {
    return { text: '', note: e instanceof Error ? e.message : 'stt error' };
  }
}
