-- ═══════════════════════════════════════════════════════════════
-- migration-v6.sql — run in Supabase SQL Editor
-- Fixes the Auth insert policy + includes v5 RPCs (safe to re-run)
-- ═══════════════════════════════════════════════════════════════

-- 1. Recreate within_rate_limit (SECURITY DEFINER — bypasses RLS)
create or replace function public.within_rate_limit()
returns boolean language sql security definer stable set search_path = public as $$
  select (
    select count(*) from people
    where added_by = auth.uid()
      and created_at > now() - interval '1 hour'
  ) < 10;
$$;

-- 2. Fix Auth insert policy:
--    Explicitly requires added_by = auth.uid() on every new row.
--    The JS client now sets added_by explicitly, so this is always satisfied.
drop policy if exists "Auth insert" on people;
create policy "Auth insert" on people for insert with check (
  auth.uid() is not null
  and added_by = auth.uid()
  and public.within_rate_limit()
);

-- 3. set_person_parent — SECURITY DEFINER so it bypasses the Update RLS
--    (anchor may be verified or added by someone else; this is intentional)
create or replace function public.set_person_parent(
  anchor_id     uuid,
  new_parent_id uuid
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;
  update people
    set parent_id   = new_parent_id,
        is_seedling = false
    where id = anchor_id;
end;
$$;

-- 4. set_person_mother — SECURITY DEFINER for the same reason
create or replace function public.set_person_mother(
  anchor_id     uuid,
  new_mother_id uuid
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;
  update people
    set mother_id = new_mother_id
    where id = anchor_id;
end;
$$;
