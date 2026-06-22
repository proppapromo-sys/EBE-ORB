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
  fast:   { provider: 'gemini',    model: env('ORB_FAST_MODEL', 'gemini-2.5-flash'),     label: 'Gemini Flash' },
  medium: { provider: 'openai',    model: env('ORB_MEDIUM_MODEL', 'gpt-4.1-mini'),       label: 'GPT' },
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

/** Pick a route, falling back to whatever provider is actually configured (so an answer always returns). */
function resolveRoute(cls: TaskClass): { provider: BrainProvider; model: string; label: string } {
  const primary = ROUTES[cls];
  if (getProviderClient(primary.provider).configured) return primary;
  for (const alt of [ROUTES.medium, ROUTES.fast, ROUTES.heavy]) {
    if (getProviderClient(alt.provider).configured) return alt;
  }
  return primary; // nothing configured — returns the labelled stub
}

/** Answer a request with one routed model, speaking as ORB. */
export async function routedAnswer(
  message: string,
  opts: { images?: string[]; context?: string } = {}
): Promise<{ answer: string; route: TaskClass; model: string; label: string; ok: boolean }> {
  const cls = classifyTask(message, Boolean(opts.images && opts.images.length));
  const route = resolveRoute(cls);
  const client = getProviderClient(route.provider);
  const user = opts.context ? `Context (use silently, never read aloud):\n${opts.context}\n\nUser: ${message}` : message;
  const { text, ok, note } = await client.complete({ model: route.model, system: BRAINS.finalizer.system, user, images: opts.images });
  return { answer: text || note || '…', route: cls, model: route.model, label: route.label, ok };
}
