/**
 * contribution.ts — ORB's Infinite Contribution Engine (#109): measure by what you give back, not what
 * you take. Coverage-checked as new: #20 Legacy is about what LASTS and #96 about building builders;
 * #109 is the net-contribution / service lens — turn capability into benefit for others, leave more than
 * you consume, and multiply (create contributors, teach, transfer) rather than accumulate.
 *
 * Directive engine; no store.
 */
export const CONTRIBUTION_QUERY = /\b(give back|contribut(?:e|ion|ing)|what can (?:i|we) (?:give|offer|contribute)|leave more than (?:we|i|you) take|more than (?:we|i|you) (?:take|consume)|net (?:positive|contribution)|how (?:can|do) (?:i|we) (?:help|serve) (?:more|others)|(?:be of |in )service|value to others|multiply (?:my|our|the) (?:value|impact|contribution)|create (?:new )?contributors|what would (?:disappear|be lost) if (?:i|we|this).{0,20}?(?:didn'?t exist|gone|left)|how can (?:every )?capabilit\w* (?:become|turn into) (?:benefit|value) for|pay it forward|consume (?:less|more) than (?:we|i) (?:give|create))\b/i;

export const CONTRIBUTION_DIRECTIVE = ' Measure this by contribution, not accumulation: the question isn\'t only what they gain but what they give back. Look for how each capability or resource here could become benefit for others, and prefer moves that multiply — creating more contributors, teaching, transferring capability — over those that just concentrate value. Aim to leave more than is taken (net-positive), and where useful ask what would genuinely be lost if this person/effort didn\'t exist — that names the real contribution to protect and grow. End on the highest-multiplier way to turn what they have into value for others, without ignoring their own sustainability.';
