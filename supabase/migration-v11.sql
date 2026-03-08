-- ═══════════════════════════════════════════════════════════════
-- migration-v11.sql — run in Supabase SQL Editor
-- Edit history for clan story sections
-- ═══════════════════════════════════════════════════════════════

-- 1. Edit history table
--    FK to profiles (not auth.users) so PostgREST can join for names
create table if not exists public.clan_story_edits (
  id            uuid        primary key default gen_random_uuid(),
  section_id    text        not null,
  content_after text        not null,
  edited_by     uuid        references public.profiles(id),
  edited_at     timestamptz default now()
);

alter table public.clan_story_edits enable row level security;

-- Mods can read all edit history; no one writes directly (trigger only)
create policy "Mods can read edit history" on clan_story_edits
  for select using (public.is_mod());

-- 2. Trigger function — SECURITY DEFINER so it can bypass RLS to insert
create or replace function public.log_clan_story_edit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Only log when content actually changed (or on first insert)
  if TG_OP = 'INSERT' or NEW.content <> OLD.content then
    insert into clan_story_edits (section_id, content_after, edited_by)
    values (NEW.id, NEW.content, NEW.updated_by);
  end if;
  return NEW;
end;
$$;

-- 3. Attach trigger to clan_story_sections
drop trigger if exists story_edit_log on clan_story_sections;
create trigger story_edit_log
  after insert or update on clan_story_sections
  for each row execute function public.log_clan_story_edit();
