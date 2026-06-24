import { completeOrbPrompt } from '../services/openai.js';
import { connectors } from '../connectors/index.js';
import { runOrbCycle, type OrbCycleReport } from '../genome/orbBranch.js';
import { createJournal } from '../services/journalStore.js';
import { runCouncil, type CouncilLevel } from '../brains/council.js';
import { runBuild } from '../build/genome.js';
import { classifyTask, routedAnswer } from '../brains/router.js';
import { matchSkill, isOwner, listSkills } from '../brains/skills.js';
import { getForecast, geocode } from '../services/weather.js';
import { getNews } from '../services/news.js';
import { getQuote } from '../services/stocks.js';
import { defineWord, wikiSummary, countryInfo, convertCurrency, timeIn } from '../services/reference.js';
import { govRegulations } from '../services/civics.js';
import { handleAction } from '../services/actions.js';
import { getAccessToken, calendarUpcoming, gmailUnreadImportant, driveSearch, driveRecent, gmailRecent } from '../connectors/google.js';
import { recall } from '../services/memoryStore.js';
import { cacheGet, cacheSet } from '../services/cache.js';
import { searchFlights, searchHotels, travelConfigured, duffelConfigured } from '../services/travel.js';
import { calculate, convertUnits } from '../services/calc.js';
import { generateVideo, videoAllowedFor } from '../services/video.js';
import { getPlan } from '../billing/plans.js';
import { getPrefs, setPrefs, observeMessage, resetProfile, topCommands, type ConvoStyle, type HumorLevel, type SupportStyle } from '../services/convoPrefs.js';
import { profileDirective, describeProfile, decisionProfile } from '../services/personality.js';
import { analyzeComms, postureDirective, voiceFor, sceneDirective, sceneVoice, isUrgent, type Prosody, type Scene } from '../services/comms.js';
import { detectLang } from '../services/lang.js';
import { relate, aboutEntity, formatAbout, ingestItems, traceCausal, formatTrace, type IngestItem } from '../services/graph.js';
import { SYSTEMS_QUERY, SYSTEMS_DIRECTIVE, parseCausal } from '../services/systems.js';
import { noteIntent, completeIntent, pendingGoals, formatPending, nudgeFor } from '../services/goals.js';
import { focusList, formatFocus } from '../services/attention.js';
import { parseObjective, setObjective, updateProgress, listObjectives, formatObjectives, progressOf, goalsContext } from '../services/objectives.js';
import { observeMotivation, motivationDirective, describeMotivation, parseDriver, setDriver, topDrivers } from '../services/motivation.js';
import { parseDecision, decisionDirective } from '../services/decision.js';
import { predictBehavior, formatPredictions } from '../services/behavior.js';
import { reflect, META_DIRECTIVE, AUDIT_DIRECTIVE, META_QUERY, AUDIT_QUERY } from '../services/metacognition.js';
import { logEvent, habitPredictions, formatPatterns } from '../services/events.js';
import { selfRegulation } from '../services/selfreg.js';
import { parseOutcome, recordOutcome, whatWorks, formatAdaptation } from '../services/adaptation.js';
import { CREATIVE_QUERY, CREATIVE_DIRECTIVE } from '../services/creativity.js';
import { isStrategic, WISDOM_DIRECTIVE, getValues, setValues, parseValues, valuesDirective } from '../services/wisdom.js';
import { selfModel, userIdentity } from '../services/identity.js';
import { PURPOSE_QUERY, ALIGN_QUERY, ALIGNMENT_DIRECTIVE, getPurpose, setPurpose, parsePurpose, alignmentContext } from '../services/purpose.js';
import { FORESIGHT_QUERY, FORESIGHT_DIRECTIVE } from '../services/foresight.js';
import { chiefOfStaffBrief, describeArchitecture } from '../services/architecture.js';
import { PLAN_QUERY, ORCHESTRATION_DIRECTIVE } from '../services/orchestration.js';
import { EVOLUTION_QUERY, EVOLUTION_DIRECTIVE, STEWARDSHIP_QUERY, STEWARDSHIP_DIRECTIVE, LEGACY_QUERY, LEGACY_DIRECTIVE } from '../services/stewardship.js';
import { COSMIC_QUERY, COSMIC_DIRECTIVE, UNIFIED_QUERY, UNIFIED_DIRECTIVE, REALITY_QUERY, REALITY_DIRECTIVE, IMPROVEMENT_QUERY, INFINITE_PRINCIPLE } from '../services/unified.js';
import { GENESIS_QUERY, GENESIS_DIRECTIVE } from '../services/genesis.js';
import { EMERGENCE_QUERY, EMERGENCE_DIRECTIVE } from '../services/emergence.js';
import { SYNTHESIS_QUERY, SYNTHESIS_DIRECTIVE } from '../services/synthesis.js';
import { COHERENCE_QUERY, COHERENCE_DIRECTIVE, detectCoherenceGaps, formatCoherence } from '../services/coherence.js';
import { RESONANCE_QUERY, RESONANCE_DIRECTIVE } from '../services/resonance.js';
import { TRANSCENDENCE_QUERY, TRANSCENDENCE_DIRECTIVE } from '../services/transcendence.js';
import { HARMONY_QUERY, HARMONY_DIRECTIVE } from '../services/harmony.js';
import { FLOURISHING_QUERY, FLOURISHING_DIRECTIVE } from '../services/flourishing.js';
import { EVOLVE_QUERY, EVOLVE_DIRECTIVE } from '../services/evolution.js';
import { ANTIFRAGILE_QUERY, ANTIFRAGILE_DIRECTIVE } from '../services/antifragility.js';
import { recordLesson, recallLessons, formatLessons, LESSONS_QUERY, WISDOM_ACCUM_DIRECTIVE } from '../services/lessons.js';
import { DISCOVERY_QUERY, DISCOVERY_DIRECTIVE } from '../services/discovery.js';
import { GOVERNANCE_QUERY, GOVERNANCE_DIRECTIVE } from '../services/governance.js';
import { CIVILIZATION_QUERY, CIVILIZATION_DIRECTIVE } from '../services/civilization.js';
import { COORDINATION_QUERY, COORDINATION_DIRECTIVE } from '../services/coordination.js';
import { PRIME_QUERY, CONSTITUTION_DIRECTIVE, constitutionStatement } from '../services/constitution.js';
import { PRESERVATION_QUERY, PRESERVATION_DIRECTIVE } from '../services/preservation.js';
import { CONTINUITY_QUERY, CONTINUITY_DIRECTIVE } from '../services/continuity.js';
import { RECALL_QUERY, COSMIC_MEMORY_DIRECTIVE } from '../services/recall.js';
import { POSSIBILITY_QUERY, POSSIBILITY_DIRECTIVE } from '../services/possibility.js';
import { SOURCE_QUERY, SOURCE_DIRECTIVE } from '../services/source.js';
import { UNITY_QUERY, UNITY_DIRECTIVE } from '../services/unity.js';
import { RECURSION_QUERY, RECURSION_DIRECTIVE } from '../services/recursion.js';
import { AWAKENING_QUERY, AWAKENING_DIRECTIVE } from '../services/awakening.js';
import { PERSPECTIVE_QUERY, PERSPECTIVE_DIRECTIVE } from '../services/perspectives.js';
import { METAPURPOSE_QUERY, METAPURPOSE_DIRECTIVE } from '../services/metapurpose.js';
import { LEARNING_QUERY, LEARNING_DIRECTIVE } from '../services/learning.js';
import { FRONTIER_QUERY, FRONTIER_DIRECTIVE } from '../services/frontier.js';
import { parseReliability, recordReliability, reliabilityOf, roster } from '../services/relationships.js';
import { predictIntent, needsClarification, nextPrompt } from '../services/predict.js';
import type { ConnectorResult, OrbAction, OrbInsight } from '../types/orb.js';

// Adaptive Conversation Memory — answer-length intent.
// Persistent ("from now on, keep it short") sets the saved preference; a per-turn cue
// ("break it down") overrides just this answer. Privacy: only this preference signal is stored.
const SET_SHORT = /\b(keep it short|be brief|short answers?|keep it brief|less detail|stop being so wordy|shorter answers?)\b/i;
const SET_DETAILED = /\b(detailed answers?|be (?:more )?detailed|more detail( from now on)?|always (?:explain|elaborate)|long(er)? answers?)\b/i;
const WANT_DETAIL = /\b(break it down|in detail|explain (?:it|that|this) (?:more|fully|in detail)|elaborate|go deeper|tell me more|the long version|full breakdown|walk me through)\b/i;
const WANT_SHORT = /\b(quick(?:ly)?|in short|short version|just the gist|tl;?dr|one line|keep it short here)\b/i;

// Urgency/tone now lives in the Communication Layer (services/comms.ts). Re-exported here so callers
// and tests keep one import surface.
export { isUrgent };

// Humor Levels — the user dials ORB's register in plain language. Checked most-specific first.
const HUMOR_PROFESSIONAL = /\b(professional mode|no humor|be serious|all business|just the facts|cut the (?:jokes?|humor|wit)|no jokes?|turn off (?:the )?(?:wit|humor)|stop being (?:funny|witty|cute))\b/i;
const HUMOR_PLAYFUL = /\b(be playful|playful mode|be more playful|more conversational|joke around|banter|be fun|loosen up)\b/i;
const HUMOR_FRIENDLY = /\b(be friendly|friendly mode|friendly tone|light humor|lighten up|be more personable|be warmer)\b/i;
const HUMOR_EXECUTIVE = /\b(executive wit|turn on (?:the )?wit|be witty|some wit|dry humor|bring (?:back )?the wit)\b/i;

