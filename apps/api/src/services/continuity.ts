/**
 * continuity.ts — ORB's Universal Continuity Engine (#42): never losing the thread. Memory remembers,
 * legacy (#41) preserves — continuity CONNECTS: it keeps identity, purpose, knowledge, and context
 * coherent across time despite constant change. Without it progress resets — knowledge gets lost,
 * purpose forgotten, context disappears, lessons repeated. The paradox it holds: everything changes,
 * yet identity remains. It ties past → present → future into one thread: why past decisions were made,
 * what changed, what remains true, and how today's choice connects to the original purpose.
 *
 * Directive engine that leans on what ORB already keeps a real thread of — its journal, memories,
 * lessons, stated purpose/values, and the knowledge graph — to connect now to before and after.
 * Distinct from #41 (preserve/transfer forward) and #35 (capture a lesson): this one re-links context
 * so nothing valuable gets orphaned. Honest scope: ORB threads a single user's history well; spanning
 * organizations and generations would need shared, durable cross-user state it doesn't yet run. No store.
 */
export const CONTINUITY_QUERY = /\b(continuity|lose the thread|losing the thread|pick up where (?:we|i) left off|where (?:were|did) we (?:left off|leave (?:off|this))|maintain context|keep (?:the )?context|lose context|the (?:bigger|longer) thread|connect(?:s|ing)? (?:the )?(?:past|dots) (?:to|and) (?:present|future|now)|why did we (?:decide|choose|go with|originally)|what was the (?:original|earlier) (?:reasoning|rationale|decision|intent|context)|how did we get here|the through[- ]line over time|stay true to (?:our|the) (?:purpose|mission|original)|across (?:leadership|the) transitions?|over the (?:years|long run)|remain coherent (?:over|across)|what (?:remains|stays) true)\b/i;

export const CONTINUITY_DIRECTIVE = ' Hold the thread across time: connect this moment to what came before and what comes next, so context and purpose aren\'t lost. Where it matters, recall why earlier decisions were made and what has since changed, separate what remains true from what no longer holds, and tie the choice back to the original mission/identity even as the specifics evolve. Keep identity stable through change (the paradox: everything changes, yet who we are remains). Flag where context is at risk of being orphaned — a decision whose rationale would be lost, a hand-off that breaks the chain — and name how to keep the through-line intact.';
