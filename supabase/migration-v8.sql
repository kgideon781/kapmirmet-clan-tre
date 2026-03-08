-- ═══════════════════════════════════════════════════════════════
-- migration-v8.sql — run in Supabase SQL Editor
-- 1. RLS policies so admins can read/write user_roles directly
--    (fixes the silent-delete → duplicate-key 409 error)
-- 2. SECURITY DEFINER RPCs for role management
-- ═══════════════════════════════════════════════════════════════

-- 1a. Everyone can read user_roles (needed for the role chip display
--     and for fetchProfilesWithRoles join to return role data)
drop policy if exists "Anyone can read roles" on user_roles;
create policy "Anyone can read roles" on user_roles
  for select using (true);

-- 1b. Only admins can insert / update / delete user_roles rows
drop policy if exists "Admins can manage roles" on user_roles;
create policy "Admins can manage roles" on user_roles
  for all
  using  (public.is_admin())
  with check (public.is_admin());

-- 2. Assign or change a role for any user (admin only)
create or replace function public.admin_set_role(target_user_id uuid, new_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized — admin only';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'Cannot change your own role';
  end if;
  delete from user_roles where user_id = target_user_id;
  insert into user_roles(user_id, role) values (target_user_id, new_role);
end;
$$;

-- 3. Remove a role from a user (admin only)
create or replace function public.admin_remove_role(target_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized — admin only';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'Cannot change your own role';
  end if;
  delete from user_roles where user_id = target_user_id;
end;
$$;
