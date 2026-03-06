-- ═══════════════════════════════════════════════════════════════
-- migration-v4.sql — run in Supabase SQL Editor
-- Deletion requests + owner edit anytime + safe delete RPC
-- ═══════════════════════════════════════════════════════════════

-- 1. Add any missing columns (mother_id may not exist if schema.sql predates it)
alter table people
  add column if not exists mother_id              uuid,
  add column if not exists deletion_requested_at  timestamptz,
  add column if not exists deletion_requested_by  uuid references profiles(id);

-- 2. Allow owners to edit their entries at any time (not just pending)
drop policy if exists "Update people" on people;
create policy "Update people" on people for update using (
  public.is_mod()
  or added_by = auth.uid()
);

-- 3. SECURITY DEFINER function — handles descendant rerouting + authorization
--    descendant_action: 'grandparent' | 'seedling' | 'reroute'
create or replace function public.delete_person_with_reroute(
  person_id      uuid,
  descendant_action text default 'seedling',
  new_parent_id  uuid default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_parent_id uuid;
begin
  -- Authorization: must be mod/admin OR own entry created within 24 hours
  if not (
    public.is_mod()
    or exists (
      select 1 from people
      where id = person_id
        and added_by = auth.uid()
        and created_at > now() - interval '24 hours'
    )
  ) then
    raise exception 'Not authorized to delete this person';
  end if;

  -- Fetch parent for 'grandparent' action
  select parent_id into v_parent_id from people where id = person_id;

  -- Reroute / handle children
  if descendant_action = 'grandparent' then
    update people set parent_id = v_parent_id where parent_id = person_id;
  elsif descendant_action = 'reroute' and new_parent_id is not null then
    update people set parent_id = new_parent_id where parent_id = person_id;
  elsif descendant_action = 'cascade' then
    -- Clear mother_id refs from outside the branch pointing into it
    with recursive branch as (
      select id from people where parent_id = person_id
      union all
      select p.id from people p inner join branch b on p.parent_id = b.id
    )
    update people set mother_id = null
    where mother_id in (select id from branch)
      and id not in (select id from branch)
      and id != person_id;
    -- Delete entire branch
    with recursive branch as (
      select id from people where parent_id = person_id
      union all
      select p.id from people p inner join branch b on p.parent_id = b.id
    )
    delete from people where id in (select id from branch);
  else -- 'seedling' (default)
    update people set parent_id = null, is_seedling = true where parent_id = person_id;
  end if;

  -- Clear satellite mother references
  update people set mother_id = null where mother_id = person_id;

  -- Delete the person
  delete from people where id = person_id;
end;
$$;

-- 4. Function to approve a deletion request (admin/mod clears + deletes)
create or replace function public.approve_deletion_request(
  person_id uuid,
  descendant_action text default 'seedling',
  new_parent_id uuid default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_mod() then
    raise exception 'Not authorized';
  end if;
  perform public.delete_person_with_reroute(person_id, descendant_action, new_parent_id);
end;
$$;
