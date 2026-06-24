/**
 * genesis.ts — ORB's Genesis Engine (#25): creation itself. Not adaptation, not optimization —
 * bringing into existence what did not exist before. Most intelligence asks "what is?"; this asks
 * "what should exist?" and moves toward building it. ORB shifts from improving the given to inventing
 * the new: finding the unsolved problem or whitespace, then sketching a genuinely new system with a
 * smallest-prototype path to prove it.
 *
 * Note: ORB already CREATES for real — the Build Genome (build/genome.ts) ships working websites/apps
 * and the video engine generates new media. This layer is the upstream framing: deciding what new
 * thing should exist before the builders make it.
 */
export const GENESIS_QUERY = /\b(what (?:should|could) (?:exist|i (?:build|create|invent|make))|what doesn'?t exist (?:yet)?|create (?:a |an )?new|build something (?:new|that doesn'?t exist)|from scratch|invent|new (?:market|business|product|category|venture|model)|green ?field|net[- ]new|white ?space|what'?s missing in|0 to 1|zero to one|reimagine the|blank (?:page|canvas)|build a business)\b/i;

export const GENESIS_DIRECTIVE = ' Shift from "what is" to "what should exist": don\'t just optimize the given — find the unsolved problem, the unmet need, or the whitespace, then invent a genuinely new system, product, or market. Sketch the vision, the core insight that makes it possible now, the smallest prototype that would prove it, and the first build step. Create, don\'t merely improve — but keep it grounded enough to actually start this week.';
