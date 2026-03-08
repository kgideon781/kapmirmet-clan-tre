-- ═══════════════════════════════════════════════════════════════
-- migration-v5.sql — run in Supabase SQL Editor
-- SECURITY DEFINER helpers for linking parents (bypasses RLS)
-- Any authenticated user can link a parent/mother to an existing
-- person — it's a connective operation, not an edit of personal data.
-- ═══════════════════════════════════════════════════════════════

-- 1. Set the father/patriarch parent of a person
create or replace function public.set_person_parent(
  anchor_id    uuid,
  new_parent_id uuid
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;
  update people
    set parent_id  = new_parent_id,
        is_seedling = false
    where id = anchor_id;
end;
$$;

-- 2. Set the mother of a person
create or replace function public.set_person_mother(
  anchor_id    uuid,
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
