/**
 * genome.ts — THE UNIVERSAL GENOME (TypeScript port).
 *
 * The reusable, risk-first decision skeleton behind every EBE machine. ORB is just
 * one more organism: connectors are its EARS, the edge model its BRAIN, the risk gate
 * its HEART, the connectors' execute() its HANDS, learning Eyes that graduate on the
 * record, and a Journal as the TruthMeter. Same loop, different cells.
 *
 * THE FIVE LAWS (the DNA — never break them):
 *   1. Risk-first, not prediction-first.            (survive before you win)
 *   2. Edge = your number vs the world's number.    (no edge -> no action)
 *   3. Forward-validate before real stakes.         (the journal / truth-meter)
 *   4. Recognise + remember, don't predict.         (trust is earned on your record)
 *   5. Confirm-first, never chase.                  (no revenge, no size-up on a streak)
 *
 * Ported faithfully from seed/universal_genome.py so the Python EBE Command engine and
 * the TypeScript ORB share one soul.
 */

/** A thing the machine could act on right now — each organ reads it. */
export type Item = {
  id: string;
  name?: string;
  category?: string;
  [key: string]: unknown;
};

// ── 👂 EARS — where truth enters ────────────────────────────────────────────
export interface DataFeed {
  /** The things you could act on right now — each an Item your organs read. */
  candidates(): Promise<Item[]> | Item[];
}

// ── 🧠 BRAIN — your estimate vs the world's; the edge gate ───────────────────
export interface EdgeModel {
  /** The world's fair estimate (de-vigged / consensus). */
  fair(item: Item): number;
  /** YOUR estimate. */
  mine(item: Item): number;
}

/** edge = mine - fair. The brain proposes; the heart disposes. */
export function edgeOf(model: EdgeModel, item: Item): number {
  return model.mine(item) - model.fair(item);
}

// ── 💰 PORTFOLIO — one exposure cap across ALL actions/branches ──────────────
export class Portfolio {
  cap: number;
  committed = 0;

  constructor(cap: number) {
    this.cap = cap;
  }

  get free(): number {
    return Math.max(0, this.cap - this.committed);
  }

  canCommit(stake: number): boolean {
    return stake <= this.free + 1e-9;
  }

  commit(stake: number): number {
    this.committed += stake;
    return this.committed;
  }
}

export type GateDecision = { ok: boolean; stake: number; reason: string };

// ── ❤️ HEART — risk. BUILD THIS ORGAN FIRST. ────────────────────────────────
export abstract class Risk {
  bankroll: number;
  minEdge: number; // the edge gate (your "regime ON")
  maxPer: number; // never risk more than this per action
  dailyStop: number; // halt the day past this loss
  dayPnl = 0;
  killed = false; // kill-switch
  portfolio?: Portfolio; // optional shared exposure cap

  constructor(opts: {
    bankroll: number;
    minEdge?: number;
    maxPer?: number;
    dailyStop?: number;
    portfolio?: Portfolio;
  }) {
    this.bankroll = opts.bankroll;
    this.minEdge = opts.minEdge ?? 0.02;
    this.maxPer = opts.maxPer ?? 0.02;
    this.dailyStop = opts.dailyStop ?? 0.1;
    this.portfolio = opts.portfolio;
  }

  /** Full-Kelly fraction of bankroll for this action (we apply a quarter of it). */
  abstract kelly(item: Item, edge: number): number;

  stake(item: Item, edge: number): number {
    const f = Math.max(0, Math.min(0.25 * this.kelly(item, edge), this.maxPer)); // ¼-Kelly, capped
    return Math.round(f * this.bankroll * 100) / 100;
  }

  /** Confirm-first decision — the heart can always VETO. */
  gate(item: Item, edge: number): GateDecision {
    if (this.killed) return { ok: false, stake: 0, reason: 'kill-switch active' };
    if (this.dayPnl < 0 && this.dayPnl <= -this.dailyStop * this.bankroll) {
      return { ok: false, stake: 0, reason: 'daily stop hit' };
    }
    if (edge < this.minEdge) {
      return {
        ok: false,
        stake: 0,
        reason: `no edge (${(edge * 100).toFixed(1)}% < ${(this.minEdge * 100).toFixed(1)}%)`,
      };
    }
    const s = this.stake(item, edge);
    if (s <= 0) return { ok: false, stake: 0, reason: 'size 0' };
    if (this.portfolio && !this.portfolio.canCommit(s)) {
      return { ok: false, stake: 0, reason: `portfolio cap (free ${this.portfolio.free.toFixed(2)})` };
    }
    if (this.portfolio) this.portfolio.commit(s);
    return { ok: true, stake: s, reason: `edge ${(edge * 100).toFixed(1)}% · stake ${s.toFixed(2)}` };
  }
}

