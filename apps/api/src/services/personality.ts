/**
 * personality.ts — ORB's Personality Engine. Over time ORB learns *how each person prefers to be
 * communicated with* and adapts: directness, depth, risk posture, appetite for options, visual
 * thinking, and decisiveness. This is NOT labeling the user and NOT pop-psychology typing — it's a
 * handful of behavioral tendencies, each earned from repeated, deliberate signals in what the user
 * chose to say, and only ever used to shape ORB's delivery.
 *
 * Privacy: traits are derived from finished text the user sent to ORB — never background speech, never
 * raw audio. Each tendency needs repeated evidence before it influences anything, the score is bounded,
 * and the user can read it back in plain language ("what have you learned about me") or reset it.
 */

// The six tendencies, each scored in [-1, 1] (0 = unknown). Negative/positive are opposite leans.
export type TraitKey = 'direct' | 'analytical' | 'risk' | 'explore' | 'visual' | 'decisive';
export type TraitState = { s: number; n: number };          // s = score, n = evidence count
export type Traits = Partial<Record<TraitKey, TraitState>>;

// Observable cues → a nudge on one tendency. Read from deliberate, finished text only.
const SIGNALS: { key: TraitKey; dir: 1 | -1; re: RegExp }[] = [
  { key: 'direct', dir: 1, re: /\b(just|simply|cut to (?:it|the chase)|bottom line|get to the point|no fluff|skip the|spare me)\b/i },
  { key: 'direct', dir: -1, re: /\b(could you maybe|if you (?:don'?t mind|get a chance|have (?:a )?(?:sec|time))|whenever you can|sorry to bother|i was wondering|would it be possible|when you get a moment)\b/i },
  { key: 'analytical', dir: 1, re: /\b(why|how (?:does|do|did|come)|explain|break it down|in detail|the (?:data|numbers|details)|walk me through|reasoning|rationale|root cause|prove)\b/i },
  { key: 'analytical', dir: -1, re: /\b(quick(?:ly)?|tl;?dr|short version|just the gist|one line|keep it short|don'?t explain|skip the detail)\b/i },
  { key: 'risk', dir: 1, re: /\b(let'?s do it|go for it|send it|ship it|just do it|i'?m in|full send|be aggressive|bold|take the risk|double down|swing)\b/i },
  { key: 'risk', dir: -1, re: /\b(careful|cautious|are you sure|double[- ]check|make sure|play it safe|conservative|hold off|what'?s the risk|too risky|safer|hedge)\b/i },
  { key: 'explore', dir: 1, re: /\b(ideas?|brainstorm|options|alternatives?|what else|other ways|creative|any other|possibilities|explore|outside the box|inspire)\b/i },
  { key: 'visual', dir: 1, re: /\b(show me|chart|graph|diagram|draw|picture|visual(?:i[sz]e)?|mockup|sketch|image of|map (?:it|out)|wireframe)\b/i },
  { key: 'decisive', dir: 1, re: /\b(just (?:pick|choose|decide)|your call|you decide|you choose|what should i|what would you do|recommend|tell me what to do|pick one|make the call)\b/i },
  { key: 'decisive', dir: -1, re: /\b(give me (?:the )?options|what are (?:my|the) (?:choices|options)|let me (?:think|decide)|i'?ll decide|lay out the|pros and cons|weigh)\b/i }
];

const DECAY = 0.82, RATE = 0.18;                            // bounded EMA — recent behavior matters more
const clamp1 = (x: number) => Math.max(-1, Math.min(1, x));

/** Pull the per-tendency nudges a single message provides (summing +/- cues on the same trait). */
export function traitSignals(text: string): Partial<Record<TraitKey, number>> {
  const out: Partial<Record<TraitKey, number>> = {};
  for (const sig of SIGNALS) if (sig.re.test(text)) out[sig.key] = (out[sig.key] || 0) + sig.dir;
  return out;
}

/** Fold one message's signals into the running profile (EMA + evidence count). Pure — returns new map. */
export function applySignals(traits: Traits, text: string): Traits {
  const signals = traitSignals(text);
  const next: Traits = { ...traits };
  for (const k of Object.keys(signals) as TraitKey[]) {
    const nudge = clamp1(signals[k]!);
    const cur = next[k] ?? { s: 0, n: 0 };
    next[k] = { s: clamp1(cur.s * DECAY + nudge * RATE), n: Math.min(999, cur.n + 1) };
  }
  return next;
}

/** A tendency only speaks once it's earned: enough evidence and a clear lean. */
export function confident(t?: TraitState): boolean {
  return !!t && t.n >= 3 && Math.abs(t.s) >= 0.25;
}

/**
 * Turn confident tendencies into a quiet directive for the model — "communicate this way," never
 * shown or spoken to the user. Returns '' until ORB has actually learned something.
 */
export function profileDirective(traits: Traits): string {
  const c: string[] = [];
  const t = traits;
  if (confident(t.direct)) c.push(t.direct!.s > 0 ? 'lead bluntly — skip hedging and filler' : 'be polite and gentle in framing');
  if (confident(t.analytical)) c.push(t.analytical!.s > 0 ? 'show the reasoning and back claims with specifics' : 'stay concise — conclusion first, minimal explanation');
  if (confident(t.risk)) c.push(t.risk!.s > 0 ? 'they move decisively — lead with the bold play, but still name real downside' : 'they are cautious — lead with the safer option and call out risks plainly');
  if (confident(t.explore)) c.push('offer a fresh angle or an alternative or two');
  if (confident(t.visual)) c.push('structure scannable steps or lists, and suggest a visual when it genuinely helps');
  if (confident(t.decisive)) c.push(t.decisive!.s > 0 ? 'give one clear recommendation, not a menu' : 'lay out the options before you recommend');
  if (!c.length) return '';
  return ` Communication tendencies for this user (adapt to these naturally; never mention or explain them): ${c.join('; ')}.`;
}

/** A decision profile derived from the learned tendencies — risk tolerance and how they decide. */
export function decisionProfile(traits: Traits): { risk: 'low' | 'medium' | 'high'; style: 'analytical' | 'intuitive' | 'balanced' } {
  const r = traits.risk, a = traits.analytical, d = traits.decisive;
  const risk = r && r.n >= 2 ? (r.s > 0.25 ? 'high' : r.s < -0.25 ? 'low' : 'medium') : 'medium';
  const style = a && a.n >= 2 && a.s > 0.25 ? 'analytical'
    : (d && d.n >= 2 && d.s > 0.25 && (!a || a.s <= 0)) ? 'intuitive' : 'balanced';
  return { risk, style };
}

/** Plain-language, non-labeling read-back of what ORB has learned. Honest when it's still early. */
export function describeProfile(traits: Traits): string {
  const p: string[] = [];
  const t = traits;
  if (confident(t.direct)) p.push(t.direct!.s > 0 ? 'you prefer direct, no-fluff answers' : 'you like a softer, more considered tone');
  if (confident(t.analytical)) p.push(t.analytical!.s > 0 ? 'you like the reasoning spelled out' : 'you like things kept concise');
  if (confident(t.risk)) p.push(t.risk!.s > 0 ? 'you tend to move decisively' : 'you tend to play it safe');
  if (confident(t.explore)) p.push('you appreciate options and fresh ideas');
  if (confident(t.visual)) p.push('you think visually');
  if (confident(t.decisive)) p.push(t.decisive!.s > 0 ? 'you want a clear recommendation' : 'you like to weigh the options yourself');
  if (!p.length) return "I'm still getting to know how you like to work — give it a little time and I'll adapt to your style. Nothing about you is stored beyond these simple preferences.";
  const last = p.pop()!;
  const joined = p.length ? `${p.join(', ')}, and ${last}` : last;
  return `Here's how I've learned to work with you: ${joined}. That's just how I tune my delivery — tell me anytime if it's off, or say "reset my profile" to start fresh.`;
}
