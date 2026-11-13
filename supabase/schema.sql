-- Viral Driven Tracker database (Basic).
--
-- How to use: Supabase > SQL Editor > New query > paste this whole file > Run.
-- Safe to run more than once. Safe to run on top of the 9 Nov version: it upgrades
-- the old tables in place and keeps every brand, link and sale.

-- =====================================================================
-- 0. Upgrade from the 9 Nov version (campaigns -> products)
-- =====================================================================
do $$
begin
  if to_regclass('public.campaigns') is not null and to_regclass('public.products') is null then
    alter table public.campaigns rename to products;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'links' and column_name = 'campaign_id') then
    alter table public.links rename column campaign_id to product_id;
    perform set_config('vdt.upgrading', '1', false);
  end if;
end $$;

-- =====================================================================
-- 1. People (one row per Discord login)
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar_url text,
  role text not null default 'creator',
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists discord_username text;
alter table public.profiles add column if not exists discord_id text;

-- roles: owner (Morgan), team (staff who see everything), creator (own links only)
alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'team' where role = 'manager';
update public.profiles set role = 'owner'
  where id = (select id from public.profiles where role = 'team' order by created_at limit 1)
    and not exists (select 1 from public.profiles where role = 'owner');
alter table public.profiles add constraint profiles_role_check check (role in ('owner', 'team', 'creator'));

update public.profiles p set
  discord_id = coalesce(p.discord_id, u.raw_user_meta_data->>'provider_id', u.raw_user_meta_data->>'sub'),
  discord_username = coalesce(p.discord_username, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')
from auth.users u
where u.id = p.id and (p.discord_id is null or p.discord_username is null);

-- New Discord login -> profile. The first person ever to sign in becomes the owner.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, discord_username, discord_id, avatar_url, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->'custom_claims'->>'global_name', ''),
             nullif(new.raw_user_meta_data->>'full_name', ''),
             nullif(new.raw_user_meta_data->>'name', ''),
             'creator'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub'),
    new.raw_user_meta_data->>'avatar_url',
    case when exists (select 1 from public.profiles where role = 'owner') then 'creator' else 'owner' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep the Discord name and avatar fresh when someone signs in again.
create or replace function public.handle_user_updated()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set
    username = coalesce(nullif(new.raw_user_meta_data->'custom_claims'->>'global_name', ''),
                        nullif(new.raw_user_meta_data->>'full_name', ''), username),
    discord_username = coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', discord_username),
    discord_id = coalesce(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub', discord_id),
    avatar_url = coalesce(new.raw_user_meta_data->>'avatar_url', avatar_url)
  where id = new.id;
  return new;
end $$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of raw_user_meta_data on auth.users
  for each row execute procedure public.handle_user_updated();

-- =====================================================================
-- 2. Brands > products > Amazon pages
-- =====================================================================
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  marketplace text not null default 'US',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
-- Filled in once the Amazon Ads API is connected: the Attribution tag template for this brand.
alter table public.brands add column if not exists tag_template text;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
alter table public.products drop constraint if exists campaigns_status_check;
alter table public.products drop constraint if exists products_status_check;
update public.products set status = 'archived' where status not in ('active', 'archived');
alter table public.products add constraint products_status_check check (status in ('active', 'archived'));

-- The Amazon addresses creators can point a link at (Lens calls these destinations).
create table if not exists public.amazon_pages (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  url text not null,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists amazon_pages_product_idx on public.amazon_pages(product_id);

-- 9 Nov version kept one address on the product itself. Move it into amazon_pages.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'products' and column_name = 'product_url') then
    insert into public.amazon_pages (product_id, name, url)
    select p.id, 'Main page', p.product_url from public.products p
    where p.product_url is not null
      and not exists (select 1 from public.amazon_pages a where a.product_id = p.id);
    alter table public.products drop column product_url;
  end if;
end $$;

-- =====================================================================
-- 3. Invite links and who has joined what
-- =====================================================================
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 16),
  name text not null,
  role text not null default 'creator' check (role in ('creator', 'team')),
  product_id uuid references public.products(id) on delete cascade,
  active boolean not null default true,
  expires_at timestamptz,
  max_uses integer,
  uses integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint invites_creator_needs_product check (role = 'team' or product_id is not null)
);
create index if not exists invites_product_idx on public.invites(product_id);

