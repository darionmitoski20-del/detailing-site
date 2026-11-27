-- =====================================================================
--  Detailing websites platform — database schema (Supabase / Postgres)
--  Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
--  Safe to run again: it only creates what is missing.
-- =====================================================================

-- ---------- Tables ----------

-- One row per client (detailer) website.
create table if not exists public.sites (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,                 -- short name, e.g. "shine-pro"
  name         text not null,                        -- business name
  plan         text not null default 'admin' check (plan in ('basic', 'admin', 'pro')),
  draft        jsonb,                                -- what the detailer is editing (not public)
  build_hook   text,                                 -- Netlify build hook URL, called on Publish
  active       boolean not null default true,        -- false = admin locked (unpaid)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- What the public website shows. Readable by everyone.
create table if not exists public.published_sites (
  site_id      uuid primary key references public.sites(id) on delete cascade,
  data         jsonb not null,
  published_at timestamptz not null default now()
);

-- Who may log in to which site (by email).
create table if not exists public.site_members (
  site_id    uuid not null references public.sites(id) on delete cascade,
  email      text not null,
  role       text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  primary key (site_id, email)
);

-- You (the platform owner): can see and edit every site.
create table if not exists public.platform_admins (
  email text primary key
);

-- Booking requests sent from a website's form.
create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  site_id        uuid not null references public.sites(id) on delete cascade,
  created_at     timestamptz not null default now(),
  name           text not null check (char_length(name) between 1 and 120),
  phone          text not null check (char_length(phone) between 3 and 40),
  email          text check (email is null or char_length(email) <= 200),
  vehicle        text check (vehicle is null or char_length(vehicle) <= 80),
  service        text check (service is null or char_length(service) <= 120),
  estimate       integer,
  preferred_date text check (preferred_date is null or char_length(preferred_date) <= 60),
  details        text check (details is null or char_length(details) <= 1000),
  status         text not null default 'new' check (status in ('new', 'confirmed', 'done'))
);
create index if not exists bookings_site_created on public.bookings (site_id, created_at desc);

-- "Request access" form on the admin sign-in page.
create table if not exists public.access_requests (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email      text not null check (char_length(email) <= 200),
  business   text check (business is null or char_length(business) <= 200),
  phone      text check (phone is null or char_length(phone) <= 40)
);

-- ---------- Helper functions ----------

create or replace function public.current_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins a where lower(a.email) = public.current_email())
$$;

