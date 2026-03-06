import { useState } from 'react';
import { Search, TreePine, BookOpen, Send, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, signOut } from '../lib/auth';

export default function Header({ onOpenPanel, allPeople = [] }) {
  const { user, profile, isMod } = useAuth();
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    const found = allPeople.find((n) =>
      n.name?.toLowerCase().includes(query.toLowerCase())
    );
    if (found) {
      setMessage({
        type: 'playful',
        text: `✨ That's not how stories are told.\nTrace your path from the ancestors.\n\nHint: ${found.name} — b. ${found.birth ?? '?'}`,
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
    <header style={headerStyle}>
      <div style={rowStyle}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '30px', lineHeight: 1 }}>🦅</span>
          <div>
            <h1 style={titleStyle}>Kapmirmet</h1>
            <p style={subStyle}>Mooi Kogos · Living Clan Tree</p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', color: '#7B6845', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search the tree…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={searchStyle}
            onFocus={(e) => (e.target.style.borderColor = '#8B6914')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(92,64,51,0.6)')}
          />
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <HeaderBtn icon={<TreePine size={14} />} label="Plant Yourself" onClick={() => onOpenPanel('add')} />
          <HeaderBtn icon={<Send size={14} />}     label="Invite Kin"     onClick={() => onOpenPanel('invite')} />
          <HeaderBtn icon={<BookOpen size={14} />} label="Clan Story"     onClick={() => onOpenPanel('story')} />

          {isMod && (
            <HeaderBtn
              icon={<ShieldCheck size={14} />}
              label="Review Queue"
              onClick={() => onOpenPanel('admin')}
              highlight
            />
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid rgba(218,165,32,0.4)', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(218,165,32,0.2)', border: '1.5px solid rgba(218,165,32,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#DAA520' }}>
                  {(profile?.full_name || user.email || '?')[0].toUpperCase()}
                </div>
              )}
              <button onClick={signOut} style={iconBtnStyle} title="Sign out">
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button onClick={signInWithGoogle} style={signInBtnStyle}>
              Sign in
            </button>
          )}
        </div>
      </div>

      {message && (
        <div style={{
          ...toastStyle,
          background: message.type === 'playful' ? 'rgba(218,165,32,0.12)' : 'rgba(139,105,20,0.12)',
          borderColor: message.type === 'playful' ? 'rgba(218,165,32,0.25)' : 'rgba(139,105,20,0.25)',
        }}>
          {message.text}
        </div>
      )}
    </header>
  );
}

function HeaderBtn({ icon, label, onClick, highlight }) {
  return (
    <button onClick={onClick} style={{ ...btnStyle, color: highlight ? '#4CAF50' : '#DAA520', borderColor: highlight ? 'rgba(76,175,80,0.4)' : 'rgba(92,64,51,0.6)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = highlight ? 'rgba(76,175,80,0.15)' : 'rgba(218,165,32,0.15)'; e.currentTarget.style.borderColor = highlight ? 'rgba(76,175,80,0.6)' : '#8B6914'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(92,64,51,0.35)'; e.currentTarget.style.borderColor = highlight ? 'rgba(76,175,80,0.4)' : 'rgba(92,64,51,0.6)'; }}
    >
      {icon}{label}
    </button>
  );
}

// ── Styles ──
const headerStyle = { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, background: 'linear-gradient(180deg, rgba(13,9,6,0.96) 0%, rgba(13,9,6,0.85) 60%, transparent 100%)', padding: '14px 20px 28px' };
const rowStyle    = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' };
const titleStyle  = { fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 400, margin: 0, color: '#DAA520', letterSpacing: '2px', lineHeight: 1.1 };
const subStyle    = { margin: 0, fontSize: '9.5px', color: '#7B6845', fontFamily: 'var(--font-mono)', letterSpacing: '2.5px', textTransform: 'uppercase' };
const searchStyle = { background: 'rgba(92,64,51,0.3)', border: '1px solid rgba(92,64,51,0.6)', borderRadius: '8px', padding: '8px 12px 8px 30px', color: '#E8DCC8', fontSize: '12.5px', fontFamily: 'var(--font-body)', width: '200px', outline: 'none', transition: 'border-color 0.2s' };
const btnStyle    = { display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(92,64,51,0.35)', border: '1px solid rgba(92,64,51,0.6)', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontSize: '11.5px', fontWeight: 500, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', transition: 'all 0.2s' };
const signInBtnStyle = { ...btnStyle, color: '#DAA520', background: 'rgba(218,165,32,0.12)', borderColor: 'rgba(218,165,32,0.35)' };
const iconBtnStyle   = { background: 'none', border: 'none', color: '#7B6845', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' };
const toastStyle     = { marginTop: '10px', padding: '10px 14px', border: '1px solid', borderRadius: '10px', fontSize: '12.5px', lineHeight: 1.6, whiteSpace: 'pre-line', maxWidth: '420px', animation: 'slideInUp 0.3s var(--ease-out)', fontFamily: 'var(--font-body)', color: '#D4C4A8' };
