# Connect ORB to your real business

The shortest path from "the code exists" to "ORB is watching my business." ORB connects to live
systems **in the running app** (not in the code) — you authorize from your own accounts, secrets stay
in env vars or ORB's encrypted store, and nothing is ever pasted into chat or committed.

See [`DEPLOY.md`](./DEPLOY.md) for full hosting detail; this is the business-connection path.

## 1. Stand it up with a database
- Create a **Supabase** project. In its SQL editor, run all of [`../supabase/schema.sql`](../supabase/schema.sql)
  (creates every table, including `orb_business`, `orb_conversation`, `orb_insights`). Without Supabase
  ORB runs but forgets everything on restart — for a business you want it durable.
- Deploy via Render Blueprint (`render.yaml`): **New → Blueprint → this repo**. It creates the **web**
  service *and* the **ebe-orb-worker** cron (the eyes-and-ears scan, every 30 min).
- Minimum env vars: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  and `ORB_OWNER_EMAILS=you@email.com` (gives you full access **and** tells the worker to watch you).

## 2. Connect the systems ORB should watch
Open the live app → **CONNECT tab**.

| System | How | What ORB then sees |
|---|---|---|
| **Google Calendar + Gmail** | OAuth — click Connect, sign into your account | meetings (incl. soon/back-to-back) + important-unread backlog |
| **Stripe** | paste your own secret key (tested live, stored encrypted) | balance / payouts |
| **Shopify** | paste your store creds | orders / store |

**Google redirect URI (the usual gotcha):** in Google Cloud → OAuth client → Authorized redirect URIs,
add `https://<your-app>/api/orb/oauth/google/callback` **exactly**, and set the same value as
`GOOGLE_REDIRECT_URI`.

Systems not in the list yet (a support inbox, ad platform, inventory, a database)? Those need a
**connector built first** — tell me which and I'll add it, then it connects the same way.

## 3. Teach ORB the business
Open the **BUSINESS tab** (or just say it in chat: *"my business is …", "our priority is …",
"track …"*). From then on every answer is business-aware and ORB takes the operator stance.

## 4. Confirm it's watching
- Ask **"what do you see"** / **"what needs fixing"** → live scan → problems to act on.
- The worker surfaces issues on its own in the **"ORB NOTICED"** panel.

## The rule that never changes
ORB **sees** everything you connect and **proposes** every fix — but anything that changes the world
(sends, spends, posts, deletes) is **confirm-first**. You decide. That's the whole point: eyes and ears
you can trust, not an autopilot you can't.
