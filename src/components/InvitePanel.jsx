import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const INVITE_OPTIONS = [
  { icon: '👪', label: 'Invite Siblings', desc: 'Brothers and sisters' },
  { icon: '👨‍👩‍👧', label: 'Invite Parents', desc: 'Mother and father' },
  { icon: '👶', label: 'Invite Children', desc: 'Sons and daughters' },
  { icon: '🤝', label: 'Invite Cousins', desc: 'Extended family' },
  { icon: '👴', label: 'Invite Elders', desc: 'Uncles, aunts, grandparents' },
];

export default function InvitePanel({ onClose }) {
  const [copied, setCopied] = useState(false);
  const [invited, setInvited] = useState(null);

  const inviteLink = 'kapmirmet.tree/join/abc123';

  const handleCopy = () => {
    navigator.clipboard?.writeText(`https://${inviteLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = (label) => {
    setInvited(label);
    setTimeout(() => setInvited(null), 3000);
  };

  return (
    <div style={panelStyle}>
      <button onClick={onClose} style={closeBtnStyle}>
        <X size={18} />
      </button>

      <div style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '8px' }}>
        <span style={{ fontSize: '44px', display: 'block', lineHeight: 1 }}>📨</span>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            fontWeight: 400,
            color: '#DAA520',
            margin: '12px 0 4px',
          }}
        >
          Invite Your Kin
        </h2>
        <p
          style={{
            fontSize: '12px',
            color: '#7B6845',
            fontFamily: 'var(--font-body)',
            maxWidth: '260px',
            margin: '0 auto',
            lineHeight: 1.5,
          }}
        >
          Help the tree grow by inviting family members to join and plant their
          own branches.
        </p>
      </div>

      {/* Invite Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {INVITE_OPTIONS.map((item, i) => (
          <button
            key={i}
            onClick={() => handleInvite(item.label)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              background:
                invited === item.label
                  ? 'rgba(76,175,80,0.12)'
                  : 'rgba(92,64,51,0.12)',
              border: `1px solid ${
                invited === item.label
                  ? 'rgba(76,175,80,0.3)'
                  : 'rgba(92,64,51,0.4)'
              }`,
              borderRadius: '10px',
              color: '#E8DCC8',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.2s',
              animation: `slideInUp 0.3s var(--ease-out) ${i * 0.06}s both`,
            }}
            onMouseEnter={(e) => {
              if (invited !== item.label) {
                e.currentTarget.style.background = 'rgba(218,165,32,0.1)';
                e.currentTarget.style.borderColor = 'rgba(218,165,32,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (invited !== item.label) {
                e.currentTarget.style.background = 'rgba(92,64,51,0.12)';
                e.currentTarget.style.borderColor = 'rgba(92,64,51,0.4)';
              }
            }}
          >
            <span style={{ fontSize: '24px', width: '32px', textAlign: 'center' }}>
              {invited === item.label ? '✅' : item.icon}
            </span>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 500 }}>
                {invited === item.label ? 'Invite sent!' : item.label}
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  color: '#7B6845',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {item.desc}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Shareable Link */}
      <div style={{ marginTop: '24px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '10px',
            color: '#A89070',
            fontWeight: 500,
            marginBottom: '6px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          Or share a direct link
        </label>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            readOnly
            value={inviteLink}
            style={{
              flex: 1,
              background: 'rgba(92,64,51,0.2)',
              border: '1px solid rgba(92,64,51,0.4)',
              borderRadius: '8px',
              padding: '9px 12px',
              color: '#DAA520',
              fontSize: '11.5px',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
          />
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '9px 12px',
              background: copied
                ? 'rgba(76,175,80,0.15)'
                : 'rgba(92,64,51,0.3)',
              border: `1px solid ${
                copied ? 'rgba(76,175,80,0.3)' : 'rgba(92,64,51,0.5)'
              }`,
              borderRadius: '8px',
              color: copied ? '#4CAF50' : '#DAA520',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* SMS / WhatsApp */}
      <div style={{ marginTop: '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '10px',
            color: '#A89070',
            fontWeight: 500,
            marginBottom: '6px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          Share via
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['WhatsApp', 'SMS', 'Email'].map((method) => (
            <button
              key={method}
              style={{
                flex: 1,
                padding: '9px',
                background: 'rgba(92,64,51,0.15)',
                border: '1px solid rgba(92,64,51,0.4)',
                borderRadius: '8px',
                color: '#D4C4A8',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(218,165,32,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(92,64,51,0.15)';
              }}
            >
              {method}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

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
};
