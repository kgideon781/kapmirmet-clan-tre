-- ═══════════════════════════════════════════════════════════════
-- migration-v3.sql — run in Supabase SQL Editor
-- Enables the admin Team panel to read and manage all user roles
-- ═══════════════════════════════════════════════════════════════

-- Allow admins to see all roles (non-admins can only see their own)
drop policy if exists "Admin read all roles" on user_roles;
create policy "Admin read all roles" on user_roles
  for select using (public.is_admin());
