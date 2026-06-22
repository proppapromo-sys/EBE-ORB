# ORB — Master Build Breakdown
**Tiers · Subscriptions · Sign-in/Sign-up · Monetization Monitoring**

This is the single reference for how ORB makes money and onboards users. Three parts:
1. The Tier System (what each plan is + unlocks)
2. Subscriptions (defaults, billing, lifecycle)
3. Sign-in / Sign-up front screen (all invite + auth methods)
4. Monetization monitoring (how you watch the money)

---

## 1) THE TIER SYSTEM

Six tiers. Charge by *how much of their life/business ORB runs* — not by "messages." Every paid
capability scales on the same dial (the council's escalation cap), so higher tier = more brains,
bigger builds, more features.

| Tier | Price | Council depth | Build power | Video | Integrations |
|---|---|---|---|---|---|
| **Free** | $0/mo | standard (1–2 brains) | 1-page mockup (1 file) | — | limited |
| **Personal** | $19.99/mo | important | single-page site (3 files) | — | core |
| **Pro** | $49.99/mo | high | multi-page + small app (10 files, review) | — | all |
| **Entrepreneur** | $99/mo | high | business site / dashboard / store (18 files) | — | all |
| **Executive** | $249/mo | critical (full council) | deploy-ready builds (30 files) | ✅ Runway/Veo | all |
| **Enterprise** | $499–$2,500+/mo | critical | everything + mobile + auto-deploy (60 files) | ✅ | all |

### What each tier includes (sold as outcomes)
- **Free** — Basic chat, notes, tasks, reminders, limited memory, daily briefing.
- **Personal** — Calendar, Gmail, contacts, memory, daily briefing, tasks, voice assistant.
- **Pro** — Multiple AI models, finance tracking, investments, travel, smart home, advanced memory, custom workflows.
- **Entrepreneur** — Personal + Business ORB, dashboards, CRM, QuickBooks, team management, reporting.
- **Executive** — Full multi-AI council (GPT + Claude + Gemini), advanced analytics, AI video, unlimited integrations, BI, workflow automation.
- **Enterprise** — Multiple users, departmental ORBs, custom AI agents, custom integrations, API access, white-label, auto-deploy.

### The dial (how tier maps to power, in code)
- `maxCouncil` — caps how many brains a request may convene (cost control).
- `buildCapability` — depth / max files / can-deploy per plan.
- `videoAllowedFor` — Executive + Enterprise only (priciest call).
- **Owner override** — the main account (`ORB_OWNER_EMAILS`) is always Enterprise-level, never billed.

---

## 2) SUBSCRIPTIONS

### Defaults
- **Everyone starts on Free.** No card required to sign up.
- **Plan is stored per user** (`planStore` → Supabase, falls back to in-memory).
- **Owner = Enterprise**, always, free.

### Billing (Stripe)
- **Monthly recurring**, one Stripe Price per paid tier.
- Hosted **Stripe Checkout** (no card data touches our servers).
- **Upgrade:** Plans tab → Upgrade → Stripe Checkout → on success, webhook sets the user's tier.
- **Cancel/downgrade:** `customer.subscription.deleted` webhook → user drops to Free.

### Lifecycle (what happens when)
| Event | Result |
|---|---|
| Sign up | Free tier, instant access |
| Click Upgrade | Redirect to Stripe Checkout for that tier |
| Payment succeeds | Webhook → tier set → features unlock immediately |
| Subscription canceled | Webhook → back to Free |
| Owner logs in | Full Enterprise, no charge |

### Recommended additions (not yet built)
- **Free trial** (e.g. 7 days of Pro) — set `trial_period_days` on the Checkout session.
- **Annual pricing** (2 months free) — add annual Prices per tier.
- **Proration** on upgrade/downgrade — Stripe handles automatically with subscription updates.

---

## 3) SIGN-IN / SIGN-UP — the front pop-up screen

The first thing a new user sees: a clean **"Join ORB"** pop-up. Goal = lowest-friction signup,
then route to Free and offer upgrade.

### Auth methods to offer (all)
1. **Continue with Google** (one tap) — built (`/oauth/google`).
2. **Continue with Apple** — *required by Apple* if you offer other social logins in the iOS app.
3. **Email** — magic-link or email+password.
4. **Phone / SMS** — optional, great for mobile.

### The pop-up (what it shows)
- ORB logo + one-line promise ("Your AI chief of staff.")
- The buttons above (Google / Apple / Email / Phone)
- "Explore first →" (skip into a demo, convert later)
- Tiny print: terms + privacy

### Invite / growth methods
- **Invite by email** — owner/users send an invite link.
- **Referral links** — unique per user; reward both sides (e.g. a month of Pro).
- **Shareable demo** — "try ORB" link that drops into demo mode.
- **Team invites (Entrepreneur/Enterprise)** — owner adds seats; each gets their own login.

### Current state
- A "JOIN ORB" pop-up already exists (email + Google).
- **To build:** Apple sign-in, phone, magic-link, referral/invite system, team seats.

---

## 4) MONETIZATION MONITORING — how you watch the money

Two layers: **Stripe's own dashboard** (instant, zero build) + an **in-app owner Admin** (ORB-native).

### A) Stripe Dashboard (already gives you, free)
- **MRR** (monthly recurring revenue) + growth
- **Active subscriptions** + by plan
- **Churn** (cancellations) + churn rate
- **Failed payments / dunning**
- **Revenue, payouts, taxes**

### B) In-app Owner Admin (to build — owner-only)
A dashboard inside ORB so you never leave the app:
- **Live counts:** users per tier (Free / Personal / Pro / …)
- **MRR** = Σ(active subs × tier price) + **ARR** (×12)
- **Conversion:** Free → paid %, and trial → paid %
- **Churn:** cancellations / period
- **ARPU** (avg revenue per user), **LTV** (ARPU ÷ churn)
- **Top tier mix** (which plans earn most)
- **Recent events feed:** upgrades, cancels, new signups

### Metrics that matter (the scoreboard)
| Metric | Why |
|---|---|
| MRR / ARR | The headline number |
| Active subs by tier | Where the money is |
| Free→Paid conversion | Is the funnel working |
| Churn rate | Are you leaking customers |
| ARPU / LTV | What a customer is worth |
| Trial conversion | Is the trial earning its keep |

### Data plumbing (how it's tracked)
- Source of truth: **Stripe** (subscriptions/invoices) + **planStore** (who's on what).
- Webhooks already handled: `checkout.session.completed`, `customer.subscription.deleted`.
- **To build:** an owner-only `/api/orb/admin/metrics` endpoint that aggregates plan counts + Stripe
  data into the numbers above, and an **Admin** tab in the app to display them.

---

## BUILD ORDER (suggested)
1. ✅ Tiers + capabilities + Stripe checkout/webhook + Plans UI — **done**
2. **Sign-in front screen** upgrade — Apple + email magic-link + referral/invite
3. **Owner Admin dashboard** — MRR, subs by tier, churn, conversion
4. **Free trial + annual pricing** — Stripe trial days + annual Prices
5. **Team seats** — Entrepreneur/Enterprise multi-user

> Owner-only everywhere it matters: Admin metrics and any money/settings screens check `isOwner`.
