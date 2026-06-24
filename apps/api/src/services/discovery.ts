/**
 * discovery.ts — ORB's Truth Discovery Engine (#36): finding what nobody knows yet. Wisdom (#35) comes
 * from the past; discovery creates the future. The frame assumes current knowledge ≠ complete knowledge
 * and runs the scientific method as a posture: observe → question → hypothesize → test → verify. It
 * hunts the unknown unknowns, actively seeks where evidence contradicts assumptions, generates candidate
 * explanations, and refuses to stop at "discovered" — a claim isn't a truth until it can be tested,
 * verified, and replicated.
 *
 * Directive engine — it steers the council to behave like a researcher (curiosity: why? why not? what
 * if? what are we missing?) over the user's real context and knowledge graph, and to propose a concrete
 * way to TEST each hypothesis rather than asserting. Honest scope: ORB does not run live experiments or
 * scan external corpora on its own; it frames the inquiry and names the test a human can actually run.
 */
export const DISCOVERY_QUERY = /\b(what (?:are we|am i) missing|what (?:don'?t|do not) we know|unknown unknowns?|what'?s (?:the )?(?:hidden|underlying|real) (?:cause|reason|driver)|dig (?:deeper|into)|investigate|get to the bottom|root cause|figure out why|what (?:would|could) (?:explain|account for)|hypothesi[sz]e?|hypothesis|test (?:this|the|a|my) (?:idea|theory|assumption|hypothesis)|how (?:would|could|do) (?:we|i) (?:test|verify|prove|disprove|find out)|what if (?:it'?s|the)|why (?:is|does|are|do) .{0,40}? (?:really|actually)|what (?:truth|else) (?:is|are) (?:hidden|out there|undiscovered)|explore (?:why|whether|what)|what assumptions? (?:should|do) (?:we|i) (?:test|challenge|question))\b/i;

export const DISCOVERY_DIRECTIVE = ' Reason like a researcher, not just an answerer: assume current knowledge is incomplete and look for the truth nobody has named yet. Surface the unknown unknowns and the places where the evidence might contradict the assumption everyone is making. Generate two or three concrete, competing hypotheses that could explain what\'s going on rather than asserting one — and for each, name the specific observation, experiment, or check that would confirm or kill it. Be explicit about confidence and what evidence is still missing; a claim isn\'t a truth until it can be tested and replicated. End on the single highest-information thing to investigate next.';
