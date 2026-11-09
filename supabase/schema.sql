-- Viral Driven Tracker schema. Run once in Supabase → SQL Editor.

create extension if not exists pgcrypto;

-- ---------- profiles (one per Discord login) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar_url text,
  role text not null default 'creator' check (role in ('manager','creator')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->'custom_claims'->>'global_name',
             new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'name',
             new.raw_user_meta_data->>'preferred_username',
             'creator'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- brands ----------
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  marketplace text not null default 'US',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- campaigns ----------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  product_url text not null,
  status text not null default 'active' check (status in ('active','paused','ended')),
  created_at timestamptz not null default now()
);

-- ---------- tracking links ----------
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  placement text not null check (placement in ('bio','comment','manychat','other')),
  note text,
  amazon_tag text,          -- Amazon Attribution tag query string, set by a manager
  created_at timestamptz not null default now()
);
create index if not exists links_campaign_idx on public.links(campaign_id);
create index if not exists links_owner_idx on public.links(owner_id);

-- ---------- daily stats per link (from Attribution report CSV or API) ----------
create table if not exists public.link_stats (
  link_id uuid not null references public.links(id) on delete cascade,
  day date not null,
  clicks integer not null default 0,
  detail_page_views integer not null default 0,
  add_to_carts integer not null default 0,
  purchases integer not null default 0,
  units integer not null default 0,
  sales numeric(12,2) not null default 0,
  referral_bonus numeric(12,2) not null default 0,
  primary key (link_id, day)
);

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.campaigns enable row level security;
alter table public.links enable row level security;
alter table public.link_stats enable row level security;

create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'manager');
$$;

-- profiles: everyone signed in can read names (for creator lists); only managers change roles
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
drop policy if exists "profiles manager update" on public.profiles;
create policy "profiles manager update" on public.profiles for update to authenticated
  using (public.is_manager()) with check (public.is_manager());

-- brands & campaigns: readable by all signed-in users, writable by managers
drop policy if exists "brands read" on public.brands;
create policy "brands read" on public.brands for select to authenticated using (true);
drop policy if exists "brands write" on public.brands;
create policy "brands write" on public.brands for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists "campaigns read" on public.campaigns;
create policy "campaigns read" on public.campaigns for select to authenticated using (true);
drop policy if exists "campaigns write" on public.campaigns;
create policy "campaigns write" on public.campaigns for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- links: creators see and manage their own; managers see all and can set tags
drop policy if exists "links read" on public.links;
create policy "links read" on public.links for select to authenticated using (owner_id = auth.uid() or public.is_manager());
drop policy if exists "links insert" on public.links;
create policy "links insert" on public.links for insert to authenticated with check (owner_id = auth.uid() or public.is_manager());
drop policy if exists "links delete" on public.links;
create policy "links delete" on public.links for delete to authenticated using (owner_id = auth.uid() or public.is_manager());
drop policy if exists "links update" on public.links;
create policy "links update" on public.links for update to authenticated using (public.is_manager()) with check (public.is_manager());

-- stats: creators see their own links' stats; managers see all; only managers write (via import)
drop policy if exists "stats read" on public.link_stats;
create policy "stats read" on public.link_stats for select to authenticated
  using (public.is_manager() or exists (select 1 from public.links l where l.id = link_id and l.owner_id = auth.uid()));
drop policy if exists "stats write" on public.link_stats;
create policy "stats write" on public.link_stats for all to authenticated using (public.is_manager()) with check (public.is_manager());
