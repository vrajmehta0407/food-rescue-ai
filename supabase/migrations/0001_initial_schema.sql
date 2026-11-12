-- FoodRescue AI: Initial PostgreSQL + PostGIS Schema
-- Requires PostGIS extension enabled in Supabase

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- 1. Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('donor', 'receiver', 'volunteer', 'admin')),
  name text not null,
  phone text,
  org_name text,
  verified boolean not null default false,
  trust_score numeric(4,2) not null default 5.00 check (trust_score >= 0 and trust_score <= 5),
  daily_demand_portions integer default 0,
  dietary_preference text default 'any' check (dietary_preference in ('any', 'veg_only')),
  location geography(Point, 4326),
  approx_area text,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_location on public.profiles using gist (location);

-- 2. Verifications
create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  doc_type text not null check (doc_type in ('fssai', 'ngo_registration', 'volunteer_id')),
  doc_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 3. Safety Rules (deterministic table)
create table if not exists public.safety_rules (
  id uuid primary key default gen_random_uuid(),
  category text unique not null,
  max_hours_ambient numeric(5,2) not null,
  max_hours_chilled numeric(5,2) not null,
  blocked boolean not null default false,
  notes text not null,
  is_sample boolean not null default true
);

-- 4. Listings
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null,
  items text[] not null default '{}',
  veg boolean not null default true,
  portions integer not null check (portions > 0),
  kg numeric(8,2) not null check (kg > 0),
  allergens text[] not null default '{}',
  packaging text not null check (packaging in ('sealed_containers', 'covered_trays', 'open_unsealed')),
  storage_method text not null default 'ambient' check (storage_method in ('ambient', 'chilled')),
  prepared_at timestamptz not null,
  safe_by timestamptz not null,
  safety_decision text not null check (safety_decision in ('APPROVE', 'APPROVE_WITH_WARNING', 'BLOCK')),
  safety_explanation text,
  pickup_location geography(Point, 4326) not null,
  pickup_area text not null,
  pickup_address_exact text not null,
  photo_url text,
  ai_confidence jsonb default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'matched', 'picked', 'delivered', 'expired', 'cancelled', 'blocked')),
  created_at timestamptz not null default now()
);

create index if not exists idx_listings_location on public.listings using gist (pickup_location);
create index if not exists idx_listings_status_safe_by on public.listings (status, safe_by);

-- 5. Matches
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  rank integer not null,
  score numeric(5,4) not null,
  reasons jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  notified_at timestamptz not null default now(),
  responded_at timestamptz
);

-- 6. Tasks (Volunteer Logistics)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  volunteer_id uuid references public.profiles(id) on delete set null,
  route_json jsonb,
  eta timestamptz,
  status text not null default 'unassigned' check (status in ('unassigned', 'accepted', 'picked', 'delivered', 'cancelled')),
  picked_at timestamptz,
  delivered_at timestamptz,
  proof_url text,
  receiver_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

-- 7. Ratings & Flags
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  flag_reason text,
  created_at timestamptz not null default now()
);

-- 8. Impact
create table if not exists public.impact (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  meals integer not null,
  kg numeric(8,2) not null,
  co2e_kg numeric(10,2) not null,
  value_inr numeric(10,2) not null,
  delivered_at timestamptz not null default now()
);

-- 9. Agent Audit Logs (agents.md Shared Rule #3)
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  input_hash text not null,
  decision text,
  latency_ms integer not null,
  cost_usd numeric(10,6) default 0,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security on every table
alter table public.profiles enable row level security;
alter table public.verifications enable row level security;
alter table public.safety_rules enable row level security;
alter table public.listings enable row level security;
alter table public.matches enable row level security;
alter table public.tasks enable row level security;
alter table public.ratings enable row level security;
alter table public.impact enable row level security;
alter table public.agent_runs enable row level security;

-- Basic RLS Policies
create policy "Public can read safety rules" on public.safety_rules
  for select using (true);

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Donors can insert own listings" on public.listings
  for insert with check (auth.uid() = donor_id);

create policy "Authenticated users can read non-blocked listings" on public.listings
  for select using (
    auth.uid() = donor_id
    or status in ('open', 'matched', 'picked', 'delivered')
  );

create policy "Receivers see own matches" on public.matches
  for select using (auth.uid() = receiver_id);

create policy "Volunteers see assigned or unassigned tasks" on public.tasks
  for select using (volunteer_id is null or auth.uid() = volunteer_id);

create policy "Impact is publicly readable" on public.impact
  for select using (true);

