import { useEffect, useState } from 'react';
import { X, Check, XCircle, Clock, ShieldCheck, ShieldOff, Users, Trash2 } from 'lucide-react';
import { fetchPending, verifyPerson, rejectPerson, verifyPeopleBulk, fetchProfilesWithRoles, setUserRole, removeUserRole, deletePersonWithReroute, denyDeletionRequest } from '../lib/db';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel({ onClose, onRefreshTree }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('queue');

  return (
    <div style={panelStyle}>
      <button onClick={onClose} style={closeBtnStyle}><X size={18} /></button>

      <div style={{ marginBottom: '16px', paddingTop: '4px' }}>
        <p style={{ fontSize: '10px', color: '#A89070', fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px' }}>Moderation</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 400, color: '#DAA520', margin: 0 }}>
          Admin Panel
        </h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '18px', background: 'rgba(92,64,51,0.1)', borderRadius: '8px', padding: '3px' }}>
        {[
          { key: 'queue', label: 'Review Queue', icon: <Clock size={12} /> },
          { key: 'team',  label: 'Manage Team',  icon: <Users size={12} /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              padding: '7px 8px', borderRadius: '6px', cursor: 'pointer',
              background: tab === key ? 'rgba(218,165,32,0.15)' : 'transparent',
              border: tab === key ? '1px solid rgba(218,165,32,0.3)' : '1px solid transparent',
              color: tab === key ? '#DAA520' : '#7B6845',
              fontSize: '11.5px', fontFamily: 'var(--font-body)', fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'queue' && <QueueTab onRefreshTree={onRefreshTree} />}
      {tab === 'team'  && <TeamTab currentUserId={user?.id} />}
    </div>
  );
}

// ── Verification Queue ──────────────────────────────────────────
function QueueTab({ onRefreshTree }) {
  const [queue, setQueue]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionError, setActionError] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  async function load() {
    setLoading(true);
    setActionError(null);
    const data = await fetchPending();
    setQueue(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleVerify(id) {
    setActionError(null);
    try {
      await verifyPerson(id);
      setQueue((q) => q.filter((p) => p.id !== id));
      onRefreshTree();
    } catch (e) {
      setActionError(e.message || 'Failed to verify. Check console.');
      console.error(e);
    }
  }

  async function handleReject(id) {
    setActionError(null);
    try {
      await rejectPerson(id);
      setQueue((q) => q.filter((p) => p.id !== id));
      onRefreshTree();
    } catch (e) {
      setActionError(e.message || 'Failed to reject.');
      console.error(e);
    }
  }

  async function handleApproveDeletion(id) {
    setActionError(null);
    try {
      await deletePersonWithReroute(id, { action: 'seedling' });
      setQueue((q) => q.filter((p) => p.id !== id));
      onRefreshTree();
    } catch (e) {
      setActionError(e.message || 'Failed to delete.');
      console.error(e);
    }
  }

  async function handleDenyDeletion(id) {
    setActionError(null);
    try {
      await denyDeletionRequest(id);
      setQueue((q) => q.filter((p) => p.id !== id));
    } catch (e) {
      setActionError(e.message || 'Failed to deny.');
      console.error(e);
    }
  }

  async function handleApproveAll() {
    const ids = queue.filter((p) => p._queueType === 'pending').map((p) => p.id);
    if (!ids.length) return;
    setBulkBusy(true);
    setActionError(null);
    try {
      await verifyPeopleBulk(ids);
      setQueue((q) => q.filter((p) => p._queueType !== 'pending'));
      onRefreshTree();
    } catch (e) {
      setActionError(e.message || 'Bulk approve failed.');
      console.error(e);
    } finally {
      setBulkBusy(false);
    }
  }

  if (loading) return <p style={{ color: '#7B6845', fontFamily: 'var(--font-body)', fontSize: '13px' }}>Loading…</p>;

  const pending   = queue.filter((p) => p._queueType === 'pending');
  const deletions = queue.filter((p) => p._queueType === 'deletion');

  if (queue.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#7B6845' }}>
      <Check size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', margin: 0 }}>All clear — nothing to review.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {actionError && (
        <div style={{ padding: '10px 12px', background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: '8px', fontSize: '12px', color: '#e05555', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
          {actionError}
        </div>
      )}

      {/* Pending additions */}
      {pending.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <p style={{ fontSize: '10px', color: '#A89070', fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
              {pending.length} pending addition{pending.length !== 1 ? 's' : ''}
            </p>
            {pending.length > 1 && (
              <button
                onClick={handleApproveAll}
                disabled={bulkBusy}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: '6px', color: '#4CAF50', cursor: bulkBusy ? 'default' : 'pointer', fontSize: '11px', fontFamily: 'var(--font-body)', fontWeight: 600, opacity: bulkBusy ? 0.6 : 1 }}
              >
                <Check size={11} /> {bulkBusy ? 'Approving…' : `Approve all ${pending.length}`}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pending.map((person) => (
              <div key={person.id} style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '22px', lineHeight: 1 }}>{person.gender === 'F' ? '♀' : '♂'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontFamily: 'var(--font-display)', color: '#E8DCC8', fontWeight: 400 }}>{person.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '10.5px', color: '#7B6845', fontFamily: 'var(--font-mono)' }}>
                      {person.birth ? `b. ${person.birth}` : 'birth unknown'}
                      {person.death ? ` – ${person.death}` : ''}
                      {person.clan && person.clan !== 'Kapmirmet' ? ` · ${person.clan}` : ''}
                    </p>
                  </div>
                  <span style={{ fontSize: '9.5px', color: '#7B6845', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {new Date(person.created_at).toLocaleDateString()}
                  </span>
                </div>
                {person.story && <p style={{ fontSize: '12px', color: '#A89070', fontFamily: 'var(--font-body)', fontStyle: 'italic', margin: '0 0 8px', lineHeight: 1.5, borderLeft: '2px solid rgba(92,64,51,0.4)', paddingLeft: '8px' }}>{person.story}</p>}
                {person.adder && <p style={{ fontSize: '10px', color: '#5C4033', fontFamily: 'var(--font-mono)', margin: '0 0 10px' }}>Added by {person.adder.full_name || person.adder.email}</p>}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleVerify(person.id)} style={verifyBtnStyle}><Check size={13} /> Verify</button>
                  <button onClick={() => handleReject(person.id)} style={rejectBtnStyle}><XCircle size={13} /> Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deletion requests */}
      {deletions.length > 0 && (
        <div>
          <p style={{ fontSize: '10px', color: '#e05555', fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>
            {deletions.length} deletion request{deletions.length !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {deletions.map((person) => (
              <div key={person.id} style={{ ...cardStyle, borderColor: 'rgba(224,85,85,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '22px', lineHeight: 1 }}>{person.gender === 'F' ? '♀' : '♂'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontFamily: 'var(--font-display)', color: '#E8DCC8', fontWeight: 400 }}>{person.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '10.5px', color: '#7B6845', fontFamily: 'var(--font-mono)' }}>
                      {person.birth ? `b. ${person.birth}` : 'birth unknown'}
                      {person.death ? ` – ${person.death}` : ''}
                    </p>
                  </div>
                </div>
                {person.requester && (
                  <p style={{ fontSize: '10px', color: '#e05555', fontFamily: 'var(--font-mono)', margin: '0 0 10px' }}>
                    Requested by {person.requester.full_name || person.requester.email} · {new Date(person.deletion_requested_at).toLocaleDateString()}
                  </p>
                )}
                <p style={{ fontSize: '10.5px', color: '#7B6845', fontFamily: 'var(--font-body)', margin: '0 0 10px', lineHeight: 1.4 }}>
                  Children will become seedlings. For other rerouting, find them in the tree.
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleApproveDeletion(person.id)} style={{ ...rejectBtnStyle, gap: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={13} /> Approve & Delete
                  </button>
                  <button onClick={() => handleDenyDeletion(person.id)} style={verifyBtnStyle}>
                    <XCircle size={13} /> Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Team / Role Management ──────────────────────────────────────
function TeamTab({ currentUserId }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(null); // userId being updated

  async function load() {
    setLoading(true);
    try {
      const data = await fetchProfilesWithRoles();
      setProfiles(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSetRole(userId, role) {
    setBusy(userId);
    try {
      if (role === null) {
        await removeUserRole(userId);
      } else {
        await setUserRole(userId, role);
      }
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role } : p))
      );
    } catch (e) {
      console.error(e);
    }
    setBusy(null);
  }

  if (loading) return <p style={{ color: '#7B6845', fontFamily: 'var(--font-body)', fontSize: '13px' }}>Loading members…</p>;

  if (profiles.length === 0) return (
    <p style={{ color: '#7B6845', fontFamily: 'var(--font-body)', fontSize: '13px' }}>No members have signed in yet.</p>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ fontSize: '11px', color: '#7B6845', fontFamily: 'var(--font-body)', margin: '0 0 4px', lineHeight: 1.5 }}>
        {profiles.length} member{profiles.length !== 1 ? 's' : ''} · Assign roles to trusted members.
      </p>
      {profiles.map((profile) => {
        const isSelf = profile.id === currentUserId;
        const isBusy = busy === profile.id;
        return (
          <div key={profile.id} style={{ ...cardStyle, opacity: isSelf ? 0.75 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              {/* Avatar */}
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(218,165,32,0.15)', border: '1px solid rgba(218,165,32,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#DAA520', flexShrink: 0 }}>
                  {(profile.full_name || profile.email || '?')[0].toUpperCase()}
                </div>
              )}

              {/* Name + role */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#E8DCC8', fontFamily: 'var(--font-body)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile.full_name || profile.email}
                  {isSelf && <span style={{ fontSize: '10px', color: '#7B6845', fontFamily: 'var(--font-mono)', marginLeft: '6px' }}>you</span>}
                </p>
                {profile.full_name && (
                  <p style={{ margin: '1px 0 0', fontSize: '10px', color: '#5C4033', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile.email}
                  </p>
                )}
              </div>

              {/* Current role chip */}
              {profile.role && (
                <div style={{ flexShrink: 0, padding: '3px 8px', borderRadius: '10px', fontSize: '10px', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px', background: profile.role === 'admin' ? 'rgba(218,165,32,0.15)' : 'rgba(76,175,80,0.12)', color: profile.role === 'admin' ? '#DAA520' : '#4CAF50', border: `1px solid ${profile.role === 'admin' ? 'rgba(218,165,32,0.3)' : 'rgba(76,175,80,0.3)'}` }}>
                  {profile.role}
                </div>
              )}
            </div>

            {/* Role buttons — disabled for self */}
            {isSelf ? (
              <p style={{ fontSize: '10.5px', color: '#5C4033', fontFamily: 'var(--font-mono)', margin: 0 }}>Cannot change your own role</p>
            ) : (
              <div style={{ display: 'flex', gap: '5px' }}>
                <RoleBtn
                  label="Admin"
                  icon={<ShieldCheck size={11} />}
                  active={profile.role === 'admin'}
                  busy={isBusy}
                  color="#DAA520"
                  onClick={() => profile.role === 'admin' ? handleSetRole(profile.id, null) : handleSetRole(profile.id, 'admin')}
                />
                <RoleBtn
                  label="Moderator"
                  icon={<ShieldCheck size={11} />}
                  active={profile.role === 'moderator'}
                  busy={isBusy}
                  color="#4CAF50"
                  onClick={() => profile.role === 'moderator' ? handleSetRole(profile.id, null) : handleSetRole(profile.id, 'moderator')}
                />
                {profile.role && (
                  <RoleBtn
                    label="Remove"
                    icon={<ShieldOff size={11} />}
                    active={false}
                    busy={isBusy}
                    color="#e05555"
                    onClick={() => handleSetRole(profile.id, null)}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RoleBtn({ label, icon, active, busy, color, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        padding: '7px 6px', borderRadius: '7px', cursor: busy ? 'default' : 'pointer',
        background: active ? `${color}20` : 'rgba(92,64,51,0.1)',
        border: `1px solid ${active ? color + '50' : 'rgba(92,64,51,0.25)'}`,
        color: active ? color : '#7B6845',
        fontSize: '11px', fontFamily: 'var(--font-body)', fontWeight: active ? 600 : 400,
        transition: 'all 0.15s', opacity: busy ? 0.5 : 1,
      }}
    >
      {icon} {label}
    </button>
  );
}

// ── Styles ──
const panelStyle = { position: 'absolute', top: 0, right: 0, width: '380px', maxWidth: '100vw', height: '100%', background: 'linear-gradient(180deg, #0D0906 0%, #1A120B 50%, #2C1810 100%)', borderLeft: '1px solid rgba(92,64,51,0.5)', zIndex: 30, overflowY: 'auto', padding: '20px', boxSizing: 'border-box', animation: 'slideInRight 0.35s var(--ease-out)', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)', pointerEvents: 'auto' };
const closeBtnStyle = { position: 'absolute', top: '14px', right: '14px', background: 'rgba(92,64,51,0.3)', border: '1px solid rgba(92,64,51,0.5)', borderRadius: '6px', padding: '6px', color: '#A89070', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 };
const cardStyle = { background: 'rgba(92,64,51,0.12)', border: '1px solid rgba(92,64,51,0.3)', borderRadius: '10px', padding: '12px' };
const verifyBtnStyle = { display: 'flex', alignItems: 'center', gap: '5px', flex: 1, justifyContent: 'center', padding: '8px', background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.35)', borderRadius: '7px', color: '#4CAF50', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-body)', fontWeight: 600 };
const rejectBtnStyle = { display: 'flex', alignItems: 'center', gap: '5px', flex: 1, justifyContent: 'center', padding: '8px', background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: '7px', color: '#e05555', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-body)', fontWeight: 600 };
