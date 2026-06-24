/**
 * lessons.ts — ORB's Wisdom Accumulation Engine (#35): converting experience into enduring lessons
 * that compound. Information can be stored and knowledge can be learned, but wisdom must be earned —
 * Experience + Reflection over Time. This is the REAL part of the layer: a per-user lessons-learned
 * repository. When the user reflects ("I learned that...", "note to self...", "next time...", "what
 * worked was...", "the lesson is..."), ORB extracts the durable lesson and stores it; later it recalls
 * the relevant ones so the same mistake isn't repeated and what works is carried forward.
 *
 * Separate from #10 wisdom.ts (the in-the-moment judgment directive). That reasons; this remembers.
 * Per-user, Supabase-backed (orb_lessons) with an in-memory fallback. Never throws. The parser and
 * the relevance ranking are pure and tested directly.
 */
import { supabase } from './supabase.js';

export type Lesson = { id: string; text: string; kind: 'worked' | 'failed' | 'principle'; created: number; reinforced: number };
const cache = new Map<string, Lesson[]>();
const MAX = 300;
function llist(userId: string): Lesson[] { let a = cache.get(userId); if (!a) { a = []; cache.set(userId, a); } return a; }

// Reflection cues that mark a sentence as a lesson worth keeping, mapped to capture groups.
const CUES: { re: RegExp; kind: Lesson['kind'] }[] = [
  { re: /\b(?:i|we) (?:learned|realized|discovered|figured out|found out)(?: that)?\s+(.+)/i, kind: 'principle' },
  { re: /\bnote to self[:,]?\s+(.+)/i, kind: 'principle' },
  { re: /\bthe (?:lesson|takeaway|moral)(?: here| from this)? (?:is|was)[:,]?\s+(.+)/i, kind: 'principle' },
  { re: /\blesson learned[:,]?\s+(.+)/i, kind: 'principle' },
  { re: /\bnext time[,]?\s+(?:i|we)?\s*(.+)/i, kind: 'principle' },
  { re: /\bwhat worked(?: was| is)?[:,]?\s+(.+)/i, kind: 'worked' },
  { re: /\b(?:what (?:went wrong|failed)|the mistake)(?: was| is)?[:,]?\s+(.+)/i, kind: 'failed' },
  { re: /\bi (?:should have|shouldn'?t have|wish i(?:'d| had))\s+(.+)/i, kind: 'failed' },
  { re: /\b(?:always|never) (?:remember to|forget to)?\s*(.+)/i, kind: 'principle' },
  { re: /\bremember (?:that |to )?(.+)/i, kind: 'principle' },
];

const STOP = new Set(['the', 'a', 'an', 'to', 'of', 'and', 'or', 'is', 'was', 'be', 'i', 'we', 'you', 'it', 'that', 'this', 'in', 'on', 'for', 'with', 'my', 'our', 'me', 'as', 'at', 'by', 'if', 'so', 'do', 'not', 'but', 'when', 'how', 'what', 'about', 'are', 'too', 'them', 'they', 'he', 'she']);
function keywords(text: string): Set<string> {
  return new Set((text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) || []).filter((w) => !STOP.has(w)));
}

