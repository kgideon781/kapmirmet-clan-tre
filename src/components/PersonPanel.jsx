import { useState, useRef } from 'react';
import { X, UserPlus, Camera, MessageCircle, Send, Check, Loader, Trash2, Pencil } from 'lucide-react';
import { BADGE_MAP, CLAN_COLORS } from '../data/clanData';
import { claimProfile, deletePerson, updatePerson, uploadPersonPhoto } from '../lib/db';
import { useAuth } from '../context/AuthContext';

const BADGE_KEYS = Object.keys(BADGE_MAP);

export default function PersonPanel({ person, onClose, onAddRelative, onLoginRequired, onPersonDeleted, onPersonUpdated }) {
  const { user, isMod, role } = useAuth();
  const isAdmin = role === 'admin';
  const canEdit = isAdmin || isMod || (user && user.id === person?.added_by);

  const [currentBadge, setCurrentBadge] = useState(person?.badge || null);
  const [settingBadge, setSettingBadge] = useState(false);
  const [claiming, setClaiming]         = useState(false);
  const [claimed, setClaimedLocal]      = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing]       = useState(false);
  const [editForm, setEditForm]         = useState(null);
  const [saving, setSaving]             = useState(false);
  const [editError, setEditError]       = useState(null);
  const [photoUrl, setPhotoUrl]         = useState(person?.photo_url || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  if (!person) return null;

  const badge = person.badge ? BADGE_MAP[person.badge] : null;
  const clan = person.clan || 'Kapmirmet';
  const colors = CLAN_COLORS[clan] || CLAN_COLORS.Kapmirmet;
  const isFounder = person.badge === 'founder';
  const canUploadPhoto = isAdmin || (user && (user.id === person.claimed_by || user.id === person.added_by));

  async function handleClaim() {
    if (!user) { onLoginRequired?.(); return; }
    setClaiming(true);
    try { await claimProfile(person.id); setClaimedLocal(true); }
    catch (e) { console.error(e); }
    finally { setClaiming(false); }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try { await deletePerson(person.id); onPersonDeleted?.(); }
    catch (e) { console.error(e); setDeleting(false); setConfirmDelete(false); }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadPersonPhoto(person.id, file);
      setPhotoUrl(url);
      onPersonUpdated?.();
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  }

  function startEdit() {
    setEditForm({
      name: person.name || '',
      birth: person.birth ? String(person.birth) : '',
      death: person.death ? String(person.death) : '',
      gender: person.gender || 'M',
      story: person.story || '',
      clan: person.clan || 'Kapmirmet',
    });
    setEditError(null);
    setIsEditing(true);
  }

  async function saveEdit() {
    if (!editForm.name.trim()) return;
    setSaving(true);
    setEditError(null);
    try {
      await updatePerson(person.id, {
        name: editForm.name.trim(),
        birth: editForm.birth ? parseInt(editForm.birth, 10) : null,
        death: editForm.death ? parseInt(editForm.death, 10) : null,
        gender: editForm.gender,
        story: editForm.story?.trim() || null,
        clan: editForm.clan || 'Kapmirmet',
      });
      setIsEditing(false);
      onPersonUpdated?.();
    } catch (err) {
      setEditError(err.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetBadge(badgeKey) {
    setSettingBadge(badgeKey ?? 'clear');
    try {
      await updatePerson(person.id, { badge: badgeKey });
      setCurrentBadge(badgeKey);
      onPersonUpdated?.();
    } catch (e) { console.error(e); }
    finally { setSettingBadge(false); }
  }

  function guardedAdd(rel) {
    if (!user) { onLoginRequired?.(); return; }
    onAddRelative?.(person, rel);
  }

  const avatarSize = isFounder ? 90 : 72;

  return (
    <div style={panelStyle}>
      {/* Header actions */}
      <div style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', gap: '6px', zIndex: 2 }}>
        {canEdit && !isEditing && (
          <button onClick={startEdit} style={iconBtnStyle} title="Edit person">
            <Pencil size={14} />
          </button>
        )}
        <button onClick={onClose} style={iconBtnStyle}><X size={18} /></button>
      </div>

      {/* Avatar + Photo upload */}
      <div style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '8px' }}>
        <div style={{ position: 'relative', width: avatarSize, margin: '0 auto 14px', display: 'inline-block' }}>
          <div
            style={{
              width: avatarSize, height: avatarSize, borderRadius: '50%',
              background: photoUrl ? 'transparent' : `linear-gradient(135deg, ${colors.primary}, ${colors.leaf})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isFounder ? '36px' : '28px',
              border: isFounder ? '3px solid #FFD700' : person.claimed ? '2.5px solid #4CAF50' : '2px solid #5C4033',
              boxShadow: isFounder ? '0 0 30px rgba(218,165,32,0.35)' : badge ? `0 0 20px ${colors.glow}` : '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            {photoUrl
              ? <img src={photoUrl} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (person.gender === 'F' ? '♀' : '♂')
            }
            {isFounder && !photoUrl && (
              <span style={{ position: 'absolute', right: '-16px', bottom: '-4px', fontSize: '24px' }}>🦅</span>
            )}
          </div>

          {/* Camera overlay */}
          {canUploadPhoto && (
            <>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload photo"
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: '#1A120B', border: '1.5px solid #8B6914',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#DAA520',
                }}
              >
                {uploadingPhoto
                  ? <Loader size={10} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Camera size={10} />
                }
              </button>
            </>
          )}
        </div>

        {/* Badge */}
        {badge && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '10px', background: `${badge.color}18`, border: `1px solid ${badge.color}30`, fontSize: '11px', color: badge.color, marginBottom: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
            {badge.icon} {badge.label}
          </div>
        )}

        {/* Name + dates */}
        {!isEditing && (
          <>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isFounder ? '22px' : '19px', fontWeight: 400, margin: '6px 0 4px', color: '#E8DCC8', lineHeight: 1.2 }}>
              {person.name}
            </h2>
            <p style={{ fontSize: '11px', color: '#7B6845', fontFamily: 'var(--font-mono)' }}>
              {person.birth && (person.death ? `${person.birth}–${person.death}` : `b. ${person.birth}`)}
              {person.birth && ' · '}
              {clan}
            </p>
            {person.claimed && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '10px', color: '#4CAF50', fontFamily: 'var(--font-mono)' }}>
                <Check size={12} /> Claimed
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Edit Form ── */}
      {isEditing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', padding: '14px', background: 'rgba(92,64,51,0.1)', borderRadius: '10px', border: '1px solid rgba(92,64,51,0.25)' }}>
          <p style={labelStyle}>EDITING: {person.name}</p>

          <EField label="Full Name" value={editForm.name} onChange={(v) => setEditForm((f) => ({ ...f, name: v }))} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <EField label="Birth Year" value={editForm.birth} onChange={(v) => setEditForm((f) => ({ ...f, birth: v }))} placeholder="e.g. 1942" />
            <EField label="Death Year" value={editForm.death} onChange={(v) => setEditForm((f) => ({ ...f, death: v }))} placeholder="Leave blank if living" />
          </div>

          <div>
            <label style={labelStyle}>Gender</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['M', 'F'].map((g) => (
                <button key={g} onClick={() => setEditForm((f) => ({ ...f, gender: g }))}
                  style={{ flex: 1, padding: '7px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-body)', border: `1px solid ${editForm.gender === g ? 'rgba(218,165,32,0.4)' : 'rgba(92,64,51,0.4)'}`, background: editForm.gender === g ? 'rgba(218,165,32,0.15)' : 'rgba(92,64,51,0.15)', color: editForm.gender === g ? '#DAA520' : '#A89070' }}>
                  {g === 'M' ? '♂ Male' : '♀ Female'}
                </button>
              ))}
            </div>
          </div>

          <EField label="Clan" value={editForm.clan} onChange={(v) => setEditForm((f) => ({ ...f, clan: v }))} placeholder="e.g. Kapmirmet" />
          <EField label="Story / Notes" value={editForm.story} onChange={(v) => setEditForm((f) => ({ ...f, story: v }))} multiline />

          {editError && (
            <p style={{ color: '#e05555', fontSize: '11.5px', fontFamily: 'var(--font-body)', margin: 0 }}>{editError}</p>
          )}

          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={saveEdit} disabled={!editForm.name.trim() || saving} style={{ flex: 2, padding: '9px', background: 'rgba(218,165,32,0.15)', border: '1px solid rgba(218,165,32,0.35)', borderRadius: '8px', color: '#DAA520', cursor: 'pointer', fontSize: '12.5px', fontFamily: 'var(--font-body)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {saving ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '9px', background: 'rgba(92,64,51,0.15)', border: '1px solid rgba(92,64,51,0.35)', borderRadius: '8px', color: '#A89070', cursor: 'pointer', fontSize: '12.5px', fontFamily: 'var(--font-body)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Story */}
      {!isEditing && person.story && (
        <div style={storyBlockStyle}>
          <p style={{ fontSize: '10px', color: '#A89070', margin: '0 0 6px', fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            📜 Their Story
          </p>
          <p style={{ fontSize: '13.5px', lineHeight: 1.7, margin: 0, color: '#D4C4A8', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
            {person.story}
          </p>
        </div>
      )}

      {/* Action buttons */}
      {!isEditing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
          {!person.claimed && !claimed && (
            <ActionBtn
              icon={claiming ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={14} />}
              label={claiming ? 'Claiming…' : 'Claim This Profile'}
              highlight
              onClick={handleClaim}
            />
          )}
          {(person.claimed || claimed) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.25)', borderRadius: '8px', fontSize: '12px', color: '#4CAF50', fontFamily: 'var(--font-body)' }}>
              <Check size={13} /> Profile claimed
            </div>
          )}

          {person.status === 'pending' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', background: 'rgba(218,165,32,0.08)', border: '1px solid rgba(218,165,32,0.2)', borderRadius: '8px', fontSize: '11px', color: '#DAA520', fontFamily: 'var(--font-mono)' }}>
              ⏳ Pending verification
            </div>
          )}

          {/* Badge assignment — admins/mods only */}
          {(isAdmin || isMod) && (
            <div style={{ marginTop: '4px' }}>
              <p style={{ ...labelStyle, marginBottom: '6px' }}>ASSIGN BADGE</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                {BADGE_KEYS.map((key) => {
                  const b = BADGE_MAP[key];
                  const active = currentBadge === key;
                  return (
                    <button
                      key={key}
                      onClick={() => active ? handleSetBadge(null) : handleSetBadge(key)}
                      title={`${b.label}: ${b.description}`}
                      disabled={!!settingBadge}
                      style={{
                        padding: '7px 4px', textAlign: 'center', borderRadius: '7px', cursor: 'pointer',
                        background: active ? `${b.color}22` : 'rgba(92,64,51,0.1)',
                        border: `1px solid ${active ? b.color + '60' : 'rgba(92,64,51,0.25)'}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                        transition: 'all 0.15s', opacity: settingBadge && !active ? 0.5 : 1,
                      }}
                    >
                      <span style={{ fontSize: '15px', lineHeight: 1 }}>
                        {settingBadge === key ? '⏳' : b.icon}
                      </span>
                      <span style={{ fontSize: '8px', color: active ? b.color : '#6B5A4E', fontFamily: 'var(--font-mono)', lineHeight: 1.1, textAlign: 'center' }}>
                        {b.label.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
              {currentBadge && (
                <button
                  onClick={() => handleSetBadge(null)}
                  style={{ marginTop: '5px', width: '100%', padding: '5px', background: 'none', border: '1px dashed rgba(92,64,51,0.3)', borderRadius: '6px', color: '#5C4033', cursor: 'pointer', fontSize: '10px', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}
                >
                  {settingBadge === 'clear' ? 'Clearing…' : 'Remove badge'}
                </button>
              )}
            </div>
          )}

          {isAdmin && (
            <button onClick={handleDelete} disabled={deleting} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', background: confirmDelete ? 'rgba(224,85,85,0.18)' : 'rgba(224,85,85,0.07)', border: `1px solid ${confirmDelete ? 'rgba(224,85,85,0.5)' : 'rgba(224,85,85,0.2)'}`, borderRadius: '8px', color: '#e05555', cursor: 'pointer', fontSize: '12.5px', fontFamily: 'var(--font-body)', fontWeight: 500, transition: 'all 0.2s' }}>
              {deleting ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
              {deleting ? 'Deleting…' : confirmDelete ? 'Confirm delete — cannot be undone' : 'Delete person'}
            </button>
          )}

          <p style={{ fontSize: '10px', color: '#7B6845', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px', margin: '4px 0 2px', textTransform: 'uppercase' }}>
            Add Relatives
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <ActionBtn icon="↓" label="Child"   onClick={() => guardedAdd('child')} />
            <ActionBtn icon="♀" label="Mother"  onClick={() => guardedAdd('mother')} />
            <ActionBtn icon="↑" label="Father"  onClick={() => guardedAdd('father')} />
            <ActionBtn icon="↔" label="Sibling" onClick={() => guardedAdd('sibling')} />
          </div>
          <ActionBtn icon={<MessageCircle size={14} />} label="Add a Memory" />
          <ActionBtn icon={<Send size={14} />} label="Invite Relatives" />
        </div>
      )}

      {/* Children */}
      {!isEditing && person.children && person.children.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <p style={{ fontSize: '10px', color: '#A89070', fontWeight: 600, marginBottom: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
            CHILDREN ({person.children.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {person.children.map((c) => (
              <div key={c.id} style={childRowStyle}>
                <span style={{ fontSize: '14px' }}>{c.gender === 'F' ? '♀' : '♂'}</span>
                <span style={{ fontSize: '13px', fontFamily: 'var(--font-body)' }}>{c.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#7B6845', fontFamily: 'var(--font-mono)' }}>
                  {c.birth && (c.death ? `${c.birth}–${c.death}` : `b. ${c.birth}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, highlight, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px',
        background: highlight ? 'rgba(218,165,32,0.12)' : 'rgba(92,64,51,0.15)',
        border: `1px solid ${highlight ? 'rgba(218,165,32,0.3)' : 'rgba(92,64,51,0.4)'}`,
        borderRadius: '8px', color: highlight ? '#DAA520' : '#D4C4A8', cursor: 'pointer',
        fontSize: '12.5px', fontFamily: 'var(--font-body)', fontWeight: 500,
        textAlign: 'left', transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = highlight ? 'rgba(218,165,32,0.2)' : 'rgba(92,64,51,0.25)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = highlight ? 'rgba(218,165,32,0.12)' : 'rgba(92,64,51,0.15)'; }}
    >
      {typeof icon === 'string' ? <span>{icon}</span> : icon}
      {label}
    </button>
  );
}

function EField({ label, value, onChange, placeholder, required, multiline }) {
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: '#DAA520', marginLeft: '3px' }}>*</span>}
      </label>
      <Tag
        type="text" value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={multiline ? 3 : undefined}
        style={{ width: '100%', background: 'rgba(92,64,51,0.2)', border: '1px solid rgba(92,64,51,0.4)', borderRadius: '7px', padding: '8px 10px', color: '#E8DCC8', fontSize: '12.5px', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box', resize: multiline ? 'vertical' : 'none' }}
        onFocus={(e) => (e.target.style.borderColor = '#8B6914')}
        onBlur={(e) => (e.target.style.borderColor = 'rgba(92,64,51,0.4)')}
      />
    </div>
  );
}

// ── Styles ──
const panelStyle = { position: 'absolute', top: 0, right: 0, width: '380px', maxWidth: '100vw', height: '100%', background: 'linear-gradient(180deg, #0D0906 0%, #1A120B 50%, #2C1810 100%)', borderLeft: '1px solid rgba(92,64,51,0.5)', zIndex: 30, overflowY: 'auto', padding: '20px', boxSizing: 'border-box', animation: 'slideInRight 0.35s var(--ease-out)', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)' };
const iconBtnStyle = { background: 'rgba(92,64,51,0.3)', border: '1px solid rgba(92,64,51,0.5)', borderRadius: '6px', padding: '6px', color: '#A89070', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' };
const storyBlockStyle = { padding: '14px', background: 'rgba(92,64,51,0.12)', borderRadius: '10px', borderLeft: '3px solid #DAA520' };
const childRowStyle = { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'rgba(92,64,51,0.1)', borderRadius: '6px' };
const labelStyle = { display: 'block', fontSize: '10px', color: '#A89070', fontWeight: 500, marginBottom: '5px', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px', textTransform: 'uppercase' };
