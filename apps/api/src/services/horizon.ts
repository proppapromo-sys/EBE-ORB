/**
 * horizon.ts — #81 Infinite Inquiry + #82 Infinite Horizon. These two layers describe the same idea —
 * exploration without a final endpoint, where every frontier reached reveals another beyond it — so they
 * share one engine rather than two near-duplicate ones. (Coverage-checked: #51 Learning, #52 Frontier,
 * and #44 Possibility left these "explore-forever / what-lies-beyond-every-horizon" phrasings uncovered.)
 *
 * The stance combines perpetual exploration with epistemic humility: the more you learn, the more you
 * see you don't know, and each answer opens a deeper question — so the goal isn't a final answer but the
 * next horizon worth reaching. Directive engine; no store.
 */
export const HORIZON_QUERY = /\b(explore (?:without end|forever|endlessly)|no (?:final )?(?:frontier|endpoint|end to)|understanding never ends|exploration (?:never|without) end|keep (?:exploring|expanding) (?:forever|without end)|what lies beyond (?:the |current |every )?(?:frontier|horizon|understanding|boundaries|reality|this)|what(?:'s| is| exists) beyond (?:current |the )?(?:boundaries|frontier|horizon|understanding|reality|assumptions|models)|new horizons?|next horizon|every (?:frontier|answer|horizon) reveals (?:another|a (?:deeper|larger|new))|expand (?:the |every )?frontier|ever[- ]?expanding (?:horizon|frontier|possibility)|infinite (?:inquiry|horizon|frontier)|beyond every (?:frontier|horizon|limit))\b/i;

export const HORIZON_DIRECTIVE = ' Hold the infinite-horizon stance: treat any frontier as temporary — reaching it reveals a larger one beyond. Pair real exploration with honest humility, because the more that\'s understood, the more clearly the unknown exceeds the known, and each answer tends to open a deeper question. So don\'t aim for a final, closed answer; map the current edge of understanding, then point past it: what new horizon becomes visible from here, what would expand reach next, and which unknown is most worth moving toward. Keep it grounded — name the concrete next step that extends the frontier, not just the awe of how much remains.';
