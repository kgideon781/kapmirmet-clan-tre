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

export async function addPerson({ name, birth, death, gender, parentId, notes, clan, isSeedling }) {
  const { data, error } = await supabase
    .from('people')
    .insert({
      name: name.trim(),
      birth: birth ? parseInt(birth, 10) : null,
      death: death ? parseInt(death, 10) : null,
      gender,
      parent_id: parentId || null,
      story: notes?.trim() || null,
      clan: clan || 'Kapmirmet',
      is_seedling: isSeedling !== undefined ? isSeedling : !parentId,
      status: 'pending',
      // added_by intentionally omitted — column DEFAULT auth.uid() sets it
      // server-side, avoiding any JWT timing issue between getUser() and insert
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadPersonPhoto(personId, file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${personId}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('person-photos')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from('person-photos').getPublicUrl(path);
  await updatePerson(personId, { photo_url: data.publicUrl });
  return data.publicUrl;
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
  const { error } = await supabase.rpc('verify_person', { person_id: id });
  if (error) throw error;
}

export async function rejectPerson(id) {
  const { error } = await supabase.rpc('reject_person', { person_id: id });
  if (error) throw error;
}

export async function verifyPeopleBulk(ids) {
  const { data, error } = await supabase.rpc('verify_people_bulk', { ids });
  if (error) throw error;
  return data; // number of rows updated
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

export async function setPersonParent(anchorId, parentId) {
  const { error } = await supabase.rpc('set_person_parent', {
    anchor_id: anchorId,
    new_parent_id: parentId,
  });
  if (error) throw error;
}

export async function setPersonMother(anchorId, motherId) {
  const { error } = await supabase.rpc('set_person_mother', {
    anchor_id: anchorId,
    new_mother_id: motherId,
  });
  if (error) throw error;
}

export async function deletePersonWithReroute(personId, { action = 'seedling', newParentId = null } = {}) {
  const { error } = await supabase.rpc('delete_person_with_reroute', {
    person_id: personId,
    descendant_action: action,
    new_parent_id: newParentId,
  });
  if (error) throw error;
}

export async function requestDeletion(personId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { error } = await supabase.from('people').update({
    deletion_requested_at: new Date().toISOString(),
    deletion_requested_by: user.id,
  }).eq('id', personId);
  if (error) throw error;
}

export async function denyDeletionRequest(personId) {
  const { error } = await supabase.from('people').update({
    deletion_requested_at: null,
    deletion_requested_by: null,
  }).eq('id', personId);
  if (error) throw error;
}

export async function fetchProfilesWithRoles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, created_at, user_roles(role)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    ...p,
    role: p.user_roles?.[0]?.role || null,
  }));
}

export async function setUserRole(userId, role) {
  // Delete existing first (upsert needs an update policy we don't have)
  await supabase.from('user_roles').delete().eq('user_id', userId);
  const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
  if (error) throw error;
}

export async function removeUserRole(userId) {
  const { error } = await supabase.from('user_roles').delete().eq('user_id', userId);
  if (error) throw error;
}

export async function fetchPending() {
  const [pendingRes, deletionRes] = await Promise.all([
    supabase.from('people')
      .select('*, adder:profiles!added_by(full_name, email, avatar_url)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabase.from('people')
      .select('*, adder:profiles!added_by(full_name, email, avatar_url), requester:profiles!deletion_requested_by(full_name, email)')
      .not('deletion_requested_at', 'is', null)
      .order('deletion_requested_at', { ascending: true }),
  ]);
  if (pendingRes.error) throw pendingRes.error;
  if (deletionRes.error) throw deletionRes.error;
  const pending = (pendingRes.data ?? []).map((p) => ({ ...p, _queueType: 'pending' }));
  const deletions = (deletionRes.data ?? [])
    .filter((d) => !pending.find((p) => p.id === d.id))
    .map((p) => ({ ...p, _queueType: 'deletion' }));
  return [...pending, ...deletions];
}
