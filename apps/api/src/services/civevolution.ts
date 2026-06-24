/**
 * civevolution.ts — ORB's Civilization Evolution Engine (#55): how civilization develops over time.
 * Honest positioning: this heavily overlaps #38 Civilization OS (society-scale coordination) and #18
 * Evolutionary Intelligence (the long view). To avoid redundant firing, #55 is scoped to the one facet
 * those don't center: the DEVELOPMENTAL / institutional-evolution lens — civilization as stages
 * (hunter-gatherer → agriculture → cities → industry → digital → intelligent), the failure mode where
 * complexity outpaces adaptation, and what must change vs. what must be preserved for the next stage.
 *
 * Directive engine; steers the council to reason about institutional and civilizational development.
 * Honest scope (same as #38): ORB is a per-user system reasoning ABOUT civilization, not a platform
 * that develops it; the human is sovereign over any such call. No store.
 */
export const CIVEVOLUTION_QUERY = /\b(next stage of civili[sz]ation|how (?:should|does|do) (?:our |the |we )?(?:civili[sz]ation|institutions?|society|humanity) evolve|institutional evolution|evolve (?:our|the) institutions?|civili[sz]ational (?:progress|development|evolution|stage)|complexity outpac|stages? of (?:civili[sz]ation|human development|progress)|what must (?:change|be preserved) for (?:the )?(?:next|future)|how (?:do|should) (?:we )?(?:redesign|evolve|reform) (?:institutions?|governance|the system)s?|better (?:institutions?|governance|incentive systems?)|future of (?:civili[sz]ation|humanity|society)|advance civili[sz]ation)\b/i;

export const CIVEVOLUTION_DIRECTIVE = ' Reason about civilizational development, not just the immediate org: see institutions and society as evolving through stages, where progress comes from knowledge compounding, innovation accelerating, and cooperation widening — and where the classic failure is complexity outpacing the ability to adapt. For the question at hand, ask what stage it\'s really at, what must change to reach a better next stage, and what must be PRESERVED through that change. Favor small improvements to education, governance, incentives, or coordination that compound across many people and years. Keep it grounded in what this person can actually influence, human sovereign over any large-scale call.';
