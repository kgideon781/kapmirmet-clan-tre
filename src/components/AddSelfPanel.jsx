import { useState } from 'react';
import { X, Sprout, ArrowRight } from 'lucide-react';
import { addPerson, updatePerson } from '../lib/db';

// relationship: 'child' | 'mother' | 'father' | 'sibling'
const RELATIONSHIPS = [
  { key: 'child',   label: (a) => `Child of ${a}`,   defaultGender: null },
  { key: 'sibling', label: (a) => `Sibling of ${a}`,  defaultGender: null },
  { key: 'mother',  label: (a) => `Mother of ${a}`,   defaultGender: 'F'  },
  { key: 'father',  label: (a) => `Father of ${a}`,   defaultGender: 'M'  },
];

export default function AddSelfPanel({ onClose, anchor, relationship: initialRel, onPersonAdded }) {
  const hasAnchor = !!anchor;
  const defaultRel = initialRel || 'child';

  const [relationship, setRelationship] = useState(defaultRel);
  const [form, setForm] = useState({
    name: '',
    birth: '',
    gender: genderForRelationship(defaultRel),
    story: '',
    clan: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);
  const [saved, setSaved]   = useState(null); // the newly created person
  const [chain, setChain]   = useState(null); // { anchor, relationship } for chaining

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  function handleRelationshipChange(rel) {
    setRelationship(rel);
    const g = genderForRelationship(rel);
    if (g) update('gender', g);
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
            name: form.name, birth: form.birth,
            gender: form.gender, notes: form.story,
            parentId: anchor?.id || null,
            clan: form.clan || undefined,
          });
          break;
        case 'sibling':
          newPerson = await addPerson({
            name: form.name, birth: form.birth,
            gender: form.gender, notes: form.story,
            parentId: anchor?.parent_id || null,
          });
          break;
        case 'mother': {
          newPerson = await addPerson({
            name: form.name, birth: form.birth,
            gender: 'F', notes: form.story,
          });
          await updatePerson(anchor.id, { mother_id: newPerson.id });
          break;
        }
        case 'father': {
          newPerson = await addPerson({
            name: form.name, birth: form.birth,
            gender: 'M', notes: form.story,
          });
          await updatePerson(anchor.id, { parent_id: newPerson.id });
          break;
        }
        default:
          newPerson = await addPerson({
            name: form.name, birth: form.birth,
            gender: form.gender, notes: form.story,
          });
      }
      setSaved(newPerson);
      onPersonAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // After saving, user can chain to another add
  function startChain(chainRel) {
    setChain({ anchor: saved, relationship: chainRel });
    setSaved(null);
    setForm({ name: '', birth: '', gender: genderForRelationship(chainRel), story: '', clan: '' });
    setRelationship(chainRel);
    setError(null);
  }

  // Sync effective anchor for display
  const effectiveAnchor = chain ? chain.anchor : anchor;

  return (
    <div style={panelStyle}>
      <button onClick={onClose} style={closeBtnStyle}><X size={18} /></button>

      <div style={{ textAlign: 'center', marginBottom: '18px', paddingTop: '8px' }}>
        <span style={{ fontSize: '40px', display: 'block', lineHeight: 1 }}>🌱</span>
        <h2 style={titleStyle}>
          {effectiveAnchor ? `${effectiveAnchor.name}'s Family` : 'Plant Yourself on the Tree'}
        </h2>
        <p style={subtitleStyle}>
          {effectiveAnchor
            ? 'Choose a relationship and fill in their details.'
            : "Add yourself even if you don't know your exact branch yet."}
        </p>
      </div>

      {saved ? (
        // ── Success + chain options ──
        <div style={{ animation: 'slideInUp 0.4s var(--ease-out)' }}>
          <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🌿</span>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#DAA520', margin: '0 0 4px' }}>
              {saved.name} added!
            </p>
            <p style={{ fontSize: '12px', color: '#7B6845', fontFamily: 'var(--font-body)' }}>
              Keep building the tree — add more relatives below.
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
        // ── Form ──
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Relationship selector (only when anchor exists) */}
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
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      textAlign: 'center',
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

          <Field label="Full Name" value={form.name} onChange={(v) => update('name', v)} placeholder="e.g. Kiprotich Korir" required />
          <Field label="Year of Birth" value={form.birth} onChange={(v) => update('birth', v)} placeholder="e.g. 1985" />

          {/* Gender (locked for mother/father) */}
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

          {/* Clan field — shown when adding a child to a female node */}
          {relationship === 'child' && (effectiveAnchor ?? anchor)?.gender === 'F' && (
            <div>
              <Field
                label="Father's Clan"
                value={form.clan}
                onChange={(v) => update('clan', v)}
                placeholder="e.g. Kipkenda, Kapchemulwo…"
              />
              <p style={{ fontSize: '10.5px', color: '#7B6845', fontFamily: 'var(--font-body)', margin: '4px 0 0', lineHeight: 1.4 }}>
                Their children follow their father's lineage. They'll appear in the tree with a dashed branch.
              </p>
            </div>
          )}

          <Field label="Their Story / Notes" value={form.story} onChange={(v) => update('story', v)} placeholder="Any details about their life or lineage…" multiline />

          {error && (
            <p style={{ color: '#e05555', fontSize: '12px', margin: 0, fontFamily: 'var(--font-body)' }}>{error}</p>
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
        </div>
      )}
    </div>
  );
}

function genderForRelationship(rel) {
  if (rel === 'mother') return 'F';
  if (rel === 'father') return 'M';
  return 'M';
}

function Field({ label, value, onChange, placeholder, required, multiline }) {
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
  background: 'rgba(92,64,51,0.15)',
  border: '1px solid rgba(92,64,51,0.35)',
  borderRadius: '8px', color: '#D4C4A8', cursor: 'pointer',
  fontSize: '12.5px', fontFamily: 'var(--font-body)', fontWeight: 500,
  transition: 'all 0.2s', textAlign: 'left',
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
