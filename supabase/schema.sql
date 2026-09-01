-- Central do Instagram — schema do banco (Supabase / Postgres)
-- Rode isto UMA vez no Supabase: Dashboard -> SQL Editor -> New query -> cole -> Run.

create table if not exists instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id text,
  instagram_username text not null,
  publora_channel_id text,
  zernio_profile_id text,
  meta_access_token_encrypted text,
  status text not null default 'disconnected',
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists content_briefs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references instagram_accounts(id) on delete cascade,
  type text not null,
  theme text default '',
  caption text not null,
  hashtags text[] default '{}',
  scheduled_at timestamptz,
  status text not null default 'draft',
  created_by text default 'unknown',
  approved_by text,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists content_assets (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid references content_briefs(id) on delete cascade,
  account_id uuid references instagram_accounts(id) on delete cascade,
  publora_post_id text,
  publora_status text,
  published_url text,
  media_urls text[] default '{}',
  status text not null default 'draft',
  error_message text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists base_conhecimento (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references instagram_accounts(id) on delete cascade,
  category text,
  question text not null,
  answer text not null,
  confidence_threshold real default 0.8,
  active boolean not null default true,
  created_by text default 'unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists instagram_interactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references instagram_accounts(id) on delete cascade,
  external_event_id text not null,
  sender_username text,
  sender_name text,
  interaction_type text not null,
  content text,
  status text not null default 'new',
  auto_response text,
  base_conhecimento_id uuid references base_conhecimento(id),
  confidence_score real,
  assigned_to text,
  crm_lead_id text,
  zernio_message_id text,
  meta_event_id text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- idempotência: o mesmo evento do Instagram nunca vira dois registros
  unique (account_id, external_event_id)
);

create index if not exists idx_briefs_account on content_briefs(account_id);
create index if not exists idx_briefs_status on content_briefs(status);
create index if not exists idx_assets_brief on content_assets(brief_id);
create index if not exists idx_inter_account on instagram_interactions(account_id);
create index if not exists idx_inter_status on instagram_interactions(status);
create index if not exists idx_kb_account on base_conhecimento(account_id);