create or replace function public.is_site_member(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_platform_admin() or exists (
    select 1 from public.site_members m
    where m.site_id = sid and lower(m.email) = public.current_email()
  )
$$;

-- Editing is allowed on the "admin" and "pro" plans, while the site is active.
create or replace function public.can_edit_site(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_platform_admin() or exists (
    select 1 from public.sites s
    join public.site_members m on m.site_id = s.id
    where s.id = sid and s.plan in ('admin', 'pro') and s.active
      and lower(m.email) = public.current_email()
  )
$$;

-- Detailers may only change their draft. Plan, lock, slug and build hook are yours.
create or replace function public.protect_site_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then
    if new.plan is distinct from old.plan or new.active is distinct from old.active
       or new.slug is distinct from old.slug or new.build_hook is distinct from old.build_hook then
      raise exception 'Only the platform admin can change plan, active, slug or build_hook';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists sites_protect on public.sites;
create trigger sites_protect before update on public.sites
  for each row execute function public.protect_site_columns();

-- ---------- Row Level Security ----------

alter table public.sites           enable row level security;
alter table public.published_sites enable row level security;
alter table public.site_members    enable row level security;
alter table public.platform_admins enable row level security;
alter table public.bookings        enable row level security;
alter table public.access_requests enable row level security;

-- sites: members read their own; only editors update; only you create/delete.
drop policy if exists sites_select on public.sites;
create policy sites_select on public.sites for select to authenticated using (public.is_site_member(id));
drop policy if exists sites_update on public.sites;
create policy sites_update on public.sites for update to authenticated using (public.can_edit_site(id)) with check (public.can_edit_site(id));
drop policy if exists sites_admin_all on public.sites;
create policy sites_admin_all on public.sites for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

-- published_sites: everyone can read (the public website); editors publish.
drop policy if exists published_read on public.published_sites;
create policy published_read on public.published_sites for select to anon, authenticated using (true);
drop policy if exists published_write on public.published_sites;
create policy published_write on public.published_sites for all to authenticated using (public.can_edit_site(site_id)) with check (public.can_edit_site(site_id));

-- site_members: a member sees their own rows; you manage everything.
drop policy if exists members_select on public.site_members;
create policy members_select on public.site_members for select to authenticated using (lower(email) = public.current_email() or public.is_platform_admin());
drop policy if exists members_admin on public.site_members;
create policy members_admin on public.site_members for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

-- platform_admins: only you can read it.
drop policy if exists padmins_select on public.platform_admins;
create policy padmins_select on public.platform_admins for select to authenticated using (public.is_platform_admin());

-- bookings: anyone can send one from a website; members read and change the status.
drop policy if exists bookings_insert on public.bookings;
create policy bookings_insert on public.bookings for insert to anon, authenticated with check (status = 'new');
drop policy if exists bookings_select on public.bookings;
create policy bookings_select on public.bookings for select to authenticated using (public.is_site_member(site_id));
drop policy if exists bookings_update on public.bookings;
create policy bookings_update on public.bookings for update to authenticated using (public.is_site_member(site_id)) with check (public.is_site_member(site_id));
drop policy if exists bookings_delete on public.bookings;
create policy bookings_delete on public.bookings for delete to authenticated using (public.is_site_member(site_id));

-- access_requests: anyone can send; only you read.
drop policy if exists access_insert on public.access_requests;
create policy access_insert on public.access_requests for insert to anon, authenticated with check (true);
drop policy if exists access_select on public.access_requests;
create policy access_select on public.access_requests for select to authenticated using (public.is_platform_admin());

-- ---------- Photo & video storage ----------
-- Public bucket; each site writes only inside its own folder: <site_id>/...

insert into storage.buckets (id, name, public, file_size_limit)
values ('site-media', 'site-media', true, 26214400)  -- 25 MB per file
on conflict (id) do nothing;

drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select to anon, authenticated using (bucket_id = 'site-media');
drop policy if exists media_insert on storage.objects;
create policy media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media' and public.can_edit_site(((storage.foldername(name))[1])::uuid));
drop policy if exists media_update on storage.objects;
create policy media_update on storage.objects for update to authenticated
  using (bucket_id = 'site-media' and public.can_edit_site(((storage.foldername(name))[1])::uuid));
drop policy if exists media_delete on storage.objects;
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and public.can_edit_site(((storage.foldername(name))[1])::uuid));

-- =====================================================================
--  FIRST-TIME SETUP (edit the emails, then run these lines once)
-- =====================================================================
-- 1) Make yourself the platform admin:
--    insert into public.platform_admins (email) values ('dariomitoski13@gmail.com');
--
-- 2) Add a client site and give the detailer access:
--    insert into public.sites (slug, name, plan) values ('shine-pro', 'Shine Pro Detailing', 'admin') returning id;
--    insert into public.site_members (site_id, email) values ('<id from above>', 'owner@theirbusiness.com');

-- ============================================================
--  OPTIONAL: rebuild every client site once a day (fresh Google reviews).
--  Database → Extensions: turn on pg_cron and pg_net, then run:
-- ============================================================
-- select cron.schedule(
--   'daily-rebuild',
--   '0 9 * * *',  -- every day 09:00 UTC (4–5 AM New York)
--   $$ select net.http_post(url := build_hook) from public.sites where active and build_hook is not null $$
-- );
