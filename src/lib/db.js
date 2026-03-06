import { supabase } from './supabase';

export async function fetchPeople() {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('birth', { ascending: true });
  if (error) throw error;
  return data;
}

export function buildTree(people) {
  const map = new Map();
  people.forEach((p) => map.set(p.id, { ...p, children: [] }));

  // IDs that are referenced as someone's mother — they don't belong in the main tree
  const motherIds = new Set(people.filter((p) => p.mother_id).map((p) => p.mother_id));

  let tree = null;
  const seedlings = [];
  // fatherId → Map<motherId, motherData>  (for satellite rendering)
  const mothersMap = new Map();

  people.forEach((p) => {
    if (p.is_seedling) {
      seedlings.push(map.get(p.id));
    } else if (p.parent_id) {
      const parent = map.get(p.parent_id);
      if (parent) {
        const node = map.get(p.id);
        // Children of female members belong to their father's clan, not Kapmirmet
        if (node && parent.gender === 'F') node.is_maternal = true;
        parent.children.push(node);
      }
      // Track (father → mother) for satellite rendering
      if (p.mother_id) {
        const motherData = map.get(p.mother_id);
        if (motherData) {
          if (!mothersMap.has(p.parent_id)) mothersMap.set(p.parent_id, new Map());
          mothersMap.get(p.parent_id).set(p.mother_id, motherData);
        }
      }
    } else if (!motherIds.has(p.id)) {
      tree = map.get(p.id); // root / founder
    }
  });

  return { tree, seedlings, mothersMap };
}

export async function addPerson({ name, birth, gender, parentId, notes, clan }) {
  const { data, error } = await supabase
    .from('people')
    .insert({
      name: name.trim(),
      birth: birth ? parseInt(birth, 10) : null,
      gender,
      parent_id: parentId || null,
      story: notes?.trim() || null,
      clan: clan || 'Kapmirmet',
      is_seedling: !parentId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePerson(id, updates) {
  const { data, error } = await supabase
    .from('people')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
