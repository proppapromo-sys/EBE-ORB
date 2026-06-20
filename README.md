# 🧬 EBE ORB

**ORB — your Digital Chief of Staff, built on the Universal Genome.**

ORB is the central intelligence layer that connects to every EBE platform and outside
system — EBE Venue OS, Amazon Seller, stocks/investments, calendar, Gmail, banking, tasks,
documents — observes them all, and turns the noise into a **prioritized, risk-gated action
list** you approve.

It is not a chatbot. It is a proactive operating system that observes, understands,
prioritizes, recommends, requests approval, executes approved actions, and logs everything —
and it runs on the same risk-first decision skeleton as every other EBE machine: the
**Universal Genome**.

> Same soul in every domain: **knowledge is earned, not bestowed.** Build the heart first,
> prove the edge forward before real stakes, let the eyes learn on your own record, never chase.

---

## The Universal Genome (structure & build dynamics)

EBE's stock trader, the betting engine, EBE Command's sourcing/pricing/inventory branches,
and ORB are the *same organism* — only the cells differ. Every one of them implements the
**seven organs** behind one interface and runs the identical risk-first loop.

The framework is documented and seeded in this repo so any new machine starts from it:

- **[docs/UNIVERSAL_GENOME.md](docs/UNIVERSAL_GENOME.md)** — the framework: five laws, seven organs, the flow.
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — how ORB maps onto the genome (the build dynamics).
- **[seed/universal_genome.py](seed/universal_genome.py)** — the canonical single-file seed (pure stdlib) + **[seed/SEED.md](seed/SEED.md)**.
- **[apps/api/src/genome/genome.ts](apps/api/src/genome/genome.ts)** — the faithful TypeScript port ORB runs on.
- **[EBENEWEST.bundle](EBENEWEST.bundle)** — the full Python *EBE Command* implementation (the reference bundle these dynamics come from). Clone it with `git clone EBENEWEST.bundle ebe-command`.

### The five laws (the DNA — never break them)
1. **Risk-first**, not prediction-first. Survive before you win.
2. **Edge = your number vs the world's number.** No edge → no action.
3. **Forward-validate before real stakes** (the truth-meter / journal).
4. **Recognise + remember, don't predict.** Trust is earned on your own record.
5. **Confirm-first, never chase.** No revenge, no size-up on a streak.

### The seven organs — ORB's cells
| Organ | Role | ORB's implementation |
|---|---|---|
| 👂 **DataFeed** | truth enters | every connector's `signals()` |
| 🧠 **EdgeModel** | your number vs the world's → edge gate | `OrbEdge` — attention score vs ambient-noise baseline |
| ❤️ **Risk** *(build first)* | sizing, caps, daily stop, kill-switch | `OrbRisk` — ¼-Kelly, portfolio cap, confirm-first |
| ✋ **Execution** | confirm-first action (dry-run default) | `OrbHands` → connector `execute()` after approval |
| 👁️ **Eyes** | recognise → remember → learn → graduate | `OrbEyes` (LearningEyes) — patterns graduate on the record |
| 🩸 **TruthMeter** | fast forward-validation | the `Journal` grades each surfaced action |
| 🔄 **Machine** | the loop + resilience | `runOrbCycle()` — one cycle across every connector |

---

## What's in this repo

```text
apps/api                 Backend API (Express + TypeScript)
apps/api/src/genome      ⭐ Universal Genome (TS port) + the ORB branch
apps/api/src/agents      Master ORB agent (the five laws in the system prompt)
apps/api/src/connectors  Universal connectors — each an EAR feeding the loop
apps/api/src/routes      API routes (health, cycle, briefing, ask, context)
apps/api/src/services    OpenAI + Supabase services
apps/mobile              Expo/React Native placeholder
packages/shared          Shared genome contracts across surfaces
sql/schema.sql           Supabase schema (connectors, memory, tasks, actions, briefings)
seed/                    The copy-me Universal Genome seed (Python)
docs/                    Framework + architecture documentation
EBENEWEST.bundle         The reference EBE Command implementation (git bundle)
```

## Setup

