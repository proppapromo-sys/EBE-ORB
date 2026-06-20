# 🧬 THE UNIVERSAL GENOME

The reusable skeleton behind **every** truth-driven machine. The EBE stock trader
and the betting engine are the *same organism* — only the cells differ. Implement
the seven organs for your domain and the `Machine` runs the identical risk-first,
forward-validated loop. **Build any software from truth.**

## The five laws (the DNA — never break them)
1. **Risk-first**, not prediction-first. Survive before you win.
2. **Edge = your number vs the world's number.** No edge → no action.
3. **Forward-validate before real stakes** (the truth-meter).
4. **Recognise + remember, don't predict.** Trust is earned on your own record.
5. **Confirm-first, never chase.** No revenge, no size-up on a streak.

## The seven organs (one interface, any domain)
| Organ | Role | Stocks | Betting | Your domain |
|---|---|---|---|---|
| 👂 **DataFeed** | truth enters | price/volume bars | odds + stats | _your inputs_ |
| 🧠 **EdgeModel** | your number vs the world's → edge gate | regime + gates | de-vig vs your prob | _your estimate_ |
| ❤️ **Risk** *(build first)* | sizing, caps, daily stop, kill-switch | 6%/pos, 3% stop | fractional Kelly | _your limits_ |
| ✋ **Execution** | confirm-first action (dry-run default) | bridge/MCP | bet placement | _your actuator_ |
| 👁️ **Eyes** | recognise → remember → learn → graduate | Cyclops patterns | angles | _your situations_ |
| 🩸 **TruthMeter** | FAST forward-validation | t-stat / fwd return | **CLV** | _your leading signal_ |
| 🔄 **Machine** | the loop + resilience | `run_forever` | `run_slate` | _same loop_ |

## The flow (identical everywhere)
```
DataFeed → EdgeModel (edge ≥ gate?) → Eyes (veto if proven-bad / confirm if proven-good)
        → Risk (Kelly stake · caps · daily stop · kill-switch) → Execution (confirm-first)
        → TruthMeter grades it forward → Eyes learn → patterns GRADUATE → the eyes guide the brain
```

## The Eyes, in full (the learning loop — what makes it *get smarter*)
1. **Detector** — name the situations present (deterministic, auditable).
2. **Memory** — log every detection + its outcome.
3. **Study** — backtest history → prior hit-rate per pattern.
4. **Learner** — blend prior + live forward results → living **trust** (building → confirming → diverging).
5. **DNA / kinship** — cluster items by behavioural genome; **kin share learning**.
6. **Graduation** — a pattern earns a confirm/veto **vote** only once forward-confirmed. Inert until proven.

## Resilience (the seamless body — so it never falls apart)
One always-on process, no fragile external chain:
- **`run_forever`** — own scheduler, own state, own dashboard. The loop never dies on a bad cycle.
- **supervisor** — relaunches it on crash/hang (heartbeat-watched).
- **watchdog** — alerts if it stalls.
- **clock** — one DST-correct time source.

## How to build a NEW machine (the whole recipe)
1. Subclass the six ABCs in `genome.py` for your domain (start with **Risk**).
2. `m = Machine(feed, edge, risk, eyes, exe, name="yours")`.
3. `m.cycle()` to test a pass; `m.run_forever()` to live.
4. Wrap it in supervisor/watchdog for self-healing.
5. **Paper/dry-run first.** Nothing graduates, nothing scales, until the TruthMeter proves it forward.

> Same soul in every domain: **knowledge is earned, not bestowed.** Build the heart
> first, prove the edge forward before real stakes, let the eyes learn on your own
> record, and never chase. That's the genome. Everything else is just cells.