// ── ✋ HANDS — confirm-first execution ───────────────────────────────────────
export interface Execution {
  /** Place the action (dry-run unless live). Log it — paper actions ARE the record. */
  place(item: Item, stake: number, live?: boolean): Promise<unknown> | unknown;
}

export type Pattern = { name: string; dir: 1 | -1 | 0 };

// ── 👁️ EYES — recognise + remember + learn ──────────────────────────────────
export abstract class Eyes {
  /** Named patterns present on this item. */
  abstract detect(item: Item): Pattern[];
  /** Blended prior + live-forward trust. ~0.5 until it's learned. */
  abstract trust(patternName: string): number;

  graduated(patternName: string, minTrust = 0.55): boolean {
    return this.trust(patternName) >= minTrust; // earns a vote only when proven
  }

  confirm(item: Item): string[] {
    return this.detect(item)
      .filter((p) => p.dir > 0 && this.graduated(p.name))
      .map((p) => p.name);
  }

  veto(item: Item): string[] {
    return this.detect(item)
      .filter((p) => p.dir < 0 && this.graduated(p.name))
      .map((p) => p.name);
  }
}

/** Start blind; grow sight later. */
export class BlindEyes extends Eyes {
  detect(): Pattern[] {
    return [];
  }
  trust(): number {
    return 0.5;
  }
}

/** trust() reads a table earned on the journal (laws 3 & 4). Subclass detect() for your domain. */
export class LearningEyes extends Eyes {
  trustTable: Record<string, number>;
  constructor(trustTable: Record<string, number> = {}) {
    super();
    this.trustTable = { ...trustTable };
  }
  trust(name: string): number {
    return this.trustTable[name] ?? 0.5;
  }
  detect(_item: Item): Pattern[] {
    return [];
  }
}

// ── 🩸 TRUTH-METER — the FAST forward-validation signal ──────────────────────
export interface TruthMeter {
  /** Did you beat the world's later estimate? >0 = real edge, proven fast. */
  score(placedAction: unknown): number;
}

// ── 👂 SANITY GATE — garbage never reaches the Brain ─────────────────────────
const NONNEG = ['price', 'cost', 'sell', 'stake', 'size', 'quantity'] as const;

export function saneItem(item: Item, nonneg: readonly string[] = NONNEG): string | null {
  for (const k of nonneg) {
    if (k in item) {
      const v = item[k];
      if (typeof v === 'boolean' || typeof v !== 'number') return `${k} not numeric`;
      if (!Number.isFinite(v) || v < 0) return `${k} invalid (${String(v)})`;
    }
  }
  if ('cost' in item && typeof item.cost === 'number' && item.cost <= 0) return 'cost must be > 0';
  return null;
}

// ── 📓 JOURNAL — the record (law 4). In-memory or pluggable sink. ────────────
export type JournalRecord = {
  ts?: number;
  kind: 'decision' | 'outcome';
  branch?: string;
  id?: string;
  name?: string;
  category?: string;
  stake?: number;
  edge?: number;
  score?: number;
  patterns?: string[];
};

export interface JournalSink {
  append(record: JournalRecord): Promise<void> | void;
  read(): Promise<JournalRecord[]> | JournalRecord[];
}

export class Journal {
  private mem: JournalRecord[] = [];
  private sink?: JournalSink;

  constructor(sink?: JournalSink) {
    this.sink = sink;
  }

  async append(record: JournalRecord): Promise<JournalRecord> {
    const rec: JournalRecord = { ts: Math.round(Date.now()) / 1000, ...record };
    if (this.sink) await this.sink.append(rec);
    else this.mem.push(rec);
    return rec;
  }

  recordDecision(branch: string, item: Item, stake: number, edge: number, patterns: string[] = []) {
    return this.append({
      kind: 'decision',
      branch,
      id: item.id,
      name: item.name,
      category: item.category,
      stake,
      edge,
      patterns: [...patterns],
    });
  }

  recordOutcome(branch: string, itemId: string, score: number, patterns: string[] = []) {
    return this.append({ kind: 'outcome', branch, id: itemId, score, patterns: [...patterns] });
  }

