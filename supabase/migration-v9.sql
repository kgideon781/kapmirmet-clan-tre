-- ═══════════════════════════════════════════════════════════════
-- migration-v9.sql — run in Supabase SQL Editor
-- Moves role storage from user_roles → profiles.role
-- Fixes the "roles disappear on reload" bug caused by user_roles
-- SELECT RLS only allowing users to read their own row.
-- ═══════════════════════════════════════════════════════════════

-- 1. Add role column to profiles
alter table public.profiles
  add column if not exists role text check (role in ('admin', 'moderator'));

-- 2. Copy any existing roles across
update public.profiles p
  set role = (select ur.role from public.user_roles ur where ur.user_id = p.id limit 1)
  where exists (select 1 from public.user_roles ur where ur.user_id = p.id);

-- 3. Update is_admin() to read from profiles
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 4. Update is_mod() to read from profiles
create or replace function public.is_mod()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

-- 5. SECURITY DEFINER RPCs — update profiles.role directly
create or replace function public.admin_set_role(target_user_id uuid, new_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized — admin only';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'Cannot change your own role';
  end if;
  update profiles set role = new_role where id = target_user_id;
end;
$$;

create or replace function public.admin_remove_role(target_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized — admin only';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'Cannot change your own role';
  end if;
  update profiles set role = null where id = target_user_id;
end;
$$;
