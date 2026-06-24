/**
 * comms.ts — ORB's Communication Layer. Humans don't just hear words; in milliseconds they read tone,
 * emotion, urgency and intent, then plan a response to match. This layer does the same *before* the
 * Council ever runs: it turns a message into a small "read" (is the user rushed? frustrated? unsure?
 * being playful?) and a posture directive that shapes HOW ORB replies — efficient, reassuring, warm.
 *
 * The same words mean different things by delivery:
 *   "ORB call John."   → a calm task.
 *   "ORB CALL JOHN!!"  → urgent / frustrated — act now, no chit-chat.
 *   "ORB call John…"   → hesitant — maybe check in before charging ahead.
 *
 * This is state, not personality: it's read fresh each turn and never stored. It reads only the
 * finished text the user chose to send — no raw audio, no background speech.
 */

// Urgency — is the user in a hurry? (Also the canonical home for this signal across ORB.)
// English plus the major languages' urgency words — prosody (voice tone) catches the rest in any tongue.
const URGENT_RE = /\b(asap|a\.s\.a\.p|urgent(?:ly)?|emergency|right now|right away|immediately|hurry|quick(?:ly)?|fast|now now|come on|no time|stat|on it now|ahora mismo|r[áa]pido|deprisa|maintenant|vite|d[ée]p[êe]che|urgente|agora|depressa|sofort|schnell|eilig|subito|presto|быстро|сейчас)\b|!{2,}/i;
export function isUrgent(message: string): boolean {
  if (URGENT_RE.test(message)) return true;
  const letters = (message || '').replace(/[^A-Za-z]/g, '');
  return letters.length >= 6 && letters === letters.toUpperCase();   // SHOUTING in all-caps
}

// Emotional read — a transient state, not a label. Conservative by design: default 'neutral' unless
// there's a clear cue, so ORB never mis-reads a plain question as an outburst.
export type Emotion = 'neutral' | 'frustrated' | 'hesitant' | 'playful';

const FRUSTRATED = /\b(ugh+|argh+|ffs|wtf|come on|seriously|are you kidding|for real|still (?:not|doesn'?t|won'?t|isn'?t)|again\?|why (?:isn'?t|won'?t|can'?t|aren'?t|does(?:n'?t)?)|not working|doesn'?t work|broken|frustrat\w*|annoying|ridiculous|hate this|fed up|stop it|useless|come on now)\b|[?!]{2,}/i;
const PLAYFUL = /\b(lol|lmao|lmfao|haha+|hehe+|rofl|jk|just kidding|kidding|teasing)\b|[😂🤣😉😜😏😎🙃]/u;
const HESITANT = /\b(um+|uh+|hmm+|i (?:think|guess|suppose)|maybe|not (?:really )?sure|kind of|sort of|i dunno|i don'?t know|possibly|might be|i'?m not sure|wondering if)\b/i;

export function readEmotion(message: string): Emotion {
  const m = message || '';
  if (FRUSTRATED.test(m)) return 'frustrated';
  if (PLAYFUL.test(m)) return 'playful';
  if (HESITANT.test(m) || /(?:\.\.\.|…)\s*$/.test(m.trim())) return 'hesitant';   // trailing "…" = unsure
  return 'neutral';
}

