/**
 * metareality.ts — #78 Meta-Reality + #79 Existence Exploration. The two most abstract layers in the
 * stack, both verified uncovered by existing engines. Honest about their nature: these are philosophical-
 * inquiry lenses, not operational capability — ORB can reason carefully and humbly about them, but there
 * is no real action behind "why is there something rather than nothing". Each directive therefore prizes
 * intellectual honesty (mark what is genuinely unknown) over confident answers.
 *
 * #78 (METAREALITY) — the generator question: not "what is reality?" but "what rules GENERATE realities,
 * and what generates those?". Recurses past #45 Source (origin of one effect) and #70 Architecture (one
 * system's structure) to the deepest generative principles — the smallest rule-set explaining the most.
 *
 * #79 (EXIST) — ontology: why anything exists at all, the necessary conditions for being, the relation
 * of existence to awareness. Distinct from #64 Existential Risk (survival) and #21 Cosmic (perspective).
 *
 * Directive engines; no store.
 */

// #78 — the rules that generate realities.
export const METAREALITY_QUERY = /\b(meta[- ]?reality|what (?:rules|laws|structures?) generate (?:reality|realities|existence|systems)|what (?:generates|produces|creates) reality(?: itself)?|what produces the producer|deepest structures? (?:from which|that)|generative (?:mechanism|principle|process|structure)|if (?:we|you) (?:change|changed) the rules|rules that (?:generate|produce|create)|what (?:underlies|is beneath) (?:all )?(?:reality|the rules|the laws)|reality generation|the generator of (?:reality|realities|systems)|smallest set of (?:rules|principles) (?:that )?explain)\b/i;
export const METAREALITY_DIRECTIVE = ' Reason at the meta level — about what GENERATES the thing, not just the thing: behind any system are rules, and behind those rules deeper generative principles. Recurse the generator question ("what produces this? what produces that producer?") toward the smallest set of principles that would explain the largest range of cases, and treat reality as the output of constraints + possibilities + interactions. Where it helps, ask what new outcomes a different rule-set would generate. Be intellectually honest: this is deep, partly-open territory — distinguish what genuinely follows from what is speculation, and say which is which rather than overclaiming.';

// #79 — why anything exists at all.
export const EXIST_QUERY = /\b(why (?:does |is )?(?:anything|something|there|the universe|existence|it all) exists?|why is there something (?:rather than|instead of) nothing|something rather than nothing|why not nothing|necessary conditions? for (?:existence|being|anything)|why does existence exist|the nature of (?:being|existence)|why (?:do|does) (?:we|i|things|reality) exist|what makes (?:existence|reality|being) possible|why anything at all|ontolog)\b/i;
export const EXIST_DIRECTIVE = ' Engage the deepest question seriously and humbly: why there is something rather than nothing, and what conditions make existence possible at all. Lay out the genuine perspectives (physical, cosmological, philosophical) without pretending to a settled answer — this is a question at or beyond the edge of what anyone knows. Distinguish what can be reasoned about from what remains genuinely open, follow the inquiry honestly (every answer tends to reveal a deeper question), and resist both false certainty and dismissiveness. Where the person seems to be reaching for meaning rather than physics, meet that too — but don\'t substitute comfort for honesty.';

// #80 — find the better question (the capstone: a discovery engine, not an answer machine).
export const QUESTION_QUERY = /\b(what(?:'s| is) the (?:right|real|better|deeper) question|am i asking the (?:right|wrong) question|what question (?:should|am i|are we|would|to)|better questions?|wrong question|reframe the question|what (?:should|are) we (?:be )?asking|what (?:am i|are we) not asking|the question (?:behind|beneath) the question|what'?s the (?:actual|underlying) question|are we solving the right (?:problem|thing)|is that even the right (?:question|problem)|what question (?:matters|would transform|unlocks))\b/i;
export const QUESTION_DIRECTIVE = ' Find the better question before chasing the answer: a sharper question produces a sharper answer, and people often work hard on the wrong one. Check whether the question as posed rests on a shaky assumption or aims at a symptom; if so, name the deeper or more useful question behind it. Offer one or two reframed questions that, if answered, would most expand understanding or unlock the real goal — and say why each is higher-leverage than the original. Then, if useful, answer the best version. Be a discovery engine, not just an answer machine: end by pointing at the most valuable question still worth asking next.';
