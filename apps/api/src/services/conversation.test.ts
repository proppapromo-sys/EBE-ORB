import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendTurn, getConversation, formatTranscript, SAVE_CONVO_RE } from './conversation.js';

test('conversation: appends turns in order and formats a readable transcript', async () => {
  const u = 'convo-test-user';
  await appendTurn(u, 'user', 'what needs my attention today?');
  await appendTurn(u, 'orb', 'Your strategy doc has stalled.');
  await appendTurn(u, 'user', '   ');            // blank is ignored
  await appendTurn(u, 'orb', 'Want me to block time?');
  const turns = await getConversation(u);
  assert.equal(turns.length, 3);                 // the blank one was dropped
  assert.deepEqual(turns.map((t) => t.role), ['user', 'orb', 'orb']);
  const transcript = formatTranscript(turns);
  assert.match(transcript, /^You: what needs my attention today\?/);
  assert.match(transcript, /ORB: Your strategy doc has stalled\./);
  assert.equal(formatTranscript([]), '(no conversation yet)');
});

test('SAVE_CONVO_RE: matches the save-to-notepad command, not normal chat', () => {
  for (const s of ['save this conversation in my notepad', 'save our chat', 'save the conversation to notepad', 'keep a record of this conversation']) {
    assert.ok(SAVE_CONVO_RE.test(s), s);
  }
  for (const s of ['what time is my meeting', 'save me some time', 'tell me about the conversation we had'].slice(0, 2)) {
    assert.equal(SAVE_CONVO_RE.test(s), false, s);
  }
});
