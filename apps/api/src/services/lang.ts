/**
 * lang.ts — ORB's language sense. Detects which language the user is writing in so ORB can reply in
 * THE SAME language, preserving their intent rather than translating word-for-word (pragmatics over
 * literalism). Script detection is exact for non-Latin writing systems; Latin-script languages are
 * guessed from common-word frequency. It's a fast, reliable HINT — the model does the final matching
 * from the message itself, so a near-miss between, say, Spanish and Portuguese still reads correctly.
 *
 * Note: ORB's voice-tone (prosody) and environment (spatial) reads are language-independent — they
 * work in any language already. This layer adds the text/output side: understand and answer in-kind.
 */
export type Lang = { code: string; name: string; locale: string };

// Non-Latin scripts → unambiguous. Order matters: kana before Han (Japanese uses both), Hangul first.
const SCRIPTS: { code: string; name: string; locale: string; re: RegExp }[] = [
  { code: 'ko', name: 'Korean',   locale: 'ko-KR', re: /[가-힯]/ },
  { code: 'ja', name: 'Japanese', locale: 'ja-JP', re: /[぀-ヿ]/ },   // hiragana + katakana
  { code: 'zh', name: 'Chinese',  locale: 'zh-CN', re: /[一-鿿]/ },   // Han
  { code: 'ar', name: 'Arabic',   locale: 'ar-SA', re: /[؀-ۿ]/ },
  { code: 'hi', name: 'Hindi',    locale: 'hi-IN', re: /[ऀ-ॿ]/ },   // Devanagari
  { code: 'ru', name: 'Russian',  locale: 'ru-RU', re: /[Ѐ-ӿ]/ },   // Cyrillic
  { code: 'el', name: 'Greek',    locale: 'el-GR', re: /[Ͱ-Ͽ]/ },
  { code: 'he', name: 'Hebrew',   locale: 'he-IL', re: /[֐-׿]/ }
];

// Latin-script languages → frequency of common function words. Whole sentences detect reliably.
const STOP: Record<string, { name: string; locale: string; words: RegExp }> = {
  es: { name: 'Spanish',    locale: 'es-ES', words: /\b(el|la|los|las|de|que|y|en|un|una|por|con|para|está|estás|cómo|qué|gracias|hola|sí|pero|porque|muy|necesito|quiero)\b/gi },
  fr: { name: 'French',     locale: 'fr-FR', words: /\b(le|la|les|des|une|un|et|est|que|qui|pour|avec|vous|je|tu|bonjour|merci|oui|non|parce|très|comment|veux)\b/gi },
  pt: { name: 'Portuguese', locale: 'pt-PT', words: /\b(o|a|os|as|de|que|e|um|uma|por|com|para|está|você|como|obrigado|olá|sim|não|mas|porque|muito|preciso|quero)\b/gi },
  de: { name: 'German',     locale: 'de-DE', words: /\b(der|die|das|und|ist|nicht|ein|eine|ich|du|sie|mit|für|wie|danke|hallo|ja|nein|aber|weil|sehr|brauche|möchte)\b/gi },
  it: { name: 'Italian',    locale: 'it-IT', words: /\b(il|la|le|di|che|e|un|una|per|con|sono|come|grazie|ciao|sì|no|ma|perché|molto|voglio|bisogno)\b/gi },
  en: { name: 'English',    locale: 'en-US', words: /\b(the|is|are|and|to|of|a|in|you|i|what|how|please|thanks|yes|no|but|because|very|need|want)\b/gi }
};

const DEFAULT: Lang = { code: 'en', name: 'English', locale: 'en-US' };

/** Detect the language of a message — exact for non-Latin scripts, frequency-based otherwise. */
export function detectLang(message: string): Lang {
  const m = message || '';
  for (const s of SCRIPTS) if (s.re.test(m)) return { code: s.code, name: s.name, locale: s.locale };
  // English is the default: another Latin-script language must clearly out-score it (strict margin),
  // so a shared word like "a" doesn't flip an English sentence to Portuguese on a tie.
  let best = 'en', bestN = (m.match(STOP.en.words) || []).length;
  for (const [code, info] of Object.entries(STOP)) {
    if (code === 'en') continue;
    const n = (m.match(info.words) || []).length;
    if (n > bestN) { bestN = n; best = code; }
  }
  if (!bestN) return DEFAULT;   // nothing recognizable → assume English
  return { code: best, name: STOP[best].name, locale: STOP[best].locale };
}
