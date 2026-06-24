/**
 * value.ts — ORB's Ultimate Value Engine (#91): what is worth pursuing in the first place. Purpose
 * answers "why?"; value answers "what is worth it?" — the foundation purpose rests on. Coverage-checked
 * as genuinely new: distinct from the user's STORED values (#14, "my values are…") and from #50
 * Meta-purpose (the why-chain). This is the reasoning lens for intrinsic worth: distinguishing what has
 * value as a means (instrumental) from what has value as an end (intrinsic), and what stays worth
 * preserving/creating/expanding across time and contexts.
 *
 * Directive engine; leans on the user's stored values/purpose when present. No store.
 */
export const VALUE_QUERY = /\b(what(?:'s| is) (?:ultimately|truly|actually|intrinsically|really) valuable|what (?:is|'s) worth (?:pursuing|preserving|protecting|building|sacrific|the (?:effort|cost)|having)|intrinsic(?:ally)? (?:value|worth|valuable)|instrumental value|value as (?:a means|an end)|what (?:truly|really|most) matters(?: most)?|what matters most|what(?:'s| is) (?:of )?(?:real|true|lasting|ultimate) (?:value|worth)|what should (?:i|we) value|is (?:this|it) (?:even )?worth (?:it|pursuing|doing)|what'?s (?:actually )?worth (?:it|doing)|what deserves (?:to be )?(?:valued|protected|pursued)|worth preserving (?:forever|across))\b/i;

export const VALUE_DIRECTIVE = ' Reason about value, the foundation under purpose: before "how" or even "why", what here is actually worth pursuing? Distinguish instrumental value (worth something as a means — money, efficiency, status) from intrinsic value (worth it as an end — truth, wisdom, flourishing, love, meaning, understanding), and don\'t let a means masquerade as an end. Test durability: would this still be worth it in ten or a hundred years, across different circumstances? Where you know the person\'s values, weigh against them. Be honest that some value questions are genuinely contested, but still help them name what is most worth protecting, creating, and expanding — and what is worth real sacrifice for.';
