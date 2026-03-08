-- ═══════════════════════════════════════════════════════════════
-- migration-v10.sql — run in Supabase SQL Editor
-- Editable clan story sections + suggestion queue
-- ═══════════════════════════════════════════════════════════════

-- 1. Story sections (one row per section, editable by mods)
create table if not exists public.clan_story_sections (
  id          text primary key,
  title       text not null,
  content     text not null,
  sort_order  int  not null default 0,
  updated_at  timestamptz default now(),
  updated_by  uuid references auth.users(id)
);

alter table public.clan_story_sections enable row level security;

create policy "Anyone can read story sections" on clan_story_sections
  for select using (true);

-- Mods can insert, update, delete sections
create policy "Mods can manage story sections" on clan_story_sections
  for all using (public.is_mod()) with check (public.is_mod());

-- 2. Suggestion queue (any logged-in user can submit, mods review)
create table if not exists public.clan_story_suggestions (
  id                uuid        primary key default gen_random_uuid(),
  section_id        text        not null,
  suggested_content text        not null,
  suggested_by      uuid        references auth.users(id) default auth.uid(),
  created_at        timestamptz default now(),
  status            text        not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected'))
);

alter table public.clan_story_suggestions enable row level security;

-- Any signed-in user can submit a suggestion
create policy "Auth users can submit suggestions" on clan_story_suggestions
  for insert with check (auth.uid() is not null);

-- Mods can read and update all suggestions
create policy "Mods can manage suggestions" on clan_story_suggestions
  for all using (public.is_mod()) with check (public.is_mod());

-- Users can see their own suggestions
create policy "Users can read own suggestions" on clan_story_suggestions
  for select using (suggested_by = auth.uid());
