# Setting up EBE's AI keys (the council)

EBE ORB's Multi-Model Council uses up to **three AI providers**. Add the ones you want — any
missing provider degrades gracefully (that brain returns a labelled placeholder instead of
breaking the council).

| Env var | Powers | Console |
|---|---|---|
| `OPENAI_API_KEY` | GPT-Executive, GPT-Operations, GPT-Risk, ORB-Finalizer | https://platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | Claude-Evaluator | https://console.anthropic.com/settings/keys |
| `GEMINI_API_KEY` | Gemini-VisualVerifier | https://aistudio.google.com/apikey |

## Step 1 — create your env file
```bash
cd EBE-ORB
cp apps/api/.env.example apps/api/.env
```
`apps/api/.env` is git-ignored, so your keys are never committed.

## Step 2 — get each key
1. **OpenAI** — https://platform.openai.com/api-keys → *Create new secret key* → copy (`sk-...`).
   Make sure billing is enabled (Settings → Billing).
2. **Anthropic (Claude)** — https://console.anthropic.com/settings/keys → *Create Key* → copy
   (`sk-ant-...`). Add credit under *Billing* (Plans & Billing).
3. **Gemini (Google)** — https://aistudio.google.com/apikey → *Create API key* → copy. Free tier available.

## Step 3 — paste into `apps/api/.env`
```bash
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GEMINI_API_KEY=your-gemini-key
```

## Step 4 — restart & verify
```bash
npm install        # first time only
npm run dev:api    # http://localhost:8080
```
Check which brains are live:
```bash
curl -s localhost:8080/api/orb/council | python3 -m json.tool
```
Every member with a detected key shows `"configured": true`. In the web app, the COUNCIL list
reflects the same live status. Then ask EBE anything — `POST /api/orb/ask` runs the full council.

## Optional model overrides
Pin specific models per role in `.env`:
```bash
ORB_EXECUTIVE_MODEL=gpt-4.1
ORB_OPERATIONS_MODEL=gpt-4.1-mini
ORB_RISK_MODEL=gpt-4.1-mini
ORB_EVALUATOR_MODEL=claude-opus-4-8
ORB_VISUAL_MODEL=gemini-2.5-flash
ORB_FINALIZER_MODEL=gpt-4.1
```

## Troubleshooting
- **`configured: false`** after adding a key → restart the API (env is read at boot) and confirm
  the line is in `apps/api/.env` (not the repo root).
- **401 / quota errors** in the council output's `note` field → the key is wrong or the account
  has no credit/billing.
- **Keys safe?** Yes — `.env` is git-ignored. Never paste keys into chat, code, or commits.

> Security: each provider's key is only sent to that provider. The genome's risk gate and the
> confirm-first approval queue stay in plain code — the AIs advise, they never get the wheel.