/** Pure: pull a durable lesson out of a reflective message, or null if there's no reflection cue. Testable. */
export function parseLesson(text: string): { text: string; kind: Lesson['kind'] } | null {
  const t = (text || '').trim();
  for (const { re, kind } of CUES) {
    const m = t.match(re);
    if (m && m[1]) {
      let lesson = m[1].trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');
      // Keep just the first clause — the core lesson, not the whole rambling sentence.
      lesson = lesson.split(/[;]| - | because (?:of )?| which is | and that's why /i)[0].trim();
      if (lesson.length < 4 || lesson.length > 160) { if (lesson.length > 160) lesson = lesson.slice(0, 160).trim(); else continue; }
      return { text: lesson, kind };
    }
  }
  return null;
}

/** Pure: rank stored lessons by keyword overlap with a topic; reinforced lessons break ties. Testable. */
export function rankLessons(lessons: Lesson[], topic: string, n = 3): Lesson[] {
  const want = keywords(topic);
  const scored = lessons.map((l) => {
    const have = keywords(l.text);
    let overlap = 0; for (const w of want) if (have.has(w)) overlap++;
    return { l, score: overlap * 10 + l.reinforced };
  });
  // With a real topic, only return lessons that actually share a keyword; with none, return most-reinforced.
  const filtered = want.size ? scored.filter((s) => s.score >= 10) : scored;
  return filtered.sort((a, b) => b.score - a.score || b.l.created - a.l.created).slice(0, n).map((s) => s.l);
}

async function load(userId: string): Promise<Lesson[]> {
  const a = llist(userId);
  if (a.length || !supabase) return a;
  try {
    const { data } = await supabase.from('orb_lessons').select('id,text,kind,created,reinforced').eq('user_id', userId).order('created', { ascending: false }).limit(MAX);
    for (const r of (data ?? []).reverse()) a.push({ id: r.id, text: r.text, kind: r.kind, created: Date.parse(r.created) || Date.now(), reinforced: r.reinforced || 0 });
  } catch { /* in-memory */ }
  return a;
}

/** Capture a lesson if the message reflects one. Re-stating a known lesson reinforces it instead of duplicating. */
export async function recordLesson(userId: string, text: string): Promise<Lesson | null> {
  const parsed = parseLesson(text);
  if (!parsed) return null;
  const a = await load(userId);
  const norm = parsed.text.toLowerCase();
  const existing = a.find((l) => l.text.toLowerCase() === norm);
  if (existing) {
    existing.reinforced++;
    if (supabase) { try { await supabase.from('orb_lessons').update({ reinforced: existing.reinforced }).eq('user_id', userId).eq('id', existing.id); } catch { /* in-memory */ } }
    return existing;
  }
  const lesson: Lesson = { id: `l_${a.length}_${parsed.text.slice(0, 8).replace(/\W/g, '')}`, text: parsed.text, kind: parsed.kind, created: Date.now(), reinforced: 0 };
  a.push(lesson); if (a.length > MAX) a.splice(0, a.length - MAX);
  if (supabase) { try { await supabase.from('orb_lessons').insert({ user_id: userId, id: lesson.id, text: lesson.text, kind: lesson.kind, created: new Date(lesson.created).toISOString(), reinforced: 0 }); } catch { /* in-memory */ } }
  return lesson;
}

/** Recall the lessons most relevant to a topic (or the most-reinforced when no topic given). */
export async function recallLessons(userId: string, topic = '', n = 3): Promise<Lesson[]> {
  return rankLessons(await load(userId), topic, n);
}

export function formatLessons(lessons: Lesson[]): string {
  if (!lessons.length) return "I haven't gathered any lessons from you yet — when you reflect on what worked or what you'd do differently, I'll keep them and bring them back when they're relevant.";
  const tag = (k: Lesson['kind']) => k === 'worked' ? 'what worked' : k === 'failed' ? 'hard-won' : 'principle';
  return 'Lessons you\'ve earned that apply here:\n' + lessons.map((l) => `• ${l.text}${l.reinforced ? ` (you've come back to this ${l.reinforced + 1}×)` : ''} — ${tag(l.kind)}`).join('\n');
}

// "what have I learned about X", "lessons learned", "what do you know about my mistakes", "what should I remember"
export const LESSONS_QUERY = /\b(what (?:have|did) (?:i|we) learn(?:ed|t)?|lessons? (?:learned|so far)|what do you know about my (?:mistakes|patterns|history)|what should i remember|remind me what (?:i|we) learned|what'?s the lesson|past lessons|what keeps (?:happening|working|failing)|my (?:hard[- ]won )?lessons|principles? (?:i|we)'?ve (?:learned|earned)|wisdom (?:so far|i'?ve)|what (?:would|should) (?:i|we) do differently)\b/i;

// Framing for broader "turn this experience into a durable lesson" reasoning (when no stored lesson fits).
export const WISDOM_ACCUM_DIRECTIVE = ' Think in durable lessons, not just answers: where this connects to past experience, name the enduring principle worth carrying forward — what keeps working, what keeps failing, and the rule of thumb that would make the next decision better. Distinguish the one-off detail from the repeatable lesson, favor judgment that holds up over the long term over the quick win, and state the lesson plainly enough that it would still be useful a year from now.';