create table if not exists public.memberships (
  product_id uuid not null references public.products(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  invite_id uuid references public.invites(id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (product_id, creator_id)
);
create index if not exists memberships_creator_idx on public.memberships(creator_id);

-- =====================================================================
-- 4. Tracking links
-- =====================================================================
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  placement text not null,
  note text,
  amazon_tag text,
  created_at timestamptz not null default now()
);
alter table public.links add column if not exists short_id text;
alter table public.links add column if not exists page_id uuid references public.amazon_pages(id);
alter table public.links add column if not exists platform text not null default 'other';
alter table public.links add column if not exists account text not null default '';
alter table public.links add column if not exists name text not null default '';
alter table public.links add column if not exists archived_at timestamptz;

-- upgrade old rows
alter table public.links drop constraint if exists links_placement_check;
update public.links set note = coalesce(note, 'Pinned comment'), placement = 'other' where placement = 'comment';
update public.links set short_id = left(id::text, 8) where short_id is null;
update public.links l set page_id = (select a.id from public.amazon_pages a where a.product_id = l.product_id order by a.created_at limit 1)
  where l.page_id is null;
update public.links set name = case placement
    when 'bio' then 'Bio' when 'manychat' then 'ManyChat' when 'post' then 'Post description'
    when 'story' then 'Story' else 'Other' end
  where name = '';
-- people who already had links in the 9 Nov version keep access to those products
do $$
begin
  if current_setting('vdt.upgrading', true) = '1' then
    insert into public.memberships (product_id, creator_id)
      select distinct product_id, owner_id from public.links
      on conflict do nothing;
  end if;
end $$;

alter table public.links alter column short_id set not null;
alter table public.links alter column page_id set not null;
alter table public.links drop constraint if exists links_short_id_key;
alter table public.links add constraint links_short_id_key unique (short_id);
alter table public.links add constraint links_placement_check check (placement in ('bio', 'manychat', 'post', 'story', 'other'));
alter table public.links drop constraint if exists links_platform_check;
alter table public.links add constraint links_platform_check check (platform in ('instagram', 'facebook', 'tiktok', 'other'));

drop index if exists public.links_campaign_idx;
create index if not exists links_product_idx on public.links(product_id);
create index if not exists links_owner_idx on public.links(owner_id);

-- =====================================================================
-- 5. Daily numbers per link (Amazon Attribution, by report upload or API)
-- =====================================================================
create table if not exists public.link_stats (
  link_id uuid not null references public.links(id) on delete cascade,
  day date not null,
  clicks integer not null default 0,
  detail_page_views integer not null default 0,
  add_to_carts integer not null default 0,
  purchases integer not null default 0,
  units integer not null default 0,
  sales numeric(12,2) not null default 0,
  primary key (link_id, day)
);
create index if not exists link_stats_day_idx on public.link_stats(day);

-- Brand Referral Bonus sits in its own table so creators can never read it.
create table if not exists public.link_bonus (
  link_id uuid not null references public.links(id) on delete cascade,
  day date not null,
  amount numeric(12,2) not null default 0,
  primary key (link_id, day)
);

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'link_stats' and column_name = 'referral_bonus') then
    insert into public.link_bonus (link_id, day, amount)
      select link_id, day, referral_bonus from public.link_stats where referral_bonus <> 0
      on conflict do nothing;
    alter table public.link_stats drop column referral_bonus;
  end if;
end $$;

-- =====================================================================
-- 6. Who can see what
-- =====================================================================
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_team()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('owner', 'team') from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'owner' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_member(p_product uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships where product_id = p_product and creator_id = auth.uid());
$$;

alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.amazon_pages enable row level security;
alter table public.invites enable row level security;
alter table public.memberships enable row level security;
alter table public.links enable row level security;
alter table public.link_stats enable row level security;
alter table public.link_bonus enable row level security;

-- clear every policy from this and the 9 Nov version, then recreate
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies
           where schemaname = 'public'
             and tablename in ('profiles', 'brands', 'products', 'amazon_pages', 'invites', 'memberships', 'links', 'link_stats', 'link_bonus')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;
drop function if exists public.is_manager();

-- Speed note: role checks are written as (select public.is_team()) so the database works them
-- out once per query instead of once per row. Without that, reports crawl as the numbers grow.

-- profiles: you see yourself, the team sees everyone. Only the owner changes roles.
create policy "profiles read" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_team()));
create policy "profiles owner update" on public.profiles for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

-- brands, products, Amazon pages: team sees and edits all; creators see what they joined
create policy "brands read" on public.brands for select to authenticated
  using ((select public.is_team()) or exists (
    select 1 from public.products p where p.brand_id = brands.id and p.status = 'active' and public.is_member(p.id)));
