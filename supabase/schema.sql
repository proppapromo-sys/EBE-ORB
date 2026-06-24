-- ============================================================================
--  EBE ORB — Supabase schema
--  Run this ONCE in your Supabase project: Dashboard → SQL Editor → paste → Run.
--  ORB uses the service-role key on the server, so Row Level Security is left off
--  (every table is reached only by the trusted backend, never the browser).
-- ============================================================================

-- TruthMeter: every decision + outcome (law 4 — trust earned on the record)
create table if not exists orb_journal (
  id          bigint generated always as identity primary key,
  user_key    text not null,
  branch      text default 'orb',
  kind        text,
  item_id     text,
  name        text,
  category    text,
  stake       double precision,
  edge        double precision,
  score       double precision,
  patterns    jsonb default '[]'::jsonb,
  ts          double precision,
  created_at  timestamptz default now()
);
create index if not exists orb_journal_user on orb_journal (user_key, ts);

-- Confirm-first action queue (law 5)
create table if not exists orb_action_queue (
  id                uuid primary key default gen_random_uuid(),
  user_key          text not null,
  title             text not null,
  description       text,
  domain            text,
  risk_level        text,
  requires_approval boolean default true,
  status            text default 'pending',
  tool_name         text,
  connector         text,
  payload           jsonb default '{}'::jsonb,
  result            jsonb,
  edge              double precision,
  stake             double precision,
  created_at        timestamptz default now(),
  approved_at       timestamptz,
  executed_at       timestamptz
);
create index if not exists orb_action_user on orb_action_queue (user_key, created_at desc);

-- Multi-Model Council audit log (one ORB chat; brains recorded for the owner only)
create table if not exists orb_council_runs (
  id               uuid primary key default gen_random_uuid(),
  user_key         text not null,
  request          text,
  final_answer     text,
  approval_count   int default 0,
  approval_titles  jsonb default '[]'::jsonb,
  council          jsonb default '[]'::jsonb,
  cycle            jsonb,
  fully_configured boolean default false,
  created_at       timestamptz default now()
);
create index if not exists orb_council_user on orb_council_runs (user_key, created_at desc);

-- Long-term memory (what ORB remembers about the owner)
create table if not exists orb_memories (
  id          uuid primary key default gen_random_uuid(),
  user_key    text not null,
  type        text default 'fact',
  title       text not null,
  content     text not null,
  importance  int default 5,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);
create index if not exists orb_memories_user on orb_memories (user_key, importance desc, created_at desc);

-- Tasks ORB tracks (due ones become attention signals)
create table if not exists orb_task_items (
  id           uuid primary key default gen_random_uuid(),
  user_key     text not null,
  title        text not null,
  description  text,
  status       text default 'open',
  domain       text default 'personal',
  priority     int default 5,
  due_at       timestamptz,
  created_at   timestamptz default now(),
  completed_at timestamptz
);
create index if not exists orb_task_user on orb_task_items (user_key, priority desc);

-- Per-owner notepad (single autosaved doc)
create table if not exists orb_notepad (
  user_key   text primary key,
  content    text default '',
  updated_at timestamptz default now()
);

-- OAuth tokens for live connectors (Google → Gmail + Calendar)
create table if not exists orb_oauth_tokens (
  user_key     text not null,
  provider     text not null,
  access_token text not null,
  refresh_token text,
  scope        text,
  token_type   text default 'Bearer',
  expires_at   bigint,
  updated_at   timestamptz default now(),
  primary key (user_key, provider)
);

-- Customer business API keys (Shopify, Stripe, …) — each user's own
create table if not exists orb_credentials (
  user_key   text not null,
  provider   text not null,
  fields     jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  primary key (user_key, provider)
);

-- Wallet payment ledger (ORB never holds money; Stripe does. This is the record.)
create table if not exists orb_wallet_txns (
  id          text primary key,
  user_key    text not null,
  payee       text,
  amount_cents int not null default 0,
  currency    text default 'usd',
  rail        text default 'stripe',
  memo        text,
  status      text default 'pending',
  note        text,
  created_at  timestamptz default now(),
  settled_at  timestamptz
);
create index if not exists orb_wallet_user on orb_wallet_txns (user_key, created_at desc);

-- Platform settings — owner keys set inside the app (Stripe/voice/video/auth). Makes in-app keys persist.
create table if not exists orb_platform_settings (
  name       text primary key,
  value      text,
  updated_at timestamptz default now()
);

