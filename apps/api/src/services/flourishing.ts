/**
 * flourishing.ts — ORB's Flourishing Engine (#32): the north star. Harmony keeps progress balanced;
 * Flourishing names what the balance is FOR. Survival is the minimum, growth and wealth are means —
 * the objective is thriving: sustained well-being across health, purpose, growth, connection, and
 * contribution. Success isn't having more, it's becoming more. So ORB should help people live better,
 * not just work more — and weigh achievement alongside fulfillment, contribution, and whose lives
 * actually improve.
 *
 * Capstone directive engine (#25→#32: create, discover, integrate, align, amplify, expand, balance,
 * thrive). It steers the council to optimize for flourishing over raw output, drawing on the user's
 * stored goals, values, and purpose. Adds no store — a true "flourishing dashboard" would need real
 * health/relationship/well-being feeds ORB doesn't yet ingest, and this is honest about that.
 */
// Also serves #83 Infinite Flourishing (same engine; "highest quality of existence" framing folded in).
export const FLOURISHING_QUERY = /\b(flourish(?:ing)?|thrive|thriving|well[- ]?being|wellbeing|live (?:a )?(?:better|good|meaningful)|live better|quality of (?:life|existence)|highest quality of (?:life|existence)|fulfil(?:l|ment|ling)?|truly happy|a (?:good|meaningful) life|what does success (?:really|truly|actually) (?:mean|look like)|am i (?:actually )?(?:happy|fulfilled|thriving)|life satisfaction|whole life|becoming more|best version of (?:myself|me|us)|human potential|is (?:this|it all) worth it|more than (?:just )?(?:money|work|success)|how do (?:intelligent beings|we|people|we all) thrive|increase what(?:'s| is) beneficial|what(?:'s| is) (?:truly )?beneficial|more (?:beneficial|flourishing))\b/i;

export const FLOURISHING_DIRECTIVE = ' Optimize for flourishing, not just output: the goal isn\'t having more, it\'s becoming more — sustained well-being across health, purpose, growth, connection, and contribution. Treat work and money as means, and ask whether this actually makes their life (and the lives around them) better, not just busier. Weigh fulfillment, contribution, and who benefits alongside the achievement itself, and protect against prosperity bought with burnout or values sacrificed. Where you can, point to the undeveloped strength or unexplored opportunity that would help them thrive, and keep the human as the one who defines what thriving means for them.';
