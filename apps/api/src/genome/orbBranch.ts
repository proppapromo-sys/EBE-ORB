/**
 * orbBranch.ts — ORB as one organism of the Universal Genome.
 *
 * ORB is not a chatbot; it is a risk-first operating system. Here we snap the genome's
 * seven organs onto ORB's domain:
 *
 *   👂 EARS   — every connector's signals become candidate Items.
 *   🧠 BRAIN  — OrbEdge: ORB's attention score (mine) vs the ambient-noise baseline (fair).
 *   ❤️ HEART  — OrbRisk: confirm-first gate; risk level decides approval, not the model.
 *   ✋ HANDS  — OrbHands: dry-run by default; high-risk actions queue for owner approval.
 *   👁️ EYES   — LearningEyes that graduate domain patterns only once proven on the record.
 *   🩸 TRUTH  — the Journal grades each surfaced action forward.
 *
 * Same loop as EBE Command's sourcing/pricing/inventory branches — different cells.
 */
import {
  type DataFeed,
  type EdgeModel,
  type Execution,
  type Item,
  type Pattern,
  LearningEyes,
  Risk,
  Machine,
  Journal,
  Portfolio,
  patternTrust,
  categoryTrust,
} from './genome.js';
import type { OrbConnector, OrbAction, RiskLevel, OrbDomain } from '../types/orb.js';

/** An ORB signal — a thing competing for the owner's attention. */
export type OrbSignal = Item & {
  domain: OrbDomain;
  riskLevel: RiskLevel;
  urgency: number; // 0..1
  impact: number; // 0..1 (estimated $ / strategic weight)
  effort: number; // 0..1 (cost to act)
  confidence: number; // 0..1 (how sure ORB is)
  baseline?: number; // the ambient-noise threshold this must beat
  toolName?: string;
  connector?: string;
};

// ── 👂 EARS — connectors feed candidate signals ─────────────────────────────
export class OrbFeed implements DataFeed {
  constructor(
    private connectors: OrbConnector[],
    private userId: string
  ) {}

  async candidates(): Promise<Item[]> {
    const all: Item[] = [];
    for (const c of this.connectors) {
      if (typeof c.signals !== 'function') continue;
      try {
        const sigs = await c.signals(this.userId);
        for (const s of sigs) all.push({ ...s, connector: c.name });
      } catch {
        // a single connector failing must never break the loop (resilience)
      }
    }
    return all;
  }
}

// ── 🧠 BRAIN — ORB's number vs the world's ──────────────────────────────────
export class OrbEdge implements EdgeModel {
  /** The world's number: the ambient-noise baseline a signal must beat to be worth attention. */
  fair(item: Item): number {
    const s = item as OrbSignal;
    return s.baseline ?? 0.35;
  }

  /** ORB's number: a confidence-weighted attention score (urgency + impact, less effort). */
  mine(item: Item): number {
    const s = item as OrbSignal;
    const raw = 0.5 * s.urgency + 0.5 * s.impact - 0.25 * s.effort;
    return clamp01(raw) * clamp01(s.confidence);
  }
}

// ── ❤️ HEART — confirm-first risk gate ──────────────────────────────────────
export class OrbRisk extends Risk {
  /** Kelly proxy: commit in proportion to confident impact; the cap and stop still rule. */
  kelly(item: Item): number {
    const s = item as OrbSignal;
    return clamp01(s.impact) * clamp01(s.confidence);
  }
}

// ── 👁️ EYES — domain pattern recognition that graduates on the record ───────
export class OrbEyes extends LearningEyes {
  detect(item: Item): Pattern[] {
    const s = item as OrbSignal;
    const out: Pattern[] = [];
    out.push({ name: `domain:${s.domain}`, dir: 1 });
    if (s.urgency >= 0.8) out.push({ name: 'urgent', dir: 1 });
    if (s.riskLevel === 'high') out.push({ name: 'high-risk', dir: -1 });
    if (s.confidence < 0.3) out.push({ name: 'low-confidence', dir: -1 });
    return out;
  }
}

// ── ✋ HANDS — confirm-first execution (dry-run by default) ──────────────────
export class OrbHands implements Execution {
  placed: { item: Item; stake: number; live: boolean }[] = [];
  place(item: Item, stake: number, live = false) {
    const rec = { item, stake, live };
    this.placed.push(rec);
    return rec;
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Turn a cleared signal into an ORB action — risk level decides approval, never the model. */
export function signalToAction(s: OrbSignal, stake: number, edge: number, confirm: string[]): OrbAction {
  return {
    title: String(s.name ?? s.id),
    description: `${(s.description as string) ?? ''}`.trim() || `Surfaced by ${s.connector ?? 'orb'}.`,
    domain: s.domain,
    riskLevel: s.riskLevel,
    requiresApproval: s.riskLevel !== 'low',
    toolName: s.toolName,
    payload: {
      connector: s.connector,
      stake,
      edge: Number(edge.toFixed(4)),
      confirmedPatterns: confirm,
      urgency: s.urgency,
      impact: s.impact,
      confidence: s.confidence,
    },
  };
}

export type OrbCycleReport = {
  generatedAt: string;
  bankroll: number;
  committed: number;
  actions: OrbAction[];
  vetoed: { id: string; patterns: string[] }[];
  passed: { id: string; reason: string }[];
  dropped: { id: string; reason: string }[];
  /** Learned trust read off the record this cycle (laws 3 & 4) — proven lanes climb. */
  learnedCategoryTrust: Record<string, number>;
  learnedPatternTrust: Record<string, number>;
};

/**
 * Run one ORB genome cycle: connectors → edge gate → eyes → risk → confirm-first actions.
 * Dry-run by default. Returns a prioritized, risk-gated action list the owner can approve.
 */
export async function runOrbCycle(
  connectors: OrbConnector[],
  userId: string,
  opts: { bankroll?: number; minEdge?: number; journal?: Journal; trustTable?: Record<string, number> } = {}
): Promise<OrbCycleReport> {
  const portfolio = new Portfolio(opts.bankroll ?? 100);
  const risk = new OrbRisk({
    bankroll: opts.bankroll ?? 100,
    minEdge: opts.minEdge ?? 0.05,
    maxPer: 0.2,
    dailyStop: 0.25,
    portfolio,
  });

  // Law 4: earn trust on the record. Read history → graduated patterns start voting this cycle.
  const history = opts.journal ? await opts.journal.read() : [];
  const learnedPattern = patternTrust(history);
  const learnedCategory = categoryTrust(history);
  const trustTable = opts.trustTable ?? learnedPattern;

  const machine = new Machine({
    feed: new OrbFeed(connectors, userId),
    edge: new OrbEdge(),
    risk,
    eyes: new OrbEyes(trustTable),
    exe: new OrbHands(),
    name: 'orb',
    journal: opts.journal,
  });

  const result = await machine.cycle();
  // Highest edge first — the most decision-worthy signals rise to the top.
  result.tickets.sort((a, b) => b.edge - a.edge);
  const actions = result.tickets.map((t) =>
    signalToAction(t.item as OrbSignal, t.stake, t.edge, t.confirm)
  );

  return {
    generatedAt: new Date().toISOString(),
    bankroll: risk.bankroll,
    committed: portfolio.committed,
    actions,
    vetoed: result.vetoed,
    passed: result.passed,
    dropped: result.dropped,
    learnedCategoryTrust: round2(learnedCategory),
    learnedPatternTrust: round2(learnedPattern),
  };
}

function round2(table: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(table).map(([k, v]) => [k, Math.round(v * 100) / 100]));
}
