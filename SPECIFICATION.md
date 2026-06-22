# ORB — Universal Platform Specification

**v1.0 — Digital Chief of Staff Operating System.** This is the canonical spec. Code aligns to it.
Status legend: ✅ built · 🟡 partial · 📋 planned (integrate later).

## Mission
ORB (Operational Resource Brain) is a universal AI operating system — a **Digital Chief of Staff**.
Not a chatbot: an intelligence layer above all apps, data, AI models, and business systems. It
organizes life, manages work, coordinates operations, retrieves knowledge, automates workflows,
generates content, recommends, and **executes approved actions** (confirm-first, always).

## Universal Architecture
```
USER → ORB INTERFACE → ORB MASTER BRAIN
  → Memory · Voice · Agents · Integrations · Security
     → Email · Calendar · Files · CRM · Finance · E-Commerce · EBE
```

## AI Council (specialized intelligence, never one AI) — ✅
| Brain | Role | Status |
|---|---|---|
| GPT Executive | strategy, planning, conversation, decision support | ✅ |
| GPT Operations | task execution, workflow generation, PM | ✅ |
| GPT Risk | validation, error detection, risk analysis | ✅ |
| Claude Evaluation | long docs, contracts, research, deep review | ✅ |
| Gemini Visual | images, screenshots, multimodal | ✅ |
| ORB Finalizer | consensus, final recommendation, confidence | ✅ |
A **speed router** sends simple tasks to one fast model and only convenes the full council on heavy work.

## Core Modules
| Module | Includes | Status |
|---|---|---|
| **Personal ORB** | calendar, tasks, notes, reminders, Gmail, voice, files | 🟡 |
| **Business ORB** | CRM, dashboards, KPIs, reporting, workflow automation | 📋 |
| **Commerce ORB** | Amazon Seller, Shopify, e-commerce, vendors | 📋 |
| **Finance ORB** | budgeting, banking, investments, forecasting | 🟡 |
| **Creative ORB** | graphics, marketing, social, video generation | ✅ (build + video) |
| **EBE Integration** | Venue OS, Trading Systems, future EBE | 📋 |

## Subscription Framework — ✅ (prices aligned to spec)
| Tier | Price | Target |
|---|---|---|
| Free | $0 | consumer trial |
| Personal | $29.99/mo | consumers, professionals |
| Pro | $59.99/mo | power users |
| Entrepreneur | $99/mo | business owners |
| Executive | $249/mo | executives, operators |
| Enterprise | $499+/mo | organizations |

## Authentication — ✅ / 🟡
Google ✅ · Email ✅ · Referral links ✅ · Apple Sign-In ✅ · Phone/SMS ✅ · Magic link 📋 · Team invitations 🟡 · Enterprise SSO 📋

## Admin Operating Center (owner-only) — ✅
MRR · ARR · active subscriptions · conversion · users per tier · ARPU · referrals. (LTV/cancellations 🟡 — pair with Stripe dashboard.)

## Universal Keys (panel: KEYS) — ✅
AI (OpenAI/Anthropic/Gemini), Billing (Stripe), Voice, Storage (Supabase), SMS (Twilio), future providers plug-and-play. **Keys update instantly, no redeploy.**

## Data Layer (Supabase) — ✅ core / 📋 rest
Core tables live: `orb_platform_settings`, `orb_user_plans`, `orb_referrals`, `orb_teams`, plus
memory/tasks/credentials/actions/notepad/council. Spec targets to map next: users, subscriptions,
documents, workflows, ai_actions, approvals (several already exist under ORB names).

## Referral System — ✅
Every user gets `…/?ref=user@email.com`. Invites + conversions tracked (`/admin/referrals`). Rewards 📋.

## Universal Mount — ✅
`mountOrb(app)` installs auth, billing, AI council, memory, admin, integrations, analytics, voice,
video, and build into any Express app. See `seed/orb-platform/README.md`.

## Design Dimensions
40% Personal Assistant · 30% Business OS · 20% Knowledge Engine · 10% Creative Studio.
UX law: **"One Brain. One Memory. One System."** Never expose the AI machinery — users interact only with ORB.

## Safety & Structural Integrity (the spine)
- **Confirm-first:** high-risk actions never auto-run; they queue for owner approval (code-level gate).
- **Owner-only** admin metrics, key management, and voice training (`isOwner`); secrets are masked, never returned.
- **Graceful degradation:** any missing key disables just that feature — never crashes the app.
- **Verified money:** Stripe webhooks signature-checked; SMS rate-limited; baseline security headers on all API responses.
- **Single source of truth:** prices/tiers/capabilities in code match this spec.

## Brand
**ORB — Your Digital Chief of Staff.** Knows your priorities. Protects your time. Organizes your world.
Runs your systems. *Smarter Life. Smarter Business. One System.*
