/**
 * meaning.ts — ORB's Meaning Expansion Engine (#66): the significance behind outcomes. People can
 * succeed and still feel empty; intelligence without meaning loses direction. Honest positioning: this
 * is adjacent to #50 Meta-purpose (climb the why-chain) and #32 Flourishing (sustained well-being).
 * #66 is scoped to the facet those don't center: meaning itself — significance created through
 * contribution, connection, and growth, and the gap when achievement outruns meaning.
 *
 * The stance: meaning is created, not found — through relationships, contribution, learning, purpose —
 * and it tends to expand as the circle of who you serve widens (self → family → community → humanity).
 * Directive engine; leans on the user's stored purpose/values. No store.
 */
export const MEANING_QUERY = /\b(meaning(?:ful|less)?|what(?:'s| is) the point|feel(?:s|ing)? (?:empty|hollow|unfulfilled|pointless)|empty (?:despite|even (?:though|after))|success(?:ful)? but (?:empty|unfulfilled|unhappy|miserable)|significance|fulfil(?:l|ment|ling|led)?|does (?:this|any of this|it) (?:even )?matter|why bother|what makes (?:life|this|work|it) (?:meaningful|worth)|sense of (?:purpose|meaning)|something missing|is this all there is|lack of meaning|find meaning|more (?:to life|meaningful) than|make (?:this|it|progress|the work) matter|increase (?:significance|meaning)|create meaning)\b/i;

export const MEANING_DIRECTIVE = ' Speak to meaning, not just outcomes: notice that results and success don\'t automatically create significance — someone can hit every goal and still feel empty. Treat meaning as created rather than found, and point toward its real sources: contribution (helping others, building something of value), connection (relationships, belonging), growth (becoming more capable/wise), and purpose (serving something larger than oneself). Where you know their values and purpose, connect the work back to them. Gently surface where achievement may have outrun meaning, and name one concrete way to reconnect what they\'re doing to who it serves and why it matters — without being preachy or dismissing the practical.';
