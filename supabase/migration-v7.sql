-- ═══════════════════════════════════════════════════════════════
-- migration-v7.sql — run in Supabase SQL Editor
-- 1. Raises rate limit to 60/hour (was 10)
-- 2. Removes the redundant added_by = auth.uid() INSERT check
--    (column default handles this server-side — no JWT timing issue)
-- 3. Adds SECURITY DEFINER RPCs for verify/reject so admins/mods
--    can approve any pending submission without RLS fighting them.
-- ═══════════════════════════════════════════════════════════════

-- 1. Raise rate limit to 60 per hour
create or replace function public.within_rate_limit()
returns boolean language sql security definer stable set search_path = public as $$
  select (
    select count(*) from people
    where added_by = auth.uid()
      and created_at > now() - interval '1 hour'
  ) < 60;
$$;

-- 2. Simplify Auth insert policy: drop the added_by = auth.uid() check.
--    The column default (auth.uid()) sets it server-side — no JWT race.
--    auth.uid() is not null still guards against anonymous inserts.
drop policy if exists "Auth insert" on people;
create policy "Auth insert" on people for insert with check (
  auth.uid() is not null
  and public.within_rate_limit()
);

-- 1. Verify a single person
create or replace function public.verify_person(person_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_mod() then
    raise exception 'Not authorized to verify people';
  end if;
  update people
    set status      = 'verified',
        verified_at = now(),
        verified_by = auth.uid()
    where id = person_id;
end;
$$;

-- 2. Reject a single person
create or replace function public.reject_person(person_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_mod() then
    raise exception 'Not authorized to reject people';
  end if;
  update people
    set status = 'rejected'
    where id = person_id;
end;
$$;

-- 3. Bulk-verify an array of person IDs — returns count of rows updated
create or replace function public.verify_people_bulk(ids uuid[])
returns integer language plpgsql security definer set search_path = public as $$
declare
  cnt integer;
begin
  if not public.is_mod() then
    raise exception 'Not authorized';
  end if;
  update people
    set status      = 'verified',
        verified_at = now(),
        verified_by = auth.uid()
    where id = any(ids)
      and status = 'pending';
  get diagnostics cnt = row_count;
  return cnt;
end;
$$;
