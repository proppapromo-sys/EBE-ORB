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

/** A directive that frames how ORB should reason about the choice — trade-offs, goals, drivers, a pick. */
export function decisionDirective(d: Decision, drivers: string[] = []): string {
  const drv = drivers.length
    ? ` Weigh them through what drives this user (${drivers.join(', ')}) — surface the angle that actually matters to them.`
    : '';
  return ` The user is weighing a decision: "${d.options[0]}" vs "${d.options[1]}". Be a decision partner: name the single biggest trade-off of EACH option (its key upside against its main cost or risk), check both against the user's goals,${drv} then commit to ONE clear recommendation with a one-line reason. Be concrete; don't just list pros and cons.`;
}