create policy "brands write" on public.brands for all to authenticated
  using ((select public.is_team())) with check ((select public.is_team()));

create policy "products read" on public.products for select to authenticated
  using ((select public.is_team()) or (status = 'active' and public.is_member(id)));
create policy "products write" on public.products for all to authenticated
  using ((select public.is_team())) with check ((select public.is_team()));

create policy "pages read" on public.amazon_pages for select to authenticated
  using ((select public.is_team()) or public.is_member(product_id));
create policy "pages write" on public.amazon_pages for all to authenticated
  using ((select public.is_team())) with check ((select public.is_team()));

-- invites: team only. Only the owner can see, make or change team invites.
create policy "invites read" on public.invites for select to authenticated
  using ((select public.is_owner()) or ((select public.is_team()) and role = 'creator'));
create policy "invites insert" on public.invites for insert to authenticated
  with check ((select public.is_owner()) or ((select public.is_team()) and role = 'creator'));
create policy "invites update" on public.invites for update to authenticated
  using ((select public.is_owner()) or ((select public.is_team()) and role = 'creator'))
  with check ((select public.is_owner()) or ((select public.is_team()) and role = 'creator'));

-- memberships: creators see their own; joining happens through redeem_invite()
create policy "memberships read" on public.memberships for select to authenticated
  using (creator_id = (select auth.uid()) or (select public.is_team()));
create policy "memberships write" on public.memberships for all to authenticated
  using ((select public.is_team())) with check ((select public.is_team()));

-- links: creators see and make their own, in products they joined. Nobody deletes a link.
create policy "links read" on public.links for select to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_team()));
create policy "links insert" on public.links for insert to authenticated
  with check ((select public.is_team()) or (owner_id = (select auth.uid()) and public.is_member(product_id)));
create policy "links update" on public.links for update to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_team()))
  with check (owner_id = (select auth.uid()) or (select public.is_team()));

-- numbers: creators see their own links' numbers; only the team writes
create policy "stats read" on public.link_stats for select to authenticated
  using ((select public.is_team()) or link_id in (select l.id from public.links l where l.owner_id = (select auth.uid())));
create policy "stats write" on public.link_stats for all to authenticated
  using ((select public.is_team())) with check ((select public.is_team()));

create policy "bonus team only" on public.link_bonus for all to authenticated
  using ((select public.is_team())) with check ((select public.is_team()));

-- =====================================================================
-- 7. Link rules that hold no matter who writes
-- =====================================================================
-- Fills a brand's Attribution tag template for one link. Returns null (so the link shows
-- as "not tracked yet") unless the template has the three Amazon slots to fill.
create or replace function public.build_tag(p_template text, p_campaign text, p_adgroup text, p_creative text)
returns text language sql immutable as $$
  select case
    when p_template is null or p_template !~ 'aa_campaignid=' or p_template !~ 'aa_adgroupid=' or p_template !~ 'aa_creativeid=' then null
    else regexp_replace(regexp_replace(regexp_replace(ltrim(btrim(p_template), '?'),
           '(aa_campaignid=)[^&]*', '\1' || p_campaign),
           '(aa_adgroupid=)[^&]*', '\1' || p_adgroup),
           '(aa_creativeid=)[^&]*', '\1' || p_creative)
  end;
$$;

create or replace function public.links_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  tpl text;
  staff boolean := auth.uid() is null or public.is_team();  -- null = database admin or sync job
begin
  if tg_op = 'INSERT' then
    if new.short_id is null then
      new.short_id := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
    end if;
    if not exists (select 1 from public.amazon_pages a
                   where a.id = new.page_id and a.product_id = new.product_id and (staff or a.archived_at is null)) then
      raise exception 'That Amazon page is not available for this product';
    end if;
    if not staff or new.amazon_tag is null then
      select b.tag_template into tpl from public.products p join public.brands b on b.id = p.brand_id where p.id = new.product_id;
      -- campaign = the product, ad group = this link, creative = this link.
      -- (Amazon only reports Brand Referral Bonus per ad group or campaign, so the link has to be the ad group.)
      new.amazon_tag := public.build_tag(tpl,
        substr(replace(new.product_id::text, '-', ''), 1, 10),
        new.short_id,
        new.short_id);
    end if;
    return new;
  end if;

  if not staff and (
       new.owner_id <> old.owner_id or new.product_id <> old.product_id or new.page_id <> old.page_id
    or new.short_id <> old.short_id or new.amazon_tag is distinct from old.amazon_tag
    or new.platform <> old.platform or new.account <> old.account or new.placement <> old.placement
    or new.created_at <> old.created_at) then
    raise exception 'You can rename, annotate or archive your own links. Nothing else can change.';
  end if;
  return new;
