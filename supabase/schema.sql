-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- If you already ran the first version, run the MIGRATION section at the bottom.

create table if not exists people (
  id          uuid        default gen_random_uuid() primary key,
  name        text        not null,
  birth       integer,
  death       integer,
  gender      text        default 'M' check (gender in ('M', 'F')),
  badge       text,
  story       text,
  claimed     boolean     default false,
  clan        text        default 'Kapmirmet',
  parent_id   uuid        references people(id),
  mother_id   uuid        references people(id),
  is_seedling boolean     default false,
  created_at  timestamptz default now()
);

alter table people enable row level security;

create policy "Public read"
  on people for select using (true);

create policy "Public insert"
  on people for insert with check (true);

create policy "Public update"
  on people for update using (true);

create policy "Public delete"
  on people for delete using (true);

-- ── MIGRATION (run this if you already have the table) ──────────────────────
-- alter table people add column if not exists mother_id uuid references people(id);
-- create policy "Public update" on people for update using (true);
