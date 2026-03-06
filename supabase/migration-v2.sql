-- ═══════════════════════════════════════════════════════════════
-- migration-v2.sql — safe to run even if partially applied before
-- ═══════════════════════════════════════════════════════════════

-- 1. Add death year and photo URL to people table
alter table people
  add column if not exists death      int,
  add column if not exists photo_url  text;

-- 2. Also add badge column if missing (in case schema.sql predates it)
alter table people
  add column if not exists badge text;

-- 3. Storage bucket for person photos (public read)
insert into storage.buckets (id, name, public)
values ('person-photos', 'person-photos', true)
on conflict (id) do nothing;

-- 4. Storage RLS policies (drop first so re-runs don't error)
drop policy if exists "Public read person photos"           on storage.objects;
drop policy if exists "Authenticated upload person photos"  on storage.objects;
drop policy if exists "Authenticated update person photos"  on storage.objects;
drop policy if exists "Authenticated delete person photos"  on storage.objects;

create policy "Public read person photos"
  on storage.objects for select
  using (bucket_id = 'person-photos');

create policy "Authenticated upload person photos"
  on storage.objects for insert
  with check (bucket_id = 'person-photos' and auth.uid() is not null);

create policy "Authenticated update person photos"
  on storage.objects for update
  using (bucket_id = 'person-photos' and auth.uid() is not null);

create policy "Authenticated delete person photos"
  on storage.objects for delete
  using (bucket_id = 'person-photos' and auth.uid() is not null);
