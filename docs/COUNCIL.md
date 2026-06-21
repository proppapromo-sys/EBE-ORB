# ORB Multi-Model Council

ORB orchestrates several AI models as one **council** — each a specialized brain/layer — and
fuses their work into a single clean answer. It is built **inside** the Universal Genome: the
council reasons, challenges, evaluates and confirms, but the genome's **code-level risk gate**
and **confirm-first approval queue** remain the only things that can release a high-risk action.

> The Brain proposes; the Heart disposes. No brain — and no number of agreeing brains — can
> approve or execute on its own. (Genome laws 1 & 5.)

## The roster

| Stage | Member | Provider · model | Job |
|---|---|---|---|
| 1 | **GPT-Executive** | openai · `gpt-4.1` | first reasoning pass — strategy, what matters & why |
| 2 | **GPT-Operations** | openai · `gpt-4.1-mini` | execution plan — steps, owners, tools, calendar/tasks |
| 3 | **GPT-Risk** | openai · `gpt-4.1-mini` | challenges the answer — mistakes, conflicts, law violations (advisory flags only) |
| 4 | **Claude-Evaluator** | anthropic · `claude-opus-4-8` | deep review + long-document understanding, quality rating |
| 5 | **Gemini-VisualVerifier** | gemini · `gemini-2.5-flash` | graphics/screenshots/charts, multimodal + final agreement check |
| 6 | **ORB-Finalizer** | openai · `gpt-4.1` | combines the whole council into one clean, owner-ready response |

Models are overridable per role via env (`ORB_EXECUTIVE_MODEL`, `ORB_EVALUATOR_MODEL`, …).

## The flow

```
            ┌──────────────── the Heart runs FIRST (code) ────────────────┐
 request ─▶ │  genome cycle → risk-gated actions + approvalRequired (code) │
            └──────────────────────────────┬──────────────────────────────┘
                                            ▼
   GPT-Executive ─▶ GPT-Operations ─▶ GPT-Risk ─▶ Claude-Evaluator ─▶ Gemini-VisualVerifier
        (reason)        (plan)        (challenge)      (review)            (confirm)
                                            ▼
                                     ORB-Finalizer  ─▶  one clean response
```

**Step 0 is the point.** `runOrbCycle` produces the authoritative, risk-gated action list and
`approvalRequired` **before** any model speaks. The council annotates that list; the Finalizer
writes the prose — but `approvalRequired` is computed in code and no brain can flip it.

## API

```bash
GET  /api/orb/council            # roster + which providers are configured
POST /api/orb/council            # run the full council
GET  /api/orb/council/history    # recent runs with full transcripts (ORB logs everything)
POST /api/orb/ask                # convenes the council by default ({"council":false} = single model)
```

Every council run (including council-mode `/ask`) is persisted: request, final answer, the
code-computed `approvalRequired`, the full per-brain transcript, and a cycle snapshot. Durable in
Supabase (`orb_council_runs`) when configured, process-memory otherwise. Each run returns a
`runId`; fetch history with `GET /api/orb/council/history?userId=…&limit=…`.

`/api/orb/ask` is wired straight to the council: a normal ask returns the ORB-Finalizer's clean
answer plus `approvalRequired`, `cycle`, the full `council` transcript, and `fullyConfigured`.
Send `{"council": false}` to fall back to a single-model reply.

```bash
curl -s -X POST localhost:8080/api/orb/council -H 'content-type: application/json' -d '{
  "userId": "demo-user",
  "request": "What needs my attention today and what should I approve?",
  "documents": "optional long text for Claude-Evaluator to review",
  "images": ["data:image/png;base64,...."]
}'
```

Response shape:

```jsonc
{
  "cycle": { "actions": [ ... ], "learnedCategoryTrust": { ... } },  // authoritative, code-gated
  "approvalRequired": { "count": 3, "titles": [ ... ] },             // computed in code
  "council": [ { "label": "GPT-Executive", "ok": true, "output": "..." }, ... ],
  "finalAnswer": "…ORB-Finalizer's single combined response…",
  "fullyConfigured": true
}
```

## Graceful degradation

Each provider client degrades to a clearly-labelled placeholder (`ok: false`) when its key is
missing, so the **whole council runs end-to-end before any key is wired** — the pipeline, the
ordering, and the code-level gate are all testable offline. `fullyConfigured` is true only when
every member ran against a live provider.

Configure providers in `apps/api/.env`:

```
OPENAI_API_KEY=...      # GPT-Executive, GPT-Operations, GPT-Risk, ORB-Finalizer
ANTHROPIC_API_KEY=...   # Claude-Evaluator
GEMINI_API_KEY=...      # Gemini-VisualVerifier
```

## Where the code lives

| Concern | File |
|---|---|
| Brain contracts (roles, request/response) | `apps/api/src/brains/types.ts` |
| Provider clients (OpenAI SDK, Anthropic + Gemini REST) | `apps/api/src/brains/providers.ts` |
| The roster + system prompts | `apps/api/src/brains/brains.ts` |
| The orchestrator (6-stage pipeline) | `apps/api/src/brains/council.ts` |
| HTTP surface | `apps/api/src/routes/orb.ts` |
