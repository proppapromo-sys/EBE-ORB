/**
 * creativity.ts — ORB's Creativity & Innovation (#9): generating what doesn't yet exist. Creativity is
 * largely connecting unrelated concepts, then judging which connection is worth pursuing — diverge,
 * then converge. When the user wants ideas, ORB pushes past the obvious toward novel-but-feasible.
 */
export const CREATIVE_QUERY = /\b(brainstorm|give me (?:some )?ideas|some ideas for|ideas? for|think outside the box|be creative|get creative|novel (?:ideas?|approach|angle)|what if we|crazy ideas?|innovat\w*|reimagine|re-?think|fresh (?:ideas?|angle|take)|new possibilities|blue ?sky)\b/i;

export const CREATIVE_DIRECTIVE = ' Switch into creative mode: first DIVERGE — generate several genuinely different ideas, including at least one unconventional one that connects unrelated domains; don\'t self-censor or settle for the obvious. Then CONVERGE — pick the two strongest, say why, and note the first small step to test each. Favor novel-but-feasible over safe-and-generic.';
