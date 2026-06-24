/**
 * decision.ts — ORB's Decision Engine. The point where motivation converts into action: choosing
 * between competing options. A chief of staff doesn't just list pros and cons; it names the real
 * trade-off of each choice, checks them against the user's goals, weighs them through what actually
 * drives the user (a security-driven person hears the stability angle; a freedom-driven one hears the
 * autonomy angle), and commits to a recommendation. This layer detects the decision and structures
 * how ORB reasons about it; the model does the weighing with that frame.
 */

export type Decision = { options: [string, string] };

function clean(a: string, b: string): Decision | null {
  const opts = [a, b].map((s) => s.trim().replace(/[?.!]+$/, '').replace(/^(?:to|just)\s+/i, '').trim());
  if (opts.every((o) => o.length >= 2 && o.length <= 60 && !/^(?:i|we|it|you)$/i.test(o))) return { options: [opts[0], opts[1]] };
  return null;
}

/** Detect a "this or that" decision the user is weighing, or null. */
export function parseDecision(text: string): Decision | null {
  const t = (text || '').trim();
  let m: RegExpExecArray | null;
  if ((m = /\bshould (?:i|we)\b\s+(.+?)\s+\bor\b\s+(.+?)[?.!]*$/i.exec(t))) return clean(m[1], m[2]);
  if ((m = /\b(?:choose|decide|pick|deciding)\s+between\s+(.+?)\s+\band\b\s+(.+?)[?.!]*$/i.exec(t))) return clean(m[1], m[2]);
  if (t.length < 80 && (m = /^(.+?)\s+(?:vs\.?|versus)\s+(.+?)[?.!]*$/i.exec(t))) return clean(m[1], m[2]);
  if ((m = /\b(?:do i|can'?t decide (?:whether|if) to)\b\s+(.+?)\s+\bor\b\s+(.+?)[?.!]*$/i.exec(t))) return clean(m[1], m[2]);
  return null;
}

export type DecisionProfile = { risk: 'low' | 'medium' | 'high'; style: 'analytical' | 'intuitive' | 'balanced' };

/** A directive that frames how ORB reasons about the choice — options, risk, bias-guards, goals, a pick. */
export function decisionDirective(d: Decision, drivers: string[] = [], profile?: DecisionProfile): string {
  const drv = drivers.length
    ? ` Weigh them through what drives this user (${drivers.join(', ')}) — surface the angle that actually matters to them.`
    : '';
  const prof = profile
    ? ` They tend to decide ${profile.style} with ${profile.risk} risk tolerance — ${profile.style === 'analytical' ? 'show the reasoning and rough numbers' : profile.style === 'intuitive' ? 'lead with a clear recommendation, light on detail' : 'pair a clear pick with the key reasoning'}; ${profile.risk === 'low' ? 'weight downside protection' : profile.risk === 'high' ? "don't over-warn on risk" : 'keep risk and reward balanced'}.`
    : '';
  return ` The user is weighing a decision: "${d.options[0]}" vs "${d.options[1]}". Be a decision partner: for EACH option give its main benefit, its main cost/risk, and a rough sense of likelihood; check both against the user's goals.${drv}${prof} Guard against bias — don't merely confirm their existing lean (confirmation bias), don't overweight a recent event (availability) or the first figure mentioned (anchoring), and remember a loss stings more than an equal gain (loss aversion). Then commit to ONE clear recommendation with a one-line why — judged by sound reasoning, not a guaranteed outcome. Be concrete; this is good-vs-good, not pros-and-cons filler.`;
}
