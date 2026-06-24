/**
 * realityarch.ts — #70 Reality Architecture + #71 Knowledge Unification. Both are scoped to the genuine
 * gaps a coverage check found in existing engines (not the parts already handled).
 *
 * #70 (ARCH) complements #68 Design (design a structure), #45 Source (trace to origin), and #13 Systems
 * (feedback/leverage). Its distinctive, uncovered framing: "what STRUCTURE is generating this outcome,
 * and what made it inevitable?" — reading the rules/incentives/constraints/feedback loops beneath the
 * pattern and preferring a structural fix over a symptomatic one.
 *
 * #71 (UNIFY) complements #46 Unity (systems interconnect), #27 Synthesis (fuse ideas), and #58
 * Principles (timeless principle). Its uncovered facet: cross-domain PATTERN TRANSFER — "where else does
 * this pattern appear?", borrowing a solution from one field for another, recurring truths across
 * disciplines. ORB\'s knowledge graph is the literal substrate this reasons over.
 *
 * Directive engines; no store.
 */

// #70 — the structure that generates the outcome.
export const ARCH_QUERY = /\b(what structure (?:is )?(?:produc|generat|creat)(?:es|ing)|what (?:hidden )?(?:structure|architecture|system) (?:makes?|made) (?:this|it|that) (?:inevitable|happen|likely)|structural (?:constraint|cause|root|leverage|solution|fix)|the (?:underlying |hidden )?architecture (?:of|behind|beneath|that)|what (?:rules|incentives|constraints|feedback loops?) (?:are )?(?:producing|generating|driving|creating)|redesign the structure|structure (?:that|behind the) (?:generates?|produces?|creates?)|what'?s generating (?:this|the) (?:outcome|pattern|behavior)|structure (?:produces|creates|generates) (?:the )?(?:outcome|behavior))\b/i;
export const ARCH_DIRECTIVE = ' Look beneath the outcome to the architecture that generates it: the rules, incentives, constraints, relationships, and feedback loops that make this result the predictable product of a structure rather than a one-off. Ask what made it close to inevitable given the current setup — then find the leverage point, the small structural change that shifts the whole pattern. Strongly prefer a structural solution (change what generates the behavior) over a symptomatic one (fight the behavior). Name the one structural or incentive change that would most reliably change the outcome.';

// #71 — cross-domain pattern transfer / knowledge unification (the gap beyond #46/#27/#58).
export const UNIFY_QUERY = /\b(where else (?:does|do|would|could) (?:this|that|these|it) (?:pattern|principle|idea|dynamic|approach)\b.{0,16}?(?:appear|apply|show up|recur|hold)|same (?:pattern|principle|dynamic) (?:across|in (?:other|different))|cross[- ]?domain (?:pattern|principle|insight|transfer)|borrow (?:a |an |the )?(?:solution|idea|model|approach) from|what (?:field|domain|discipline) (?:has |already )*solved|pattern transfer|recurring (?:truth|pattern|law) across|unify (?:the )?knowledge|connect (?:all|across) (?:domains|disciplines|fields)|how does (?:everything|all of it|all knowledge) (?:we know )?(?:fit|connect|cohere) together|analog(?:y|ous) (?:from|in) (?:another|other)|what (?:other field|discipline) (?:would|might) (?:approach|see))\b/i;
export const UNIFY_DIRECTIVE = ' Unify across domains rather than staying in one lane: ask where else this same pattern or principle shows up — in another field, discipline, or part of their world — and whether a solution already worked out elsewhere can transfer here. Treat reality as one interconnected system that humans merely divided into subjects, and look for the recurring truth that holds across the cases, since a pattern that repeats across fields often points to a deeper law. Make the analogy concrete (what maps to what, and where it breaks), and bring the borrowed insight back to the specific problem in front of them.';
