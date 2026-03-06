-- ═══════════════════════════════════════════════════════════════
-- migration-v2.sql — run in Supabase SQL Editor after auth-schema.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Add death year and photo URL to people table
alter table people
  add column if not exists death      int,
  add column if not exists photo_url  text;

-- 2. Storage bucket for person photos (public read)
insert into storage.buckets (id, name, public)
values ('person-photos', 'person-photos', true)
on conflict (id) do nothing;

-- 3. Storage RLS policies
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
