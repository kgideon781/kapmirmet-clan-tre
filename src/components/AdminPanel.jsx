import { useEffect, useState } from 'react';
import { X, Check, XCircle, Clock } from 'lucide-react';
import { fetchPending, verifyPerson, rejectPerson } from '../lib/db';

export default function AdminPanel({ onClose, onRefreshTree }) {
  const [queue, setQueue]   = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await fetchPending();
    setQueue(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleVerify(id) {
    await verifyPerson(id);
    setQueue((q) => q.filter((p) => p.id !== id));
    onRefreshTree();
  }

  async function handleReject(id) {
    await rejectPerson(id);
    setQueue((q) => q.filter((p) => p.id !== id));
    onRefreshTree();
  }

  return (
    <div style={panelStyle}>
      <button onClick={onClose} style={closeBtnStyle}><X size={18} /></button>

      <div style={{ marginBottom: '20px', paddingTop: '4px' }}>
        <p style={{ fontSize: '10px', color: '#A89070', fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px' }}>Moderation</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 400, color: '#DAA520', margin: 0 }}>
          Verification Queue
        </h2>
        <p style={{ fontSize: '11.5px', color: '#7B6845', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>
          {loading ? '…' : `${queue.length} pending`}
        </p>
      </div>

      {loading && (
        <p style={{ color: '#7B6845', fontFamily: 'var(--font-body)', fontSize: '13px' }}>Loading…</p>
      )}

      {!loading && queue.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#7B6845' }}>
          <Check size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', margin: 0 }}>All clear — nothing to review.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {queue.map((person) => (
          <div key={person.id} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '22px', lineHeight: 1 }}>{person.gender === 'F' ? '♀' : '♂'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '14px', fontFamily: 'var(--font-display)', color: '#E8DCC8', fontWeight: 400 }}>
                  {person.name}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '10.5px', color: '#7B6845', fontFamily: 'var(--font-mono)' }}>
                  {person.birth ? `b. ${person.birth}` : 'birth unknown'}
                  {person.clan && person.clan !== 'Kapmirmet' ? ` · ${person.clan}` : ''}
                  {person.is_maternal ? ' · maternal' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <Clock size={10} style={{ color: '#7B6845' }} />
                <span style={{ fontSize: '9.5px', color: '#7B6845', fontFamily: 'var(--font-mono)' }}>
                  {new Date(person.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {person.story && (
              <p style={{ fontSize: '12px', color: '#A89070', fontFamily: 'var(--font-body)', fontStyle: 'italic', margin: '0 0 8px', lineHeight: 1.5, borderLeft: '2px solid rgba(92,64,51,0.4)', paddingLeft: '8px' }}>
                {person.story}
              </p>
            )}

            {/* Who added */}
            {person.adder && (
              <p style={{ fontSize: '10px', color: '#5C4033', fontFamily: 'var(--font-mono)', margin: '0 0 10px' }}>
                Added by {person.adder.full_name || person.adder.email}
              </p>
            )}

            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => handleVerify(person.id)} style={verifyBtnStyle}>
                <Check size={13} /> Verify
              </button>
              <button onClick={() => handleReject(person.id)} style={rejectBtnStyle}>
                <XCircle size={13} /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
const cardStyle = {
  background: 'rgba(92,64,51,0.12)', border: '1px solid rgba(92,64,51,0.3)',
  borderRadius: '10px', padding: '12px',
};
const verifyBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '5px', flex: 1, justifyContent: 'center',
  padding: '8px', background: 'rgba(76,175,80,0.15)',
  border: '1px solid rgba(76,175,80,0.35)', borderRadius: '7px',
  color: '#4CAF50', cursor: 'pointer', fontSize: '12px',
  fontFamily: 'var(--font-body)', fontWeight: 600, transition: 'all 0.2s',
};
const rejectBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '5px', flex: 1, justifyContent: 'center',
  padding: '8px', background: 'rgba(224,85,85,0.1)',
  border: '1px solid rgba(224,85,85,0.3)', borderRadius: '7px',
  color: '#e05555', cursor: 'pointer', fontSize: '12px',
  fontFamily: 'var(--font-body)', fontWeight: 600, transition: 'all 0.2s',
};
