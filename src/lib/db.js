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

  const motherIds = new Set(people.filter((p) => p.mother_id).map((p) => p.mother_id));

  let tree = null;
  const seedlings = [];
  const mothersMap = new Map(); // fatherId → Map<motherId, motherData>

  people.forEach((p) => {
    if (p.is_seedling) {
      seedlings.push(map.get(p.id));
    } else if (p.parent_id) {
      const parent = map.get(p.parent_id);
      if (parent) {
        const node = map.get(p.id);
        if (node && parent.gender === 'F') node.is_maternal = true;
        parent.children.push(node);
      }
      if (p.mother_id) {
        const motherData = map.get(p.mother_id);
        if (motherData) {
          if (!mothersMap.has(p.parent_id)) mothersMap.set(p.parent_id, new Map());
          mothersMap.get(p.parent_id).set(p.mother_id, motherData);
        }
      }
    } else if (!motherIds.has(p.id)) {
      tree = map.get(p.id);
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
      status: 'pending',        // always pending until a mod verifies
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

export async function verifyPerson(id) {
  const { error } = await supabase
    .from('people')
    .update({ status: 'verified', verified_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function rejectPerson(id) {
  const { error } = await supabase
    .from('people')
    .update({ status: 'rejected' })
    .eq('id', id);
  if (error) throw error;
}

export async function claimProfile(personId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { error } = await supabase
    .from('people')
    .update({ claimed: true, claimed_by: user.id })
    .eq('id', personId);
  if (error) throw error;
}

export async function deletePerson(id) {
  const { error } = await supabase.from('people').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchPending() {
  const { data, error } = await supabase
    .from('people')
    .select('*, adder:profiles!added_by(full_name, email, avatar_url)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
