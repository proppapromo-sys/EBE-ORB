/**
 * router.ts — ORB's speed brain. The full council is deliberate but slow (six models in series),
 * so most requests don't need it. This classifies each task IN CODE (instant — no model call) and
 * routes to the single fastest fit:
 *
 *   fast    → Gemini Flash   (calendar, reminders, quick questions, chit-chat)
 *   medium  → GPT            (business, planning, operations)
 *   visual  → Gemini         (images / screenshots)
 *   heavy   → the full council (contracts, reports, deep analysis)  ← handled by caller
 *
 * The chosen model answers AS ORB (the finalizer voice), so the user always hears one person.
 */
import { getProviderClient } from './providers.js';
import { BRAINS } from './brains.js';
import type { BrainProvider } from './types.js';

export type TaskClass = 'fast' | 'medium' | 'heavy' | 'visual';

const env = (k: string, f: string) => process.env[k] ?? f;

/** Speed-tiered model map (overridable via env). */
export const ROUTES: Record<TaskClass, { provider: BrainProvider; model: string; label: string }> = {
  fast:   { provider: 'openai',    model: env('ORB_FAST_MODEL', 'gpt-4.1-mini'),         label: 'GPT' },
  medium: { provider: 'openai',    model: env('ORB_MEDIUM_MODEL', 'gpt-4.1'),            label: 'GPT' },
  heavy:  { provider: 'anthropic', model: env('ORB_HEAVY_MODEL', 'claude-sonnet-4-6'),   label: 'Claude' },
  visual: { provider: 'gemini',    model: env('ORB_VISUAL_MODEL', 'gemini-2.5-flash'),   label: 'Gemini' }
};

const HEAVY = /\b(contract|agreement|legal|lawsuit|report|analy[sz]e|analysis|deep dive|thorough|due diligence|audit|forecast|whitepaper|proposal|research|financial (model|statement|report))\b/i;
const MEDIUM = /\b(plan|planning|business|operations?|strateg(y|ic)|budget|hir(e|ing)|market(ing)?|campaign|workflow|process|roadmap|compare|pros and cons|organi[sz]e|should i|how should)\b/i;

/** Classify a request for speed. Images → visual; long/legal/analytical → heavy; planning → medium; else fast. */
export function classifyTask(message: string, hasImages = false): TaskClass {
  if (hasImages) return 'visual';
  const m = message || '';
  if (m.length > 600 || HEAVY.test(m)) return 'heavy';
  if (MEDIUM.test(m)) return 'medium';
  return 'fast';
}

/** Try the best fit first, then other configured providers — so one model being down still answers. */
function providerChain(cls: TaskClass): { provider: BrainProvider; model: string; label: string }[] {
  const order = [ROUTES[cls], ROUTES.medium, ROUTES.fast, ROUTES.heavy];
  const seen = new Set<BrainProvider>();
  const chain: { provider: BrainProvider; model: string; label: string }[] = [];
  for (const r of order) {
    if (seen.has(r.provider)) continue;
    seen.add(r.provider);
    if (getProviderClient(r.provider).configured) chain.push(r);
  }
  return chain;
}

/** Answer a request with one routed model, speaking as ORB. Falls back across providers on failure. */
// Executive Wit — ORB's personality trait. A chief of staff who occasionally lands one sharp,
// memorable observation (Observation + Truth + Unexpected Twist), then gets out of the way. The
// guardrails matter more than the joke: sparingly, never distracting, never at the user's expense,
// and silenced completely when the moment is wrong (handled by the caller via the `wit` flag).
const WIT_DIRECTIVE =
  ' Executive Wit: you are a sharp chief of staff with a dry, intelligent sense of humor. Occasionally — ' +
  'not most turns — land ONE brief, clever observation: something true about the situation with an unexpected ' +
  'twist (e.g. "You scheduled 12 hours of work into a 10-hour day — even physics has concerns."). Keep it ' +
  'professional, warm, and under one sentence; never goofy, never at the user\'s expense, never a pun for its ' +
  'own sake. If nothing genuinely clever fits, stay plain — forced wit is worse than none. The quip never ' +
  'delays, replaces, or buries the actual answer or any important detail. Skip wit entirely for anything ' +
  'sensitive, serious, or bad news (money trouble, health, conflict, errors, grief).';

export async function routedAnswer(
  message: string,
  opts: { images?: string[]; context?: string; style?: 'short' | 'detailed'; urgent?: boolean; wit?: boolean; profile?: string; posture?: string } = {}
): Promise<{ answer: string; route: TaskClass; model: string; label: string; ok: boolean }> {
  const cls = classifyTask(message, Boolean(opts.images && opts.images.length));
  // Adaptive Conversation Memory: honor the user's learned answer-length preference. "short" keeps
  // ORB crisp (the default — feels fast and human); "detailed" unlocks a fuller answer for this turn.
  const detailed = opts.style === 'detailed';
  const styleDirective = detailed
    ? 'Give a thorough, well-structured answer — the user asked you to break it down.'
    : 'Answer briefly and directly — one or two sentences unless more is truly needed.';
  // Communication Layer posture: how the user sounds this turn (rushed/frustrated/unsure/playful).
  const postureDirective = opts.posture || '';
  // Executive Wit: only when enabled AND the user isn't rushed (speed beats cleverness when urgent).
  const witDirective = (opts.wit && !opts.urgent) ? WIT_DIRECTIVE : '';
  // Personality Engine: learned communication tendencies (already gated/empty when not yet earned).
  const profileDirective = opts.profile || '';
  const base = opts.context ? `Context (use silently, never read aloud):\n${opts.context}\n\nUser: ${message}` : message;
  const user = `${styleDirective}${postureDirective}${witDirective}${profileDirective}\n\n${base}`;
  const chain = providerChain(cls);
  // Keep spoken/chat answers short → far faster to generate. Heavy work goes through the council instead.
  const maxTokens = detailed ? 900 : cls === 'fast' ? 240 : 700;
  for (const route of chain) {
    try {
      const { text, ok } = await getProviderClient(route.provider).complete({ model: route.model, system: BRAINS.finalizer.system, user, images: opts.images, maxTokens });
      if (ok && text.trim()) return { answer: text, route: cls, model: route.model, label: route.label, ok: true };
    } catch { /* try the next provider */ }
  }
  // Everything we have is down or unconfigured — a calm message, never a raw API error.
  return { answer: "I'm having a brief problem reaching my models — give me a moment and try that again.", route: cls, model: ROUTES[cls].label, label: ROUTES[cls].label, ok: false };
}
