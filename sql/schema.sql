create extension if not exists vector;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists orb_connectors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  domain text not null,
  status text not null default 'needs_auth',
  auth_metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, name)
);

create table if not exists orb_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  memory_type text not null,
  title text not null,
  content text not null,
  importance int default 5,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists orb_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  status text default 'open',
  due_at timestamptz,
  priority_score numeric default 0,
  domain text default 'personal',
  created_at timestamptz default now()
);

create table if not exists orb_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  summary text not null,
  domain text not null,
  priority_score numeric not null,
  evidence jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists orb_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text not null,
  domain text not null,
  risk_level text not null,
  requires_approval boolean not null default true,
  status text not null default 'pending',
  tool_name text,
  payload jsonb default '{}'::jsonb,
  result jsonb,
  created_at timestamptz default now(),
  approved_at timestamptz,
  executed_at timestamptz
);

create table if not exists daily_briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  briefing_date date not null,
  summary text not null,
  priorities jsonb default '[]'::jsonb,
  alerts jsonb default '[]'::jsonb,
  recommendations jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  unique(user_id, briefing_date)
);

-- The genome's record (law 4): every decision + outcome ORB makes, so trust compounds.
-- user_key is plain text so demo/anon identifiers work without a users row.
create table if not exists orb_journal (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  branch text not null default 'orb',
  kind text not null,                 -- 'decision' | 'outcome'
  item_id text,
  name text,
  category text,
  stake numeric,
  edge numeric,
  score numeric,                      -- outcome score: >0 means it worked
  patterns jsonb default '[]'::jsonb,
  ts double precision,
  created_at timestamptz default now()
);
create index if not exists orb_journal_user_idx on orb_journal (user_key, ts);

-- Confirm-first action queue (law 5): surfaced actions wait here for owner approval.
create table if not exists orb_action_queue (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  title text not null,
  description text not null,
  domain text not null,
  risk_level text not null,
  requires_approval boolean not null default true,
  status text not null default 'pending',   -- pending | approved | executed | rejected
  tool_name text,
  connector text,
  payload jsonb default '{}'::jsonb,
  result jsonb,
  edge numeric,
  stake numeric,
  created_at timestamptz default now(),
  approved_at timestamptz,
  executed_at timestamptz
);
create index if not exists orb_action_queue_user_idx on orb_action_queue (user_key, status);
