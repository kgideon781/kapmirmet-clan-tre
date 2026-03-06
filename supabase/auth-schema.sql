-- ═══════════════════════════════════════════════════════════════
-- Run this AFTER schema.sql in the Supabase SQL Editor.
-- If you already ran a previous version, run fix-rls-recursion.sql instead.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Profiles (auto-created on Google sign-in) ────────────────
create table if not exists profiles (
  id          uuid        references auth.users(id) on delete cascade primary key,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);
alter table profiles enable row level security;
create policy "Public read profiles" on profiles for select using (true);
create policy "Own profile update"   on profiles for update using (auth.uid() = id);

-- Auto-populate profile when user signs up via Google
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. User roles ────────────────────────────────────────────────
create table if not exists user_roles (
  user_id     uuid  references profiles(id) on delete cascade primary key,
  role        text  not null check (role in ('admin', 'moderator')),
  created_at  timestamptz default now()
);
alter table user_roles enable row level security;

-- ── 3. SECURITY DEFINER helpers (bypass RLS — no recursion) ─────
-- These are the key fix: policies call these functions instead of
-- querying user_roles directly, which would loop infinitely.

create or replace function public.is_mod()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and role in ('admin', 'moderator')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.within_rate_limit()
returns boolean language sql security definer stable set search_path = public as $$
  select (
    select count(*) from people
    where added_by = auth.uid()
      and created_at > now() - interval '1 hour'
  ) < 10;
$$;

-- ── 4. user_roles policies (non-recursive) ───────────────────────
create policy "Read own role"      on user_roles for select using (user_id = auth.uid());
create policy "Admin insert roles" on user_roles for insert with check (public.is_admin());
create policy "Admin delete roles" on user_roles for delete using (public.is_admin());

-- ── 5. Update people table ───────────────────────────────────────
alter table people
  add column if not exists status       text        default 'pending'
    check (status in ('pending', 'verified', 'rejected')),
  add column if not exists added_by     uuid        default auth.uid() references profiles(id),
  add column if not exists verified_by  uuid        references profiles(id),
  add column if not exists verified_at  timestamptz,
  add column if not exists claimed_by   uuid        references profiles(id);

-- Mark all existing seeded people as verified
update people set status = 'verified' where status = 'pending' or status is null;

-- ── 6. Replace RLS policies on people ───────────────────────────
drop policy if exists "Public read"   on people;
drop policy if exists "Public insert" on people;
drop policy if exists "Public update" on people;
drop policy if exists "Public delete" on people;

create policy "Read people" on people for select using (
  status = 'verified'
  or added_by = auth.uid()
  or public.is_mod()
);

create policy "Auth insert" on people for insert with check (
  auth.uid() is not null
  and public.within_rate_limit()
);

create policy "Update people" on people for update using (
  public.is_mod()
  or (added_by = auth.uid() and status = 'pending')
);

create policy "Admin delete" on people for delete using (public.is_admin());

-- ── 7. Make yourself admin ───────────────────────────────────────
-- Sign in with Google first, then find your UUID in:
-- Dashboard → Authentication → Users
-- Then run:
-- insert into user_roles (user_id, role) values ('<your-uuid>', 'admin');
