/**
 * translate.ts — EBE's translation sense. Speaks English by default, but can translate to/from
 * any language on request. Uses an available council provider (OpenAI, else Anthropic).
 */
import { getProviderClient } from '../brains/providers.js';

/** Common language name → BCP-47 code (for matching a TTS voice on the client). */
export const LANG_CODES: Record<string, string> = {
  english: 'en-US', spanish: 'es-ES', french: 'fr-FR', german: 'de-DE', italian: 'it-IT',
  portuguese: 'pt-PT', dutch: 'nl-NL', russian: 'ru-RU', polish: 'pl-PL', turkish: 'tr-TR',
  arabic: 'ar-SA', hebrew: 'he-IL', hindi: 'hi-IN', urdu: 'ur-PK', bengali: 'bn-BD',
  mandarin: 'zh-CN', chinese: 'zh-CN', cantonese: 'zh-HK', japanese: 'ja-JP', korean: 'ko-KR',
  vietnamese: 'vi-VN', thai: 'th-TH', indonesian: 'id-ID', greek: 'el-GR', swedish: 'sv-SE',
  norwegian: 'nb-NO', danish: 'da-DK', finnish: 'fi-FI', czech: 'cs-CZ', romanian: 'ro-RO',
  hungarian: 'hu-HU', ukrainian: 'uk-UA', filipino: 'fil-PH', tagalog: 'fil-PH', swahili: 'sw-KE'
};

export function langCode(name: string): string {
  return LANG_CODES[name.trim().toLowerCase()] ?? 'en-US';
}

export type Translation = { available: boolean; translated: string; to: string; langCode: string; note?: string };

export async function translate(text: string, to: string, from?: string): Promise<Translation> {
  const target = to.trim();
  const client = getProviderClient('openai').configured
    ? getProviderClient('openai')
    : getProviderClient('anthropic');
  const model = client.provider === 'anthropic' ? 'claude-sonnet-4-6' : 'gpt-4.1-mini';
  if (!client.configured) {
    return { available: false, translated: text, to: target, langCode: langCode(target), note: 'No translation provider configured (set OPENAI_API_KEY or ANTHROPIC_API_KEY).' };
  }
  const system = `You are a professional translator. Translate the user's text into ${target}${from ? ` from ${from}` : ''}. ` +
    `Preserve tone and meaning. Output ONLY the translation — no quotes, no notes, no explanation.`;
  try {
    const { text: out, ok, note } = await client.complete({ model, system, user: text });
    return { available: ok, translated: (out || text).trim(), to: target, langCode: langCode(target), note: ok ? undefined : note };
  } catch (e) {
    return { available: false, translated: text, to: target, langCode: langCode(target), note: e instanceof Error ? e.message : 'translate error' };
  }
}
