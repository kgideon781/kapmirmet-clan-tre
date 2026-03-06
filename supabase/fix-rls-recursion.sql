-- ═══════════════════════════════════════════════════════════════
-- Run this NOW in Supabase SQL Editor to fix the infinite recursion.
-- The problem: policies on user_roles queried user_roles itself.
-- The fix: SECURITY DEFINER functions bypass RLS, breaking the loop.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Helper functions (SECURITY DEFINER = bypass RLS) ─────────

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

-- ── 2. Fix user_roles policies ───────────────────────────────────

drop policy if exists "Admin manages"      on user_roles;
drop policy if exists "Read own role"      on user_roles;
drop policy if exists "Admin insert"       on user_roles;
drop policy if exists "Admin delete roles" on user_roles;

-- Users can only read their own role (non-recursive)
create policy "Read own role" on user_roles
  for select using (user_id = auth.uid());

-- Admins can insert/delete roles (uses SECURITY DEFINER fn — no recursion)
create policy "Admin insert roles" on user_roles
  for insert with check (public.is_admin());

create policy "Admin delete roles" on user_roles
  for delete using (public.is_admin());

-- ── 3. Fix people policies ───────────────────────────────────────

drop policy if exists "Read people"   on people;
drop policy if exists "Auth insert"   on people;
drop policy if exists "Update people" on people;
drop policy if exists "Admin delete"  on people;

-- SELECT: verified records, OR your own (any status), OR mod/admin sees all
create policy "Read people" on people for select using (
  status = 'verified'
  or added_by = auth.uid()
  or public.is_mod()
);

-- INSERT: authenticated + rate-limited (10/hour via SECURITY DEFINER fn)
create policy "Auth insert" on people for insert with check (
  auth.uid() is not null
  and public.within_rate_limit()
);

-- UPDATE: mods/admins, or owner editing their own pending addition
create policy "Update people" on people for update using (
  public.is_mod()
  or (added_by = auth.uid() and status = 'pending')
);

-- DELETE: admins only
create policy "Admin delete" on people for delete using (public.is_admin());
