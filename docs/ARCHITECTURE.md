# EBE ORB — Architecture & Build Dynamics

How ORB is built **on** the Universal Genome. Read [UNIVERSAL_GENOME.md](UNIVERSAL_GENOME.md)
first for the framework; this document is the build map for *this* organism.

## One organism, many cells

```
                    ┌──────────────────────── THE MACHINE (loop) ────────────────────────┐
 connectors ──▶ 👂 EARS ──▶ 🧠 BRAIN ──▶ 👁️ EYES ──▶ ❤️ HEART ──▶ ✋ HANDS ──▶ 🩸 TRUTH
 (signals)      OrbFeed     OrbEdge       OrbEyes      OrbRisk       OrbHands      Journal
                            edge gate     veto/confirm  size+cap      dry-run       learns
                    └──────────────────────── runOrbCycle() ─────────────────────────────┘
```

Each connector contributes **candidate signals** (the EARS). The genome scores each signal's
edge (ORB's attention number vs the ambient-noise baseline), lets the Eyes veto proven-bad or
confirm proven-good patterns, sizes it through the risk gate, and produces a **prioritized,
risk-gated action list**. Nothing executes until approved.

## The flow, concretely

1. **`OrbFeed.candidates()`** asks every connector for `signals(userId)` → a flat list of
   `OrbSignal`s. A failing connector is skipped, never fatal (resilience).
2. **`OrbEdge`** computes `edge = mine − fair`:
   - `mine` = `clamp01(0.5·urgency + 0.5·impact − 0.25·effort) · confidence` — ORB's number.
   - `fair` = the signal's `baseline` (default `0.35`) — the world's number / ambient noise.
   - **Law 2:** no edge above `minEdge` → no action.
3. **`OrbEyes`** (LearningEyes) detects domain patterns (`domain:*`, `urgent`, `high-risk`,
   `low-confidence`). A pattern only votes once it has **graduated** on the Journal (trust ≥ 0.55).
4. **`OrbRisk`** gates and sizes: ¼-Kelly of bankroll, capped per action, behind a shared
   `Portfolio` exposure cap, with a daily stop and kill-switch. **Law 1 + Law 5.**
5. **`signalToAction`** turns each cleared ticket into an `OrbAction` whose `requiresApproval`
   is decided by `riskLevel` — never by the model.
6. **`Journal`** records every decision; outcomes you feed back become `categoryTrust` /
   `patternTrust`, so proven lanes climb next cycle. **Laws 3 & 4 — the compounding edge.**

## Where the code lives

| Concern | File |
|---|---|
| Genome core (organs, Machine, Journal, trust) | `apps/api/src/genome/genome.ts` |
| ORB's cells (Feed/Edge/Risk/Eyes/Hands + `runOrbCycle`) | `apps/api/src/genome/orbBranch.ts` |
| End-to-end learning proof | `apps/api/src/genome/demo.ts` |
| Connector contract + signal type | `apps/api/src/types/orb.ts` |
| Connectors (the EARS) | `apps/api/src/connectors/*.ts` |
| Master agent (five laws in the prompt, briefing) | `apps/api/src/agents/masterAgent.ts` |
| HTTP surface | `apps/api/src/routes/orb.ts` |

## Why a TypeScript port of a Python genome?

The canonical seed is `seed/universal_genome.py` and the full reference engine ships in
`EBENEWEST.bundle` (EBE Command). ORB is a TypeScript service, so `genome.ts` is a **faithful
port** — same five laws, same organs, same `Risk.gate` math (¼-Kelly, caps, daily stop,
kill-switch), same shrunk `pattern_trust` / `category_trust`. Both engines share one soul, so a
lesson learned in one domain reads the same in another.

## AI in the genome, never driving it

When `OPENAI_API_KEY` is set, the model writes the briefing narrative and answers `ask`, always
**grounded in the cycle's already-gated actions**. The caps, the approval gate, and the
kill-switch stay in plain code. The Brain proposes; the Heart disposes.

## Persistence & the compounding loop (shipped)

- **`apps/api/src/services/journalStore.ts`** — the Journal sink. Supabase-backed
  (`orb_journal`) when configured, process-memory otherwise. `runOrbCycle` reads the history
  each cycle, turns it into `patternTrust`/`categoryTrust`, and feeds graduated patterns back
  into `OrbEyes` — so proven lanes vote next time. Record results with `POST /api/orb/outcome`.
- **`apps/api/src/services/actionStore.ts`** — the confirm-first action queue
  (`orb_action_queue`). Low-risk actions auto-approve; medium/high wait. `executeAction`
  refuses anything not `approved` and routes it back through the raising connector
  (dry-run unless `live=true`).

Run `sql/schema.sql` against your Supabase project to make both durable across restarts.

## Roadmap (next)

1. **Real connectors** — replace sample `signals()` with live OAuth/API pulls; wire `execute()`
   to real actuators behind the approval gate.
2. **Always-on** — add `runForever` + supervisor/watchdog for a self-healing ORB.
3. **Mobile** — Expo app: Home Briefing, Approvals, Connectors, Ask ORB.
4. **Daily briefing persistence** — write each briefing to `daily_briefings` for history.
