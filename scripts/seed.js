// Seeds the Supabase database from the local clanData.js
// Usage:  node scripts/seed.js
// To reseed: node scripts/seed.js --force  (clears all rows first)

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';
import { flattenTree, clanTree, seedlings } from '../src/data/clanData.js';

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = process.env;
if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function seed() {
  // Check if already seeded
  const { count } = await supabase
    .from('people')
    .select('*', { count: 'exact', head: true });

  if (count > 0) {
    if (!process.argv.includes('--force')) {
      console.log(`Already seeded (${count} rows). Pass --force to wipe and reseed.`);
      process.exit(0);
    }
    console.log('--force: deleting existing rows...');
    await supabase.from('people').delete().gte('created_at', '2000-01-01');
  }

  const all = flattenTree(clanTree);
  const idMap = new Map(); // old string id → new uuid

  console.log(`Inserting ${all.length} tree members...`);
  for (const node of all) {
    const { data, error } = await supabase
      .from('people')
      .insert({
        name: node.name,
        birth: node.birth,
        death: node.death,
        gender: node.gender,
        badge: node.badge,
        story: node.story,
        claimed: node.claimed,
        clan: node.clan,
        parent_id: node.parentId ? idMap.get(node.parentId) : null,
        is_seedling: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`  Error inserting "${node.name}":`, error.message);
      process.exit(1);
    }
    idMap.set(node.id, data.id);
    console.log(`  + ${node.name}`);
  }

  console.log(`\nInserting ${seedlings.length} seedlings...`);
  for (const s of seedlings) {
    const { error } = await supabase.from('people').insert({
      name: s.name,
      birth: s.birth,
      gender: s.gender,
      story: s.story,
      clan: s.clan || 'Kapmirmet',
      is_seedling: true,
    });
    if (error) console.error(`  Error inserting seedling "${s.name}":`, error.message);
    else console.log(`  + [seedling] ${s.name}`);
  }

  console.log('\nSeeding complete!');
}

seed().catch(console.error);
