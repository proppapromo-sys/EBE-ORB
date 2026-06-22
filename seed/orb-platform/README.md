# ORB Platform — Universal Code

The whole ORB stack as **one mountable platform**. Same idea as `universal_genome.py` (copy a proven
skeleton into a new project), but for the *product* layer: AI brains, builder, voice, video, billing,
auth, and an owner admin — all behind one call.

```ts
import express from 'express';
import { mountOrb } from './platform.js';

const app = express();
mountOrb(app);          // ← the entire platform, under /api/orb
app.listen(8080);
```

That's it. Nothing is required to boot — every integration degrades gracefully until you give it a key.

## What you get (under `/api/orb`)
| Area | Endpoints | Notes |
|---|---|---|
| **Brains** | `POST /ask`, `POST /council` | Speed router (Gemini Flash → GPT → Claude) + full council on heavy tasks |
| **Build** | `POST /build`, `GET /build/blueprints` | Construct sites/apps from one brief, tier-gated |
| **Video** | `POST /video` | Runway Gen-4 + Google Veo, auto-pick |
| **Voice** | `POST /speak`, `/voice/clone`, `/voice/verify`, `GET /voice/status` | Cloned voice + speaker recognition (own engine or ElevenLabs) |
| **Billing** | `GET /billing/status`, `POST /billing/checkout`, `POST /billing/webhook` | Stripe, 6 tiers, trials, annual |
| **Admin** | `GET /admin/metrics` | MRR / ARR / conversion / users-per-tier (owner-only) |
| **Keys** | `GET/POST /settings/keys` | Set Stripe/voice/video/auth keys in-app (owner-only) |
| **Auth** | `GET /auth/methods`, `/auth/apple`, `/auth/phone/start`, `/auth/phone/verify`, `/oauth/google` | Apple, phone (SMS), Google, email |
| **Skills** | `GET /skills` | Capability registry; voice cloning/recognition are owner-only |

## The reusable modules (copy these with `platform.ts`)
```
routes/orb.ts            — all routes
platform.ts              — mountOrb(app)
billing/plans.ts         — the six tiers as data
build/                   — Universal Construction Genome (genome, blueprints, tiers, builder)
brains/                  — providers, council, router (speed), skills
services/
  planStore.ts           — user → tier (Supabase or memory) + owner override
  billing.ts             — Stripe (live keys, trials, annual)
  admin.ts               — monetization metrics
  platformKeys.ts        — owner key store (read live)
  auth.ts                — Apple + phone (SMS)
  tts.ts / voiceEngine.ts / veo.ts / runway.ts / video.ts — voice + video
```

## Configure (env **or** the in-app Keys panel)
- **Brains:** `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
- **Billing:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PUBLIC_BASE_URL`, `ORB_TRIAL_DAYS`,
  `STRIPE_PRICE_<TIER>` (+ `_ANNUAL`)
- **Voice:** `ORB_VOICE_ENGINE_URL` (own engine) or `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID`
- **Video:** `RUNWAY_API_KEY` and/or `GEMINI_API_KEY` (Veo)
- **Auth:** `APPLE_CLIENT_ID`, `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM`, Google OAuth
- **Persistence:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (run `supabase/schema.sql` once)
- **Owner:** `ORB_OWNER_EMAILS` (full access, never billed)

## The owner concept
One account runs the show. `isOwner(userId)` gates admin metrics, key management, and voice training,
and resolves to the top tier (never billed). Set `ORB_OWNER_EMAILS` per project.

## Persistence
Without Supabase, everything runs in-memory (fine for dev; resets on restart). With it, in-app keys,
tiers, and per-user data persist. The contract is just two core tables — `orb_platform_settings` and
`orb_user_plans` — plus optional feature tables (see `supabase/schema.sql`).

## Philosophy (same as the genome)
One skeleton, many products. Brains decide, the builder constructs, voice speaks, billing earns, and
the owner stays in control — drop it into any build and you start with all of it.
