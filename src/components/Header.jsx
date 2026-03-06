import { useState } from 'react';
import { Search, TreePine, UserPlus, BookOpen, Send } from 'lucide-react';
import { flattenTree, clanTree, seedlings } from '../data/clanData';

const allNodes = [...flattenTree(clanTree), ...seedlings];

export default function Header({ onOpenPanel }) {
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    const found = allNodes.find((n) =>
      n.name.toLowerCase().includes(query.toLowerCase())
    );
    if (found) {
      setMessage({
        type: 'playful',
        text: `✨ That's not how stories are told.\nTrace your path from the ancestors.\n\nHint: ${found.name} lives in generation ${found.depth >= 0 ? found.depth + 1 : '?'}`,
      });
    } else {
      setMessage({
        type: 'missing',
        text: `🌱 "${query}" hasn't been planted on this tree yet.\nPerhaps you can add them?`,
      });
    }
    setTimeout(() => setMessage(null), 6000);
  };

  return (
    <header
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        background:
          'linear-gradient(180deg, rgba(13,9,6,0.96) 0%, rgba(13,9,6,0.85) 60%, transparent 100%)',
        padding: '14px 20px 28px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '30px', lineHeight: 1 }}>🦅</span>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: '24px',
                fontWeight: 400,
                margin: 0,
                color: '#DAA520',
                letterSpacing: '2px',
                lineHeight: 1.1,
              }}
            >
              Kapmirmet
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: '9.5px',
                color: '#7B6845',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
              }}
            >
              Mooi Kogos · Living Clan Tree
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                color: '#7B6845',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search the tree…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                background: 'rgba(92,64,51,0.3)',
                border: '1px solid rgba(92,64,51,0.6)',
                borderRadius: '8px',
                padding: '8px 12px 8px 30px',
                color: '#E8DCC8',
                fontSize: '12.5px',
                fontFamily: 'var(--font-body)',
                width: '200px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#8B6914')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(92,64,51,0.6)')}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <HeaderBtn icon={<TreePine size={14} />} label="Plant Yourself" onClick={() => onOpenPanel('add')} />
          <HeaderBtn icon={<Send size={14} />} label="Invite Kin" onClick={() => onOpenPanel('invite')} />
          <HeaderBtn icon={<BookOpen size={14} />} label="Clan Story" onClick={() => onOpenPanel('story')} />
        </div>
      </div>

      {/* Search message toast */}
      {message && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px 14px',
            background:
              message.type === 'playful'
                ? 'rgba(218,165,32,0.12)'
                : 'rgba(139,105,20,0.12)',
            border: `1px solid ${
              message.type === 'playful'
                ? 'rgba(218,165,32,0.25)'
                : 'rgba(139,105,20,0.25)'
            }`,
            borderRadius: '10px',
            fontSize: '12.5px',
            lineHeight: 1.6,
            whiteSpace: 'pre-line',
            maxWidth: '420px',
            animation: 'slideInUp 0.3s var(--ease-out)',
            fontFamily: 'var(--font-body)',
            color: '#D4C4A8',
          }}
        >
          {message.text}
        </div>
      )}
    </header>
  );
}

function HeaderBtn({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(92,64,51,0.35)',
        border: '1px solid rgba(92,64,51,0.6)',
        borderRadius: '8px',
        padding: '7px 12px',
        color: '#DAA520',
        cursor: 'pointer',
        fontSize: '11.5px',
        fontWeight: 500,
        fontFamily: 'var(--font-body)',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(218,165,32,0.15)';
        e.currentTarget.style.borderColor = '#8B6914';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(92,64,51,0.35)';
        e.currentTarget.style.borderColor = 'rgba(92,64,51,0.6)';
      }}
    >
      {icon}
      {label}
    </button>
  );
}
