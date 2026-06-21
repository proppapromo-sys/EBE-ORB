# ORB — Operating it (developer side)

ORB is built so the **software just comes running**. There are two kinds of configuration:

| | **Platform config (you, the developer — set ONCE)** | **User config (each customer — in the app)** |
|---|---|---|
| What | The 3 AI brains, the database, Google sign-in client | Their own business: Shopify, Stripe, connect their Gmail |
| Where | Environment variables on the host (or `apps/api/.env` locally) | The **Settings** tab inside ORB |
| Visible to users? | **No** — never shown. ORB is one chat; the brains are invisible. | Yes — it's their stuff |

Users never paste an AI key and never see which model is used. They only connect what's theirs.

---

## 1. The AI brains (baked in — developer side)
Set these as environment variables. ORB reads them at runtime; users never touch them.

```
OPENAI_API_KEY=sk-...        # ChatGPT brains
ANTHROPIC_API_KEY=sk-ant-... # Claude (the voice + deep review)
GEMINI_API_KEY=AIza...       # Google AI Studio — vision + images
```

## 2. Supabase (the database — so everything is remembered)
Without this, ORB still runs but forgets on restart. To make it permanent:

1. In Supabase → **SQL Editor** → paste the contents of [`supabase/schema.sql`](../supabase/schema.sql) → **Run**. (Creates every table ORB needs.)
2. Supabase → **Project Settings → API**, copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY`
3. Set both as env vars and restart. (The server uses the service-role key, so Row Level Security is intentionally off — only the trusted backend touches these tables.)

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # secret — never ships to the browser
```

## 3. Google sign-in (Gmail + Calendar — the "Google console code")
1. console.cloud.google.com → **APIs & Services → Credentials → Create OAuth client ID → Web application**.
2. **Authorized redirect URI** must exactly match your deployment:
   - Local: `http://localhost:8080/api/orb/oauth/google/callback`
   - Deployed: `https://YOUR-DOMAIN/api/orb/oauth/google/callback`
3. Enable **Gmail API** and **Google Calendar API** for the project.
4. Set:
```
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=....
GOOGLE_REDIRECT_URI=https://YOUR-DOMAIN/api/orb/oauth/google/callback
```

## 4. Optional platform features
```
GOOGLE_PLACES_API_KEY=...   # "good restaurants nearby" (Places API New)
RESEND_API_KEY=...          # ORB sends email (reservations, etc.)
EBE_FROM_EMAIL=orb@ebehq.com
EBE_REPLY_TO=you@gmail.com
```

---

## Where to put env vars
- **Deployed (Render):** Dashboard → your service → **Environment** → add each key → Save (it redeploys).
- **Local:** `apps/api/.env` (git-ignored). Restart after editing.

## Confirm it's wired
Open `https://YOUR-DOMAIN/api/orb/status` — you should see the AI providers `true`,
`persistence.supabase: true`, and `features.googleSignIn: true`.

## What the customer does (nothing technical)
Sign in → ORB greets them → they open **Settings** and connect **their** Shopify / Stripe,
and connect **their** Gmail with one click. That's it. The intelligence is already on.
