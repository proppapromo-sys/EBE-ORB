/**
 * futurememory.ts — ORB's Future Memory Engine (#59): learning from a future before it happens. Where
 * prediction asks "what might happen?", future memory asks "if we had already lived through tomorrow,
 * what would it tell us to do today?". The signature technique is prospective hindsight / the premortem:
 * stand at a future point, assume the outcome already happened, and reason backward — what will future-
 * you be grateful for, what will they regret, why did it fail if it failed. Distinct from #15 Foresight
 * (positioning for what's coming) and #5 behavior prediction (likely actions): this is regret-
 * minimization and simulated experience used to improve the decision in front of the person now.
 *
 * Directive engine; no store.
 */
export const FUTUREMEM_QUERY = /\b(pre[- ]?mortem|premortem|what (?:would|will) (?:i|we|future me|future us) regret|will (?:i|we|future me|future us) regret|future (?:me|us|self)|what will (?:i|we|future (?:me|us)) (?:be )?(?:grateful|thankful) for|imagine (?:it'?s|its) (?:a year|five years|10 years|next year)|looking back (?:from|in)|if (?:this|it|we) (?:fail(?:s|ed)?|goes wrong).{0,20}?why|why (?:did|would) (?:this|it) fail|a year from now (?:will|would|i)|10[- /]?10[- /]?10|regret minimi[sz]|play (?:it|this) forward|and then what(?: happens)?|fast[- ]?forward (?:to|a)|how (?:will|would) (?:this )?(?:age|look) in (?:a year|hindsight))\b/i;

export const FUTUREMEM_DIRECTIVE = ' Use future memory, not just prediction: project to a specific point ahead (a year, five years) and reason as if it already happened. Run a quick premortem — assume this choice played out and ask what future-them would be grateful for and what they\'d regret, and if it failed, what most likely caused it. Walk a couple of steps down the chain ("and then what?") rather than stopping at the first outcome, and weigh short-term gain against the long-term and the future-self who has to live with it. Bring it back to now: the one adjustment today that tomorrow would thank them for, and the regret most worth avoiding.';