-- Subscription tier per user — drives capability gating + the owner Admin (MRR/conversion) dashboard.
create table if not exists orb_user_plans (
  user_id    text primary key,
  plan       text not null default 'free',
  updated_at timestamptz default now()
);

-- Adaptive Conversation Memory — how each user likes to talk with ORB (NOT what they say).
-- Stores only small preference signals: answer-length style and their natural pause length.
-- No raw audio, no transcripts of background speech — ORB only ever receives finished text.
create table if not exists orb_convo_prefs (
  user_id    text primary key,
  style      text not null default 'short',
  pause_ms   integer not null default 1600,
  commands   jsonb not null default '{}'::jsonb,   -- frequency of the user's short, repeated commands
  wit        boolean not null default true,         -- legacy flag, kept in lockstep with humor level
  humor      text not null default 'executive',     -- Humor Level: professional | executive | friendly | playful
  support    text not null default 'standard',      -- Support style: standard | encouraging | direct | reassuring
  traits     jsonb not null default '{}'::jsonb,    -- Personality Engine: learned communication tendencies
  updated_at timestamptz default now()
);
-- Existing installs: add newer columns if the table predates them.
alter table orb_convo_prefs add column if not exists commands jsonb not null default '{}'::jsonb;
alter table orb_convo_prefs add column if not exists wit boolean not null default true;
alter table orb_convo_prefs add column if not exists humor text not null default 'executive';
alter table orb_convo_prefs add column if not exists support text not null default 'standard';
alter table orb_convo_prefs add column if not exists traits jsonb not null default '{}'::jsonb;

-- Behavioral event log — a timestamped record of what happens, so ORB learns habits and patterns
-- (time-of-day / day-of-week clustering) and can gauge follow-through over time.
create table if not exists orb_events (
  user_id text not null,
  kind    text not null,
  label   text not null default '',
  at      timestamptz default now()
);
create index if not exists orb_events_user_at on orb_events (user_id, at desc);

-- Motivation — the drivers behind a user's goals (Achievement / Freedom / Security / Legacy). Learned
-- from the words they use; persists even as goals change. ORB frames why-it-matters around these.
create table if not exists orb_motivation (
  user_id    text primary key,
  drivers    jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Goal Systems — the hierarchy above daily tasks: Identity / Strategic / Tactical objectives, with
-- the current→target gap, type, and progress. What the user is trying to BECOME, not just do.
create table if not exists orb_objectives (
  user_id text not null,
  id      text not null,
  label   text not null,
  level   text not null default 'strategic',
  type    text not null default 'outcome',
  start   double precision,
  current double precision,
  target  double precision,
  unit    text,
  created timestamptz default now(),
  updated timestamptz default now(),
  primary key (user_id, id)
);

-- Attention & Goals — open commitments ORB tracks so it can notice what you keep putting off.
create table if not exists orb_goals (
  user_id    text not null,
  id         text not null,            -- normalized action key
  action     text not null,
  importance integer not null default 1,
  created    timestamptz default now(),
  last_seen  timestamptz default now(),
  deferrals  integer not null default 0,
  done       boolean not null default false,
  primary key (user_id, id)
);

-- Digital Spatial Mapping — a per-user knowledge graph: entities (projects, people, businesses,
-- documents, deals…) and the relationships between them. ORB navigates by meaning, not by location.
create table if not exists orb_graph_nodes (
  user_id text not null,
  id      text not null,            -- normalized label
  type    text not null default 'thing',
  label   text not null,
  primary key (user_id, id)
);
create table if not exists orb_graph_edges (
  user_id text not null,
  from_id text not null,
  to_id   text not null,
  rel     text not null default 'linked to',
  primary key (user_id, from_id, to_id, rel)
);

-- Traveler profiles — details ORB needs to book flights for a user.
create table if not exists orb_profiles (
  user_id     text primary key,
  given_name  text, family_name text, born_on text,
  gender      text, title text, email text, phone text,
  updated_at  timestamptz default now()
);

-- Referral conversions — who invited whom (one referrer per invitee).
create table if not exists orb_referrals (
  invitee    text primary key,
  inviter    text not null,
  created_at timestamptz default now()
);

-- Teams / seats (Entrepreneur & Enterprise) — owner adds members, each gets their own login.
create table if not exists orb_teams (
  id         uuid primary key default gen_random_uuid(),
  owner      text not null,
  member     text not null,
  role       text not null default 'member',
  created_at timestamptz default now(),
  unique (owner, member)
);
