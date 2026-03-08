-- ═══════════════════════════════════════════════════════════════
-- migration-v12.sql — run in Supabase SQL Editor
-- Claimed profile protection: only owner or admin can update
-- ═══════════════════════════════════════════════════════════════

-- Drop existing broad UPDATE policy on people (mods could edit anything)
drop policy if exists "Mods can update people" on public.people;
drop policy if exists "Mod or creator can update" on public.people;
drop policy if exists "Mods and creators can update" on public.people;

-- 1. Unclaimed rows: admin, mod, or the person who added it can update
create policy "Update unclaimed people"
  on public.people for update
  using (
    not coalesce(claimed, false)
    and (public.is_mod() or added_by = auth.uid())
  )
  with check (
    not coalesce(claimed, false)
    and (public.is_mod() or added_by = auth.uid())
  );

-- 2. Claimed rows: only the profile owner or an absolute admin can update
create policy "Update claimed people"
  on public.people for update
  using (
    coalesce(claimed, false)
    and (public.is_admin() or claimed_by = auth.uid())
  )
  with check (
    coalesce(claimed, false)
    and (public.is_admin() or claimed_by = auth.uid())
  );
