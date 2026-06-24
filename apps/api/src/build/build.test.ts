/**
 * build.test.ts — deterministic tests for the Universal Construction Genome (no network).
 * Run:  npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inferCategory, getBlueprint } from './blueprints.js';
import { buildCapability } from './tiers.js';
import { CONSTRUCTION_LAWS, CONSTRUCTION_ORGANS } from './genome.js';
import { looksLikeBuildRequest, looksLikeVideoRequest, needsContext, isUrgent } from '../agents/masterAgent.js';
import { recordCommand, topCommands, getPrefs, setPrefs, observeMessage, resetProfile } from '../services/convoPrefs.js';
import { applySignals, profileDirective, describeProfile, confident, type Traits } from '../services/personality.js';
import { analyzeComms, readEmotion, readSarcasm, sarcasmRead, postureDirective, voiceFor, asProsody, asScene, sceneDirective, sceneVoice } from '../services/comms.js';
import { detectLang } from '../services/lang.js';
import { relate, aboutEntity, formatAbout, ingestItems } from '../services/graph.js';
import { mentionsIn, senderName } from '../agents/masterAgent.js';
import { avatarAllowedFor, avatarConfigured } from '../services/avatar.js';
import { noteIntent, completeIntent, pendingGoals, nudgeFor } from '../services/goals.js';
import { priorityScore, classifyTier, focusList } from '../services/attention.js';
import { parseObjective, setObjective, updateProgress, progressOf, listObjectives, detectConflicts, classifyLevel, classifyType } from '../services/objectives.js';
import { observeMotivation, topDrivers, motivationDirective, parseDriver, setDriver } from '../services/motivation.js';
import { parseDecision, decisionDirective } from '../services/decision.js';
import { synthesizePredictions } from '../services/behavior.js';
import { decisionProfile } from '../services/personality.js';
import { buildReflection, META_DIRECTIVE, AUDIT_DIRECTIVE, META_QUERY, AUDIT_QUERY } from '../services/metacognition.js';
import { analyzePatterns } from '../services/events.js';
import { buildSelfReg } from '../services/selfreg.js';
import { parseOutcome, recommendFrom } from '../services/adaptation.js';
import { CREATIVE_QUERY, CREATIVE_DIRECTIVE } from '../services/creativity.js';
import { isStrategic, WISDOM_DIRECTIVE, parseValues, valuesDirective } from '../services/wisdom.js';
import { selfModel, buildIdentity } from '../services/identity.js';
import { parseReliability, reliability } from '../services/relationships.js';
import { SYSTEMS_QUERY, SYSTEMS_DIRECTIVE, parseCausal } from '../services/systems.js';
import { PURPOSE_QUERY, ALIGN_QUERY, ALIGNMENT_DIRECTIVE, parsePurpose } from '../services/purpose.js';
import { FORESIGHT_QUERY, FORESIGHT_DIRECTIVE } from '../services/foresight.js';
import { buildBrief, describeArchitecture, INTELLIGENCE_STACK } from '../services/architecture.js';
import { PLAN_QUERY, ORCHESTRATION_DIRECTIVE } from '../services/orchestration.js';
import { EVOLUTION_QUERY, STEWARDSHIP_QUERY, STEWARDSHIP_DIRECTIVE, LEGACY_QUERY } from '../services/stewardship.js';
import { COSMIC_QUERY, UNIFIED_QUERY, UNIFIED_DIRECTIVE, REALITY_QUERY, REALITY_DIRECTIVE, IMPROVEMENT_QUERY, INFINITE_PRINCIPLE } from '../services/unified.js';
import { GENESIS_QUERY, GENESIS_DIRECTIVE } from '../services/genesis.js';
import { EMERGENCE_QUERY, EMERGENCE_DIRECTIVE } from '../services/emergence.js';
import { SYNTHESIS_QUERY, SYNTHESIS_DIRECTIVE } from '../services/synthesis.js';
import { COHERENCE_QUERY, COHERENCE_DIRECTIVE, detectCoherenceGaps, formatCoherence } from '../services/coherence.js';
import { RESONANCE_QUERY, RESONANCE_DIRECTIVE } from '../services/resonance.js';
import { TRANSCENDENCE_QUERY, TRANSCENDENCE_DIRECTIVE } from '../services/transcendence.js';
import { HARMONY_QUERY, HARMONY_DIRECTIVE } from '../services/harmony.js';
import { FLOURISHING_QUERY, FLOURISHING_DIRECTIVE } from '../services/flourishing.js';
import { EVOLVE_QUERY, EVOLVE_DIRECTIVE } from '../services/evolution.js';
import { ANTIFRAGILE_QUERY, ANTIFRAGILE_DIRECTIVE } from '../services/antifragility.js';
import { parseLesson, rankLessons, formatLessons, LESSONS_QUERY } from '../services/lessons.js';
import { DISCOVERY_QUERY, DISCOVERY_DIRECTIVE } from '../services/discovery.js';
import { GOVERNANCE_QUERY, GOVERNANCE_DIRECTIVE } from '../services/governance.js';
import { CIVILIZATION_QUERY, CIVILIZATION_DIRECTIVE } from '../services/civilization.js';
import { COORDINATION_QUERY, COORDINATION_DIRECTIVE } from '../services/coordination.js';
import { PRIME_QUERY, CONSTITUTION_DIRECTIVE, constitutionStatement, PRIME_DIRECTIVE, PILLARS, CONSTITUTIONAL_TEST } from '../services/constitution.js';
import { PRESERVATION_QUERY, PRESERVATION_DIRECTIVE } from '../services/preservation.js';
import { CONTINUITY_QUERY, CONTINUITY_DIRECTIVE } from '../services/continuity.js';
import { RECALL_QUERY, COSMIC_MEMORY_DIRECTIVE } from '../services/recall.js';
import { traceCausal, formatTrace } from '../services/graph.js';
import { predictIntent, needsClarification, nextPrompt } from '../services/predict.js';
import { videoAllowedFor, chooseProvider } from '../services/video.js';
import { isOwner, getUserPlan } from '../services/planStore.js';
import { classifyTask, ROUTES } from '../brains/router.js';
import { matchSkill, listSkills } from '../brains/skills.js';
import { monetizationMetrics } from '../services/admin.js';
import { OWNER_KEYS, setPlatformKey } from '../services/platformKeys.js';
import { appleConfigured, phoneConfigured, startPhone, verifyPhone } from '../services/auth.js';
import { parseInbound, whatsappConfigured } from '../services/whatsapp.js';

test('inferCategory: reads build family from a plain brief', () => {
  assert.equal(inferCategory('a booking app for a barbershop'), 'mobile');
  assert.equal(inferCategory('online store to sell candles with checkout'), 'ecommerce');
  assert.equal(inferCategory('a SaaS dashboard with login and users'), 'webapp');
  assert.equal(inferCategory('a landing page for my consultancy'), 'marketing');
  assert.equal(inferCategory('something nice for my brand'), 'marketing'); // default
});

test('getBlueprint: every category resolves to a real blueprint', () => {
  for (const cat of ['marketing', 'webapp', 'ecommerce', 'mobile'] as const) {
    const bp = getBlueprint(cat);
    assert.equal(bp.category, cat);
    assert.ok(bp.stack.length > 0 && bp.structure.length > 0 && bp.launchChecklist.length > 0);
  }
});

test('buildCapability: power scales with tier', () => {
  const free = buildCapability('free');
  const exec = buildCapability('executive');
  assert.equal(free.canDeploy, false);
  assert.equal(exec.canDeploy, true);
  assert.ok(exec.maxFiles > free.maxFiles);
  assert.equal(buildCapability(undefined).plan, 'free'); // unknown → free
  assert.equal(buildCapability('enterprise').maxFiles >= exec.maxFiles, true);
});

test('looksLikeBuildRequest: routes real build asks, ignores look-alikes', () => {
  assert.equal(looksLikeBuildRequest('build me a landing page for my barbershop'), true);
  assert.equal(looksLikeBuildRequest('create an online store for candles'), true);
  assert.equal(looksLikeBuildRequest('make a booking app for my salon'), true);
  assert.equal(looksLikeBuildRequest('build my confidence'), false);   // intent but no target
  assert.equal(looksLikeBuildRequest('what is the weather today?'), false);
});

test('looksLikeVideoRequest + tier gate', () => {
  assert.equal(looksLikeVideoRequest('make me a video of waves on a beach'), true);
  assert.equal(looksLikeVideoRequest('generate a short clip of a city at night'), true);
  assert.equal(looksLikeVideoRequest('what video should I watch'), false); // no intent verb
  assert.equal(videoAllowedFor('executive'), true);
  assert.equal(videoAllowedFor('enterprise'), true);
  assert.equal(videoAllowedFor('pro'), false);   // video reserved for top tiers
  assert.equal(videoAllowedFor('free'), false);
  // No keys set in test env → no engine available.
  assert.equal(chooseProvider(), null);
});

test('owner gets full top-tier access (unlocks video, full council, big builds)', async () => {
  assert.equal(isOwner('proppapromo@gmail.com'), true);
  assert.equal(isOwner('PROPPAPROMO@Gmail.com'), true); // case-insensitive
  assert.equal(isOwner('someone-else@example.com'), false);
  assert.equal(await getUserPlan('proppapromo@gmail.com'), 'enterprise');
  assert.equal(videoAllowedFor(await getUserPlan('proppapromo@gmail.com')), true);
});

test('classifyTask: routes for speed', () => {
  assert.equal(classifyTask("what's on my calendar today?"), 'fast');
  assert.equal(classifyTask('remind me to call mom at 5'), 'fast');
  assert.equal(classifyTask('help me plan my business operations for Q3'), 'medium');
  assert.equal(classifyTask('analyze this contract and flag legal risks'), 'heavy');
  assert.equal(classifyTask('describe this', true), 'visual'); // has images
  // Speed map points each tier at the intended engine (chat/voice runs on GPT — fastest).
  assert.equal(ROUTES.fast.provider, 'openai');
  assert.equal(ROUTES.medium.provider, 'openai');
  assert.equal(ROUTES.heavy.provider, 'anthropic');
  assert.equal(ROUTES.visual.provider, 'gemini');
});

test('isUrgent: reads a rushed tone, ignores a calm one', () => {
  assert.equal(isUrgent('I need this ASAP'), true);
  assert.equal(isUrgent('do it now now'), true);
  assert.equal(isUrgent('STOP RIGHT THERE'), true);   // shouting
  assert.equal(isUrgent('hurry up please'), true);
  assert.equal(isUrgent('whenever you get a chance, summarize my day'), false);
});

test('convoPrefs: learns short commands, ignores private-length speech', async () => {
  const u = 'test-faves@example.com';
  await recordCommand(u, "what's urgent?");
  await recordCommand(u, "What's urgent");          // normalizes to the same command
  await recordCommand(u, 'remind me to call my accountant about the third quarter filing deadline next tuesday morning'); // too long → ignored
  const top = await topCommands(u, 5);
  assert.ok(top.includes("what's urgent"), 'recurring short command is remembered');
  const prefs = await getPrefs(u);
  assert.equal(Object.keys(prefs.commands).some((k) => k.length > 60), false, 'long private speech never stored');
});

test('predict: anticipates the missing slot of a trailed-off command', () => {
  const p = predictIntent('schedule a meeting with…');
  assert.equal(p?.intent, 'meeting');
  assert.equal(needsClarification(p), true);
  assert.match(nextPrompt(p!), /who with, and when/i);

  // Slots already filled → nothing to ask.
  const full = predictIntent('schedule a meeting with Dana tomorrow at 3');
  assert.equal(needsClarification(full), false);

  // Only the time is missing → ORB asks just for that.
  const noTime = predictIntent('set up a meeting with Dana');
  assert.match(nextPrompt(noTime!), /day and time/i);

  // Flight with half the route.
  assert.match(nextPrompt(predictIntent('book a flight to Paris')!), /flying from/i);
});

test('predict: ignores questions and idioms, fires only on real commands', () => {
  assert.equal(predictIntent('what time should I schedule a meeting?'), null);   // a question, not a command
  assert.equal(predictIntent("let's call it a day"), null);                      // idiom, not a phone call
  assert.equal(predictIntent('how do I book a flight?'), null);                  // a question
  assert.equal(needsClarification(predictIntent('call John')), false);          // fully specified → no ask
  assert.equal(predictIntent('call Sarah')?.filled.person, 'Sarah');
});

test('comms: the same words read differently by delivery', () => {
  // "call John" three ways — the Communication Layer reads tone, not just words.
  assert.deepEqual(analyzeComms('ORB call John.'), { urgent: false, emotion: 'neutral', sarcasm: false, sarcasmType: 'none', reflect: false });   // calm task
  assert.equal(analyzeComms('ORB CALL JOHN!!').urgent, true);                                  // shouting + !! → urgent
  assert.equal(readEmotion('ORB call John…'), 'hesitant');                                     // trailing … → unsure
});

test('comms: emotion read is conservative and maps to a posture', () => {
  assert.equal(readEmotion("ugh this still isn't working"), 'frustrated');
  assert.equal(readEmotion('haha nice one, thanks'), 'playful');
  assert.equal(readEmotion('what time is my meeting?'), 'neutral');   // plain question, not an outburst
  assert.match(postureDirective({ urgent: false, emotion: 'frustrated' }), /frustrated/i);
  assert.match(postureDirective({ urgent: false, emotion: 'frustrated' }), /reflect back|feel heard/i);   // active listening
  assert.match(postureDirective({ urgent: true, emotion: 'neutral' }), /hurry/i);
  assert.equal(postureDirective({ urgent: false, emotion: 'neutral' }), '');   // calm → no special posture
});

test('graph: digital spatial mapping — relate entities and navigate the connections', async () => {
  const u = 'test-graph@example.com';
  await relate(u, 'Project Atlas', 'Dana', 'managed by');
  await relate(u, 'Project Atlas', 'Euphoria', 'part of');
  await relate(u, 'lease agreement', 'Euphoria', 'for');

  const atlas = await aboutEntity(u, 'project atlas');   // case-insensitive match
  assert.ok(atlas, 'finds the entity');
  assert.equal(atlas!.neighbors.length, 2);
  const out = formatAbout(atlas!);
  assert.match(out, /Project Atlas/);
  assert.match(out, /Dana/);
  assert.match(out, /Euphoria/);

  // Navigate from the other side — Euphoria is referenced by Atlas and the lease.
  const euph = await aboutEntity(u, 'Euphoria');
  assert.ok(euph!.neighbors.length >= 2);

  // Unknown entity → null, so the caller falls through to a normal answer instead of hijacking.
  assert.equal(await aboutEntity(u, 'quantum chromodynamics'), null);
});

test('graph: auto-ingestion maps calendar events and links the people/topics they mention', async () => {
  const u = 'test-ingest@example.com';
  assert.deepEqual(mentionsIn('Kickoff with Dana re Atlas'), ['Dana', 'Atlas']);   // pulls person + topic
  const n = await ingestItems(u, [{ label: 'Kickoff with Dana', type: 'event', mentions: ['Dana', 'Atlas'] }]);
  assert.equal(n, 1);
  const dana = await aboutEntity(u, 'Dana');
  assert.ok(dana && dana.neighbors.some((x) => /Kickoff/.test(x.label)));   // navigable from the person
  // Email sender names are parsed for the map; junk/emails are rejected.
  assert.equal(senderName('Jane Doe <jane@acme.com>'), 'Jane Doe');
  assert.equal(senderName('"Bob Smith" <bob@x.io>'), 'Bob Smith');
  assert.equal(senderName('noreply@notifications.example.com'), '');
});

test('avatar: gated to top tiers, off by default, always disclosed', () => {
  assert.equal(avatarAllowedFor('executive'), true);
  assert.equal(avatarAllowedFor('enterprise'), true);
  assert.equal(avatarAllowedFor('pro'), false);
  assert.equal(avatarAllowedFor('free'), false);
  assert.equal(avatarConfigured(), false);   // no DID_API_KEY in test env → off, degrades gracefully
});

test('decision: detects a choice and frames trade-offs, bias-guards, goals + drivers + profile', () => {
  const d = parseDecision('Should I hire now or wait a quarter?');
  assert.deepEqual(d?.options, ['hire now', 'wait a quarter']);
  assert.ok(parseDecision('choose between the Lagos office and the London office'));
  assert.ok(parseDecision('Runway vs Veo'));
  assert.equal(parseDecision('what time is my meeting?'), null);   // not a decision

  const dir = decisionDirective(d!, ['freedom', 'security'], { risk: 'high', style: 'analytical' });
  assert.match(dir, /cost\/risk|likelihood/i);
  assert.match(dir, /commit to ONE/i);
  assert.match(dir, /freedom, security/i);                 // weighed through the user's drivers
  assert.match(dir, /confirmation bias|loss aversion|anchoring/i);  // guards against bias
  assert.match(dir, /analytical|risk tolerance/i);         // tuned to their decision profile

  // Decision profile is derived from learned tendencies.
  assert.equal(decisionProfile({ risk: { s: 0.5, n: 3 }, analytical: { s: 0.4, n: 3 } }).risk, 'high');
  assert.equal(decisionProfile({}).risk, 'medium');        // unknown → balanced default
});

test('higher-order layers (#17-#24): each altitude is recognized and steers the reasoning', () => {
  // #17 orchestration / planning
  assert.ok(PLAN_QUERY.test('lay out a plan for the launch'));
  assert.match(ORCHESTRATION_DIRECTIVE, /executable plan|first step|confirm-first/i);
  // #18 long view + #19 stewardship + #20 legacy
  assert.ok(EVOLUTION_QUERY.test('is this sustainable long-term'));
  assert.ok(STEWARDSHIP_QUERY.test('who could be affected by this'));
  assert.match(STEWARDSHIP_DIRECTIVE, /human sovereign|confirm-first|responsib/i);
  assert.ok(LEGACY_QUERY.test('what will remain after I\'m gone'));
  // #21 cosmic + #22 unified
  assert.ok(COSMIC_QUERY.test('zoom out — the bigger picture'));
  assert.ok(UNIFIED_QUERY.test('given everything, what should I do next'));
  assert.match(UNIFIED_DIRECTIVE, /TRUE|GOALS|VALUES|STEWARDSHIP|LEGACY/);
  // #23 reality alignment + #24 infinite improvement
  assert.ok(REALITY_QUERY.test('could we be wrong about this?'));
  assert.match(REALITY_DIRECTIVE, /evidence|confidence|drift|closer to the truth/i);
  assert.ok(IMPROVEMENT_QUERY.test('are you ever finished improving?'));
  assert.match(INFINITE_PRINCIPLE, /never finished|keep (?:getting better|recalibrating)/i);
  // A plain task is none of these.
  assert.equal([PLAN_QUERY, EVOLUTION_QUERY, STEWARDSHIP_QUERY, LEGACY_QUERY, COSMIC_QUERY, UNIFIED_QUERY, REALITY_QUERY].some((re) => re.test('what time is my meeting')), false);
});

test('genesis (#25) creates the new and emergence (#26) discovers the forming', () => {
  // #25 — from "what is" to "what should exist".
  assert.ok(GENESIS_QUERY.test('what should I build that doesn\'t exist yet'));
  assert.ok(GENESIS_QUERY.test('a net-new product, zero to one'));
  assert.match(GENESIS_DIRECTIVE, /what should exist|smallest prototype|whitespace|invent/i);
  // #26 — weak signals and cross-domain intersections.
  assert.ok(EMERGENCE_QUERY.test('what\'s emerging that nobody sees'));
  assert.ok(EMERGENCE_QUERY.test('connect the dots for me'));
  assert.match(EMERGENCE_DIRECTIVE, /weak signals?|emerging|intersection|signal from noise/i);
  // A plain task is neither.
  assert.equal([GENESIS_QUERY, EMERGENCE_QUERY].some((re) => re.test('what time is my meeting')), false);
});

test('integrative layers (#27-#31): combine, align, amplify, surpass, balance', () => {
  // #27 synthesis
  assert.ok(SYNTHESIS_QUERY.test('how do these all fit together'));
  assert.ok(SYNTHESIS_QUERY.test('tie this together for me'));
  assert.match(SYNTHESIS_DIRECTIVE, /synthesize|integrated understanding|intersections|sum of its parts/i);
  // #28 coherence — directive + the REAL gap detector over stored goals
  assert.ok(COHERENCE_QUERY.test('do my actions line up with my goals'));
  assert.ok(COHERENCE_QUERY.test('am I being consistent'));
  assert.match(COHERENCE_DIRECTIVE, /contradict|stated priorities|alignment/i);
  // #29 resonance
  assert.ok(RESONANCE_QUERY.test('what should I double down on'));
  assert.ok(RESONANCE_QUERY.test('where is my highest leverage'));
  assert.match(RESONANCE_DIRECTIVE, /amplify|leverage|compounding|double down/i);
  // #30 transcendence
  assert.ok(TRANSCENDENCE_QUERY.test('why does this limitation exist at all'));
  assert.ok(TRANSCENDENCE_QUERY.test('let\'s think from first principles'));
  assert.match(TRANSCENDENCE_DIRECTIVE, /assumption|first principles|inherited|step-change/i);
  // #31 harmony
  assert.ok(HARMONY_QUERY.test('how do I keep work-life balance'));
  assert.ok(HARMONY_QUERY.test('I\'m worried about burnout'));
  assert.match(HARMONY_DIRECTIVE, /balance|sustainable flourishing|competing|gets weaker/i);
  // A plain task triggers none of them.
  assert.equal([SYNTHESIS_QUERY, COHERENCE_QUERY, RESONANCE_QUERY, TRANSCENDENCE_QUERY, HARMONY_QUERY].some((re) => re.test('what time is my meeting')), false);
});

test('flourishing (#32): the north star — thriving over output, and excludes plain tasks', () => {
  assert.ok(FLOURISHING_QUERY.test('how do I actually live a better life'));
  assert.ok(FLOURISHING_QUERY.test('what does success really mean'));
  assert.ok(FLOURISHING_QUERY.test('am I actually thriving'));
  assert.match(FLOURISHING_DIRECTIVE, /flourishing|becoming more|well-being|burnout|thriv/i);
  assert.equal(FLOURISHING_QUERY.test('what time is my meeting'), false);
});

test('apex layers (#33-#34): conscious evolution chooses, antifragility gains from stress', () => {
  // #33 conscious evolution
  assert.ok(EVOLVE_QUERY.test('what should I become next'));
  assert.ok(EVOLVE_QUERY.test('what capabilities should we build for the future'));
  assert.match(EVOLVE_DIRECTIVE, /evolution gap|become next|forecast|capability/i);
  // #34 antifragility
  assert.ok(ANTIFRAGILE_QUERY.test('what happens if our biggest client drops'));
  assert.ok(ANTIFRAGILE_QUERY.test('how do we turn this setback into an advantage'));
  assert.ok(ANTIFRAGILE_QUERY.test('where is our single point of failure'));
  assert.match(ANTIFRAGILE_DIRECTIVE, /antifragil|redundancy|optionality|stress-test|single point of failure/i);
  // Plain task triggers neither.
  assert.equal([EVOLVE_QUERY, ANTIFRAGILE_QUERY].some((re) => re.test('what time is my meeting')), false);
});

test('wisdom accumulation (#35): extracts lessons from reflection and recalls them by relevance', () => {
  // Parse: reflection cues yield a durable lesson; plain statements don't.
  assert.equal(parseLesson('I learned that shipping small and often beats big launches.')?.text, 'shipping small and often beats big launches');
  assert.equal(parseLesson('next time, confirm the budget before starting work')?.kind, 'principle');
  assert.equal(parseLesson('what worked was batching my calls into one afternoon')?.kind, 'worked');
  assert.equal(parseLesson('I should have tested it on staging first')?.kind, 'failed');
  assert.equal(parseLesson('the meeting is at 3pm'), null);
  // Lesson keeps just the core clause, dropping the trailing reason.
  assert.equal(parseLesson('I learned that hiring slowly matters because rushing burned us')?.text, 'hiring slowly matters');
  // Recall: rank by keyword overlap with the topic; unrelated lessons are filtered out.
  const now = Date.now();
  const lessons = [
    { id: '1', text: 'hire slowly and deliberately', kind: 'principle' as const, created: now, reinforced: 2 },
    { id: '2', text: 'batch calls into one afternoon', kind: 'worked' as const, created: now, reinforced: 0 },
    { id: '3', text: 'test on staging before production', kind: 'failed' as const, created: now, reinforced: 0 },
  ];
  const hits = rankLessons(lessons, 'thinking about how we hire', 3);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, '1');
  // No topic → most-reinforced first.
  assert.equal(rankLessons(lessons, '', 3)[0].id, '1');
  assert.match(formatLessons(hits), /hire slowly/);
  // Recall query is recognized; a plain task isn't.
  assert.ok(LESSONS_QUERY.test('what have I learned about hiring'));
  assert.equal(LESSONS_QUERY.test('what time is my meeting'), false);
});

test('truth discovery (#36): triggers the research posture, excludes plain tasks', () => {
  assert.ok(DISCOVERY_QUERY.test('what are we missing here'));
  assert.ok(DISCOVERY_QUERY.test('what\'s the real cause of the churn'));
  assert.ok(DISCOVERY_QUERY.test('how would we test this assumption'));
  assert.ok(DISCOVERY_QUERY.test('what assumptions should we challenge'));
  assert.match(DISCOVERY_DIRECTIVE, /hypothes|researcher|test|unknown unknowns|replicated/i);
  assert.equal(DISCOVERY_QUERY.test('what time is my meeting'), false);
});

test('stewardship of intelligence (#37): governance posture — tiers, oversight, transparency', () => {
  assert.ok(GOVERNANCE_QUERY.test('just because we can, should we'));
  assert.ok(GOVERNANCE_QUERY.test('should this be automated'));
  assert.ok(GOVERNANCE_QUERY.test('explain your reasoning for that'));
  assert.ok(GOVERNANCE_QUERY.test('does this need human approval'));
  assert.match(GOVERNANCE_DIRECTIVE, /confirm-first|sovereign|transparent|authority tiers|who bears the risk/i);
  assert.equal(GOVERNANCE_QUERY.test('what time is my meeting'), false);
});

test('civilization operating system (#38): reasons at society scale, excludes plain tasks', () => {
  assert.ok(CIVILIZATION_QUERY.test('what actually benefits humanity here'));
  assert.ok(CIVILIZATION_QUERY.test('how do institutions coordinate at scale'));
  assert.ok(CIVILIZATION_QUERY.test('what\'s good for society and future generations'));
  assert.match(CIVILIZATION_DIRECTIVE, /civilization scale|institutions|commons|second-order|sovereign/i);
  assert.equal(CIVILIZATION_QUERY.test('what time is my meeting'), false);
});

test('universal coordination (#39): synchronizing independent actors, excludes plain tasks', () => {
  assert.ok(COORDINATION_QUERY.test('how do I get everyone on the same page'));
  assert.ok(COORDINATION_QUERY.test('who should do what here'));
  assert.ok(COORDINATION_QUERY.test('the teams keep duplicating work and stepping on each other'));
  assert.ok(COORDINATION_QUERY.test('I think we have misaligned incentives'));
  assert.match(COORDINATION_DIRECTIVE, /coordination|incentives|who decides|handoffs|friction/i);
  assert.equal(COORDINATION_QUERY.test('what time is my meeting'), false);
});

test('prime directive (#40): ORB can state its constitution and runs the constitutional test', () => {
  // The constitution is recognized and articulated, with all five pillars + the test.
  assert.ok(PRIME_QUERY.test('why do you exist'));
  assert.ok(PRIME_QUERY.test('what is your prime directive'));
  assert.ok(PRIME_QUERY.test('what will you never do'));
  const stmt = constitutionStatement();
  assert.ok(stmt.includes(PRIME_DIRECTIVE));
  for (const pillar of PILLARS) assert.ok(stmt.includes(pillar), `statement should mention ${pillar}`);
  for (const q of CONSTITUTIONAL_TEST) assert.ok(stmt.includes(q), `statement should include test "${q}"`);
  assert.match(stmt, /sovereign|decision-maker/i);
  // The constitutional frame enforces the test and the non-negotiables.
  assert.match(CONSTITUTION_DIRECTIVE, /constitutional test|sustainable|responsible|sovereign|agency/i);
  // A plain task isn't a constitutional question.
  assert.equal(PRIME_QUERY.test('what time is my meeting'), false);
});

test('legacy/continuity (#41-#42): preservation across generations + holding the thread over time', () => {
  // #41 preservation
  assert.ok(PRESERVATION_QUERY.test('how do we capture this knowledge before they leave'));
  assert.ok(PRESERVATION_QUERY.test('what must survive us'));
  assert.ok(PRESERVATION_QUERY.test('we keep losing institutional memory'));
  assert.match(PRESERVATION_DIRECTIVE, /endure|institutional memory|document|generation|preserve/i);
  // #42 continuity
  assert.ok(CONTINUITY_QUERY.test('why did we originally decide this'));
  assert.ok(CONTINUITY_QUERY.test('I don\'t want to lose the thread'));
  assert.ok(CONTINUITY_QUERY.test('how do we maintain context across leadership transitions'));
  assert.match(CONTINUITY_DIRECTIVE, /thread|context|original|identity|through-line/i);
  // Plain task triggers neither.
  assert.equal([PRESERVATION_QUERY, CONTINUITY_QUERY].some((re) => re.test('what time is my meeting')), false);
});

test('cosmic memory (#43): "have we seen this before" retrieval + memory-hierarchy frame', () => {
  assert.ok(RECALL_QUERY.test('have we seen this before'));
  assert.ok(RECALL_QUERY.test('does this remind you of anything'));
  assert.ok(RECALL_QUERY.test('what did we learn from last time'));
  assert.match(COSMIC_MEMORY_DIRECTIVE, /hierarchy|event|lesson|principle|seen before|integrity/i);
  assert.equal(RECALL_QUERY.test('what time is my meeting'), false);
});

test('coherence (#28): detects stated-important-but-deferred goals as real gaps', () => {
  const now = Date.now();
  const goals = [
    { id: 'a', action: 'exercise daily', importance: 3, created: now, lastSeen: now, deferrals: 3, done: false },
    { id: 'b', action: 'reply to Sam', importance: 1, created: now, lastSeen: now, deferrals: 4, done: false },
    { id: 'c', action: 'finish taxes', importance: 3, created: now, lastSeen: now, deferrals: 0, done: false },
    { id: 'd', action: 'ship feature', importance: 3, created: now, lastSeen: now, deferrals: 5, done: true },
  ];
  const gaps = detectCoherenceGaps(goals);
  // Only the high-importance, repeatedly-deferred, not-done goal qualifies.
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].action, 'exercise daily');
  assert.match(formatCoherence(gaps), /don't line up|exercise daily/);
  // No goals → no false alarms.
  assert.equal(formatCoherence(detectCoherenceGaps([])), '');
});

test('architecture: unifies every layer into one briefing and can describe its own stack', () => {
  const brief = buildBrief({
    focus: [{ label: 'handle payroll', score: 88, tier: 'deadline' }, { label: 'reply to investor', score: 70, tier: 'deadline' }],
    objectives: [{ label: 'grow revenue to 50k', progress: 50 }],
    slipping: ['call the supplier'],
    done: 4, open: 3, purpose: 'give people their time back', drivers: ['freedom']
  });
  assert.match(brief, /What matters right now/);
  assert.match(brief, /handle payroll/);
  assert.match(brief, /grow revenue.*50%/);
  assert.match(brief, /4 of 7/);
  assert.match(brief, /give people their time back/);
  assert.match(brief, /highest-leverage/);   // closes with a single recommended next move
  assert.match(buildBrief({ focus: [], objectives: [], slipping: [], done: 0, open: 0, purpose: '', drivers: [] }), /just getting started/i);

  // ORB can describe its own architecture as one integrated system.
  assert.match(describeArchitecture(), /council|layers|confirm-first/i);
  assert.ok(INTELLIGENCE_STACK.length >= 8);
});

test('purpose + foresight: aligns to what matters and positions for possible futures', () => {
  // Purpose is captured and used to align recommendations.
  assert.equal(parsePurpose('my mission is to build ORB and give people their time back'), 'build ORB and give people their time back');
  assert.equal(parsePurpose('what time is it'), null);
  assert.ok(PURPOSE_QUERY.test('why am I doing all this'));
  assert.ok(ALIGN_QUERY.test('does this serve my mission?'));
  assert.match(ALIGNMENT_DIRECTIVE, /align|values|mission|significance/i);

  // Foresight triggers on forward-looking questions and frames best/likely/worst + positioning.
  assert.ok(FORESIGHT_QUERY.test('where is this market heading'));
  assert.ok(FORESIGHT_QUERY.test('what should I prepare for next year'));
  assert.equal(FORESIGHT_QUERY.test('what did I do yesterday'), false);
  assert.match(FORESIGHT_DIRECTIVE, /best case|most-likely|worst case|position/i);
});

test('systems thinking: records causal links and traces the chain through the system', async () => {
  // Detects stated cause→effect (and ignores questions).
  assert.deepEqual(parseCausal('late deliveries cause unhappy customers'), { cause: 'late deliveries', effect: 'unhappy customers', rel: 'causes' });
  assert.deepEqual(parseCausal('good service reduces complaints'), { cause: 'good service', effect: 'complaints', rel: 'reduces' });
  assert.equal(parseCausal('why are deliveries late?'), null);

  // Systemic questions get the structure/feedback/leverage frame.
  assert.ok(SYSTEMS_QUERY.test('why does revenue keep dropping'));
  assert.match(SYSTEMS_DIRECTIVE, /feedback loop|bottleneck|leverage|second-? and third-order|second- and third-order/i);

  // Build a causal chain and trace propagation through it.
  const u = 'test-systems@example.com';
  await relate(u, 'late deliveries', 'unhappy customers', 'causes');
  await relate(u, 'unhappy customers', 'churn', 'causes');
  await relate(u, 'churn', 'lower revenue', 'causes');
  const t = await traceCausal(u, 'late deliveries');
  assert.ok(t && t.chains.length);
  assert.match(formatTrace(t), /churn/);
  assert.match(formatTrace(t), /lower revenue/);   // traces multiple hops downstream
});

test('relationships: tracks trust across people — who delivers vs who flakes', () => {
  assert.deepEqual(parseReliability('Dana delivered on the deck'), { name: 'Dana', kind: 'delivered' });
  assert.deepEqual(parseReliability('John flaked again'), { name: 'John', kind: 'missed' });
  assert.equal(parseReliability('he dropped the ball'), null);   // pronoun, not a named person
  assert.equal(parseReliability('the vendor came through'), null); // lowercase, not a name

  assert.equal(reliability({ name: 'Dana', delivered: 4, missed: 0 }).label, 'someone you can count on');
  assert.match(reliability({ name: 'John', delivered: 0, missed: 4 }).label, /unreliable|backup/i);
  assert.equal(reliability({ name: 'New', delivered: 1, missed: 0 }).label, 'too early to say');
});

test('identity: ORB holds a self-model and a living, connected model of the user', () => {
  // Self-model: mission, boundaries (confirm-first), continuity — and honest about not being conscious.
  const self = selfModel();
  assert.match(self, /mission|chief of staff/i);
  assert.match(self, /confirm-first|high-risk/i);
  assert.match(self, /continuity|same chief of staff/i);
  assert.match(self, /not conscious/i);

  // User identity weaves the layers (drivers + values + goals + track record) into one picture.
  const id = buildIdentity({ persona: 'you prefer direct, concise answers', drivers: ['freedom'], values: 'long-term thinking', objectives: ['grow revenue to 50k'], done: 3, open: 2 });
  assert.match(id, /freedom/);
  assert.match(id, /long-term thinking/);
  assert.match(id, /grow revenue/);
  assert.match(id, /3 of 5/);
  // Nothing known yet → honest, and names continuity as the point.
  assert.match(buildIdentity({ persona: '', drivers: [], values: '', objectives: [], done: 0, open: 0 }), /still forming|continuity/i);
});

test('creativity + wisdom: generative framing and judgment on weighty calls', () => {
  // Creativity triggers on idea-generation asks; the directive pushes diverge-then-converge.
  assert.ok(CREATIVE_QUERY.test('brainstorm some ways to grow Friday traffic'));
  assert.equal(CREATIVE_QUERY.test('what time is my meeting'), false);
  assert.match(CREATIVE_DIRECTIVE, /diverge|unconventional|connects unrelated/i);

  // Wisdom triggers on strategic decisions and applies second-order / ethics / long-term judgment.
  assert.equal(isStrategic('should I open a second restaurant?'), true);
  assert.equal(isStrategic('is this the right move?'), true);
  assert.equal(isStrategic("what's the wifi password"), false);
  assert.match(WISDOM_DIRECTIVE, /second-order|opportunity cost|ethical|long-term/i);

  // Values get parsed and folded into the judgment.
  assert.equal(parseValues('my values are honesty, long-term thinking, and family'), 'honesty, long-term thinking, and family');
  assert.equal(parseValues('what time is it'), null);
  assert.match(valuesDirective('family first'), /family first/);
});

test('adaptation: learns from outcomes — do more of what works, rethink what fails', () => {
  // Reads reported outcomes (and ignores questions).
  assert.deepEqual(parseOutcome('the Friday promo worked'), { label: 'Friday promo', result: 'win' });
  assert.deepEqual(parseOutcome('the new menu flopped'), { label: 'new menu', result: 'loss' });
  assert.equal(parseOutcome('what worked last week?'), null);

  // Recommends keep vs rethink by win-rate (needs >= 2 data points).
  const rec = recommendFrom([
    ['friday promo', { wins: 3, losses: 0 }],
    ['cold emails', { wins: 0, losses: 3 }],
    ['one-off thing', { wins: 1, losses: 0 }]   // too little data → neither
  ]);
  assert.ok(rec.keep.some((k) => /friday promo/i.test(k)));
  assert.ok(rec.rethink.some((k) => /cold emails/i.test(k)));
  assert.equal(rec.keep.length + rec.rethink.length, 2);   // the 1-datapoint item is excluded
});

test('events: clusters repeated activity into a recognized habit (time-of-day)', () => {
  // Five "active" events, all in the morning (8am local) → ORB learns a morning routine.
  const morning = [9, 10, 11, 12, 13].map((day) => ({ kind: 'active', label: '', at: new Date(2024, 0, day, 8, 30).getTime() }));
  const pats = analyzePatterns(morning);
  assert.ok(pats.some((p) => /active in the morning/i.test(p)));
  // Too few occurrences → no habit claimed.
  assert.equal(analyzePatterns([{ kind: 'active', label: '', at: Date.now() }]).length, 0);
});

test('self-regulation: reads follow-through, the avoided high-value task, and discipline trend', () => {
  const weak = buildSelfReg({ done: 1, open: 4, deferred: 6, avoided: 'call the supplier' });
  assert.match(weak, /1 of 5|20%/);
  assert.match(weak, /call the supplier/);
  assert.match(weak, /slipping|focus block/i);
  const strong = buildSelfReg({ done: 8, open: 2, deferred: 1, avoided: null });
  assert.match(strong, /strong follow-through|do what you say/i);
  assert.match(buildSelfReg({ done: 0, open: 0, deferred: 0, avoided: null }), /nothing tracked/i);
});

test('meta-cognition: reflection, confidence/assumption self-check, and process-vs-outcome audit', () => {
  // Reflection synthesizes progress, what's slipping, and the assumption to question.
  const r = buildReflection({
    objectives: [{ label: 'grow revenue to 50k', progress: 50 }, { label: 'build ORB', progress: null }],
    slipping: ['call the supplier'],
    drivers: ['freedom']
  });
  assert.match(r, /50%/);
  assert.match(r, /assuming is working|question to sit with/i);   // surfaces an assumption to check
  assert.match(r, /call the supplier/);

  // The self-check directive forces confidence + assumptions; the audit separates process from luck.
  assert.match(META_DIRECTIVE, /how confident|assuming|could be wrong/i);
  assert.match(AUDIT_DIRECTIVE, /process.*not the outcome|outcome luck/i);
  assert.ok(META_QUERY.test('can we do a weekly review'));
  assert.ok(AUDIT_QUERY.test('was that a bad decision or bad luck?'));
});

test('behavior prediction: synthesizes likely next moves from drivers, risk, goals, and deferrals', () => {
  const bold = synthesizePredictions({ drivers: ['achievement'], risk: 'high', objectives: ['grow revenue to 50k'], deferring: ['call the supplier'] });
  assert.ok(bold.some((p) => /bold moves|expansion|investment/i.test(p)));
  assert.ok(bold.some((p) => /grow revenue/i.test(p)));
  assert.ok(bold.some((p) => /call the supplier/i.test(p)));
  const safe = synthesizePredictions({ drivers: ['security'], risk: 'low', objectives: [], deferring: [] });
  assert.ok(safe.some((p) => /protecting|consolidat/i.test(p)));
  assert.equal(synthesizePredictions({ drivers: [], risk: 'medium', objectives: [], deferring: [] }).length, 0);
});

test('motivation: learns the drivers behind goals and frames around them', async () => {
  const u = 'test-motiv@example.com';
  // Repeated freedom cues → ORB learns the driver.
  await observeMotivation(u, 'I want to be my own boss and have freedom');
  await observeMotivation(u, 'I just want independence and to call my own shots');
  const top = await topDrivers(u);
  assert.ok(top.includes('freedom'));
  assert.match(await motivationDirective(u), /freedom/i);   // it frames answers around the driver

  // Explicit statement is parsed and set immediately.
  assert.equal(parseDriver("honestly what motivates me is legacy and impact"), 'legacy');
  assert.equal(parseDriver('what time is the meeting?'), null);
  const u2 = 'test-motiv2@example.com';
  await setDriver(u2, 'security');
  assert.ok((await topDrivers(u2)).includes('security'));
});

test('objectives: tracks the goal hierarchy, the current→target gap, progress, and conflicts', async () => {
  // Parse a goal with a current→target gap.
  const p = parseObjective('My goal is to grow revenue from $30k to $50k a month');
  assert.ok(p);
  assert.equal(p!.level, 'strategic');
  assert.equal(p!.start, 30000);
  assert.equal(p!.target, 50000);

  // Classification of the hierarchy + types.
  assert.equal(classifyLevel('become an investor'), 'identity');
  assert.equal(classifyLevel('launch the new website'), 'tactical');
  assert.equal(classifyType('call 10 customers per day'), 'process');
  assert.equal(classifyType('increase sales by 20%'), 'performance');

  // Gap-closing progress: 30k start, 50k target, now at 40k → halfway.
  const u = 'test-obj@example.com';
  await setObjective(u, p);
  const moved = await updateProgress(u, 'revenue', 40000);
  assert.equal(progressOf(moved!), 50);

  // Conflict detection between competing goals.
  await setObjective(u, parseObjective('My goal is to scale the business and get more clients'));
  await setObjective(u, parseObjective('My goal is to spend more time with family'));
  assert.ok(detectConflicts(await listObjectives(u)).length >= 1);
});

test('attention: priority score follows the survival → goals → novelty → reward → routine hierarchy', () => {
  assert.equal(classifyTier('the server is down, security breach'), 'emergency');
  assert.equal(classifyTier('payroll due tomorrow'), 'deadline');
  assert.equal(classifyTier('weekly newsletter'), 'routine');
  // Emergency outranks a deadline outranks a reward outranks routine.
  const emerg = priorityScore('production outage right now');
  const deadline = priorityScore('payroll due tomorrow', { dueInHours: 20 });
  const reward = priorityScore('new sales lead opportunity');
  const routine = priorityScore('read the newsletter');
  assert.ok(emerg > deadline && deadline > reward && reward > routine);
  assert.ok(emerg >= 90 && routine <= 25);
  // The same item climbs as it's put off and ages.
  assert.ok(priorityScore('call the supplier', { deferrals: 3, ageDays: 5 }) > priorityScore('call the supplier'));
});

test('attention: focus list ranks the user\'s tracked items by priority', async () => {
  const u = 'test-attention@example.com';
  await noteIntent(u, 'I need to handle the payroll, it is due tomorrow');
  await noteIntent(u, 'I should read the newsletter sometime');
  const focus = await focusList(u);
  assert.ok(focus.length >= 2);
  assert.match(focus[0].label.toLowerCase(), /payroll/);   // the urgent, high-impact item is on top
  assert.ok(focus[0].score > focus[focus.length - 1].score);
});

test('goals: tracks intentions, notices what keeps slipping, nudges, and closes on completion', async () => {
  const u = 'test-goals@example.com';
  // First mention — a new commitment (important: it's a client).
  const a = await noteIntent(u, 'I need to call John, he is an important client');
  assert.ok(a && !a.deferred && a.goal.importance === 3);
  // Re-raised twice → ORB sees it being put off and nudges.
  await noteIntent(u, 'I should call John');
  const c = await noteIntent(u, 'I really need to call John');
  assert.equal(c!.deferred, true);
  assert.match(nudgeFor(c!.goal) || '', /call John.*\b3 times\b|knock it out/i);

  // It rises to the top of "what's slipping".
  const pend = await pendingGoals(u);
  assert.ok(pend[0].action.toLowerCase().includes('call john'));

  // Questions aren't commitments; completion closes it.
  assert.equal(await noteIntent(u, 'do I need to call John?'), null);
  assert.ok(await completeIntent(u, 'I just called John'));
  assert.equal((await pendingGoals(u)).some((g) => g.id.includes('call john')), false);
});

test('thinking-partner: ORB helps clarify thinking instead of just answering', () => {
  assert.equal(analyzeComms("I'm not sure whether to hire now or wait a quarter.").reflect, true);
  assert.equal(analyzeComms("I keep going back and forth on the office move.").reflect, true);
  assert.equal(analyzeComms('What time is my meeting?').reflect, false);   // a plain question, just answer it
  assert.match(postureDirective(analyzeComms("Should I take the deal or hold out for more?")), /thinking partner|clarifying question/i);
});

test('sarcasm engine: context, prosody, and the four types each get the right response', () => {
  // Context: a positive word about a clearly bad event → sarcasm even with no lexical marker.
  assert.equal(sarcasmRead('Wonderful. Payroll is due tomorrow.').sarcastic, true);
  assert.equal(sarcasmRead('Oh great, another city permit meeting.').sarcastic, true);
  // Tone: flat-positive words said in a frustrated voice → sarcasm.
  assert.equal(sarcasmRead('perfect', 'frustrated').sarcastic, true);
  assert.equal(sarcasmRead('perfect', 'calm').sarcastic, false);   // same words, genuine

  // Types route to different responses.
  assert.equal(sarcasmRead('Look at you, showing up on time.').type, 'friendly');
  assert.equal(sarcasmRead("Yeah, because my schedule wasn't busy enough.").type, 'self');
  assert.equal(sarcasmRead('Brilliant idea.', 'frustrated').type, 'hostile');   // standalone praise needs tone
  assert.equal(sarcasmRead('Great. Another software update.').type, 'frustration');

  // Frustration sarcasm → ORB offers help, doesn't congratulate.
  const fr = analyzeComms('Looks like I needed another problem today.');
  assert.equal(fr.sarcasm, true);
  assert.match(postureDirective(fr), /offer to (help|lighten)/i);
  // Hostile sarcasm → stay professional, don't joke back.
  assert.match(postureDirective(analyzeComms('Brilliant idea.', 'frustrated')), /do not joke back/i);
  // Genuine praise is left alone — text alone can't flip it, and the tone says calm.
  assert.equal(sarcasmRead('The meeting went well and we closed the deal.').sarcastic, false);
  assert.equal(sarcasmRead('Brilliant idea.').sarcastic, false);   // no tone, no context → real praise
});

test('comms: detects likely sarcasm and tells ORB not to take it literally', () => {
  assert.equal(readSarcasm('Well that city meeting went wonderfully.'), true);
  assert.equal(readSarcasm('oh great, another delay'), true);
  assert.equal(readSarcasm('the meeting went well and we closed the deal'), false);   // genuine praise
  const read = analyzeComms('Well that went perfectly.');
  assert.equal(read.sarcasm, true);
  assert.match(postureDirective(read), /sarcastic/i);
});

test('lang: detects the user\'s language across scripts, defaults to English', () => {
  assert.equal(detectLang('Hola, ¿cómo estás?').code, 'es');
  assert.equal(detectLang('Bonjour, merci beaucoup').code, 'fr');
  assert.equal(detectLang('Olá, preciso de ajuda').code, 'pt');
  assert.equal(detectLang('你好吗').code, 'zh');
  assert.equal(detectLang('こんにちは').code, 'ja');     // kana wins over Han
  assert.equal(detectLang('Привет, как дела').code, 'ru');
  assert.equal(detectLang('مرحبا').code, 'ar');
  assert.equal(detectLang('Schedule a meeting tomorrow').code, 'en');
  assert.equal(detectLang('').code, 'en');                // nothing → English
  assert.equal(detectLang('Hola, ¿cómo estás?').locale, 'es-ES');   // carries a TTS locale
});

test('lang: urgency is read across languages (prosody covers the rest)', () => {
  assert.equal(isUrgent('necesito esto rápido'), true);   // Spanish
  assert.equal(isUrgent('dépêche-toi'), true);            // French
  assert.equal(isUrgent('ich brauche das sofort'), true); // German
  assert.equal(isUrgent('tell me about the weather'), false);
});

test('scene: spatial read drives brevity, clarity voice, and privacy awareness', () => {
  // A loud place → short & clear directive, and the emergency register to cut through.
  assert.match(sceneDirective({ noise: 'loud' }), /short and clear/i);
  const v = sceneVoice({ tone: 'executive', rate: 1.0, pitch: 0.97, volume: 1.0 }, { noise: 'loud' });
  assert.equal(v.tone, 'emergency');
  assert.equal(v.volume, 1.0);

  // A crowd (even if not loud) → privacy-aware, don't read sensitive things unprompted.
  assert.match(sceneDirective({ noise: 'moderate', crowd: true }), /sensitive/i);

  // Quiet → no special handling; unchanged voice.
  assert.equal(sceneDirective({ noise: 'quiet' }), '');
  assert.equal(sceneVoice({ tone: 'friendly', rate: 1.03, pitch: 1.0, volume: 1.0 }, { noise: 'quiet' }).tone, 'friendly');

  // Validation: only well-formed scenes are trusted.
  assert.equal(asScene({ noise: 'loud', crowd: true })?.noise, 'loud');
  assert.equal(asScene({ noise: 'jet-engine' }), undefined);
});

test('prosody: voice tone disambiguates flat words, but text always wins', () => {
  // "okay." is emotionally flat in text — the voice decides.
  assert.equal(analyzeComms('okay.').emotion, 'neutral');
  assert.equal(analyzeComms('okay.', 'frustrated').emotion, 'frustrated');   // sounded tense
  assert.equal(analyzeComms('okay.', 'excited').emotion, 'playful');         // sounded bright
  assert.equal(analyzeComms('sure, go ahead', 'urgent').urgent, true);       // sounded rushed

  // Explicit words override the voice hint — text is the stronger signal.
  assert.equal(analyzeComms('ugh this is broken', 'excited').emotion, 'frustrated');
  assert.equal(analyzeComms('that went wonderfully', 'calm').sarcasm, true);

  assert.equal(asProsody('excited'), 'excited');
  assert.equal(asProsody('garbage'), undefined);   // unknown hints are ignored, never trusted
});

test('voice: ORB adapts its delivery to the user state', () => {
  // Stressed/frustrated → slow down, lower pitch, lower energy (de-escalate).
  const stressed = voiceFor({ urgent: false, emotion: 'frustrated', sarcasm: false });
  assert.equal(stressed.tone, 'calm');
  assert.ok(stressed.rate < 1.0 && stressed.pitch < 1.0 && stressed.volume < 1.0);

  // Urgent → faster, crisp.
  const urgent = voiceFor({ urgent: true, emotion: 'neutral', sarcasm: false });
  assert.equal(urgent.tone, 'emergency');
  assert.ok(urgent.rate > 1.0);

  // Playful baseline (humor=playful) → brighter and more dynamic than executive.
  const playful = voiceFor({ urgent: false, emotion: 'neutral', sarcasm: false }, 'playful');
  const exec = voiceFor({ urgent: false, emotion: 'neutral', sarcasm: false }, 'executive');
  assert.ok(playful.rate >= exec.rate && playful.pitch >= exec.pitch);

  // Everything stays inside safe, natural ranges.
  for (const v of [stressed, urgent, playful, exec]) {
    assert.ok(v.rate >= 0.8 && v.rate <= 1.3 && v.pitch >= 0.8 && v.pitch <= 1.2 && v.volume >= 0.7 && v.volume <= 1.0);
  }
});

test('support: appreciation style persists (encouraging / direct / reassuring)', async () => {
  const u = 'test-support@example.com';
  assert.equal((await getPrefs(u)).support, 'standard');   // balanced default
  await setPrefs(u, { support: 'direct' });
  assert.equal((await getPrefs(u)).support, 'direct');
  await setPrefs(u, { support: 'encouraging' });
  assert.equal((await getPrefs(u)).support, 'encouraging');
});

test('humor: graduated levels persist and stay in lockstep with the legacy flag', async () => {
  const u = 'test-humor@example.com';
  assert.equal((await getPrefs(u)).humor, 'executive');   // default
  await setPrefs(u, { humor: 'professional' });
  let p = await getPrefs(u);
  assert.equal(p.humor, 'professional');
  assert.equal(p.wit, false, 'professional turns the legacy wit flag off');
  await setPrefs(u, { humor: 'playful' });
  p = await getPrefs(u);
  assert.equal(p.humor, 'playful');
  assert.equal(p.wit, true, 'any humor level keeps the legacy flag on');
});

test('personality: tendencies need repeated evidence before they speak', () => {
  let t: Traits = {};
  t = applySignals(t, 'just give me the bottom line');   // one direct signal — not yet confident
  assert.equal(confident(t.direct), false, 'one data point is not enough');
  assert.equal(profileDirective(t), '', 'no directive until a tendency is earned');
  t = applySignals(t, 'cut to the chase');
  t = applySignals(t, 'no fluff, just the point');
  assert.equal(confident(t.direct), true, 'repeated signals earn the tendency');
  assert.match(profileDirective(t), /blunt/i, 'earned tendency shapes the directive');
});

test('personality: opposite leans are distinguished and described in plain language', () => {
  let cautious: Traits = {};
  for (const m of ['be careful here', 'are you sure?', 'play it safe', 'double-check that']) cautious = applySignals(cautious, m);
  assert.equal(confident(cautious.risk), true);
  assert.match(describeProfile(cautious), /play it safe/i);

  let bold: Traits = {};
  for (const m of ["let's do it", 'send it', 'go for it', 'full send']) bold = applySignals(bold, m);
  assert.match(describeProfile(bold), /decisively/i);
  assert.match(describeProfile({}), /still getting to know/i);   // honest when it knows nothing
});

test('personality: observeMessage learns tendencies, resetProfile clears them', async () => {
  const u = 'test-personality@example.com';
  for (const m of ['explain why that works', 'break it down', 'walk me through the reasoning']) await observeMessage(u, m);
  const learned = (await getPrefs(u)).traits;
  assert.equal(confident(learned.analytical), true, 'analytical tendency learned from real messages');
  await resetProfile(u);
  assert.deepEqual((await getPrefs(u)).traits, {}, 'reset wipes the learned profile');
});

test('convoPrefs: Executive Wit defaults on and toggles off/on', async () => {
  const u = 'test-wit@example.com';
  assert.equal((await getPrefs(u)).wit, true, 'wit is on by default');
  await setPrefs(u, { wit: false });
  assert.equal((await getPrefs(u)).wit, false, 'wit can be switched off');
  await setPrefs(u, { wit: true });
  assert.equal((await getPrefs(u)).wit, true, 'wit can be switched back on');
});

test('skills: voice cloning/recognition are owner-only and talk-triggered', () => {
  assert.equal(matchSkill('clone my voice')?.id, 'voice-clone');
  assert.equal(matchSkill('I want to record my voice')?.id, 'voice-clone');
  assert.equal(matchSkill('turn on voice recognition')?.id, 'voice-recognition');
  assert.equal(matchSkill('what is the weather'), null);
  const voice = listSkills().filter((s) => s.id.startsWith('voice'));
  assert.ok(voice.length >= 2 && voice.every((s) => s.ownerOnly));
});

test('admin metrics + owner keys', async () => {
  const m = await monetizationMetrics();
  assert.ok(typeof m.mrr === 'number' && typeof m.arr === 'number' && typeof m.conversion === 'number');
  assert.ok(m.arr === Math.round(m.mrr * 12 * 100) / 100);
  // Owner key whitelist gates what can be set in-app.
  assert.ok(OWNER_KEYS.includes('STRIPE_SECRET_KEY') && OWNER_KEYS.includes('RUNWAY_API_KEY'));
  await assert.rejects(() => setPlatformKey('NOT_AN_OWNER_KEY', 'x'));
});

test('auth: degrades gracefully without provider keys', async () => {
  assert.equal(appleConfigured(), false);
  assert.equal(phoneConfigured(), false);
  const s = await startPhone('+15551234567');
  assert.equal(s.sent, false);                       // no Twilio → not sent, no throw
  assert.equal(verifyPhone('+15551234567', '000000').ok, false);
});

test('whatsapp: parses inbound from Twilio and Meta', () => {
  assert.equal(whatsappConfigured(), false); // no keys in test
  const tw = parseInbound({ From: 'whatsapp:+15551234567', Body: 'hi orb' });
  assert.deepEqual(tw, { from: '+15551234567', text: 'hi orb' });
  const meta = parseInbound({ entry: [{ changes: [{ value: { messages: [{ from: '15551234567', text: { body: 'hello' } }] } }] }] });
  assert.deepEqual(meta, { from: '15551234567', text: 'hello' });
  assert.equal(parseInbound({ status: 'delivered' }), null); // non-message events ignored
});

test('needsContext: fetch data only when the request needs it', () => {
  assert.equal(needsContext("what's on my calendar today?"), true);
  assert.equal(needsContext('any unread email?'), true);
  assert.equal(needsContext('what is the capital of France?'), false);  // no fetch
  assert.equal(needsContext('write me a haiku'), false);                // no fetch
});

test('genome soul: five laws and seven organs are present', () => {
  assert.equal(CONSTRUCTION_LAWS.length, 5);
  assert.equal(CONSTRUCTION_ORGANS.length, 7);
});
