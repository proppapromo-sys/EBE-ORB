/**
 * systems.ts — ORB's Systems Thinking & Reality Modeling (#13). Most people see events; systems
 * thinkers see the structures producing them. ORB analyzes a situation through structure, feedback
 * loops (reinforcing vs balancing), incentives, constraints/bottlenecks, delays, and second-order
 * effects — finding root causes and the highest-leverage intervention rather than treating symptoms.
 * Cause→effect relationships are stored as causal edges in the knowledge graph (graph.traceCausal).
 */
export const SYSTEMS_QUERY = /\b(why (?:does|do|is|are|did|has|have|keeps?)\b.*\b(?:keep happening|happening|going wrong|dropping|falling|rising)|root cause|what'?s (?:the )?(?:bottleneck|root cause|real (?:problem|issue))|feedback loop|vicious cycle|downward spiral|unintended consequenc|leverage point|second[- ]order|systemic|knock[- ]on|ripple effect|how does .+ affect|what'?s (?:really )?driving|underlying (?:cause|structure))\b/i;

export const SYSTEMS_DIRECTIVE = ' Think in systems, not symptoms: map the structure (the key parts and how they connect), find the feedback loops (what reinforces the trend vs what balances it), the incentives (what each actor is actually rewarded for), and the real constraint or bottleneck. Account for delays (effects arrive later than causes), trace the second- and third-order effects, then point to the highest-leverage intervention — the small change that shifts the whole system — instead of treating the surface symptom.';

export type Causal = { cause: string; effect: string; rel: string };

const POS = /^(.+?)\s+(?:causes?|leads? to|drives?|results? in|triggers?|fuels?|increases?|boosts?)\s+(.+)$/i;
const NEG = /^(.+?)\s+(?:reduces?|lowers?|decreases?|prevents?|hurts?|kills?|slows?|cuts?)\s+(.+)$/i;
function clean(s: string): string { return (s || '').trim().replace(/^(?:the|a|an|my|our|more|less)\s+/i, '').replace(/[.!?]+$/, '').trim(); }

/** Detect a stated cause→effect ("late deliveries cause churn", "good service reduces complaints"). */
export function parseCausal(text: string): Causal | null {
  if (/\?\s*$/.test(text || '') || /^(?:why|how|what|does|do|is|are)\b/i.test((text || '').trim())) return null;
  let m = POS.exec(text || '');
  if (m) { const c = clean(m[1]), e = clean(m[2]); return valid(c, e) ? { cause: c, effect: e, rel: 'causes' } : null; }
  m = NEG.exec(text || '');
  if (m) { const c = clean(m[1]), e = clean(m[2]); return valid(c, e) ? { cause: c, effect: e, rel: 'reduces' } : null; }
  return null;
}
function valid(a: string, b: string): boolean { return a.length >= 2 && a.length <= 50 && b.length >= 2 && b.length <= 50; }
