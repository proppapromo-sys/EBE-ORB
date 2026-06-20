/**
 * journalStore.ts — the genome's record (law 4), made durable.
 *
 * The Journal is ORB's TruthMeter substrate: every decision and outcome is written here so
 * trust can be earned on the record and compound across days. When Supabase is configured we
 * persist to `orb_journal`; otherwise the Journal falls back to in-memory so the loop still
 * runs (and learns within the process) with zero setup.
 */
import { supabase } from './supabase.js';
import { Journal, type JournalRecord, type JournalSink } from '../genome/genome.js';

const TABLE = 'orb_journal';

class SupabaseJournalSink implements JournalSink {
  constructor(private userKey: string) {}

  async append(record: JournalRecord): Promise<void> {
    if (!supabase) return;
    await supabase.from(TABLE).insert({
      user_key: this.userKey,
      branch: record.branch ?? 'orb',
      kind: record.kind,
      item_id: record.id ?? null,
      name: record.name ?? null,
      category: record.category ?? null,
      stake: record.stake ?? null,
      edge: record.edge ?? null,
      score: record.score ?? null,
      patterns: record.patterns ?? [],
      ts: record.ts ?? Date.now() / 1000
    });
  }

  async read(): Promise<JournalRecord[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_key', this.userKey)
      .order('ts', { ascending: true });
    if (error || !data) return [];
    return data.map((r) => ({
      ts: Number(r.ts),
      kind: r.kind as JournalRecord['kind'],
      branch: r.branch ?? undefined,
      id: r.item_id ?? undefined,
      name: r.name ?? undefined,
      category: r.category ?? undefined,
      stake: r.stake ?? undefined,
      edge: r.edge ?? undefined,
      score: r.score ?? undefined,
      patterns: Array.isArray(r.patterns) ? r.patterns : []
    }));
  }
}

/**
 * Process-level in-memory sink so the learning loop still compounds across requests when
 * Supabase isn't configured (dev / demo). Lost on restart — that's the trade for zero setup.
 */
const memStore = new Map<string, JournalRecord[]>();

class MemoryJournalSink implements JournalSink {
  constructor(private userKey: string) {}
  append(record: JournalRecord): void {
    const list = memStore.get(this.userKey) ?? [];
    list.push(record);
    memStore.set(this.userKey, list);
  }
  read(): JournalRecord[] {
    return memStore.get(this.userKey) ?? [];
  }
}

/** A Journal for this user — durable when Supabase is configured, process-memory otherwise. */
export function createJournal(userKey: string): Journal {
  return new Journal(supabase ? new SupabaseJournalSink(userKey) : new MemoryJournalSink(userKey));
}

/** True when journal writes will actually persist beyond the process. */
export const journalIsDurable = Boolean(supabase);
