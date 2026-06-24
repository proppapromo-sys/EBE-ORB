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