  async read(): Promise<JournalRecord[]> {
    if (this.sink) return [...(await this.sink.read())];
    return [...this.mem];
  }
}

/** Generic shrunk win-rate keyed by a decision field (pattern or category). */
function trustBy(
  records: JournalRecord[],
  field: 'patterns' | 'category',
  prior = 0.5,
  priorWeight = 10
): Record<string, number> {
  const byId: Record<string, string | string[] | undefined> = {};
  for (const r of records) {
    if (r.kind === 'decision' && r.id) byId[r.id] = field === 'patterns' ? r.patterns : r.category;
  }
  const wins: Record<string, number> = {};
  const total: Record<string, number> = {};
  for (const r of records) {
    if (r.kind !== 'outcome') continue;
    const win = (r.score ?? 0) > 0 ? 1 : 0;
    let keys: (string | undefined)[];
    if (field === 'patterns') {
      const fromRec = r.patterns;
      const fromDecision = r.id ? byId[r.id] : undefined;
      keys = (fromRec && fromRec.length ? fromRec : (fromDecision as string[]) || []) as string[];
    } else {
      const fromDecision = r.id ? byId[r.id] : undefined;
      keys = [r.category ?? (fromDecision as string | undefined)];
    }
    for (const k of keys) {
      if (!k) continue;
      wins[k] = (wins[k] ?? 0) + win;
      total[k] = (total[k] ?? 0) + 1;
    }
  }
  const out: Record<string, number> = {};
  for (const k of Object.keys(total)) {
    out[k] = (wins[k] + prior * priorWeight) / (total[k] + priorWeight);
  }
  return out;
}

/** Win-rate per PATTERN, shrunk toward 0.5 so a single lucky hit can't graduate. */
export function patternTrust(records: JournalRecord[], prior = 0.5, priorWeight = 10) {
  return trustBy(records, 'patterns', prior, priorWeight);
}

/** Win-rate per CATEGORY — the compounding edge: proven lanes climb, duds sink. */
export function categoryTrust(records: JournalRecord[], prior = 0.5, priorWeight = 6) {
  return trustBy(records, 'category', prior, priorWeight);
}

export type Ticket = { item: Item; stake: number; edge: number; confirm: string[] };

export type CycleResult = {
  tickets: Ticket[];
  dropped: { id: string; reason: string }[];
  vetoed: { id: string; patterns: string[] }[];
  passed: { id: string; reason: string }[];
};

// ── 🔄 THE MACHINE — the universal loop ──────────────────────────────────────
export class Machine {
  feed: DataFeed;
  edge: EdgeModel;
  risk: Risk;
  eyes: Eyes;
  exe: Execution;
  name: string;
  journal?: Journal;
  guard: (item: Item) => string | null;

  constructor(opts: {
    feed: DataFeed;
    edge: EdgeModel;
    risk: Risk;
    eyes: Eyes;
    exe: Execution;
    name?: string;
    journal?: Journal;
    guard?: (item: Item) => string | null;
  }) {
    this.feed = opts.feed;
    this.edge = opts.edge;
    this.risk = opts.risk;
    this.eyes = opts.eyes;
    this.exe = opts.exe;
    this.name = opts.name ?? 'machine';
    this.journal = opts.journal;
    this.guard = opts.guard ?? saneItem;
  }

  async cycle(place = false, live = false): Promise<CycleResult> {
    const result: CycleResult = { tickets: [], dropped: [], vetoed: [], passed: [] };
    const items = await this.feed.candidates();
    for (const item of items) {
      const id = item.id ?? '?';
      const bad = this.guard(item);
      if (bad) {
        result.dropped.push({ id, reason: bad });
        continue;
      }
      const e = edgeOf(this.edge, item);
      const veto = this.eyes.veto(item);
      if (veto.length) {
        result.vetoed.push({ id, patterns: veto });
        continue;
      }
      const gate = this.risk.gate(item, e);
      if (!gate.ok) {
        result.passed.push({ id, reason: gate.reason });
        continue;
      }
      const confirm = this.eyes.confirm(item);
      result.tickets.push({ item, stake: gate.stake, edge: e, confirm });
      if (this.journal) {
        await this.journal.recordDecision(
          this.name,
          item,
          gate.stake,
          e,
          this.eyes.detect(item).map((p) => p.name)
        );
      }
    }
    if (place) {
      for (const t of result.tickets) await this.exe.place(t.item, t.stake, live);
    }
    return result;
  }
}