// Support style — the user's "appreciation language": how they like to be acknowledged and supported.
const SUPPORT_ENCOURAGE = /\b(encourage me|cheer me on|be (?:more )?encouraging|motivate me|hype me up|i need (?:some )?encouragement)\b/i;
const SUPPORT_DIRECT = /\b(skip the pep talk|no pep talk|just handle it|no cheerleading|spare me the (?:praise|encouragement)|don'?t (?:coddle|baby) me|just the facts and action)\b/i;
const SUPPORT_REASSURE = /\b(reassure me|i need reassurance|tell me it'?s (?:handled|under control|okay)|walk me through it so i feel|put my mind at ease)\b/i;
const SUPPORT_STANDARD = /\b(balanced support|normal support|default support)\b/i;

// Digital Spatial Mapping — parse a "relate two things" statement or a "what's connected to X" query.
const PRONOUN = /^(?:this|that|it|those|these|here|there|you|me|i|we|us|him|her|them|him\/her)$/i;
function parseRelate(m: string): { a: string; b: string; rel: string } | null {
  const tries: [RegExp, (x: RegExpExecArray) => { a: string; b: string; rel: string }][] = [
    [/^(?:link|connect|associate)\s+(.+?)\s+(?:to|with|and)\s+(.+?)[.!]*$/i, (x) => ({ a: x[1], b: x[2], rel: 'linked to' })],
    [/^(?:remember (?:that )?)?(.+?)\s+is part of\s+(.+?)[.!]*$/i, (x) => ({ a: x[1], b: x[2], rel: 'part of' })],
    [/^(?:remember (?:that )?)?(.+?)\s+(belongs to|is owned by|is managed by|reports to|is related to|is connected to|is linked to)\s+(.+?)[.!]*$/i, (x) => ({ a: x[1], b: x[3], rel: x[2].replace(/^is /, '') })]
  ];
  for (const [re, build] of tries) {
    const x = re.exec(m);
    if (!x) continue;
    const r = build(x); const a = r.a.trim(), b = r.b.trim();
    if (a.length < 2 || a.length > 60 || b.length < 2 || b.length > 60) return null;
    if (PRONOUN.test(a) || PRONOUN.test(b)) return null;
    return { a, b, rel: r.rel.trim() };
  }
  return null;
}
// Pull people / topics a calendar title refers to, so events link to the right entities in the map.
const MAP_WORLD = /\b(map|build|sync|update|refresh)\s+my\s+(?:world|map|knowledge map|graph|connections)\b/i;
export function mentionsIn(title: string): string[] {
  const out: string[] = [];
  const withRe = /\bwith\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g; let w;
  while ((w = withRe.exec(title))) out.push(w[1].trim());
  const topic = title.match(/\b(?:re|about|on|for)\s+([A-Z][A-Za-z0-9][A-Za-z0-9 ]{1,28})/);
  if (topic) out.push(topic[1].trim());
  return [...new Set(out)];
}
// Pull the human name out of a "Jane Doe <jane@x.com>" From header; '' if it doesn't look like a name.
export function senderName(from: string): string {
  const m = (from || '').match(/^\s*"?([^"<]+?)"?\s*</);   // only trust an explicit display name
  if (!m) return '';                                        // bare email (noreply@…) → not a person
  const n = m[1].trim();
  return /^[A-Za-z][A-Za-z .'-]{1,40}$/.test(n) ? n : '';
}
async function mapMyWorld(userId: string): Promise<{ added: number; note?: string }> {
  const token = await getAccessToken(userId);
  if (!token) return { added: 0, note: 'Connect Google in the Connect tab first, and I can map your calendar, Drive, and inbox into your knowledge graph automatically.' };
  const items: IngestItem[] = [];
  try {
    const events = await calendarUpcoming(token, 14);
    for (const e of events) if (e.summary) items.push({ label: e.summary, type: 'event', mentions: mentionsIn(e.summary) });
  } catch { /* degrade */ }
  try {
    const files = await driveRecent(token);
    for (const f of files) items.push({ label: f.name, type: 'document', mentions: mentionsIn(f.name) });
  } catch { /* degrade */ }
  try {
    const mails = await gmailRecent(token);
    for (const m of mails) {
      if (!m.subject) continue;
      const who = senderName(m.from);
      const mentions = [...new Set([...(who ? [who] : []), ...mentionsIn(m.subject)])];
      items.push({ label: m.subject.slice(0, 60), type: 'email', mentions });
    }
  } catch { /* degrade */ }
  if (!items.length) return { added: 0, note: "I didn't find anything to map yet — make sure Google is connected." };
  const added = await ingestItems(userId, items);
  return { added };
}

function parseAbout(m: string): string | null {
  const res = [
    /\bwhat do (?:i|we) know about\s+(.+?)[?.!]*$/i,
    /\bwhat(?:'s| is) connected to\s+(.+?)[?.!]*$/i,
    /\beverything (?:i know )?about\s+(.+?)[?.!]*$/i,
    /\bmap (?:of|out)\s+(.+?)[?.!]*$/i,
    /\bhow (?:is|are)\s+(.+?)\s+(?:connected|related|linked)\b/i
  ];
  for (const re of res) { const x = re.exec(m); if (x && x[1].trim().length >= 2) return x[1].trim(); }
  return null;
}

// Personality Engine — the user can read back what ORB has learned, or reset it (transparency + control).
const DESCRIBE_PROFILE = /\b(what (?:have|did|do) you (?:learn(?:ed)?|know) about me|what'?s my (?:profile|personality|communication style)|how (?:do|would) you describe me|describe my (?:profile|style)|my personality profile)\b/i;
const RESET_PROFILE = /\b(reset my (?:profile|personality|preferences)|forget (?:what you (?:know|learned)(?: about me)?|my (?:profile|preferences))|start (?:over|fresh) with me|wipe my profile|relearn me)\b/i;

// ORB runs on the Universal Genome. The five laws are not advice — they are the gate.
const SYSTEM_PROMPT = `You are ORB, the user's Digital Chief of Staff, running on the Universal Genome.
You are not a chatbot. You observe connected systems, prioritize what matters, recommend actions,
and only execute high-risk actions after approval.

Obey the five laws of the genome at all times:
1. Risk-first, not prediction-first — survive before you win.
2. Edge = your number vs the world's number — no edge, no action.
3. Forward-validate before real stakes — trust is earned on the record.
4. Recognise + remember, don't predict — graduate patterns only once proven.
5. Confirm-first, never chase — high-risk actions wait for the owner's approval.

Be practical, direct, and focused on the user's life, businesses, investments, and commerce platforms.`;

function scorePriority(urgency: number, impact: number, effort: number, confidence: number) {
  return urgency + impact - effort + confidence;
}

// Does the user want ORB to BUILD something? Needs an intent verb AND a buildable target,
// so "build me a website" routes to Build mode but "build my confidence" does not.
const BUILD_INTENT = /\b(build|create|make|design|develop|generate|spin up|set up)\b/i;
const BUILD_TARGET = /\b(web ?site|web ?app|landing page|home ?page|portfolio|dashboard|portal|online store|store|shop|e-?commerce|booking (site|app)|reservation|mobile app|app|site|web ?page|page)\b/i;
export function looksLikeBuildRequest(message: string): boolean {
  return BUILD_INTENT.test(message) && BUILD_TARGET.test(message);
}

// Does the user want an AI VIDEO (Veo)? Needs an intent verb AND a video word.
const VIDEO_INTENT = /\b(make|create|generate|produce|render|do)\b/i;
const VIDEO_TARGET = /\b(video|clip|animation|short film|movie|reel)\b/i;
export function looksLikeVideoRequest(message: string): boolean {
  return VIDEO_INTENT.test(message) && VIDEO_TARGET.test(message);
}

// Only pull connected-system data (calendar, email, tasks, money…) when the request actually needs
// it. Otherwise ORB answers straight from the model — no fetching, instant.
const NEEDS_CONTEXT = /\b(calendar|schedul|meeting|appointment|today|tomorrow|tonight|this week|agenda|upcoming|coming up|due|email|inbox|gmail|unread|message|task|to-?do|reminder|brief|priorit|what'?s on|my day|my plate|wallet|balance|invoice|bill|pay(ment)?|contact|connected|status)\b/i;
export function needsContext(message: string): boolean {
  return NEEDS_CONTEXT.test(message);
}

// Weather is a real tool, not a guess: detect the ask, find the location, fetch a live forecast.
const WEATHER_RE = /\b(weather|forecast|temperature|how (?:hot|cold|warm)|will it (?:rain|snow)|rain|snow|sunny|umbrella|degrees)\b/i;
function extractCity(message: string): string | null {
  const m = message.match(/\b(?:in|for|at|near)\s+([A-Za-z][A-Za-z .'-]{1,40}?)(?:\s+(?:today|tomorrow|tonight|this\s+week|right\s+now|please|tho|though))?[?.!]*$/i);
  return m ? m[1].trim() : null;
}
async function weatherContext(message: string, opts: { lat?: number; lon?: number }): Promise<string | null> {
  if (!WEATHER_RE.test(message)) return null;
  let lat = opts.lat, lon = opts.lon, place: string | undefined;
  const city = extractCity(message);
  if (city) { const g = await geocode(city); if (g) { lat = g.lat; lon = g.lon; place = g.name; } }
  if (lat == null && process.env.DEFAULT_LAT && process.env.DEFAULT_LON) {
    lat = Number(process.env.DEFAULT_LAT); lon = Number(process.env.DEFAULT_LON); place = process.env.DEFAULT_CITY || place;
  }
  if (lat == null || lon == null) return "WEATHER: no location available — ask the user which city (or have them allow location).";
  return `Real, current weather data (use this — speak it naturally, don't tell them to check their phone):\n${await getForecast(lat, lon, place)}`;
}

// News is a real tool: pull live headlines when asked.
const NEWS_RE = /\b(news|headlines?|what'?s happening|going on in the world|current events)\b/i;
async function newsContext(message: string): Promise<string | null> {
  if (!NEWS_RE.test(message)) return null;
  const topicMatch = message.match(/\b(?:about|on|in)\s+([A-Za-z][A-Za-z &'-]{2,30})/i);
  const news = await getNews(topicMatch ? topicMatch[1].trim() : undefined);
  if (!news.available || !news.headlines.length) return null;
  const lines = news.headlines.slice(0, 6).map((h, i) => `${i + 1}. ${h.title}${h.source ? ` (${h.source})` : ''}`).join('\n');
  return `Live headlines (${news.source}) — summarize the relevant ones naturally:\n${lines}`;
}

// Stocks: pull a live quote when a ticker/company is mentioned.
const STOCK_RE = /\b(stock|shares?|share price|ticker|nasdaq|dow|s&p|market)\b|\$[A-Za-z]{1,5}\b/i;
const NAME_TO_TICKER: Record<string, string> = {
  tesla: 'TSLA', apple: 'AAPL', amazon: 'AMZN', google: 'GOOGL', alphabet: 'GOOGL', microsoft: 'MSFT',
  meta: 'META', facebook: 'META', nvidia: 'NVDA', netflix: 'NFLX', amd: 'AMD', intel: 'INTC',
  walmart: 'WMT', disney: 'DIS', coinbase: 'COIN', 'sp500': '^SPX', 's&p': '^SPX', dow: '^DJI', nasdaq: '^NDQ'
};
function extractTicker(message: string): string | null {
  const dollar = message.match(/\$([A-Za-z]{1,5})\b/);
  if (dollar) return dollar[1].toUpperCase();
  const low = message.toLowerCase();
  for (const [name, sym] of Object.entries(NAME_TO_TICKER)) if (low.includes(name)) return sym;
  const m = message.match(/\b(?:stock|shares?|price)\s+(?:of|for)\s+([A-Za-z]{1,5})\b/i) || message.match(/\b([A-Z]{2,5})\s+(?:stock|shares?)\b/);
  return m ? m[1].toUpperCase() : null;
}
async function stocksContext(message: string): Promise<string | null> {
  if (!STOCK_RE.test(message)) return null;
  const ticker = extractTicker(message);
  if (!ticker) return null;
  const q = await getQuote(ticker);
  if (!q) return null;
  return `Live quote (use it): ${q.name} (${q.ticker}) is ${q.price} ${q.currency}.`;
}

// Dictionary: "define X", "what does X mean", "meaning of X".
async function dictionaryContext(message: string): Promise<string | null> {
  const m = message.match(/\b(?:define|definition of|meaning of|what does)\s+["']?([A-Za-z][A-Za-z-]{1,30})["']?(?:\s+mean)?\b/i);
  return m ? defineWord(m[1]) : null;
}

// Encyclopedia: "who is/was X", "tell me about X", "history of X", "what is a <thing>".
async function wikiContext(message: string): Promise<string | null> {
  const m = message.match(/\b(?:who(?:'?s| is| was| are| were)|tell me about|history of|facts about|what(?:'?s| is| are) (?:a |an |the )?)\s+([A-Z][A-Za-z0-9 .'-]{2,40})/);
  if (!m) return null;
  const q = m[1].replace(/[?.!]+$/, '').trim();
  return /\b(weather|stock|news|time|today|tomorrow)\b/i.test(q) ? null : wikiSummary(q);
}

// Geography: "capital of X", "population of X", "currency of X", "where is X".
async function geographyContext(message: string): Promise<string | null> {
  const m = message.match(/\b(?:capital of|population of|currency of|languages? of|where is|located|continent (?:is|of))\s+([A-Za-z][A-Za-z .'-]{2,40})/i)
    || message.match(/\babout\s+(?:the country of\s+)?([A-Z][A-Za-z .'-]{2,40})/);
  if (!m) return null;
  return countryInfo(m[1].replace(/[?.!]+$/, '').trim());
}

// Currency: "convert 100 USD to EUR", "how much is 50 dollars in euros".
const CUR: Record<string, string> = { dollars: 'USD', dollar: 'USD', usd: 'USD', euros: 'EUR', euro: 'EUR', eur: 'EUR', pounds: 'GBP', gbp: 'GBP', yen: 'JPY', jpy: 'JPY', pesos: 'MXN', mxn: 'MXN', cad: 'CAD', aud: 'AUD', rupees: 'INR', inr: 'INR', bitcoin: 'BTC', btc: 'BTC' };
function norm(c: string): string { return CUR[c.toLowerCase()] || c.toUpperCase(); }
async function currencyContext(message: string): Promise<string | null> {
  const m = message.match(/\b(?:convert\s+)?(\d+(?:\.\d+)?)\s*([A-Za-z]{3,8})\s+(?:to|in|into)\s+([A-Za-z]{3,8})\b/i);
  if (!m) return null;
  return convertCurrency(Number(m[1]), norm(m[2]), norm(m[3]));
}

// World time: "what time is it in Tokyo".
async function timeContext(message: string): Promise<string | null> {
  const m = message.match(/\b(?:time (?:is it )?in|what time.*in|current time in)\s+([A-Za-z][A-Za-z .'-]{2,30})/i);
  return m ? timeIn(m[1].replace(/[?.!]+$/, '').trim()) : null;
}

// Government & law: regulations, rules, executive orders on a topic (US Federal Register).
const GOV_RE = /\b(law|laws|legal|regulation|regulations|statute|executive order|federal|government|congress|bill|policy|compliance|rule)\b/i;
async function govContext(message: string): Promise<string | null> {
  if (!GOV_RE.test(message)) return null;
  const m = message.match(/\b(?:about|on|regarding|for)\s+([A-Za-z][A-Za-z &'-]{2,40})/i)
    || message.match(/\b(?:law|laws|regulation|regulations|rules?|policy)\s+(?:on|about|for)?\s*([A-Za-z][A-Za-z &'-]{2,40})/i);
  const topic = m ? m[1].replace(/[?.!]+$/, '').trim() : '';
  return topic ? govRegulations(topic) : null;
}

// System / self-knowledge: "what can you do", "your capabilities", "help".
const SELF_RE = /\b(what can you do|what do you do|your (?:capabilities|skills|features|abilities|tools)|what are you|how can you help|help me with)\b/i;
function selfContext(message: string): string | null {
  if (!SELF_RE.test(message)) return null;
  const skills = listSkills().map((s) => s.name).join(', ');
  return `ORB capabilities (describe these naturally, in first person, no jargon): I chat and reason with a council of AI models; I build websites and apps; I generate video; I speak in a cloned voice and recognize the owner's voice; and I pull live info — weather, news, stocks, dictionary, encyclopedia, world geography, currency, world time, and US government regulations. I connect to Google (Gmail/Calendar), handle reminders, notes, tasks and wallet, and I run subscriptions/billing. Registered skills: ${skills}.`;
}

// ── Specialized parallel agents over the user's connected accounts ──
// Calendar AI
const CAL_RE = /\b(calendar|schedul|meeting|appointment|agenda|event|today|tomorrow|this week|coming up|free time|busy)\b/i;
async function calendarAgent(userId: string, message: string): Promise<string | null> {
  if (!CAL_RE.test(message)) return null;
  const token = await getAccessToken(userId);
  if (!token) return null;
  try {
    const days = /\b(week|upcoming|coming up)\b/i.test(message) ? 7 : 2;
    const ev = await calendarUpcoming(token, days);
    if (!ev.length) return 'Calendar: nothing scheduled in that window.';
    return `Calendar (next ${days} days):\n` + ev.map((e) => `- ${e.summary}${e.start ? ` (${e.start})` : ''}`).join('\n');
  } catch { return null; }
}
// Email AI
const MAIL_RE = /\b(email|inbox|gmail|unread|messages?|mail)\b/i;
async function emailAgent(userId: string, message: string): Promise<string | null> {
  if (!MAIL_RE.test(message)) return null;
  const token = await getAccessToken(userId);
  if (!token) return null;
  try {
    const n = await gmailUnreadImportant(token);
    return `Email: ${n} important unread message${n === 1 ? '' : 's'} in the inbox.`;
  } catch { return null; }
}
// Travel AI — flights & hotels (Amadeus). Search now; booking is confirm-first via the provider.
function isoDate(d: Date): string { return d.toISOString().slice(0, 10); }
function travelDate(message: string): string {
  const now = new Date();
  if (/\btomorrow\b/i.test(message)) { const d = new Date(now); d.setDate(d.getDate() + 1); return isoDate(d); }
  const md = message.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})\b/i);
  if (md) { const mo = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(md[1].slice(0, 3).toLowerCase());
    const d = new Date(now.getFullYear(), mo, Number(md[2])); if (d < now) d.setFullYear(now.getFullYear() + 1); return isoDate(d); }
  const d = new Date(now); d.setDate(d.getDate() + 7); return isoDate(d);   // default ~a week out
}
async function flightAgent(userId: string, message: string): Promise<string | null> {
  if (!/\bflights?\b/i.test(message)) return null;
  const m = message.match(/from\s+([A-Za-z][A-Za-z .]+?)\s+to\s+([A-Za-z][A-Za-z .]+?)(?:\s+(?:on|next|this|tomorrow|in)\b.*)?[?.!]*$/i);
  if (!m) return null;
  if (!travelConfigured() && !duffelConfigured()) return 'Flight search needs a travel key (Duffel or Amadeus) — add it in the Keys tab and I can pull live flights.';
  return searchFlights(m[1].trim(), m[2].trim(), travelDate(message), 1, userId);
}
async function hotelAgent(message: string): Promise<string | null> {
  if (!/\bhotels?\b/i.test(message)) return null;
  const m = message.match(/hotels?\s+(?:in|near|around|at)\s+([A-Za-z][A-Za-z .]+?)[?.!]*$/i);
  if (!m) return null;
  if (!travelConfigured()) return 'Hotel search needs an Amadeus key — add it in the Keys tab.';
  return searchHotels(m[1].trim());
}

// File AI — searches the user's Google Drive by name.
const FILE_RE = /\b(file|files|document|doc|drive|folder|spreadsheet)\b/i;
async function fileAgent(userId: string, message: string): Promise<string | null> {
  if (!FILE_RE.test(message)) return null;
  const token = await getAccessToken(userId);
  if (!token) return 'Files: connect Google Drive in the Connect tab and I can search your files.';
  const m = message.match(/\b(?:file|document|doc|spreadsheet|drive)s?\s+(?:about|named|called|on|for|with|titled)\s+([A-Za-z0-9 .'-]{2,40})/i)
    || message.match(/\b(?:find|search|open|get|pull up)\s+(?:my\s+)?(?:file|doc|document|spreadsheet)?\s*(?:about|named|called)?\s*([A-Za-z0-9 .'-]{2,40})/i);
  const q = m ? m[1].trim() : '';
  if (!q) return null;
  try {
    const files = await driveSearch(token, q);
    return files.length ? `Files matching "${q}":\n${files.map((f) => `- ${f.name}`).join('\n')}` : `Files: nothing matching "${q}".`;
  } catch { return null; }
}

// Calculator (exact, local) — words → symbols, then evaluate safely.
function mathTool(message: string): string | null {
  const mm = message.match(/\b(?:what'?s|what is|calculate|compute|how much is|solve)\b\s*(.+)$/i);
  const raw = (mm ? mm[1] : message).replace(/[?!.]+$/, '').trim();
  const norm = raw.toLowerCase()
    .replace(/\bto the power of\b/g, '^').replace(/\bsquared\b/g, '^2').replace(/\bsquare root of\b/g, 'sqrt')
    .replace(/\bplus\b/g, '+').replace(/\bminus\b/g, '-')
    .replace(/\b(?:times|multiplied by)\b/g, '*').replace(/\b(?:divided by|over)\b/g, '/')
    .replace(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s*of\s*(\d+(?:\.\d+)?)/g, '($1/100)*$2')
    .replace(/[,$]/g, '').trim();
  if (!/[0-9]/.test(norm) || !/[-+*/^]|sqrt|cbrt|sin|cos|tan|log|ln|abs|exp/.test(norm)) return null;
  const r = calculate(norm);
  if (r == null) return null;
  return `Calculation: ${raw} = ${Number.isInteger(r) ? r : Number(r.toFixed(6))}`;
}

// Measurements / unit converter (exact, local).
function measureTool(message: string): string | null {
  let m = message.match(/(?:convert\s+)?(-?\d+(?:\.\d+)?)\s*([A-Za-z°"']+)\s+(?:to|in|into)\s+([A-Za-z°"']+)/);
  if (!m) { const m2 = message.match(/how many\s+([A-Za-z]+)\s+(?:in|are in|is)\s+(-?\d+(?:\.\d+)?)\s*([A-Za-z]+)/i); if (m2) m = [m2[0], m2[2], m2[3], m2[1]] as any; }
  if (!m) return null;
  const out = convertUnits(Number(m[1]), m[2], m[3]);
  if (!out) return null;
  return `Conversion: ${m[1]} ${m[2]} = ${Number.isInteger(out.value) ? out.value : Number(out.value.toFixed(4))} ${m[3]}`;
}

/**
 * The fan-out: ORB Router → many specialized agents run in parallel (knowledge tools + Calendar /
 * Email / File over the user's accounts) → results feed the Finalizer for one fast answer.
 * Each agent only fetches if the request matches it, so plain chat stays instant.
 */
async function toolContext(message: string, userId: string, opts: { lat?: number; lon?: number }): Promise<string | undefined> {
  const sync = [selfContext(message), mathTool(message), measureTool(message)].filter(Boolean) as string[];
  const fetched = (await Promise.all([
    weatherContext(message, opts), newsContext(message), stocksContext(message),
    dictionaryContext(message), wikiContext(message), geographyContext(message), currencyContext(message),
    timeContext(message), govContext(message),
    calendarAgent(userId, message), emailAgent(userId, message), fileAgent(userId, message),
    flightAgent(userId, message), hotelAgent(message)
  ])).filter(Boolean) as string[];
  const parts = [...sync, ...fetched];
  return parts.length ? parts.join('\n\n') : undefined;
}

/** Strip "make me a video of …" down to just the subject for the Veo prompt. */
function videoPrompt(message: string): string {
  const m = message.replace(/^.*?\b(video|clip|animation|short film|movie|reel)\b\s*(of|showing|about|with|featuring|:)?\s*/i, '').trim();
  return m || message.trim();
}

/** Turn a build result into a clear, human chat reply (the files ride along in `build`). */
function buildReply(b: Awaited<ReturnType<typeof runBuild>>): string {
  const lines = [
    `🛠️ I built you a **${b.blueprint.name}** (${b.category}).`,
    `Tier: ${b.capability.label} — generated ${b.files.length} file${b.files.length === 1 ? '' : 's'}.`,
    `Stack: ${b.blueprint.stack.join(', ')}.`,
    '',
    'Files:',
    ...b.files.map((f) => `  • ${f.path}`),
    '',
    b.deliver
  ];
  if (!b.fullyConfigured) lines.push('', '⚠️ Some build organs ran without their AI key configured — results are partial.');
  return lines.join('\n');
}

export async function gatherContext(userId: string): Promise<ConnectorResult[]> {
  const results = await Promise.all(connectors.map((connector) => connector.pull(userId)));
  return results;
}

// Anticipation follow-through: when ORB asks for a missing slot, it briefly remembers the command it
// was completing so the next short reply folds back in ("schedule a meeting with…" → "Dana, at 3").
const pendingClarify = new Map<string, { partial: string; at: number }>();
const CLARIFY_TTL = 45_000;
const FOLLOWUP_QUESTION = /^(?:\s*orb[,!.]?\s*)?(what|when|how|why|who|where|which|can|could|should|is|are|do|does|tell me|explain)\b/i;

// Spatial awareness: when ORB first notices a loud environment, it mentions once that it'll keep
// things short — then stays quiet about it. Rate-limited per user so it never nags.
const envNoted = new Map<string, number>();
const ENV_NOTE_TTL = 20 * 60_000;
function shouldNoteEnv(userId: string): boolean {
  const last = envNoted.get(userId) || 0;
  if (Date.now() - last < ENV_NOTE_TTL) return false;
  envNoted.set(userId, Date.now());
  return true;
}

/**
 * Ask ORB. By default this convenes the full Multi-Model Council and returns the
 * ORB-Finalizer's single clean answer; `approvalRequired` stays code-computed from the cycle.
 * Pass { council: false } for a single-model answer (the lightweight path).
 */
export async function askOrb(
  userId: string,
  message: string,
  opts: { council?: boolean; documents?: string; images?: string[]; level?: CouncilLevel; plan?: string; personality?: string; customPersona?: string; lat?: number; lon?: number; tz?: string; prosody?: Prosody; scene?: Scene } = {}
) {
  // Anticipation follow-through: if ORB just asked for a missing slot, fold this short reply back
  // into the command it was completing. Survives exactly one turn (consumed here, fresh window only).
  const pend = pendingClarify.get(userId);
  pendingClarify.delete(userId);
  if (pend && Date.now() - pend.at < CLARIFY_TTL) {
    const reply = message.trim();
    if (reply.split(/\s+/).length <= 8 && !FOLLOWUP_QUESTION.test(reply)) {
      message = `${pend.partial.replace(/(?:\.\.\.|…)\s*$/, '').trim()} ${reply}`.trim();
    }
  }

  // Video mode (Veo): generate an AI video. Top tiers only — it's the priciest call.
  if (looksLikeVideoRequest(message)) {
    if (!videoAllowedFor(opts.plan)) {
      return { mode: 'video' as const, answer: '🎬 AI video is an Executive/Enterprise feature — upgrade in the Plans tab to generate videos.', video: { available: false, locked: true } };
    }
    const provider = /\brunway\b/i.test(message) ? 'runway' : /\bveo\b/i.test(message) ? 'veo' : undefined;
    const video = await generateVideo(videoPrompt(message), { provider });
    const tag = video.provider ? ` (${video.provider})` : '';
    return { mode: 'video' as const, answer: video.available ? `🎬 Here’s your video${tag}.` : `🎬 ${video.note || 'Video unavailable.'}`, video };
  }

  // Owner-only skills (voice cloning / recognition+learning): the main user just tells ORB.
  const skill = matchSkill(message);
  if (skill && (skill.id === 'voice-clone' || skill.id === 'voice-recognition')) {
    if (!isOwner(userId)) {
      return { mode: 'skill' as const, skill: skill.id, answer: 'Only the main account can change or train my voice.' };
    }
    const answer = skill.id === 'voice-clone'
      ? "Sure. When you're ready, just talk to me for about twenty seconds and I'll learn your voice. Go ahead whenever."
      : "Let's do it. Speak naturally for about twenty seconds so I can learn and recognize your voice. Start whenever you're ready.";
    return { mode: 'skill' as const, skill: skill.id, action: 'record', answer };
  }

  // Adaptive Conversation Memory: a persistent style command teaches ORB how you like answers.
  // It saves the preference (no raw audio, just this one signal) and confirms — nothing else runs.
  if (SET_SHORT.test(message) || SET_DETAILED.test(message)) {
    const style: ConvoStyle = SET_DETAILED.test(message) ? 'detailed' : 'short';
    await setPrefs(userId, { style });
    const answer = style === 'detailed'
      ? "Got it — I'll give you fuller answers from now on. Say \"keep it short\" anytime to switch back."
      : "Done — I'll keep my answers short from now on. Say \"break it down\" anytime you want the full version.";
    return { mode: 'fast' as const, answer, route: 'fast' as const, model: 'prefs' };
  }

  // Personality Engine: read-back ("what have you learned about me") and reset — transparency first.
  if (DESCRIBE_PROFILE.test(message)) {
    const { traits } = await getPrefs(userId).catch(() => ({ traits: {} as Awaited<ReturnType<typeof getPrefs>>['traits'] }));
    return { mode: 'fast' as const, answer: describeProfile(traits), route: 'fast' as const, model: 'profile' };
  }
  if (RESET_PROFILE.test(message)) {
    await resetProfile(userId);
    return { mode: 'fast' as const, answer: "Done — I've cleared what I'd learned about your style and we'll start fresh. I'll pick your rhythm back up as we talk.", route: 'fast' as const, model: 'profile' };
  }

  // Humor Levels: set ORB's register. Most-specific intent wins; "all business" beats "be playful".
  const humorLevel: HumorLevel | null =
    HUMOR_PROFESSIONAL.test(message) ? 'professional'
    : HUMOR_PLAYFUL.test(message) ? 'playful'
    : HUMOR_FRIENDLY.test(message) ? 'friendly'
    : HUMOR_EXECUTIVE.test(message) ? 'executive' : null;
  if (humorLevel) {
    await setPrefs(userId, { humor: humorLevel });
    const acks: Record<HumorLevel, string> = {
      professional: "Understood — all business from here. I'll keep my observations to myself.",
      executive: "Executive wit it is — I'll land the occasional sharp observation, and keep it rare.",
      friendly: "Sounds good — warm and friendly, with the odd light quip.",
      playful: "Love it — I'll loosen up and keep it playful. Still get you what you need, just with more personality."
    };
    return { mode: 'fast' as const, answer: acks[humorLevel], route: 'fast' as const, model: 'prefs' };
  }

  // Support style: how the user likes to be acknowledged (their "appreciation language").
  const supportStyle: SupportStyle | null =
    SUPPORT_DIRECT.test(message) ? 'direct'
    : SUPPORT_ENCOURAGE.test(message) ? 'encouraging'
    : SUPPORT_REASSURE.test(message) ? 'reassuring'
    : SUPPORT_STANDARD.test(message) ? 'standard' : null;
  if (supportStyle) {
    await setPrefs(userId, { support: supportStyle });
    const acks: Record<SupportStyle, string> = {
      standard: "Got it — I'll keep my support balanced.",
      encouraging: "You've got it — I'll have your back and cheer the wins, not just the to-dos.",
      direct: "Understood — no pep talk. I'll just handle things and tell you what's next.",
      reassuring: "Okay — I'll make sure you always know it's handled and how, so you can breathe easy."
    };
    return { mode: 'fast' as const, answer: acks[supportStyle], route: 'fast' as const, model: 'prefs' };
  }

  // Motivation: set or read back what drives the user (the "why" behind the goals).
  {
    const drv = parseDriver(message);
    if (drv) { await setDriver(userId, drv); return { mode: 'fast' as const, answer: `Got it — I'll remember you're driven by ${drv}, and frame things around that.`, route: 'fast' as const, model: 'motivation' }; }
  }
  if (/\bwhat (?:drives|motivates) me\b|\bwhat'?s my motivation\b|\bwhat am i driven by\b/i.test(message)) {
    return { mode: 'fast' as const, answer: await describeMotivation(userId).catch(() => "I'm still learning what drives you."), route: 'fast' as const, model: 'motivation' };
  }

  // Goal Systems: set an objective, log progress on one, or review the goal hierarchy.
  if (/\bmy (?:goal|objective|target) (?:is|was)\b|\b(?:goal is to|i want to|i'?m trying to|i aim to|i plan to|working toward)\b/i.test(message)) {
    const o = await setObjective(userId, parseObjective(message)).catch(() => null);
    if (o) {
      const p = progressOf(o);
      const extra = p == null ? '' : ` You're ${p}% of the way there.`;
      return { mode: 'fast' as const, answer: `Locked in as a ${o.level} goal: "${o.label}".${extra} I'll keep it in view and connect your day to it.`, route: 'fast' as const, model: 'goals' };
    }
  }
  {
    const prog = message.match(/\b(?:we'?re|i'?m|it'?s|now|update|progress|currently)\b[^.]*?\b([a-z][a-z ]{2,30}?)\s+(?:is now|is at|hit|reached|to)\s+\$?([\d.,]+\s*[km]?)/i);
    if (prog) {
      const val = parseFloat(prog[2].replace(/,/g, '')) * (/k/i.test(prog[2]) ? 1000 : /m/i.test(prog[2]) ? 1e6 : 1);
      const o = await updateProgress(userId, prog[1].trim(), val).catch(() => null);
      if (o) { const p = progressOf(o); return { mode: 'fast' as const, answer: `Updated — "${o.label}" is now ${o.current}${o.unit || ''}${p == null ? '' : `, ${p}% to target`}. Nice progress.`, route: 'fast' as const, model: 'goals' }; }
    }
  }
  if (/\b(what are my goals|my (?:goals|objectives|targets)|show (?:me )?my goals|how am i (?:doing|tracking) (?:on|against) my goals|what am i (?:working toward|trying to (?:become|achieve)))\b/i.test(message)) {
    return { mode: 'fast' as const, answer: formatObjectives(await listObjectives(userId).catch(() => [])), route: 'fast' as const, model: 'goals' };
  }

  // Social Intelligence / Trust: track who delivers vs flakes; answer "who can I count on?".
  {
    const rel = parseReliability(message);
    if (rel) {
      await recordReliability(userId, rel.name, rel.kind).catch(() => {});
      const answer = rel.kind === 'delivered' ? `Noted — ${rel.name} came through. That's in their column.` : `Noted — ${rel.name} dropped that one. I'll factor it into who you lean on.`;
      return { mode: 'fast' as const, answer, route: 'fast' as const, model: 'trust' };
    }
  }
  if (/\bwho can i (?:count on|rely on|trust)\b|\bwho(?:'s| is) (?:reliable|dependable)\b|\bwho keeps (?:dropping the ball|flaking)\b|\bwho(?:'s| is) (?:unreliable|slipping)\b/i.test(message)) {
    return { mode: 'fast' as const, answer: await roster(userId).catch(() => "I don't have a track record on people yet."), route: 'fast' as const, model: 'trust' };
  }
  {
    const rm = message.match(/\b(?:how reliable is|can i (?:count on|rely on|trust)|how dependable is|what'?s my read on)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
    if (rm) return { mode: 'fast' as const, answer: await reliabilityOf(userId, rm[1]).catch(() => `I haven't tracked ${rm[1]} yet.`), route: 'fast' as const, model: 'trust' };
  }

  // Universal Intelligence Architecture: the unified read (every layer → one briefing), and ORB's
  // self-description of its own stack.
  if (/\b(brief me|where do i stand|catch me up|chief of staff (?:brief|briefing|update)|the (?:full|big) picture|status (?:report|check)|where (?:are we|do things stand)|sitrep|run me through everything)\b/i.test(message)) {
    return { mode: 'fast' as const, answer: await chiefOfStaffBrief(userId).catch(() => "We're just getting started — give me a few goals to track."), route: 'fast' as const, model: 'brief' };
  }
  if (/\bhow (?:do you work|are you (?:built|designed|wired))\b|\bwhat'?s your architecture\b|\bshow me your (?:stack|layers|architecture)\b|\bwhat makes you (?:you|different)\b|\bhow are you put together\b/i.test(message)) {
    return { mode: 'fast' as const, answer: describeArchitecture(), route: 'fast' as const, model: 'architecture' };
  }
  // #24 Infinite Improvement Loop: ORB is never "done" — it keeps recalibrating.
  if (IMPROVEMENT_QUERY.test(message)) {
    return { mode: 'fast' as const, answer: INFINITE_PRINCIPLE, route: 'fast' as const, model: 'architecture' };
  }

  // Self-Identity: ORB's model of itself (mission, boundaries, continuity) and its living model of you.
  if (/\bwho are you\b|\bwhat'?s your (?:mission|purpose)\b|\bare you conscious\b|\bwhat are you, really\b/i.test(message)) {
    return { mode: 'fast' as const, answer: selfModel(), route: 'fast' as const, model: 'identity' };
  }
  if (/\bwho am i(?: to you)?\b|\bwhat do you know about me\b|\bhow (?:do|would) you (?:see|describe) me\b|\bdescribe me\b|\bmy identity\b|\bpaint a picture of (?:me|who i am)\b/i.test(message)) {
    return { mode: 'fast' as const, answer: await userIdentity(userId).catch(() => "I'm still forming a picture of who you are."), route: 'fast' as const, model: 'identity' };
  }

  // Prime Directive (#40): ORB's own constitution — why it exists, the pillars, the test, the lines it won't cross.
  if (PRIME_QUERY.test(message)) {
    return { mode: 'fast' as const, answer: constitutionStatement(), route: 'fast' as const, model: 'constitution' };
  }

  // Purpose & Meaning: set or read the user's purpose/mission ORB aligns recommendations to.
  {
    const pp = parsePurpose(message);
    if (pp) { await setPurpose(userId, pp).catch(() => {}); return { mode: 'fast' as const, answer: `That's your north star now — I'll align what I recommend to it: ${pp}.`, route: 'fast' as const, model: 'purpose' }; }
  }
  if (PURPOSE_QUERY.test(message)) {
    const p = await getPurpose(userId).catch(() => '');
    if (p) return { mode: 'fast' as const, answer: `Your stated purpose — what I align everything to: ${p}.`, route: 'fast' as const, model: 'purpose' };
    // No purpose set → let the model engage thoughtfully (it falls through with the alignment frame).
  }

  // Wisdom & Judgment: set or read the values ORB weighs major decisions against.
  {
    const vals = parseValues(message);
    if (vals) { await setValues(userId, vals).catch(() => {}); return { mode: 'fast' as const, answer: `Noted — I'll weigh the big calls against your values: ${vals}.`, route: 'fast' as const, model: 'wisdom' }; }
  }
  if (/\bwhat are my values\b|\bwhat do i (?:value|stand for)\b/i.test(message)) {
    const v = await getValues(userId).catch(() => '');
    return { mode: 'fast' as const, answer: v ? `The values you've told me to weigh decisions against: ${v}.` : "You haven't told me your core values yet — say \"my values are …\" and I'll weigh big decisions against them.", route: 'fast' as const, model: 'wisdom' };
  }

  // Wisdom Accumulation (#35): recall the durable lessons the user has earned, relevant to what they asked.
  if (LESSONS_QUERY.test(message)) {
    const topic = message.replace(LESSONS_QUERY, ' ');
    return { mode: 'fast' as const, answer: formatLessons(await recallLessons(userId, topic, 5).catch(() => [])), route: 'fast' as const, model: 'lessons' };
  }

  // Cosmic Memory (#43): "have we seen this before?" — retrieve relevant earned lessons over ORB's memory.
  if (RECALL_QUERY.test(message)) {
    const topic = message.replace(RECALL_QUERY, ' ');
    const hits = await recallLessons(userId, topic, 4).catch(() => []);
    const answer = hits.length
      ? `Yes — here's what we've learned that looks relevant:\n${formatLessons(hits).split('\n').slice(1).join('\n')}`
      : "Nothing in what I've kept lines up with this yet — but as we go, I'll remember how it plays out so next time I can tell you whether we've been here before.";
    return { mode: 'fast' as const, answer, route: 'fast' as const, model: 'memory' };
  }

  // Adaptation & Learning: learn from reported outcomes, and surface what's working vs what to rethink.
  if (/\bwhat(?:'s| is| has been) working\b|\bwhat should i (?:do more of|double down on|change|stop doing)\b|\bwhat'?s working and what'?s not\b/i.test(message)) {
    return { mode: 'fast' as const, answer: formatAdaptation(await whatWorks(userId).catch(() => ({ keep: [], rethink: [] }))), route: 'fast' as const, model: 'adapt' };
  }
  {
    const oc = parseOutcome(message);
    if (oc) {
      await recordOutcome(userId, oc.label, oc.result).catch(() => {});
      const answer = oc.result === 'win'
        ? `Good to know — I'll remember "${oc.label}" worked and lean toward more of that.`
        : `Noted — "${oc.label}" didn't land. I'll factor that in and we can rethink the approach.`;
      return { mode: 'fast' as const, answer, route: 'fast' as const, model: 'adapt' };
    }
  }

  // Self-Regulation: the execution read — follow-through, the avoided high-value task, discipline trend.
  if (/\b(how'?s|how is|what'?s) my (?:follow[- ]through|discipline|execution|consistency)\b|\bam i (?:executing|following through|staying (?:on track|focused|disciplined))\b|\b(?:keep|hold) me accountable\b/i.test(message)) {
    return { mode: 'fast' as const, answer: await selfRegulation(userId).catch(() => "Give me a few commitments to track and I'll keep you honest."), route: 'fast' as const, model: 'selfreg' };
  }

  // Self-Regulation / habits: the patterns ORB has noticed in how the user actually works.
  if (/\bwhat are my (?:habits|patterns|routines?)\b|\bwhen am i (?:usually )?(?:most )?(?:active|productive)\b|\bmy (?:daily )?routine\b/i.test(message)) {
    return { mode: 'fast' as const, answer: formatPatterns(await habitPredictions(userId).catch(() => [])), route: 'fast' as const, model: 'habits' };
  }

  // Meta-Cognition: strategic reflection — step back and look at the whole picture honestly.
  if (META_QUERY.test(message) && !AUDIT_QUERY.test(message)) {
    return { mode: 'fast' as const, answer: await reflect(userId).catch(() => "Let's set a goal or two first, then I can reflect with you."), route: 'fast' as const, model: 'meta' };
  }

  // Behavior Prediction: anticipate the user's likely next moves from their patterns.
  if (/\bwhat am i likely to (?:do|decide|choose)\b|\bpredict my (?:behavio(?:u)?r|next move|decisions?)\b|\bwhat would i (?:probably|likely) (?:do|decide)\b|\bwhat'?s my likely next move\b|\bwhat will i (?:probably )?do next\b/i.test(message)) {
    return { mode: 'fast' as const, answer: formatPredictions(await predictBehavior(userId).catch(() => [])), route: 'fast' as const, model: 'behavior' };
  }

  // Attention Engine: the spotlight — what deserves focus right now, priority-scored (emergency first).
  if (/\bwhat (?:needs|deserves|should have) my attention\b|\bwhat(?:'s| is) (?:the )?most important\b|\bmy (?:top )?priorit(?:y|ies)\b|\bwhat should i focus on right now\b|\bwhat matters (?:most|right now)\b|\bprioriti[sz]e my\b/i.test(message)) {
    return { mode: 'fast' as const, answer: formatFocus(await focusList(userId).catch(() => [])), route: 'fast' as const, model: 'attention' };
  }

  // Attention & Goals: surface what the user keeps putting off, most pressing first.
  if (/\bwhat(?:'s| is| has been)?\s*(?:slipping|been slipping)\b|\bwhat (?:should i|do i need to) (?:focus on|prioriti[sz]e|tackle first|do first)\b|\bwhat am i (?:forgetting|putting off|avoiding|procrastinating(?: on)?)\b|\bwhat have i been (?:putting off|avoiding|postponing)\b/i.test(message)) {
    return { mode: 'fast' as const, answer: formatPending(await pendingGoals(userId).catch(() => [])), route: 'fast' as const, model: 'goals' };
  }

  // Digital Spatial Mapping: auto-build the map from connected systems (calendar today).
  if (MAP_WORLD.test(message)) {
    const r = await mapMyWorld(userId);
    const answer = r.added
      ? `Mapped ${r.added} thing${r.added === 1 ? '' : 's'} from your calendar, Drive, and inbox into your knowledge graph. Ask "what's connected to <name>?" to navigate it.`
      : (r.note || 'Nothing to map yet.');
    return { mode: 'fast' as const, answer, route: 'fast' as const, model: 'graph' };
  }

  // Systems Thinking: record a cause→effect, or trace the downstream chain through the system.
  {
    const cz = parseCausal(message);
    if (cz) {
      await relate(userId, cz.cause, cz.effect, cz.rel).catch(() => {});
      return { mode: 'fast' as const, answer: `Mapped the causal link — **${cz.cause}** ${cz.rel} **${cz.effect}**. Ask me to "trace ${cz.cause}" to follow the chain.`, route: 'fast' as const, model: 'systems' };
    }
  }
  {
    const tm = message.match(/\b(?:trace|downstream (?:of|effects of)|what does .* (?:cause|affect|lead to)|ripple effects? of|knock[- ]on effects? of)\s+(.+?)[?.!]*$/i)
      || message.match(/\bwhat does\s+(.+?)\s+(?:cause|affect|lead to)\b/i);
    if (tm) { const t = await traceCausal(userId, tm[1].trim()).catch(() => null); if (t) return { mode: 'fast' as const, answer: formatTrace(t), route: 'fast' as const, model: 'systems' }; }
  }

  // Digital Spatial Mapping: build/navigate the user's knowledge graph. Relate two things, or ask
  // what's connected to one. Unknown entities fall through to a normal answer (never hijacked).
  const rel = parseRelate(message);
  if (rel) {
    const ok = await relate(userId, rel.a, rel.b, rel.rel);
    const answer = ok ? `Mapped it — **${rel.a}** ${rel.rel} **${rel.b}**. Ask me "what's connected to ${rel.a}?" anytime.`
      : "I couldn't map that — try naming two distinct things.";
    return { mode: 'fast' as const, answer, route: 'fast' as const, model: 'graph' };
  }
  const aboutQ = parseAbout(message);
  if (aboutQ) {
    const r = await aboutEntity(userId, aboutQ).catch(() => null);
    if (r) return { mode: 'fast' as const, answer: formatAbout(r), route: 'fast' as const, model: 'graph' };
  }

  // Action mode: ORB *does* things — reminders/tasks now, email confirm-first. Nothing outward
  // goes without a "confirm". Checked before build so "remind me to build X" stays a reminder.
  const action = await handleAction(userId, message, { tz: opts.tz });
  if (action) return action;

  // Anticipation: the user started a command and trailed off ("schedule a meeting with…"). ORB
  // recognizes the frame and asks for exactly the missing slot — fluid, not a dead-ended fragment.
  // Only runs once actions.ts couldn't complete it, and never on questions (the predictor guards).
  const prediction = predictIntent(message);
  if (needsClarification(prediction)) {
    pendingClarify.set(userId, { partial: message, at: Date.now() });   // remember it for the reply
    return { mode: 'clarify' as const, answer: nextPrompt(prediction), intent: prediction.intent, missing: prediction.missing };
  }

  // Build mode: if the user is asking ORB to construct a site/app, run the Construction Genome
  // (Gemini designs, GPT architects, Claude codes) instead of a chat answer. Tier caps the depth.
  if (looksLikeBuildRequest(message)) {
    const build = await runBuild({ request: message, plan: opts.plan });
    return { mode: 'build' as const, answer: buildReply(build), build };
  }

  if (opts.council === false) {
    // Single-model path still needs the raw connector context for its prompt.
    const context = await gatherContext(userId);
    const cycle = await runOrbCycle(connectors, userId, { journal: createJournal(userId) });
    const prompt = `User request: ${message}

Connected system context:
${JSON.stringify(context, null, 2)}

Genome cycle — risk-gated, prioritized actions (highest edge first):
${JSON.stringify(cycle.actions, null, 2)}

Respond as ORB with priorities, recommended actions, and approval notes where needed.
Flag every action whose requiresApproval is true — never imply it can run on its own.`;
    const answer = await completeOrbPrompt(SYSTEM_PROMPT, prompt);
    return { mode: 'single' as const, answer, context, cycle };
  }

  // Speed routing: classify the task in code (instant — no model call) and send fast/medium/visual
  // work to a single quick model. Only heavy tasks (or explicit council / attached documents) pay
  // the full six-brain council. This is what keeps everyday responses snappy.
  const taskClass = classifyTask(message, Boolean(opts.images && opts.images.length));
  const forceCouncil = opts.council === true || taskClass === 'heavy' || Boolean(opts.documents);
  if (!forceCouncil) {
    // Weather is a live tool. Otherwise fetch your data ONLY when the request needs it
    // (calendar/email/tasks/money). Plain questions answer straight from the model — no fetching.
    // Router → memory search + parallel agents (knowledge + Calendar/Email/File), all at once →
    // Finalizer → one fast answer. Cache reuses stable answers; live/personal data is never cached.
    const [mems, toolCtx, prefs, faves] = await Promise.all([
      recall(userId, message, 4).catch(() => []),
      toolContext(message, userId, { lat: opts.lat, lon: opts.lon }),
      getPrefs(userId).catch(() => ({ style: 'short' as ConvoStyle, pauseMs: 1600, commands: {}, wit: true, humor: 'executive' as HumorLevel, support: 'standard' as SupportStyle, traits: {} })),
      topCommands(userId, 5).catch(() => [] as string[])
    ]);
    const savedStyle = prefs.style;
    // Learn in the background — favorite phrasing + communication tendencies + motivation drivers.
    void observeMessage(userId, message).catch(() => {});
    void observeMotivation(userId, message).catch(() => {});
    // Attention & Goals: track stated intentions and completions. If the user is re-raising something
    // important they keep putting off, surface a gentle nudge on this turn.
    const intent = await noteIntent(userId, message).catch(() => null);
    completeIntent(userId, message).then((g) => { if (g) void logEvent(userId, 'completed', g.action); }).catch(() => {});
    void logEvent(userId, 'active').catch(() => {});   // timestamped activity → habit/time-of-day patterns
    void recordLesson(userId, message).catch(() => {});   // #35: capture durable lessons when the user reflects
    const nudge = intent && intent.deferred ? nudgeFor(intent.goal) : null;
    let liveCtx = toolCtx;
    if (!liveCtx && needsContext(message)) liveCtx = JSON.stringify(await gatherContext(userId)).slice(0, 4000);

    // Communication Layer: read tone + emotion + urgency for this turn (state, never stored).
    // Saved length preference is the baseline, but a per-turn cue wins — "break it down" goes
    // detailed once; an urgent or frustrated tone forces short and a faster, no-fluff delivery.
    const comms = analyzeComms(message, opts.prosody);
    const urgent = comms.urgent;
    const noisy = opts.scene?.noise === 'loud';   // a loud place → favor brevity and clarity
    // Decision Engine / Creativity / Wisdom: weighty or generative turns get room and a structured frame.
    const decision = parseDecision(message);
    const auditing = AUDIT_QUERY.test(message);   // reviewing a past decision (process vs outcome)
    const creative = CREATIVE_QUERY.test(message);
    const strategic = isStrategic(message);
    const systemic = SYSTEMS_QUERY.test(message);
    const aligned = ALIGN_QUERY.test(message);     // "does this serve my purpose/values?"
    const foresight = FORESIGHT_QUERY.test(message);  // looking ahead / positioning
    // Higher-order frames (#17 orchestration, #18 long-view, #19 stewardship, #20 legacy, #21 cosmic,
    // #22 unified): ORB recognizes the altitude of the question and steers the council to reason at it.
    const orchestrating = PLAN_QUERY.test(message), evolving = EVOLUTION_QUERY.test(message), steward = STEWARDSHIP_QUERY.test(message);
    const legacyQ = LEGACY_QUERY.test(message), cosmic = COSMIC_QUERY.test(message), unified = UNIFIED_QUERY.test(message);
    const realityCheck = REALITY_QUERY.test(message);   // #23 calibrate to evidence
    const genesis = GENESIS_QUERY.test(message), emerge = EMERGENCE_QUERY.test(message);   // #25 create, #26 discover
    const synth = SYNTHESIS_QUERY.test(message), coherent = COHERENCE_QUERY.test(message);   // #27 combine, #28 align
    const resonant = RESONANCE_QUERY.test(message), transcend = TRANSCENDENCE_QUERY.test(message);   // #29 amplify, #30 surpass
    const harmonic = HARMONY_QUERY.test(message);   // #31 balance competing forces
    const flourish = FLOURISHING_QUERY.test(message);   // #32 the north star: thriving over output
    const conscEvolve = EVOLVE_QUERY.test(message), antifragile = ANTIFRAGILE_QUERY.test(message);   // #33 become next, #34 gain from stress
    const wisdomAccum = /\b(what (?:can|should) (?:i|we) learn from|lesson(?:s)? from (?:this|that)|what does this teach|takeaway from|for next time|so (?:this|it) (?:doesn'?t|won'?t) happen again|how do (?:i|we) avoid (?:this|that) (?:next time|again))\b/i.test(message);   // #35 extract a durable lesson
    const discovering = DISCOVERY_QUERY.test(message);   // #36 reason like a researcher: hypothesize + verify
    const governing = GOVERNANCE_QUERY.test(message);   // #37 govern intelligence: tiers, oversight, transparency
    const civscale = CIVILIZATION_QUERY.test(message);   // #38 reason at civilization scale
    const coordinating = COORDINATION_QUERY.test(message);   // #39 synchronize independent actors
    const preserving = PRESERVATION_QUERY.test(message), continuity = CONTINUITY_QUERY.test(message);   // #41 preserve across generations, #42 hold the thread
    const cosmicMem = /\b(what should (?:we|i) never forget|never be forgotten|too valuable to (?:lose|forget)|worth remembering (?:long[- ]term|forever)|what'?s worth remembering|memory hierarchy|what (?:learning|knowledge) (?:should|must) (?:we|i) keep)\b/i.test(message);   // #43 memory hierarchy posture
    const possible = POSSIBILITY_QUERY.test(message);   // #44 open the future-possibility space
    const sourcing = SOURCE_QUERY.test(message), unifying = UNITY_QUERY.test(message);   // #45 trace to origin, #46 whole-system interconnection
    const recursive = RECURSION_QUERY.test(message);   // #47 operate one level up: improve the process that produces results
    const awakening = AWAKENING_QUERY.test(message);   // #48 challenge the frame: surface blind spots, reframe
    const perspectival = PERSPECTIVE_QUERY.test(message);   // #49 integrate multiple viewpoints into a meta-view
    const metaPurpose = METAPURPOSE_QUERY.test(message), learning = LEARNING_QUERY.test(message);   // #50 deepen purpose, #51 learn forever
    const frontier = FRONTIER_QUERY.test(message);   // #52 scan the frontier for undiscovered opportunity (narrow; #36/#26/#25 cover the rest)
    // #40 Prime Directive: the constitutional test rides along on the most consequential calls (not chit-chat).
    const constitutional = !urgent && (decision || strategic || governing || aligned || steward || flourish);
    const deepThink = decision || auditing || creative || strategic || systemic || aligned || foresight || orchestrating || evolving || steward || legacyQ || cosmic || unified || realityCheck || genesis || emerge || synth || coherent || resonant || transcend || harmonic || flourish || conscEvolve || antifragile || wisdomAccum || discovering || governing || civscale || coordinating || preserving || continuity || cosmicMem || possible || sourcing || unifying || recursive || awakening || perspectival || metaPurpose || learning || frontier;
    const style: ConvoStyle = WANT_DETAIL.test(message) ? 'detailed'
      : (deepThink && !urgent) ? 'detailed'
      : (WANT_SHORT.test(message) || urgent || noisy || comms.emotion === 'frustrated') ? 'short' : savedStyle;

    // Humor: the user's level, downgraded to professional this turn if they're rushed, frustrated, or
    // being sarcastic — a chief of staff doesn't crack wise when the meeting just bombed. Friendly
    // teasing is the exception: matching it lightly is the right read.
    const pointedSarcasm = comms.sarcasm && comms.sarcasmType !== 'friendly';
    const humor: HumorLevel = (urgent || comms.emotion === 'frustrated' || pointedSarcasm) ? 'professional' : prefs.humor;

    // Cache: only when no live/personal data was pulled (so cached answers can't go stale).
    // Key includes style + tone + humor so calm/rushed/frustrated/playful/sarcastic answers don't collide.
    const cacheable = !liveCtx && !mems.length;
    const key = `${userId}|${style}|${urgent ? 'u' : 'n'}|${comms.emotion[0]}|${comms.sarcasm ? comms.sarcasmType[0] : 'x'}|${humor[0]}|${prefs.support[0]}|${message.trim().toLowerCase().replace(/\s+/g, ' ')}`;
    // Language: detect what the user wrote in, so ORB replies in-kind and speaks it in that voice.
    const lang = detectLang(message);
    // Adaptive voice: how ORB should SOUND this turn (register from humor, delivery from the state read,
    // then shifted toward clarity if the environment is loud).
    const voice = sceneVoice(voiceFor(comms, prefs.humor), opts.scene);
    if (cacheable) { const hit = cacheGet(key); if (hit) return { mode: 'fast' as const, answer: hit, route: 'fast' as const, model: 'cache', voice, lang: lang.locale }; }

    const memCtx = mems.length ? `What I remember about you (use if relevant):\n${mems.map((m) => `- ${m.title}: ${m.content}`).join('\n')}` : '';
    const faveCtx = faves.length ? `Commands this user reaches for often (recognize these shortcuts, act on intent fast): ${faves.map((c) => `"${c}"`).join(', ')}.` : '';
    // Goal Systems + Purpose: hand the model the user's objectives and what gives their work meaning,
    // so it frames answers around what they serve and flags anything pulling against it.
    const [goalCtx, purposeCtx] = await Promise.all([goalsContext(userId).catch(() => ''), alignmentContext(userId).catch(() => '')]);
    const context = [memCtx, faveCtx, goalCtx, purposeCtx, liveCtx].filter(Boolean).join('\n\n') || undefined;
    // Communication posture (urgency/emotion) + learned personality tendencies → quiet directives
    // shaping HOW ORB answers. Personality is skipped when rushed (speed wins); wit is dropped when
    // the user is frustrated (a chief of staff reads the room).
    // Meta-Cognition: decisions get a structured frame + a self-check on confidence/assumptions; a
    // decision audit judges process over outcome.
    const decisionDir = (decision && !urgent) ? decisionDirective(decision, await topDrivers(userId).catch(() => []), decisionProfile(prefs.traits)) + META_DIRECTIVE : '';
    const auditDir = (auditing && !urgent) ? AUDIT_DIRECTIVE + META_DIRECTIVE : '';
    // Creativity: push past the obvious. Wisdom: weigh strategic calls through consequences + values.
    const creativeDir = (creative && !urgent) ? CREATIVE_DIRECTIVE : '';
    const wisdomDir = (strategic && !urgent) ? WISDOM_DIRECTIVE + valuesDirective(await getValues(userId).catch(() => '')) : '';
    const systemsDir = (systemic && !urgent) ? SYSTEMS_DIRECTIVE : '';
    // Purpose alignment check + strategic-foresight framing on forward-looking turns.
    const alignDir = ((aligned || strategic) && !urgent) ? ALIGNMENT_DIRECTIVE : '';
    const foresightDir = (foresight && !urgent) ? FORESIGHT_DIRECTIVE : '';
    // The higher-order frames (#17–#22), each added only when its altitude is invoked.
    const higherDir = urgent ? '' : (
      (orchestrating ? ORCHESTRATION_DIRECTIVE : '') + (evolving ? EVOLUTION_DIRECTIVE : '') + (steward ? STEWARDSHIP_DIRECTIVE : '')
      + (legacyQ ? LEGACY_DIRECTIVE : '') + (cosmic ? COSMIC_DIRECTIVE : '') + (unified ? UNIFIED_DIRECTIVE : '') + (realityCheck ? REALITY_DIRECTIVE : '')
      + (genesis ? GENESIS_DIRECTIVE : '') + (emerge ? EMERGENCE_DIRECTIVE : '')
      + (synth ? SYNTHESIS_DIRECTIVE : '') + (coherent ? COHERENCE_DIRECTIVE : '') + (resonant ? RESONANCE_DIRECTIVE : '') + (transcend ? TRANSCENDENCE_DIRECTIVE : '')
      + (harmonic ? HARMONY_DIRECTIVE : '') + (flourish ? FLOURISHING_DIRECTIVE : '')
      + (conscEvolve ? EVOLVE_DIRECTIVE : '') + (antifragile ? ANTIFRAGILE_DIRECTIVE : '') + (wisdomAccum ? WISDOM_ACCUM_DIRECTIVE : '')
      + (discovering ? DISCOVERY_DIRECTIVE : '') + (governing ? GOVERNANCE_DIRECTIVE : '') + (civscale ? CIVILIZATION_DIRECTIVE : '')
      + (coordinating ? COORDINATION_DIRECTIVE : '') + (constitutional ? CONSTITUTION_DIRECTIVE : '')
      + (preserving ? PRESERVATION_DIRECTIVE : '') + (continuity ? CONTINUITY_DIRECTIVE : '') + (cosmicMem ? COSMIC_MEMORY_DIRECTIVE : '')
      + (possible ? POSSIBILITY_DIRECTIVE : '') + (sourcing ? SOURCE_DIRECTIVE : '') + (unifying ? UNITY_DIRECTIVE : '') + (recursive ? RECURSION_DIRECTIVE : '') + (awakening ? AWAKENING_DIRECTIVE : '')
      + (perspectival ? PERSPECTIVE_DIRECTIVE : '') + (metaPurpose ? METAPURPOSE_DIRECTIVE : '') + (learning ? LEARNING_DIRECTIVE : '') + (frontier ? FRONTIER_DIRECTIVE : ''));
    const posture = postureDirective(comms) + sceneDirective(opts.scene) + decisionDir + auditDir + creativeDir + wisdomDir + systemsDir + alignDir + foresightDir + higherDir;
    // Personality tendencies + motivation drivers shape HOW and WHY ORB frames the answer (skip when rushed).
    const profile = urgent ? '' : (profileDirective(prefs.traits) + await motivationDirective(userId).catch(() => ''));
    const replyLang = lang.code === 'en' ? undefined : lang.name;
    const routed = await routedAnswer(message, { images: opts.images, context, style, urgent, humor, support: prefs.support, profile, posture, replyLang });
    if (cacheable && routed.ok && routed.answer) cacheSet(key, routed.answer);
    // Situational awareness: the first time a loud place is detected, ORB says so once (then drops it).
    const envNote = (noisy && lang.code === 'en' && shouldNoteEnv(userId)) ? "Sounds loud where you are — I'll keep this short. " : '';
    // Behavioral nudge for a high-impact thing the user keeps deferring (English turns only).
    const nudgeLead = (nudge && lang.code === 'en') ? `${nudge}\n\n` : '';
    // #28 Coherence: when asked if things line up, surface REAL measured gaps (stated-important vs. deferred goals).
    let cohLead = '';
    if (coherent && lang.code === 'en') {
      const gaps = formatCoherence(detectCoherenceGaps(await pendingGoals(userId, 12).catch(() => [])));
      if (gaps) cohLead = `${gaps}\n\n`;
    }
    const lead = nudgeLead + cohLead;
    return { mode: 'fast' as const, answer: lead + envNote + routed.answer, route: routed.route, model: routed.label, voice, lang: lang.locale };
  }

  const council = await runCouncil(userId, message, {
    documents: opts.documents, images: opts.images,
    level: opts.level, maxLevel: opts.plan ? getPlan(opts.plan).maxCouncil : undefined,
    personality: opts.personality, customPersona: opts.customPersona
  });
  return {
    mode: 'council' as const,
    answer: council.finalAnswer,
    cycle: council.cycle,
    approvalRequired: council.approvalRequired,
    council: council.council,
    fullyConfigured: council.fullyConfigured,
    level: council.level,
    ran: council.ran
  };
}

/**
 * The morning briefing: one genome cycle turned into a human-readable summary.
 * Pure-code fallback when AI is not configured, so ORB always produces something.
 */
export async function dailyBriefing(userId: string): Promise<{ report: OrbCycleReport; summary: string }> {
  const report = await runOrbCycle(connectors, userId, { journal: createJournal(userId) });
  const approvals = report.actions.filter((a) => a.requiresApproval);
  const auto = report.actions.filter((a) => !a.requiresApproval);
  const lines = [
    `ORB daily briefing — ${report.actions.length} actions surfaced (${approvals.length} need approval).`,
    ...report.actions.map(
      (a, i) =>
        `${i + 1}. [${a.riskLevel.toUpperCase()}${a.requiresApproval ? ' · approve' : ' · auto'}] ${a.title}`
    )
  ];
  if (auto.length) lines.push(`Auto-safe: ${auto.map((a) => a.title).join(', ')}.`);
  return { report, summary: lines.join('\n') };
}

/**
 * Proactive ORB — EBE speaks first. A short, spoken-ready alert of the top priorities, built
 * straight from the genome cycle (pure code: fast, free, always works). Greets by name if known.
 */
export async function proactive(userId: string, name?: string): Promise<{ alert: string; count: number; actions: OrbAction[] }> {
  const report = await runOrbCycle(connectors, userId, { journal: createJournal(userId) });
  const top = report.actions.slice(0, 3);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  if (!top.length) {
    return { alert: `${greet}${name ? ', ' + name : ''}. You're all clear — nothing needs your attention right now.`, count: 0, actions: [] };
  }
  const items = top.map((a, i) => `${i + 1}. ${a.title}`).join(' ');
  const needApproval = report.actions.filter((a) => a.requiresApproval).length;
  const alert = `${greet}${name ? ', ' + name : ''}. You have ${report.actions.length} thing${report.actions.length === 1 ? '' : 's'} that need attention. Top priorities: ${items}` +
    (needApproval ? ` ${needApproval} need your okay.` : '') + ' Want a full briefing?';
  return { alert, count: report.actions.length, actions: top };
}

export function createInsight(input: Partial<OrbInsight>): OrbInsight {
  return {
    title: input.title ?? 'Untitled Insight',
    summary: input.summary ?? '',
    domain: input.domain ?? 'personal',
    priorityScore: input.priorityScore ?? scorePriority(5, 5, 2, 5),
    evidence: input.evidence ?? [],
    recommendedActions: input.recommendedActions ?? []
  };
}

export function createAction(action: Omit<OrbAction, 'requiresApproval'>): OrbAction {
  const requiresApproval = action.riskLevel !== 'low';
  return { ...action, requiresApproval };
}
