import { useState } from 'react';
import { X, UserPlus, Camera, MessageCircle, Send, Check, Loader } from 'lucide-react';
import { BADGE_MAP, CLAN_COLORS } from '../data/clanData';
import { claimProfile } from '../lib/db';
import { useAuth } from '../context/AuthContext';

export default function PersonPanel({ person, onClose, onAddRelative, onLoginRequired }) {
  const { user } = useAuth();
  const [claiming, setClaiming]   = useState(false);
  const [claimed,  setClaimedLocal] = useState(false);

  if (!person) return null;

  const badge = person.badge ? BADGE_MAP[person.badge] : null;

  async function handleClaim() {
    if (!user) { onLoginRequired?.(); return; }
    setClaiming(true);
    try { await claimProfile(person.id); setClaimedLocal(true); }
    catch (e) { console.error(e); }
    finally { setClaiming(false); }
  }

  function guardedAdd(rel) {
    if (!user) { onLoginRequired?.(); return; }
    onAddRelative?.(person, rel);
  }
  const clan = person.clan || 'Kapmirmet';
  const colors = CLAN_COLORS[clan] || CLAN_COLORS.Kapmirmet;
  const isFounder = person.badge === 'founder';

  return (
    <div style={panelStyle}>
      {/* Close */}
      <button onClick={onClose} style={closeBtnStyle}>
        <X size={18} />
      </button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '8px' }}>
        {/* Avatar */}
        <div
          style={{
            width: isFounder ? 90 : 72,
            height: isFounder ? 90 : 72,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.leaf})`,
            margin: '0 auto 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isFounder ? '36px' : '28px',
            border: isFounder
              ? '3px solid #FFD700'
              : person.claimed
              ? '2.5px solid #4CAF50'
              : '2px solid #5C4033',
            boxShadow: isFounder
              ? '0 0 30px rgba(218,165,32,0.35), 0 0 60px rgba(218,165,32,0.1)'
              : badge
              ? `0 0 20px ${colors.glow}`
              : '0 4px 20px rgba(0,0,0,0.3)',
            position: 'relative',
          }}
        >
          {person.gender === 'F' ? '♀' : '♂'}
          {isFounder && (
            <span
              style={{
                position: 'absolute',
                right: '-16px',
                bottom: '-4px',
                fontSize: '24px',
              }}
            >
              🦅
            </span>
          )}
        </div>

        {/* Badge */}
        {badge && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: '10px',
              background: `${badge.color}18`,
              border: `1px solid ${badge.color}30`,
              fontSize: '11px',
              color: badge.color,
              marginBottom: '8px',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.5px',
            }}
          >
            {badge.icon} {badge.label}
          </div>
        )}

        {/* Name */}
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: isFounder ? '22px' : '19px',
            fontWeight: 400,
            margin: '6px 0 4px',
            color: '#E8DCC8',
            lineHeight: 1.2,
          }}
        >
          {person.name}
        </h2>

        {/* Dates + Clan */}
        <p
          style={{
            fontSize: '11px',
            color: '#7B6845',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {person.birth}
          {person.death ? `–${person.death}` : ' – present'} · {clan}
        </p>

        {/* Claimed status */}
        {person.claimed && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '6px',
              fontSize: '10px',
              color: '#4CAF50',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Check size={12} /> Claimed
          </div>
        )}
      </div>

      {/* Story */}
      {person.story && (
        <div style={storyBlockStyle}>
          <p
            style={{
              fontSize: '10px',
              color: '#A89070',
              margin: '0 0 6px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            📜 Their Story
          </p>
          <p
            style={{
              fontSize: '13.5px',
              lineHeight: 1.7,
              margin: 0,
              color: '#D4C4A8',
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
            }}
          >
            {person.story}
          </p>
        </div>
      )}

      {/* Action Buttons */}
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

        {/* Pending badge */}
        {person.status === 'pending' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', background: 'rgba(218,165,32,0.08)', border: '1px solid rgba(218,165,32,0.2)', borderRadius: '8px', fontSize: '11px', color: '#DAA520', fontFamily: 'var(--font-mono)' }}>
            ⏳ Pending verification
          </div>
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
        <ActionBtn icon={<Camera size={14} />} label="Add Photos" />
        <ActionBtn icon={<MessageCircle size={14} />} label="Add a Memory" />
        <ActionBtn icon={<Send size={14} />} label="Invite Relatives" />
      </div>

      {/* Children */}
      {person.children && person.children.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <p
            style={{
              fontSize: '10px',
              color: '#A89070',
              fontWeight: 600,
              marginBottom: '8px',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '1px',
            }}
          >
            CHILDREN ({person.children.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {person.children.map((c) => (
              <div key={c.id} style={childRowStyle}>
                <span style={{ fontSize: '14px' }}>
                  {c.gender === 'F' ? '♀' : '♂'}
                </span>
                <span style={{ fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                  {c.name}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '10px',
                    color: '#7B6845',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  b.{c.birth}
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
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '10px 14px',
        background: highlight ? 'rgba(218,165,32,0.12)' : 'rgba(92,64,51,0.15)',
        border: `1px solid ${highlight ? 'rgba(218,165,32,0.3)' : 'rgba(92,64,51,0.4)'}`,
        borderRadius: '8px',
        color: highlight ? '#DAA520' : '#D4C4A8',
        cursor: 'pointer',
        fontSize: '12.5px',
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        textAlign: 'left',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = highlight
          ? 'rgba(218,165,32,0.2)'
          : 'rgba(92,64,51,0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = highlight
          ? 'rgba(218,165,32,0.12)'
          : 'rgba(92,64,51,0.15)';
      }}
    >
      {typeof icon === 'string' ? <span>{icon}</span> : icon}
      {label}
    </button>
  );
}

// ── Styles ──
const panelStyle = {
  position: 'absolute',
  top: 0,
  right: 0,
  width: '380px',
  maxWidth: '100vw',
  height: '100%',
  background: 'linear-gradient(180deg, #0D0906 0%, #1A120B 50%, #2C1810 100%)',
  borderLeft: '1px solid rgba(92,64,51,0.5)',
  zIndex: 30,
  overflowY: 'auto',
  padding: '20px',
  boxSizing: 'border-box',
  animation: 'slideInRight 0.35s var(--ease-out)',
  boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
};

const closeBtnStyle = {
  position: 'absolute',
  top: '14px',
  right: '14px',
  background: 'rgba(92,64,51,0.3)',
  border: '1px solid rgba(92,64,51,0.5)',
  borderRadius: '6px',
  padding: '6px',
  color: '#A89070',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2,
  transition: 'all 0.2s',
};

const storyBlockStyle = {
  padding: '14px',
  background: 'rgba(92,64,51,0.12)',
  borderRadius: '10px',
  borderLeft: '3px solid #DAA520',
};

const childRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '7px 10px',
  background: 'rgba(92,64,51,0.1)',
  borderRadius: '6px',
};
