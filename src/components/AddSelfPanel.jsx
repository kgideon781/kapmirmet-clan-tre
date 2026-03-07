import { useState } from 'react';
import { X, Sprout, ArrowRight, Plus, Minus } from 'lucide-react';
import { addPerson, setPersonParent, setPersonMother } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../lib/auth';

const RELATIONSHIPS = [
  { key: 'child',   label: (a) => `Child of ${a}`,   defaultGender: null },
  { key: 'sibling', label: (a) => `Sibling of ${a}`,  defaultGender: null },
  { key: 'mother',  label: (a) => `Mother of ${a}`,   defaultGender: 'F'  },
  { key: 'father',  label: (a) => `Father of ${a}`,   defaultGender: 'M'  },
];

function genderForRelationship(rel) {
  if (rel === 'mother') return 'F';
  if (rel === 'father') return 'M';
  return 'M';
}

export default function AddSelfPanel({ onClose, anchor, relationship: initialRel, onPersonAdded, allPeople, insertBefore }) {
  const { user } = useAuth();
  const hasAnchor = !!anchor;

  if (!user) {
    return (
      <div style={panelStyle}>
        <button onClick={onClose} style={closeBtnStyle}><X size={18} /></button>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🔐</span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#DAA520', margin: '0 0 8px' }}>Sign in to add family</p>
          <p style={{ fontSize: '12px', color: '#7B6845', fontFamily: 'var(--font-body)', lineHeight: 1.5, margin: '0 0 20px' }}>
            Additions require a verified identity to keep the clan record trustworthy.
          </p>
          <button onClick={signInWithGoogle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', background: '#fff', border: 'none', borderRadius: '10px', color: '#333', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  const defaultRel = initialRel || 'child';

  const [relationship, setRelationship] = useState(defaultRel);
  const [form, setForm] = useState({
    name: '',
    birth: '',
    death: '',
    gender: genderForRelationship(defaultRel),
    story: '',
    clan: '',
  });
  const [children, setChildren]         = useState([]);
  const [showChildren, setShowChildren] = useState(false);
  const [showDeath, setShowDeath]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState(null);
  const [saved, setSaved]               = useState(null);
  const [chain, setChain]               = useState(null);

  const effectiveAnchor = chain ? chain.anchor : anchor;

  const [linkMode, setLinkMode]         = useState(false);
  const [linkSearch, setLinkSearch]     = useState('');
  const [linkTarget, setLinkTarget]     = useState(null);

  const linkResults = hasAnchor
    ? (allPeople || [])
        .filter((p) => p.id !== effectiveAnchor?.id && p.name.toLowerCase().includes(linkSearch.toLowerCase()))
        .slice(0, 8)
    : [];

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  function handleRelationshipChange(rel) {
    setRelationship(rel);
    setLinkMode(false);
    setLinkSearch('');
    setLinkTarget(null);
    const g = genderForRelationship(rel);
    if (g) update('gender', g);
  }

  function addChildRow() {
    setShowChildren(true);
    setChildren((prev) => [...prev, { id: Date.now(), name: '', birth: '', death: '', gender: 'M' }]);
  }

  function updateChild(id, key, val) {
    setChildren((prev) => prev.map((c) => (c.id === id ? { ...c, [key]: val } : c)));
  }

  function removeChild(id) {
    setChildren((prev) => prev.filter((c) => c.id !== id));
    if (children.length <= 1) setShowChildren(false);
  }

  async function handleSubmit() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      let newPerson;
      switch (relationship) {
        case 'child':
          newPerson = await addPerson({
            name: form.name, birth: form.birth, death: form.death,
            gender: form.gender, notes: form.story,
            parentId: effectiveAnchor?.id || null,
            clan: form.clan || undefined,
          });
          break;
        case 'sibling':
          newPerson = await addPerson({
            name: form.name, birth: form.birth, death: form.death,
            gender: form.gender, notes: form.story,
            parentId: effectiveAnchor?.parent_id || null,
          });
          break;
        case 'mother': {
          newPerson = await addPerson({
            name: form.name, birth: form.birth, death: form.death,
            gender: 'F', notes: form.story, isSeedling: false,
          });
          await setPersonMother(effectiveAnchor.id, newPerson.id);
          break;
        }
        case 'father': {
          newPerson = await addPerson({
            name: form.name, birth: form.birth, death: form.death,
            gender: 'M', notes: form.story,
            parentId: effectiveAnchor?.parent_id || null,
            isSeedling: false,
          });
          await setPersonParent(effectiveAnchor.id, newPerson.id);
          break;
        }
        default:
          newPerson = await addPerson({
            name: form.name, birth: form.birth, death: form.death,
            gender: form.gender, notes: form.story,
          });
      }

      // If inserting between two nodes, reparent the lower node to the new person
      if (insertBefore && relationship === 'child') {
        await setPersonParent(insertBefore.id, newPerson.id);
      }

      // Create any inline children
      for (const child of children) {
        if (!child.name.trim()) continue;
        await addPerson({
          name: child.name, birth: child.birth, death: child.death,
          gender: child.gender, parentId: newPerson.id,
        });
      }

      setSaved(newPerson);
      onPersonAdded?.();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLinkSubmit() {
    if (!linkTarget || saving) return;
    setSaving(true);
    setError(null);
    try {
      switch (relationship) {
        case 'child':
          await setPersonParent(linkTarget.id, effectiveAnchor.id);
          break;
        case 'father':
          await setPersonParent(effectiveAnchor.id, linkTarget.id);
          break;
        case 'mother':
          await setPersonMother(effectiveAnchor.id, linkTarget.id);
          break;
        case 'sibling':
          await setPersonParent(linkTarget.id, effectiveAnchor.parent_id);
          break;
        default:
          throw new Error('Select a relationship first');
      }
      setSaved(linkTarget);
      onPersonAdded?.();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function startChain(chainRel) {
    setChain({ anchor: saved, relationship: chainRel });
    setSaved(null);
    setForm({ name: '', birth: '', death: '', gender: genderForRelationship(chainRel), story: '', clan: '' });
    setRelationship(chainRel);
    setChildren([]);
    setShowChildren(false);
    setLinkMode(false);
    setLinkSearch('');
    setLinkTarget(null);
    setError(null);
  }

  return (
    <div style={panelStyle}>
      <button onClick={onClose} style={closeBtnStyle}><X size={18} /></button>

      <div style={{ textAlign: 'center', marginBottom: '18px', paddingTop: '8px' }}>
        <span style={{ fontSize: '40px', display: 'block', lineHeight: 1 }}>🌱</span>
        <h2 style={titleStyle}>
          {effectiveAnchor ? `${effectiveAnchor.name}'s Family` : 'Plant Yourself on the Tree'}
        </h2>
        <p style={subtitleStyle}>
          {insertBefore
            ? `Will be placed between ${effectiveAnchor?.name?.split(' ')[0]} and ${insertBefore.name.split(' ')[0]}.`
            : effectiveAnchor
            ? 'Choose a relationship and fill in their details.'
            : "Add yourself even if you don't know your exact branch yet."}
        </p>
      </div>

      {saved ? (
        <div style={{ animation: 'slideInUp 0.4s var(--ease-out)' }}>
          <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🌿</span>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#DAA520', margin: '0 0 4px' }}>
              {saved.name} planted!
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: 'rgba(218,165,32,0.1)', border: '1px solid rgba(218,165,32,0.25)', borderRadius: '20px', margin: '6px 0' }}>
              <span style={{ fontSize: '10px' }}>⏳</span>
              <span style={{ fontSize: '10.5px', color: '#DAA520', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>PENDING REVIEW</span>
            </div>
            <p style={{ fontSize: '11.5px', color: '#7B6845', fontFamily: 'var(--font-body)', lineHeight: 1.5, margin: '4px 0 0' }}>
              Visible only to you for now. An elder will verify and publish it to the full tree.
            </p>
          </div>

          <p style={{ ...labelStyle, marginBottom: '8px' }}>ADD MORE RELATIVES OF {saved.name.toUpperCase()}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { rel: 'child',   icon: '↓', label: `Child of ${saved.name}` },
              { rel: 'mother',  icon: '♀', label: `Mother of ${saved.name}` },
              { rel: 'father',  icon: '↑', label: `Father of ${saved.name}` },
              { rel: 'sibling', icon: '↔', label: `Sibling of ${saved.name}` },
            ].map(({ rel, icon, label }) => (
              <button key={rel} onClick={() => startChain(rel)} style={chainBtnStyle}>
                <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>{icon}</span>
                {label}
                <ArrowRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{ ...chainBtnStyle, marginTop: '10px', color: '#7B6845', borderColor: 'rgba(92,64,51,0.2)' }}>
            Done for now
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Relationship selector */}
          {hasAnchor && (
            <div>
              <label style={labelStyle}>RELATIONSHIP TO {(effectiveAnchor?.name || anchor?.name || '').toUpperCase()}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {RELATIONSHIPS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleRelationshipChange(key)}
                    style={{
                      padding: '8px',
                      background: relationship === key ? 'rgba(218,165,32,0.18)' : 'rgba(92,64,51,0.15)',
                      border: `1px solid ${relationship === key ? 'rgba(218,165,32,0.45)' : 'rgba(92,64,51,0.35)'}`,
                      borderRadius: '8px',
                      color: relationship === key ? '#DAA520' : '#A89070',
                      cursor: 'pointer', fontSize: '11.5px', fontFamily: 'var(--font-body)',
                      fontWeight: 500, transition: 'all 0.2s', textAlign: 'center',
                    }}
                  >
                    {label(effectiveAnchor?.name.split(' ')[0] || anchor?.name?.split(' ')[0] || 'them')}
                  </button>
                ))}
              </div>
              {relationship === 'sibling' && !anchor?.parent_id && (
                <p style={{ fontSize: '11px', color: '#e0883a', marginTop: '5px', fontFamily: 'var(--font-body)' }}>
                  Parent not known yet — sibling will be added as a seedling.
                </p>
              )}
            </div>
          )}

          {/* ── New / Link toggle ── */}
          {hasAnchor && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => { setLinkMode(false); setLinkSearch(''); setLinkTarget(null); }}
                style={{ flex: 1, padding: '7px', borderRadius: '8px', cursor: 'pointer', fontSize: '11.5px', fontFamily: 'var(--font-body)', border: `1px solid ${!linkMode ? 'rgba(218,165,32,0.45)' : 'rgba(92,64,51,0.35)'}`, background: !linkMode ? 'rgba(218,165,32,0.12)' : 'rgba(92,64,51,0.1)', color: !linkMode ? '#DAA520' : '#A89070', transition: 'all 0.2s' }}
              >+ New person</button>
              <button
                onClick={() => setLinkMode(true)}
                style={{ flex: 1, padding: '7px', borderRadius: '8px', cursor: 'pointer', fontSize: '11.5px', fontFamily: 'var(--font-body)', border: `1px solid ${linkMode ? 'rgba(218,165,32,0.45)' : 'rgba(92,64,51,0.35)'}`, background: linkMode ? 'rgba(218,165,32,0.12)' : 'rgba(92,64,51,0.1)', color: linkMode ? '#DAA520' : '#A89070', transition: 'all 0.2s' }}
              >Link existing</button>
            </div>
          )}

          {linkMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  autoFocus
                  placeholder="Search by name…"
                  value={linkSearch}
                  onChange={(e) => { setLinkSearch(e.target.value); setLinkTarget(null); }}
                  style={{ width: '100%', background: 'rgba(92,64,51,0.2)', border: '1px solid rgba(92,64,51,0.4)', borderRadius: '8px', padding: '9px 12px', color: '#E8DCC8', fontSize: '13px', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => (e.target.style.borderColor = '#8B6914')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(92,64,51,0.4)')}
                />
                {linkSearch.length > 1 && !linkTarget && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1A120B', border: '1px solid rgba(92,64,51,0.5)', borderRadius: '8px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', marginTop: '3px' }}>
                    {linkResults.length > 0 ? linkResults.map((p) => (
                      <button key={p.id} onClick={() => { setLinkTarget(p); setLinkSearch(p.name); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#D4C4A8', fontSize: '13px', fontFamily: 'var(--font-body)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(92,64,51,0.25)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <span>{p.gender === 'F' ? '♀' : '♂'}</span>
                        <span>{p.name}</span>
                        {p.birth && <span style={{ marginLeft: 'auto', color: '#7B6845', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>b.{p.birth}</span>}
                      </button>
                    )) : (
                      <p style={{ padding: '10px 12px', fontSize: '12px', color: '#7B6845', fontFamily: 'var(--font-body)', margin: 0 }}>No matches found</p>
                    )}
                  </div>
                )}
              </div>

              {linkTarget && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(218,165,32,0.06)', border: '1px solid rgba(218,165,32,0.2)', borderRadius: '8px' }}>
                  <span>{linkTarget.gender === 'F' ? '♀' : '♂'}</span>
                  <span style={{ fontSize: '13px', color: '#DAA520', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{linkTarget.name}</span>
                  {linkTarget.birth && <span style={{ fontSize: '11px', color: '#7B6845', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>b.{linkTarget.birth}</span>}
                </div>
              )}

              {relationship === 'sibling' && !effectiveAnchor?.parent_id && (
                <p style={{ fontSize: '11px', color: '#e0883a', fontFamily: 'var(--font-body)', margin: 0 }}>
                  {effectiveAnchor?.name} has no known parent — cannot link a sibling without a shared parent.
                </p>
              )}

              {error && (
                <p style={{ color: '#e05555', fontSize: '12px', margin: 0, fontFamily: 'var(--font-body)', padding: '8px 12px', background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '8px' }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleLinkSubmit}
                disabled={!linkTarget || saving || (relationship === 'sibling' && !effectiveAnchor?.parent_id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', background: linkTarget && !saving ? 'rgba(218,165,32,0.2)' : 'rgba(92,64,51,0.15)', border: `1px solid ${linkTarget && !saving ? 'rgba(218,165,32,0.4)' : 'rgba(92,64,51,0.3)'}`, borderRadius: '10px', color: linkTarget && !saving ? '#DAA520' : '#7B6845', cursor: linkTarget && !saving ? 'pointer' : 'default', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 600, marginTop: '4px', transition: 'all 0.2s' }}
              >
                <Sprout size={16} />
                {saving ? 'Linking…' : 'Link This Person'}
              </button>
            </div>
          ) : (
            <>
          <Field label="Full Name" value={form.name} onChange={(v) => update('name', v)} placeholder="e.g. Kiprotich Korir" required />

          <Field label="Year of Birth" value={form.birth} onChange={(v) => update('birth', v)} placeholder="e.g. 1942" />
          {showDeath ? (
            <div style={{ position: 'relative' }}>
              <Field label="Year of Death" value={form.death} onChange={(v) => update('death', v)} placeholder="e.g. 2001" />
              <button
                onClick={() => { setShowDeath(false); update('death', ''); }}
                style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', color: '#5C4033', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'var(--font-mono)', fontSize: '10px' }}
              >
                <Minus size={11} /> remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeath(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#8B6914', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '2px 0' }}
            >
              <Plus size={11} /> Deceased? Add year of death
            </button>
          )}

          {/* Gender */}
          <div>
            <label style={labelStyle}>Gender</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['M', 'F'].map((g) => {
                const locked = relationship === 'mother' || relationship === 'father';
                return (
                  <button
                    key={g}
                    onClick={() => !locked && update('gender', g)}
                    style={{
                      flex: 1, padding: '9px',
                      background: form.gender === g ? 'rgba(218,165,32,0.15)' : 'rgba(92,64,51,0.15)',
                      border: `1px solid ${form.gender === g ? 'rgba(218,165,32,0.4)' : 'rgba(92,64,51,0.4)'}`,
                      borderRadius: '8px',
                      color: form.gender === g ? '#DAA520' : '#A89070',
                      cursor: locked ? 'default' : 'pointer',
                      fontSize: '12.5px', fontFamily: 'var(--font-body)', fontWeight: 500,
                      opacity: locked && form.gender !== g ? 0.35 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {g === 'M' ? '♂ Male' : '♀ Female'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clan field for child of female */}
          {relationship === 'child' && effectiveAnchor?.gender === 'F' && (
            <div>
              <Field label="Father's Clan" value={form.clan} onChange={(v) => update('clan', v)} placeholder="e.g. Kipkenda, Kapchemulwo…" />
              <p style={{ fontSize: '10.5px', color: '#7B6845', fontFamily: 'var(--font-body)', margin: '4px 0 0', lineHeight: 1.4 }}>
                Their children follow their father's lineage.
              </p>
            </div>
          )}

          <Field label="Their Story / Notes" value={form.story} onChange={(v) => update('story', v)} placeholder="Any details about their life or lineage…" multiline />

          {/* ── Children section ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showChildren ? '8px' : '0' }}>
              <label style={labelStyle}>THEIR CHILDREN</label>
              <button
                onClick={addChildRow}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#8B6914', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '2px 0' }}
              >
                <Plus size={11} /> Add child
              </button>
            </div>

            {showChildren && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {children.map((child, i) => (
                  <div key={child.id} style={childCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#A89070', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Child {i + 1}</span>
                      <button onClick={() => removeChild(child.id)} style={{ background: 'none', border: 'none', color: '#5C4033', cursor: 'pointer', padding: '0', display: 'flex' }}>
                        <Minus size={13} />
                      </button>
                    </div>
                    <input
                      placeholder="Full name"
                      value={child.name}
                      onChange={(e) => updateChild(child.id, 'name', e.target.value)}
                      style={miniInputStyle}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
                      <input
                        placeholder="Born"
                        value={child.birth}
                        onChange={(e) => updateChild(child.id, 'birth', e.target.value)}
                        style={miniInputStyle}
                      />
                      <input
                        placeholder="Died"
                        value={child.death}
                        onChange={(e) => updateChild(child.id, 'death', e.target.value)}
                        style={miniInputStyle}
                      />
                      {['M', 'F'].map((g) => (
                        <button
                          key={g}
                          onClick={() => updateChild(child.id, 'gender', g)}
                          style={{
                            padding: '6px 8px', borderRadius: '6px', cursor: 'pointer',
                            background: child.gender === g ? 'rgba(218,165,32,0.15)' : 'rgba(92,64,51,0.15)',
                            border: `1px solid ${child.gender === g ? 'rgba(218,165,32,0.4)' : 'rgba(92,64,51,0.3)'}`,
                            color: child.gender === g ? '#DAA520' : '#7B6845',
                            fontSize: '12px', fontFamily: 'var(--font-body)',
                          }}
                        >
                          {g === 'M' ? '♂' : '♀'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={addChildRow} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px', background: 'rgba(92,64,51,0.1)', border: '1px dashed rgba(92,64,51,0.3)', borderRadius: '8px', color: '#7B6845', cursor: 'pointer', fontSize: '11.5px', fontFamily: 'var(--font-body)' }}>
                  <Plus size={12} /> Add another child
                </button>
              </div>
            )}
          </div>

          {error && (
            <p style={{ color: '#e05555', fontSize: '12px', margin: 0, fontFamily: 'var(--font-body)', padding: '8px 12px', background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '8px' }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!form.name.trim() || saving}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '12px',
              background: form.name.trim() && !saving ? 'rgba(218,165,32,0.2)' : 'rgba(92,64,51,0.15)',
              border: `1px solid ${form.name.trim() && !saving ? 'rgba(218,165,32,0.4)' : 'rgba(92,64,51,0.3)'}`,
              borderRadius: '10px',
              color: form.name.trim() && !saving ? '#DAA520' : '#7B6845',
              cursor: form.name.trim() && !saving ? 'pointer' : 'default',
              fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 600,
              marginTop: '4px', transition: 'all 0.2s',
            }}
          >
            <Sprout size={16} />
            {saving ? 'Planting…' : 'Plant This Branch'}
          </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required, multiline, hint }) {
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: '#DAA520', marginLeft: '3px' }}>*</span>}
      </label>
      <Tag
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={multiline ? 3 : undefined}
        style={{
          width: '100%', background: 'rgba(92,64,51,0.2)',
          border: '1px solid rgba(92,64,51,0.4)', borderRadius: '8px',
          padding: '9px 12px', color: '#E8DCC8', fontSize: '13px',
          fontFamily: 'var(--font-body)', outline: 'none',
          boxSizing: 'border-box', resize: multiline ? 'vertical' : 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#8B6914')}
        onBlur={(e) => (e.target.style.borderColor = 'rgba(92,64,51,0.4)')}
      />
      {hint && <p style={{ fontSize: '10px', color: '#5C4033', fontFamily: 'var(--font-mono)', margin: '3px 0 0' }}>{hint}</p>}
    </div>
  );
}

// ── Styles ──
const labelStyle = {
  display: 'block', fontSize: '10px', color: '#A89070', fontWeight: 500,
  marginBottom: '5px', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
  textTransform: 'uppercase',
};
const titleStyle = {
  fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 400,
  color: '#DAA520', margin: '10px 0 4px',
};
const subtitleStyle = {
  fontSize: '12px', color: '#7B6845', fontFamily: 'var(--font-body)',
  maxWidth: '280px', margin: '0 auto', lineHeight: 1.5,
};
const chainBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '8px',
  width: '100%', padding: '10px 14px',
  background: 'rgba(92,64,51,0.15)', border: '1px solid rgba(92,64,51,0.35)',
  borderRadius: '8px', color: '#D4C4A8', cursor: 'pointer',
  fontSize: '12.5px', fontFamily: 'var(--font-body)', fontWeight: 500,
  transition: 'all 0.2s', textAlign: 'left',
};
const childCardStyle = {
  background: 'rgba(92,64,51,0.1)', border: '1px solid rgba(92,64,51,0.25)',
  borderRadius: '8px', padding: '10px',
};
const miniInputStyle = {
  width: '100%', background: 'rgba(92,64,51,0.2)',
  border: '1px solid rgba(92,64,51,0.35)', borderRadius: '6px',
  padding: '7px 10px', color: '#E8DCC8', fontSize: '12px',
  fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
};
const panelStyle = {
  position: 'absolute', top: 0, right: 0, width: '380px', maxWidth: '100vw',
  height: '100%',
  background: 'linear-gradient(180deg, #0D0906 0%, #1A120B 50%, #2C1810 100%)',
  borderLeft: '1px solid rgba(92,64,51,0.5)',
  zIndex: 30, overflowY: 'auto', padding: '20px', boxSizing: 'border-box',
  animation: 'slideInRight 0.35s var(--ease-out)',
  boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
};
const closeBtnStyle = {
  position: 'absolute', top: '14px', right: '14px',
  background: 'rgba(92,64,51,0.3)', border: '1px solid rgba(92,64,51,0.5)',
  borderRadius: '6px', padding: '6px', color: '#A89070', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
};
