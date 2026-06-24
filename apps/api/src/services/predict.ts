/**
 * predict.ts — ORB's anticipation. The brain finishes "peanut butter and…" with "jelly" before the
 * sentence ends; conversations feel fluid because we predict structure, not just parse words. This
 * does the same for commands: it recognizes the *frame* of an imperative early ("schedule a meeting
 * with…", "remind me to…", "book a flight to…"), sees which slots are already filled and which are
 * still missing, and lets ORB ask for exactly the missing piece instead of dead-ending on a fragment.
 *
 * Deliberately narrow and conservative: it only fires on clear command frames (never on questions),
 * so normal chat is untouched. It reads the finished text only — no raw audio, no background speech.
 */

export type IntentName = 'meeting' | 'call' | 'remind' | 'flight';
export type Prediction = { intent: IntentName; filled: Record<string, string>; missing: string[] };

// A message that starts like a question is a query, not a command — never predict an action from it.
const QUESTION = /^(?:\s*orb[,!.]?\s*)?(what|when|how|should|can|could|would|is|are|am|do|does|did|why|who|where|which|tell me|explain|show me)\b/i;
// Trailing connectors / ellipsis — a thought left hanging mid-air.
const TRAIL = /(?:\b(?:with|to|for|about|at|on|and|the|a|an)\s*$)|(?:\.\.\.|…)\s*$/i;
// A rough but useful "is there a time in here" check.
const TIME = /\b(today|tonight|tomorrow|mon(day)?|tue(s|sday)?|wed(nesday)?|thu(r|rsday)?|fri(day)?|sat(urday)?|sun(day)?|next (week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|this (week|afternoon|evening|morning)|noon|midnight|\d{1,2}(:\d{2})?\s*(am|pm)|at \d{1,2}\b|in \d+\s*(min|minute|minutes|hour|hours|day|days))\b/i;

const has = (re: RegExp, s: string) => re.test(s);
function present(filled: Record<string, string>, required: string[]): string[] {
  return required.filter((k) => !filled[k]);
}

/**
 * Read a partial or whole utterance for an actionable command frame. Returns the intent with its
 * filled and still-missing slots, or null when it isn't a command we anticipate.
 */
export function predictIntent(message: string): Prediction | null {
  const m = (message || '').trim();
  if (!m || QUESTION.test(m)) return null;
  const trailing = TRAIL.test(m);

  // Meeting / event — "schedule a meeting with Dana tomorrow at 3".
  if ((has(/\b(schedule|set ?up|book|arrange|put in|add|plan|set)\b/i, m) && has(/\b(meeting|call|appointment|sync|catch[- ]?up|event|1:1|one[ -]on[ -]one|lunch|coffee)\b/i, m))
      || has(/\bmeeting with\b/i, m)) {
    const filled: Record<string, string> = {};
    const who = m.match(/\bwith\s+([A-Za-z][\w'’.-]+(?:\s+[A-Z][\w'’.-]+)?)/);
    if (who && !TRAIL.test(who[0])) filled.person = who[1];
    if (TIME.test(m)) filled.time = 'set';
    return { intent: 'meeting', filled, missing: present(filled, ['person', 'time']) };
  }

  // Call — only a real call command, not "call it a day" or "what's the call".
  const namedCall = m.match(/\bcall\s+([A-Z][a-z'’-]+)\b/);
  const bareCall = /^\s*(?:orb[,!.]?\s*)?(?:please\s+)?call\b[\s,]*(?:\.\.\.|…)?\s*$/i.test(m);
  if (namedCall || bareCall) {
    const filled: Record<string, string> = {};
    if (namedCall) filled.person = namedCall[1];
    return { intent: 'call', filled, missing: present(filled, ['person']) };
  }

  // Remind — "remind me to call the bank at noon".
  if (has(/\bremind me\b/i, m)) {
    const filled: Record<string, string> = {};
    const task = m.replace(/^.*\bremind me\s*(?:to\s*)?/i, '').replace(/(?:\.\.\.|…)\s*$/, '').trim();
    const taskNoTime = task.replace(TIME, '').trim();
    if (taskNoTime.split(/\s+/).filter(Boolean).length >= 1 && !trailing) filled.task = task;
    if (TIME.test(m)) filled.time = 'set';
    return { intent: 'remind', filled, missing: present(filled, ['task', 'time']) };
  }

  // Flight — "book a flight from Lagos to London".
  if (has(/\bflights?\b|\bfly\b/i, m) && has(/\b(book|find|search|get|need|want|look up)\b/i, m)) {
    const filled: Record<string, string> = {};
    const route = m.match(/\bfrom\s+([A-Za-z][A-Za-z .'-]+?)\s+to\s+([A-Za-z][A-Za-z .'-]+)/i);
    if (route) { filled.from = route[1].trim(); filled.to = route[2].trim(); }
    else { const to = m.match(/\bto\s+([A-Za-z][A-Za-z .'-]+)/i); if (to && !TRAIL.test(to[0])) filled.to = to[1].trim(); }
    return { intent: 'flight', filled, missing: present(filled, ['from', 'to']) };
  }

  return null;
}

/** Is this a recognized command that's clearly still missing a required slot? Then ORB should ask. */
export function needsClarification(p: Prediction | null): p is Prediction {
  return !!p && p.missing.length > 0;
}

/** The natural, specific question for what's still missing — short, so the open mic catches the reply. */
export function nextPrompt(p: Prediction): string {
  const miss = p.missing;
  switch (p.intent) {
    case 'meeting':
      if (miss.includes('person') && miss.includes('time')) return 'Sure — who with, and when?';
      if (miss.includes('person')) return 'Who should the meeting be with?';
      return 'What day and time?';
    case 'call':
      return 'Who should I call?';
    case 'remind':
      if (miss.includes('task') && miss.includes('time')) return 'What should I remind you about, and when?';
      if (miss.includes('task')) return 'What should I remind you about?';
      return 'When should I remind you?';
    case 'flight':
      if (miss.includes('from') && miss.includes('to')) return 'Flying from where to where?';
      if (miss.includes('from')) return 'Where are you flying from?';
      return 'Where are you flying to?';
  }
}