end $$;

drop trigger if exists links_guard on public.links;
create trigger links_guard before insert or update on public.links
  for each row execute procedure public.links_guard();

-- =====================================================================
-- 8. Invite links
-- =====================================================================
-- What the join page shows before sign-in. Gives away the product and brand name only.
create or replace function public.invite_preview(p_code text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((
    select jsonb_build_object(
      'found', true,
      'open', i.active and (i.expires_at is null or i.expires_at > now()) and (i.max_uses is null or i.uses < i.max_uses),
      'role', i.role,
      'product', p.name,
      'brand', b.name)
    from public.invites i
    left join public.products p on p.id = i.product_id
    left join public.brands b on b.id = p.brand_id
    where i.code = p_code
  ), jsonb_build_object('found', false, 'open', false));
$$;

-- Signed-in person uses an invite: creators join the product, team invites make them team.
create or replace function public.redeem_invite(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  inv public.invites;
  me uuid := auth.uid();
  mine text;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'signed_out');
  end if;
  select role into mine from public.profiles where id = me;
  if mine is null then
    return jsonb_build_object('ok', false, 'reason', 'no_profile');
  end if;
  select * into inv from public.invites where code = p_code for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- already in: let them through even if the link has since been switched off
  if inv.role = 'team' and mine in ('owner', 'team') then
    return jsonb_build_object('ok', true, 'role', 'team', 'already', true);
  end if;
  if inv.role = 'creator' and exists (select 1 from public.memberships where product_id = inv.product_id and creator_id = me) then
    return jsonb_build_object('ok', true, 'role', 'creator', 'product_id', inv.product_id, 'already', true);
  end if;

  if not inv.active then
    return jsonb_build_object('ok', false, 'reason', 'off');
  end if;
  if inv.expires_at is not null and inv.expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;
  if inv.max_uses is not null and inv.uses >= inv.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'full');
  end if;

  if inv.role = 'team' then
    update public.profiles set role = 'team' where id = me;
  else
    insert into public.memberships (product_id, creator_id, invite_id) values (inv.product_id, me, inv.id);
  end if;
  update public.invites set uses = uses + 1 where id = inv.id;
  return jsonb_build_object('ok', true, 'role', inv.role, 'product_id', inv.product_id, 'already', false);
end $$;

-- =====================================================================
-- 9. Report maths (run as the signed-in person, so the rules above still apply)
-- =====================================================================
drop function if exists public.link_totals(uuid, uuid, date, date);
create function public.link_totals(p_product uuid default null, p_brand uuid default null, p_from date default null, p_to date default null)
returns table (link_id uuid, clicks bigint, dpv bigint, atc bigint, purchases bigint, units bigint, sales numeric)
language sql stable as $$
  select s.link_id, sum(s.clicks), sum(s.detail_page_views), sum(s.add_to_carts), sum(s.purchases), sum(s.units), sum(s.sales)
  from public.link_stats s
  join public.links l on l.id = s.link_id
  join public.products p on p.id = l.product_id
  where (p_product is null or l.product_id = p_product)
    and (p_brand is null or p.brand_id = p_brand)
    and (p_from is null or s.day >= p_from)
    and (p_to is null or s.day <= p_to)
  group by s.link_id;
$$;

drop function if exists public.product_totals(date, date);
create function public.product_totals(p_from date default null, p_to date default null)
returns table (product_id uuid, clicks bigint, dpv bigint, atc bigint, purchases bigint, units bigint, sales numeric)
language sql stable as $$
  select l.product_id, sum(s.clicks), sum(s.detail_page_views), sum(s.add_to_carts), sum(s.purchases), sum(s.units), sum(s.sales)
  from public.link_stats s
  join public.links l on l.id = s.link_id
  where (p_from is null or s.day >= p_from)
    and (p_to is null or s.day <= p_to)
  group by l.product_id;
$$;

drop function if exists public.daily_totals(uuid, uuid, date, date, uuid[]);
create function public.daily_totals(
  p_product uuid default null, p_brand uuid default null, p_from date default null, p_to date default null,
  p_links uuid[] default null)
