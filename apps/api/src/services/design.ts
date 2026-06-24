/**
 * design.ts — #67 Infinite Creativity + #68 Universal Design.
 *
 * #67 (CREATE2) is honestly a near-twin of #9 Creativity & Innovation (already wired as `creative`).
 * To avoid two directives firing on the same "brainstorm/novel idea" prompts, #67 is scoped tightly to
 * the "bring into existence what has NEVER existed" framing — invention beyond the obvious, the
 * impossible-today-possible-tomorrow question, combinational novelty — and otherwise defers to #9.
 *
 * #68 (DESIGN) is more distinct and genuinely useful: outcomes are created by STRUCTURE — change the
 * structure, change the outcome. It covers system/organization/incentive design (people respond to
 * incentives, so align them with desired outcomes), designing for resilience and adaptation, and the
 * purpose → principles → architecture → process → outcome hierarchy. Adjacent to #13 systems and #54
 * selection but focused on intentionally STRUCTURING a system to produce a result.
 *
 * Both directive engines; no store.
 */

// #67 — invent what has never existed (the narrow novelty facet beyond #9).
export const CREATE2_QUERY = /\b(never (?:existed|been (?:done|created|built|made|tried) before)|what (?:has|hasn'?t) (?:never )?been (?:invented|created|imagined)|bring into existence|invent something (?:new|that doesn'?t exist)|beyond (?:current )?imagination|seems impossible (?:today|now) but|what (?:should|could) (?:we|humanity) (?:invent|create) next|entirely new (?:possibilit|invention|category|kind)|combinational creativity|never[- ]?before[- ]?seen|imagine something (?:entirely|completely) new)\b/i;
export const CREATE2_DIRECTIVE = ' Reach past improving the existing toward inventing what has never existed: combine ideas, knowledge, and technologies across domains into genuinely novel possibilities, and ask which assumptions or rules could be broken to make a never-before-seen thing real. Use constraints as a creative trigger, not a limit. Take the "impossible today" version seriously, then make it concrete — sketch the new thing and the smallest prototype that would prove it could exist. Bold in imagination, grounded in a first build step.';

// #68 — design the structure/incentives that produce the outcome.
export const DESIGN_QUERY = /\b(design (?:a|an|the|this|our|better|for) (?:system|process|org|organi[sz]ation|team|structure|incentive|workflow|institution|experience)|incentive (?:design|structure|alignment|system)|align(?:ing)? incentives|structure (?:the|this|our|a) (?:team|org|process|system|deal|incentive)|how should (?:we|this|it) be (?:designed|structured|set up|organi[sz]ed)|redesign (?:the|this|our|how)|change the (?:structure|incentives|system) (?:to|so)|system design|organi[sz]ational design|design for (?:resilience|flourishing|adaptation|scale)|what (?:structure|incentives?) (?:would|produce|create)|by design)\b/i;
export const DESIGN_DIRECTIVE = ' Design the structure, because structure produces the outcome — change the structure, change the result. Start from purpose, then the principles, architecture, and processes that follow from it, rather than patching surface behavior. Look hardest at incentives: people respond to them, so check what the current setup actually rewards vs. what\'s wanted, and realign so the desired outcome is the path of least resistance. Build in adaptation and resilience (feedback, redundancy, recovery) so it improves and survives failure. Name the one structural or incentive change that would shift behavior the most, not just the symptomatic fix.';