```bash
npm install
cp apps/api/.env.example apps/api/.env   # add OPENAI_API_KEY + Supabase keys when ready
npm run dev:api                          # http://localhost:8080
```

Build & prove the genome learns end-to-end (no keys needed):

```bash
npm run build:api
npm --workspace apps/api exec tsx src/genome/demo.ts
```

## Main endpoints

| Method | Path | What it does |
|---|---|---|
| `GET`  | `/api/orb/health` | liveness |
| `GET`  | `/api/orb/connectors` | list connected nervous-system nodes |
| `POST` | `/api/orb/cycle` | **run one genome cycle** → risk-gated, prioritized actions (persists to the Journal; `{"enqueue":true}` also queues them for approval) |
| `POST` | `/api/orb/outcome` | record what actually happened (`win`/`score`) — the compounding loop (laws 3 & 4) |
| `POST` | `/api/orb/briefing` | the morning briefing (cycle → human summary) |
| `POST` | `/api/orb/ask` | ask ORB — **convenes the full council by default**; `{"council":false}` for a single-model answer |
| `GET`  | `/api/orb/council` | the Multi-Model Council roster + which providers are configured |
| `POST` | `/api/orb/council` | **run the council** (6 brains → one clean answer) |
| `POST` | `/api/orb/context` | raw connector pull |
| `GET`  | `/api/orb/actions?status=pending` | the confirm-first approval queue |
| `POST` | `/api/orb/actions/:id/approve` | approve a queued action |
| `POST` | `/api/orb/actions/:id/reject` | reject a queued action |
| `POST` | `/api/orb/actions/:id/execute` | execute an **approved** action (dry-run unless `{"live":true}`) |
| `POST` | `/api/orb/connectors/:name/execute` | execute directly against a connector (confirm-first) |

The Journal and action queue persist to **Supabase** when `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
are set (run `sql/schema.sql`); otherwise they fall back to process memory so everything still
runs with zero setup. Trust earned via `/outcome` is read back into the next `/cycle` — proven
lanes climb above the 0.55 vote bar, duds sink.

```bash
curl -s -X POST localhost:8080/api/orb/cycle -H 'content-type: application/json' \
  -d '{"userId":"demo-user"}' | jq '.actions[] | {title, riskLevel, requiresApproval}'
```

## ORB Multi-Model Council

ORB orchestrates several AI models as one council and fuses their work into a single answer —
all **inside** the genome (the Brain proposes, the Heart disposes):

```
request → genome cycle (code-level risk gate, runs FIRST)
        → GPT-Executive → GPT-Operations → GPT-Risk → Claude-Evaluator
        → Gemini-VisualVerifier → ORB-Finalizer → one clean response
```

`approvalRequired` is computed in code from the cycle **before any model speaks** — no brain can
flip it. Each provider degrades gracefully when its key is missing, so the whole pipeline runs
offline. See **[docs/COUNCIL.md](docs/COUNCIL.md)**.

## Risk model (the genome's confirm-first gate, made concrete)

- **Low-risk** → can run automatically (reminders, drafts, summaries, flags).
- **Medium-risk** → needs confirmation (reschedule, staff messages, inventory edits).
- **High-risk** → needs owner approval (spend money, payroll, prices, orders, **trades**).

`requiresApproval` is set by risk level, never by the model — the Brain proposes, the Heart
disposes. Execution is **dry-run** until real APIs are wired and `live=true` is passed.

## Building a new machine from the genome
1. Copy `seed/universal_genome.py` (or the TS port) into your project.
2. Implement the organs for your domain — **start with Risk (the Heart).**
3. `Machine(feed, edge, risk, eyes, exe).cycle()` to test; `run_forever()` to live.
4. **Paper/dry-run first.** Nothing graduates or scales until the TruthMeter proves it forward.

## Next steps
1. Wire real OAuth/API integrations behind each connector's `signals()`/`execute()`.
2. Persist the Journal to Supabase (`orb_actions`, `daily_briefings`) so trust compounds across days.
3. Build the Expo mobile app (Home Briefing, Approvals, Connectors).
4. Add `run_forever` + supervisor/watchdog for an always-on ORB.