// Sarcasm — the surface words are positive but the meaning is the opposite. Humans read it from words
// + tone + CONTEXT (a positive word about a bad event) + history. ORB combines what it can from text
// and voice. The point isn't cleverness — it's that ORB never congratulates someone on a meeting that
// clearly bombed, and instead responds to how they actually feel.
const SARCASM = /\b(oh (?:great|wonderful|fantastic|perfect|good|joy)|just (?:great|perfect|wonderful|fantastic|brilliant|lovely)|thanks a lot|yeah,? right|sure it (?:is|will|does)|what could (?:possibly )?go wrong|love that for me|how wonderful|well that('?s| (?:went|was)).{0,30}\b(great|wonderful|perfect|fantastic|brilliant|swimmingly|wonderfully|perfectly|smoothly))\b/i;
const HYPERBOLIC_ADVERB = /\bwent\s+(?:so\s+)?(?:wonderfully|great|perfectly|fantastically|brilliantly|swimmingly|smoothly|amazingly)\b/i;
// Structural sarcasm — the shape gives it away regardless of tone.
const SARCASM_STRUCT = /\b(just what i needed|exactly what i needed|needed another|(?:like|as if) i needed|because .{0,40}wasn'?t .{0,25}enough)\b/i;
// A positive-affect word + a clearly negative event in the same breath = almost certainly sarcasm.
const POSITIVE = /\b(great|fantastic|wonderful|perfect(?:ly)?|brilliant(?:ly)?|awesome|amazing|lovely|excellent|terrific|fabulous|genius|splendid|marvel(?:ous|lous)|love (?:it|this|that))\b/i;
const STRONG_NEG = /\b(another|again|broke|broken|problem|issue|bug|crash(?:ed)?|delay(?:ed)?|deadline|due (?:today|tomorrow|tonight|now|this)|late|cancel(?:led|ed)?|flat tire|traffic|overtime|audit|fired|stuck|stranded|paperwork|more work)\b/i;
// Friendly teasing has its own reliable shape, even with no positive word.
const FRIENDLY_TEASE = /\b(look at you|well well|aren'?t you|nice of you|about time|showing up (?:on time|early)|finally (?:decided|showed|here)|showing up on time)\b/i;

export type SarcasmType = 'none' | 'friendly' | 'frustration' | 'self' | 'hostile';

/** Read whether a message is sarcastic, combining lexical tells, structure, context, and voice tone. */
export function sarcasmRead(message: string, prosody?: Prosody): { sarcastic: boolean; type: SarcasmType } {
  const m = message || '';
  const hasPos = POSITIVE.test(m);
  const sarcastic = SARCASM.test(m) || HYPERBOLIC_ADVERB.test(m) || SARCASM_STRUCT.test(m) || FRIENDLY_TEASE.test(m)
    || (hasPos && STRONG_NEG.test(m))                                   // context: praise about a bad event
    || (hasPos && (prosody === 'frustrated' || prosody === 'urgent'));  // tone: praise said tensely (e.g. "Brilliant idea.")
  return sarcastic ? { sarcastic: true, type: classifySarcasm(m) } : { sarcastic: false, type: 'none' };
}

// Four flavors carry different emotional weight, so ORB should respond to each differently.
function classifySarcasm(m: string): SarcasmType {
  if (FRIENDLY_TEASE.test(m)) return 'friendly';
  if (/\b(?:as if|because)\b[^.]*\b(?:i|my)\b/i.test(m) || /\bmy\b[^.]*\bwasn'?t\b[^.]*\benough\b/i.test(m)) return 'self';
  if (/\b(brilliant|genius|great|wonderful|fantastic|nice|smart|clever)\s+(idea|job|plan|move|thinking|work|one)\b/i.test(m) || /\byour\b/i.test(m)) return 'hostile';
  return 'frustration';
}

/** Back-compat boolean read. */
export function readSarcasm(message: string): boolean {
  return sarcasmRead(message).sarcastic;
}

// Thinking out loud — people often don't know what they think until they say it, so a great chief of
// staff doesn't just answer; sometimes it helps you clarify your OWN thinking. ORB detects when the
// user is wrestling with a decision or reasoning aloud, and shifts into thinking-partner mode.
const REFLECT = /\b(not sure (?:whether|if|what|how)|should i\b[^?]*\bor\b|do i\b[^?]*\bor\b|going back and forth|torn between|on (?:the )?one hand|trying to (?:figure|decide|work out|wrap my head)|can'?t decide|i don'?t know (?:what|how|whether|if)\b|thinking (?:out loud|through)|wrestling with|stuck on (?:whether|what|how)|debating (?:whether|if)|weighing (?:up|whether|my options)|help me think)\b/i;
export function readReflect(message: string): boolean {
  return REFLECT.test(message || '');
}

export type CommRead = { urgent: boolean; emotion: Emotion; sarcasm: boolean; sarcasmType: SarcasmType; reflect: boolean };

// Prosody — the read from the user's VOICE (pitch, energy, tempo), measured in the browser and sent
// as a single hint. This is what lets "Great." said four ways mean four things: the words are flat,
// the delivery isn't. Text always wins when it's explicit; prosody only fills a neutral, ambiguous turn.
export type Prosody = 'urgent' | 'frustrated' | 'excited' | 'calm' | 'neutral';
const PROSODY: Prosody[] = ['urgent', 'frustrated', 'excited', 'calm', 'neutral'];
export function asProsody(v: unknown): Prosody | undefined {
  return typeof v === 'string' && PROSODY.includes(v as Prosody) ? v as Prosody : undefined;
}

/** The full read for a turn — what the Communication Layer hands to the responder. */
export function analyzeComms(message: string, prosody?: Prosody): CommRead {
  let urgent = isUrgent(message);
  let emotion = readEmotion(message);
  const sr = sarcasmRead(message, prosody);
  // Voice fills the gap only when the words give nothing away (no explicit cue, no sarcasm).
  if (prosody && emotion === 'neutral' && !urgent && !sr.sarcastic) {
    if (prosody === 'urgent') urgent = true;
    else if (prosody === 'frustrated') emotion = 'frustrated';
    else if (prosody === 'excited') emotion = 'playful';
    // 'calm'/'neutral' leave the neutral read as-is.
  }
  // Sarcasm shapes the underlying feeling: friendly teasing is playful; the rest is real frustration,
  // so ORB de-escalates and offers help instead of taking the praise at face value.
  if (sr.sarcastic && emotion === 'neutral') emotion = sr.type === 'friendly' ? 'playful' : 'frustrated';
  return { urgent, emotion, sarcasm: sr.sarcastic, sarcasmType: sr.type, reflect: readReflect(message) };
}

/**
 * Turn the read into a quiet posture directive for the model (never shown or spoken). Matches the
 * human move: meet urgency with speed, frustration with calm efficiency, hesitation with reassurance,
 * play with warmth.
 */
// ── Adaptive voice: ORB tunes its own delivery to the moment ──
// The brain judges a voice — trust, confidence, calm — in a fraction of a second, before the words.
// So ORB doesn't speak every line the same way: it picks a register and dials rate/pitch/energy to
// match the user's state. Stress → slow, lower, controlled (de-escalate). Urgency → faster, crisp.
// Excitement → brighter, more energetic. Values map straight to the Web Speech API on the client.
export type VoiceTone = 'executive' | 'friendly' | 'emergency' | 'calm';
export type VoiceSpec = { tone: VoiceTone; rate: number; pitch: number; volume: number };
type HumorLevel = 'professional' | 'executive' | 'friendly' | 'playful';

const clampRate = (x: number) => Math.max(0.8, Math.min(1.3, Number(x.toFixed(3))));
const clampPitch = (x: number) => Math.max(0.8, Math.min(1.2, Number(x.toFixed(3))));
const clampVol = (x: number) => Math.max(0.7, Math.min(1.0, Number(x.toFixed(3))));

export function voiceFor(read: CommRead, humor: HumorLevel = 'executive'): VoiceSpec {
  // Baseline register from the relationship — executive is lower & controlled (authority/warmth);
  // friendly/playful are a touch brighter and more dynamic.
  let rate = 1.0, pitch = 0.97, volume = 1.0, tone: VoiceTone = 'executive';
  if (humor === 'friendly') { rate = 1.03; pitch = 1.0; tone = 'friendly'; }
  else if (humor === 'playful') { rate = 1.06; pitch = 1.03; tone = 'friendly'; }

  // State overrides the baseline — meet the person where they are.
  if (read.emotion === 'frustrated') { rate = 0.9; pitch = 0.94; volume = 0.92; tone = 'calm'; }       // stressed → de-escalate
  else if (read.urgent) { rate = 1.14; pitch = 1.0; volume = 1.0; tone = 'emergency'; }                // urgent → faster, crisp
  else if (read.emotion === 'hesitant') { rate = 0.95; pitch = 0.98; volume = 0.95; tone = 'calm'; }   // unsure → gentle, unhurried
  else if (read.emotion === 'playful') { rate = Math.max(rate, 1.06); pitch = Math.max(pitch, 1.03); tone = 'friendly'; } // match the energy

  return { tone, rate: clampRate(rate), pitch: clampPitch(pitch), volume: clampVol(volume) };
}

// ── Spatial Audio Intelligence: the read of the ENVIRONMENT the conversation is happening in.
// Humans infer room, distance, and occupancy from reverb and background sound; ORB infers the basics
// it can act on — how loud the place is, whether other people seem to be around, and (coarsely) how
// reverberant the room is — and adapts: short & clear in noise, privacy-aware in a crowd, well-paced
// in an echoey space. Measured in-browser; only the summary is sent.
export type Scene = { noise: 'quiet' | 'moderate' | 'loud'; crowd?: boolean; space?: 'live' | 'normal' | 'damped' };
const NOISE_LEVELS = ['quiet', 'moderate', 'loud'];
const SPACES = ['live', 'normal', 'damped'];
export function asScene(v: any): Scene | undefined {
  if (!v || typeof v !== 'object' || !NOISE_LEVELS.includes(v.noise)) return undefined;
  return { noise: v.noise, crowd: v.crowd === true, space: SPACES.includes(v.space) ? v.space : undefined };
}

/** Environment-driven delivery directive — silent guidance, layered on top of the emotional posture. */
export function sceneDirective(scene?: Scene): string {
  if (!scene) return '';
  if (scene.noise === 'loud') return ' The user is in a loud, noisy place — keep it short and clear, and lead with the answer so it lands.';
  if (scene.crowd) return ' The user may be around other people — stay concise and do not read out anything sensitive unprompted.';
  if (scene.space === 'live') return ' The user seems to be in a large or echoey space — keep replies clear and well-paced so they\'re easy to follow.';
  return '';
}

/** In a noisy place, ORB favors clarity: the emergency register cuts through, at full, steady volume. */
export function sceneVoice(base: VoiceSpec, scene?: Scene): VoiceSpec {
  if (scene && scene.noise === 'loud') return { tone: 'emergency', rate: Math.min(base.rate, 1.0), pitch: base.pitch, volume: 1.0 };
  return base;
}

export function postureDirective(read: CommRead): string {
  let d = '';
  if (read.urgent) d += ' The user is in a hurry — give the answer first, no preamble.';
  if (read.sarcasm) {
    d += ' The user is likely being sarcastic — read the intended meaning, not the literal words; never take the praise at face value.';
    if (read.sarcasmType === 'friendly') d += ' This is friendly, playful teasing — take it in good humor and keep your reply light and warm.';
    else if (read.sarcasmType === 'self') d += ' They are being self-deprecating about their own situation — be warm and reassuring, do not pile on, and offer to lighten the load.';
    else if (read.sarcasmType === 'hostile') d += ' The sarcasm is pointed and critical — stay calm and professional, do NOT joke back, and address the substance directly.';
    else d += ' They sound frustrated — acknowledge that briefly and offer to help with the underlying problem (e.g. "Sounds like that\'s not great — want a hand with it?"), rather than congratulating them.';
  }
  if (read.emotion === 'frustrated' && !read.sarcasm) d += ' The user sounds frustrated — acknowledge it in a few words, drop pleasantries and jokes, and fix the problem directly.';
  else if (read.emotion === 'hesitant') d += ' The user sounds unsure — be reassuring and clear, and offer a gentle recommendation if they seem to be deciding.';
  else if (read.emotion === 'playful' && !read.sarcasm) d += ' The user is being light and playful — a warm, easy tone fits here.';
  // Thinking-partner mode: help them clarify their OWN thinking, don't just hand over an answer.
  if (read.reflect) d += ' The user is thinking out loud and working through a decision — act as a thinking partner: briefly reflect back the core tension you hear, ask ONE sharp clarifying question, then offer your read. Help them reach their own clarity rather than just dumping an answer.';
  return d;
}