returns table (day date, clicks bigint, dpv bigint, atc bigint, purchases bigint, units bigint, sales numeric)
language sql stable as $$
  select s.day, sum(s.clicks), sum(s.detail_page_views), sum(s.add_to_carts), sum(s.purchases), sum(s.units), sum(s.sales)
  from public.link_stats s
  join public.links l on l.id = s.link_id
  join public.products p on p.id = l.product_id
  where (p_product is null or l.product_id = p_product)
    and (p_brand is null or p.brand_id = p_brand)
    and (p_from is null or s.day >= p_from)
    and (p_to is null or s.day <= p_to)
    and (p_links is null or s.link_id = any(p_links))
  group by s.day;
$$;

drop function if exists public.bonus_total(uuid, uuid, date, date);
create function public.bonus_total(p_product uuid default null, p_brand uuid default null, p_from date default null, p_to date default null)
returns numeric language sql stable as $$
  select coalesce(sum(b.amount), 0)
  from public.link_bonus b
  join public.links l on l.id = b.link_id
  join public.products p on p.id = l.product_id
  where (p_product is null or l.product_id = p_product)
    and (p_brand is null or p.brand_id = p_brand)
    and (p_from is null or b.day >= p_from)
    and (p_to is null or b.day <= p_to);
$$;

drop function if exists public.data_through(uuid, uuid);
create function public.data_through(p_product uuid default null, p_brand uuid default null)
returns date language sql stable as $$
  select max(s.day)
  from public.link_stats s
  join public.links l on l.id = s.link_id
  join public.products p on p.id = l.product_id
  where (p_product is null or l.product_id = p_product)
    and (p_brand is null or p.brand_id = p_brand);
$$;

-- =====================================================================
-- 9b. Amazon Ads API connection (one per brand)
-- =====================================================================
-- Holds the brand's Login with Amazon refresh token, encrypted by the app before it gets here.
-- No access rules are created, so nobody signed in can read this table: only the server's own
-- key (service role) can. The team sees the status through amazon_status() below, never the token.
create table if not exists public.amazon_connections (
  brand_id uuid primary key references public.brands(id) on delete cascade,
  region text not null default 'NA' check (region in ('NA', 'EU', 'FE')),
  refresh_token_enc text not null,
  profile_id text,
  advertiser_id text,
  advertiser_name text,
  candidates jsonb not null default '[]'::jsonb,
  connected_by uuid references public.profiles(id) on delete set null,
  connected_at timestamptz not null default now(),
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_rows integer
);
alter table public.amazon_connections enable row level security;

create or replace function public.amazon_status(p_brand uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not public.is_team() then null else coalesce((
    select jsonb_build_object(
      'connected', true, 'region', c.region, 'advertiser_id', c.advertiser_id, 'advertiser_name', c.advertiser_name,
      'candidates', c.candidates, 'connected_at', c.connected_at,
      'last_sync_at', c.last_sync_at, 'last_sync_status', c.last_sync_status, 'last_sync_rows', c.last_sync_rows)
    from public.amazon_connections c where c.brand_id = p_brand
  ), jsonb_build_object('connected', false)) end;
$$;

-- Tags every untagged link of a brand from its tag template. Returns how many links it tagged.
create or replace function public.apply_tag_template(p_brand uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare tpl text; n integer;
begin
  if auth.uid() is not null and not public.is_team() then
    raise exception 'Team only';
  end if;
  select tag_template into tpl from public.brands where id = p_brand;
  if tpl is null then return 0; end if;
  update public.links l set amazon_tag = public.build_tag(tpl, substr(replace(l.product_id::text, '-', ''), 1, 10), l.short_id, l.short_id)
  from public.products p
  where p.id = l.product_id and p.brand_id = p_brand and l.amazon_tag is null
    and public.build_tag(tpl, 'x', 'x', 'x') is not null;
  get diagnostics n = row_count;
  return n;
end $$;

-- =====================================================================
-- 10. Access for the app's database roles
-- =====================================================================
-- Signed-out visitors get nothing except the invite preview. Signed-in people get the
-- tables, and the rules in section 6 decide which rows.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on
  public.profiles, public.brands, public.products, public.amazon_pages, public.invites,
  public.memberships, public.links, public.link_stats, public.link_bonus
  to authenticated, service_role;
grant execute on function
  public.my_role(), public.is_team(), public.is_owner(), public.is_member(uuid),
  public.redeem_invite(text), public.amazon_status(uuid), public.apply_tag_template(uuid),
  public.link_totals(uuid, uuid, date, date),
  public.product_totals(date, date),
  public.daily_totals(uuid, uuid, date, date, uuid[]),
  public.bonus_total(uuid, uuid, date, date),
  public.data_through(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.invite_preview(text) to anon, authenticated, service_role;
grant select, insert, update, delete on public.amazon_connections to service_role;
