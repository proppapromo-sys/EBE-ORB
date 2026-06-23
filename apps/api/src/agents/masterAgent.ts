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
import { getAccessToken, calendarUpcoming, gmailUnreadImportant } from '../connectors/google.js';
import { generateVideo, videoAllowedFor } from '../services/video.js';
import { getPlan } from '../billing/plans.js';
import type { ConnectorResult, OrbAction, OrbInsight } from '../types/orb.js';

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
// File AI (ready for Google Drive — returns nothing until a file source is connected)
const FILE_RE = /\b(file|files|document|doc|drive|folder|spreadsheet)\b/i;
async function fileAgent(_userId: string, message: string): Promise<string | null> {
  if (!FILE_RE.test(message)) return null;
  return 'Files: no file source connected yet — connect Google Drive to let me search your files.';
}

/**
 * The fan-out: ORB Router → many specialized agents run in parallel (knowledge tools + Calendar /
 * Email / File over the user's accounts) → results feed the Finalizer for one fast answer.
 * Each agent only fetches if the request matches it, so plain chat stays instant.
 */
async function toolContext(message: string, userId: string, opts: { lat?: number; lon?: number }): Promise<string | undefined> {
  const sync = [selfContext(message)].filter(Boolean) as string[];
  const fetched = (await Promise.all([
    weatherContext(message, opts), newsContext(message), stocksContext(message),
    dictionaryContext(message), wikiContext(message), geographyContext(message), currencyContext(message),
    timeContext(message), govContext(message),
    calendarAgent(userId, message), emailAgent(userId, message), fileAgent(userId, message)
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

/**
 * Ask ORB. By default this convenes the full Multi-Model Council and returns the
 * ORB-Finalizer's single clean answer; `approvalRequired` stays code-computed from the cycle.
 * Pass { council: false } for a single-model answer (the lightweight path).
 */
export async function askOrb(
  userId: string,
  message: string,
  opts: { council?: boolean; documents?: string; images?: string[]; level?: CouncilLevel; plan?: string; personality?: string; customPersona?: string; lat?: number; lon?: number; tz?: string } = {}
) {
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

  // Action mode: ORB *does* things — reminders/tasks now, email confirm-first. Nothing outward
  // goes without a "confirm". Checked before build so "remind me to build X" stays a reminder.
  const action = await handleAction(userId, message, { tz: opts.tz });
  if (action) return action;

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
    // Router → parallel agents (knowledge + Calendar/Email/File) → Finalizer → one fast answer.
    let context = await toolContext(message, userId, { lat: opts.lat, lon: opts.lon });
    if (!context && needsContext(message)) context = JSON.stringify(await gatherContext(userId)).slice(0, 4000);
    const routed = await routedAnswer(message, { images: opts.images, context });
    return { mode: 'fast' as const, answer: routed.answer, route: routed.route, model: routed.label };
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
