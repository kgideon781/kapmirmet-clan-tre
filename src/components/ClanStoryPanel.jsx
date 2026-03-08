import { useState, useEffect } from 'react';
import { X, Pencil, Lightbulb, Check, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchClanStorySections,
  saveClanStorySection,
  fetchStorySuggestions,
  submitStorySuggestion,
  resolveStorySuggestion,
  fetchSectionEditHistory,
} from '../lib/db';

// ── Default content (used until a mod saves an edited version) ──
const DEFAULT_SECTIONS = [
  {
    id: 'origin', title: '🌿 Origin', sort_order: 0,
    content: `The Kapmirmet clan traces its roots to the founding ancestor known by multiple names: Mirmetin, Kipkenken, and a third name yet to be recovered. The clan's history stretches back to the 1850s and earlier, with deep connections to the land and its people.`,
  },
  {
    id: 'totem', title: '🦅 Clan Totem', sort_order: 1,
    content: `The eagle with a white breast and black back, known as Mooi Kogos. The eagle symbolizes vision, strength, and the ability to see far across generations. It is the spiritual guardian of the clan.`,
  },
  {
    id: 'migration', title: '🧭 Migration History', sort_order: 2,
    content: `Over the decades, members of the clan migrated across regions. Some branches, led by figures like Kipkoech Mirmet, established new communities while maintaining their Kapmirmet identity. These migrations shaped the geographic spread of the clan.`,
  },
  {
    id: 'offshoots', title: '🌳 Clan Offshoots', sort_order: 3,
    content: `Some members historically broke away to form new clans. The Kapcheboin offshoot, founded by Kiprotich Mirmet, remains connected to the original tree but has developed its own identity. The tree honors these connections while recognizing their distinct paths.`,
  },
  {
    id: 'ancestors', title: '👑 Key Ancestors', sort_order: 4,
    content: `Mirmetin (Kipkenken) — The founding patriarch, around whom the entire clan identity formed.\n\nArap Mirmet — A legendary warrior who defended the clan's territory.\n\nChebet Mirmet — The great keeper of oral histories.\n\nKipkoech Mirmet — Leader of the southern migration.\n\nKiplagat arap Mirmet — Clan builder who formalized gathering traditions.`,
  },
  {
    id: 'culture', title: '📜 Cultural Practices', sort_order: 5,
    content: `The clan maintains strong oral traditions. Stories are passed from generation to generation through gatherings and ceremonies. Elders serve as the keepers of knowledge, entrusted with the names, marriages, and migrations of the clan's many branches.`,
  },
  {
    id: 'living-tree', title: '🌱 This Living Tree', sort_order: 6,
    content: `This digital heritage tree is a new chapter in the Kapmirmet storytelling tradition. Every member who plants themselves on this tree adds a leaf to our shared story. The tree grows as our knowledge grows — branch by branch, generation by generation.`,
  },
];

// ── Panel ────────────────────────────────────────────────────────
export default function ClanStoryPanel({ onClose }) {
  const { isMod, user } = useAuth();
  const [sections, setSections]       = useState(DEFAULT_SECTIONS);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [dbSections, dbSuggestions] = await Promise.all([
          fetchClanStorySections(),
          isMod ? fetchStorySuggestions() : Promise.resolve([]),
        ]);

        if (dbSections.length > 0) {
          const dbMap = new Map(dbSections.map((s) => [s.id, s]));
          setSections(DEFAULT_SECTIONS.map((def) => dbMap.get(def.id) ?? def));
        }
        setSuggestions(dbSuggestions);
      } catch (e) {
        console.error('ClanStoryPanel load error:', e);
      }
    }
    load();
  }, [isMod]);

  function handleSectionSaved(updated) {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  async function handleResolve(suggestionId, approve, sug) {
    try {
      if (approve) {
        const section = sections.find((s) => s.id === sug.section_id);
        if (section) {
          const updated = { ...section, content: sug.suggested_content };
          await saveClanStorySection(updated);
          handleSectionSaved(updated);
        }
      }
      await resolveStorySuggestion(suggestionId, approve);
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div style={panelStyle}>
      <button onClick={onClose} style={closeBtnStyle}><X size={18} /></button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px', paddingTop: '8px' }}>
        <span style={{ fontSize: '52px', display: 'block', lineHeight: 1 }}>🦅</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 400, color: '#DAA520', margin: '14px 0 4px', letterSpacing: '1px' }}>
          The Kapmirmet Clan
        </h2>
        <p style={{ fontSize: '10px', color: '#7B6845', fontFamily: 'var(--font-mono)', letterSpacing: '2.5px', textTransform: 'uppercase', margin: 0 }}>
          Mooi Kogos
        </p>
        {isMod && (
          <p style={{ fontSize: '10px', color: '#8B6914', fontFamily: 'var(--font-mono)', margin: '8px 0 0' }}>
            ✏️ tap any section to edit
          </p>
        )}
        {!isMod && user && (
          <p style={{ fontSize: '10px', color: '#5C4033', fontFamily: 'var(--font-mono)', margin: '8px 0 0' }}>
            💡 tap <Lightbulb size={9} style={{ display: 'inline', verticalAlign: 'middle' }} /> to suggest a correction
          </p>
        )}
      </div>

      {sections.map((section, i) => (
        <StorySection
          key={section.id}
          section={section}
          delay={i}
          isMod={isMod}
          isLoggedIn={!!user}
          suggestions={suggestions.filter((s) => s.section_id === section.id)}
          onSaved={handleSectionSaved}
          onResolve={handleResolve}
        />
      ))}
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────
function StorySection({ section, delay, isMod, isLoggedIn, suggestions, onSaved, onResolve }) {
  const [mode, setMode]           = useState('view'); // 'view' | 'edit' | 'suggest'
  const [draft, setDraft]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState(null);
  const [showHistory, setShowHistory]     = useState(false);
  const [history, setHistory]             = useState(null); // null = not yet loaded
  const [historyLoading, setHistoryLoading] = useState(false);

  async function toggleHistory() {
    if (showHistory) { setShowHistory(false); return; }
    if (history !== null) { setShowHistory(true); return; }
    setHistoryLoading(true);
    try {
      const data = await fetchSectionEditHistory(section.id);
      setHistory(data);
    } catch (e) { console.error(e); }
    setHistoryLoading(false);
    setShowHistory(true);
  }

  function startEdit()    { setDraft(section.content); setMode('edit');    setError(null); setSubmitted(false); }
  function startSuggest() { setDraft(section.content); setMode('suggest'); setError(null); setSubmitted(false); }
  function cancel()       { setMode('view'); setDraft(''); setError(null); }

  async function handleSave() {
    if (!draft.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = { ...section, content: draft.trim() };
      await saveClanStorySection(updated);
      onSaved(updated);
      setMode('view');
    } catch (e) {
      setError(e.message || 'Failed to save.');
    }
    setSaving(false);
  }

  async function handleSubmitSuggestion() {
    if (!draft.trim() || saving || draft.trim() === section.content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await submitStorySuggestion(section.id, draft.trim());
      setSubmitted(true);
      setMode('view');
    } catch (e) {
      setError(e.message || 'Failed to submit suggestion.');
    }
    setSaving(false);
  }

  const borderColor = mode === 'edit' ? 'rgba(218,165,32,0.55)'
    : mode === 'suggest'              ? 'rgba(76,175,80,0.45)'
    : suggestions.length > 0         ? 'rgba(218,165,32,0.3)'
    : 'rgba(92,64,51,0.5)';

  return (
    <div style={{ marginBottom: '12px', animation: `slideInUp 0.4s var(--ease-out) ${delay * 0.08}s both` }}>
      <div style={{ padding: '13px', background: 'rgba(92,64,51,0.1)', borderRadius: '10px', borderLeft: `3px solid ${borderColor}` }}>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#DAA520', margin: 0, fontFamily: 'var(--font-body)' }}>
            {section.title}
          </p>
          {mode === 'view' && (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {isMod && (
                <>
                  <button onClick={toggleHistory} title="Edit history" style={iconBtnStyle(showHistory ? '#DAA520' : '#7B6845')}>
                    <Clock size={11} />
                  </button>
                  <button onClick={startEdit} title="Edit" style={iconBtnStyle('#DAA520')}>
                    <Pencil size={11} />
                  </button>
                </>
              )}
              {isLoggedIn && !isMod && (
                <button onClick={startSuggest} title="Suggest a correction" style={iconBtnStyle('#4CAF50')}>
                  <Lightbulb size={11} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* View mode */}
        {mode === 'view' && (
          <>
            <div style={{ fontSize: '13px', lineHeight: 1.7, color: '#D4C4A8', fontFamily: 'var(--font-body)', whiteSpace: 'pre-line' }}>
              {section.content}
            </div>
            {submitted && (
              <div style={{ marginTop: '7px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#4CAF50', fontFamily: 'var(--font-body)' }}>
                <Check size={11} /> Suggestion submitted — thank you!
              </div>
            )}
          </>
        )}

        {/* Edit mode (mods) */}
        {mode === 'edit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              style={textareaStyle}
            />
            {error && <p style={errorStyle}>{error}</p>}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleSave} disabled={saving || !draft.trim()} style={saveBtnStyle}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={cancel} style={cancelBtnStyle}>Cancel</button>
            </div>
          </div>
        )}

        {/* Suggest mode (logged-in non-mods) */}
        {mode === 'suggest' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '11px', color: '#7B6845', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.4 }}>
              Edit the text below — a moderator will review your suggestion before it goes live.
            </p>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              style={{ ...textareaStyle, borderColor: 'rgba(76,175,80,0.4)' }}
            />
            {error && <p style={errorStyle}>{error}</p>}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleSubmitSuggestion}
                disabled={saving || !draft.trim() || draft.trim() === section.content.trim()}
                style={{ ...saveBtnStyle, background: 'rgba(76,175,80,0.15)', borderColor: 'rgba(76,175,80,0.4)', color: '#4CAF50' }}
              >
                {saving ? 'Submitting…' : 'Submit suggestion'}
              </button>
              <button onClick={cancel} style={cancelBtnStyle}>Cancel</button>
            </div>
          </div>
        )}

        {/* Edit history (mods, view mode only) */}
        {isMod && showHistory && mode === 'view' && (
          <div style={{ marginTop: '10px', borderTop: '1px solid rgba(92,64,51,0.3)', paddingTop: '10px' }}>
            <p style={{ fontSize: '10px', color: '#7B6845', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 8px' }}>
              Edit history
            </p>
            {historyLoading && (
              <p style={{ fontSize: '11.5px', color: '#5C4033', fontFamily: 'var(--font-body)', margin: 0 }}>Loading…</p>
            )}
            {!historyLoading && history?.length === 0 && (
              <p style={{ fontSize: '11.5px', color: '#5C4033', fontFamily: 'var(--font-body)', margin: 0 }}>No edits recorded yet.</p>
            )}
            {!historyLoading && history?.map((entry, i) => (
              <div key={entry.id} style={{ display: 'flex', gap: '10px', padding: '7px 0', borderBottom: i < history.length - 1 ? '1px solid rgba(92,64,51,0.15)' : 'none' }}>
                {/* Avatar initial */}
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(218,165,32,0.12)', border: '1px solid rgba(218,165,32,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', color: '#DAA520', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {(entry.editor?.full_name || entry.editor?.email || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: '#D4C4A8', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                      {entry.editor?.full_name || entry.editor?.email || 'Unknown'}
                    </span>
                    <span style={{ fontSize: '10px', color: '#5C4033', fontFamily: 'var(--font-mono)' }}>
                      {timeAgo(entry.edited_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#7B6845', fontFamily: 'var(--font-body)', margin: '2px 0 0', lineHeight: 1.4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    "{entry.content_after.slice(0, 80)}{entry.content_after.length > 80 ? '…' : ''}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending suggestions (mods, view mode only) */}
        {isMod && suggestions.length > 0 && mode === 'view' && (
          <div style={{ marginTop: '10px', borderTop: '1px solid rgba(92,64,51,0.3)', paddingTop: '10px' }}>
            <p style={{ fontSize: '10px', color: '#8B6914', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 6px' }}>
              {suggestions.length} pending suggestion{suggestions.length !== 1 ? 's' : ''}
            </p>
            {suggestions.map((sug) => (
              <div key={sug.id} style={{ padding: '9px', background: 'rgba(218,165,32,0.06)', border: '1px solid rgba(218,165,32,0.2)', borderRadius: '8px', marginBottom: '6px' }}>
                {sug.suggester?.full_name && (
                  <p style={{ fontSize: '10px', color: '#5C4033', fontFamily: 'var(--font-mono)', margin: '0 0 5px' }}>
                    by {sug.suggester.full_name || sug.suggester.email}
                  </p>
                )}
                <p style={{ fontSize: '12.5px', color: '#D4C4A8', fontFamily: 'var(--font-body)', lineHeight: 1.6, margin: '0 0 8px', whiteSpace: 'pre-line' }}>
                  {sug.suggested_content}
                </p>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => onResolve(sug.id, true, sug)} style={applyBtnStyle}>
                    <Check size={11} /> Apply
                  </button>
                  <button onClick={() => onResolve(sug.id, false, sug)} style={dismissBtnStyle}>
                    <XCircle size={11} /> Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Styles ───────────────────────────────────────────────────────
const iconBtnStyle = (color) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '4px 6px', borderRadius: '5px',
  background: 'rgba(92,64,51,0.15)',
  border: `1px solid rgba(92,64,51,0.3)`,
  color, cursor: 'pointer', transition: 'all 0.15s',
});

const textareaStyle = {
  width: '100%', background: 'rgba(92,64,51,0.2)',
  border: '1px solid rgba(92,64,51,0.4)', borderRadius: '8px',
  padding: '9px 11px', color: '#E8DCC8', fontSize: '12.5px',
  fontFamily: 'var(--font-body)', outline: 'none',
  resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box',
};

const saveBtnStyle = {
  flex: 1, padding: '8px', background: 'rgba(218,165,32,0.18)',
  border: '1px solid rgba(218,165,32,0.4)', borderRadius: '7px',
  color: '#DAA520', cursor: 'pointer', fontSize: '12px',
  fontFamily: 'var(--font-body)', fontWeight: 600,
};

const cancelBtnStyle = {
  padding: '8px 14px', background: 'none',
  border: '1px solid rgba(92,64,51,0.3)', borderRadius: '7px',
  color: '#5C4033', cursor: 'pointer', fontSize: '12px',
  fontFamily: 'var(--font-body)',
};

const applyBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '4px',
  flex: 1, justifyContent: 'center', padding: '6px',
  background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)',
  borderRadius: '6px', color: '#4CAF50', cursor: 'pointer',
  fontSize: '11.5px', fontFamily: 'var(--font-body)', fontWeight: 600,
};

const dismissBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '4px',
  flex: 1, justifyContent: 'center', padding: '6px',
  background: 'rgba(92,64,51,0.12)', border: '1px solid rgba(92,64,51,0.3)',
  borderRadius: '6px', color: '#7B6845', cursor: 'pointer',
  fontSize: '11.5px', fontFamily: 'var(--font-body)',
};

const errorStyle = {
  color: '#e05555', fontSize: '11.5px', margin: 0,
  fontFamily: 'var(--font-body)', padding: '6px 10px',
  background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)',
  borderRadius: '6px',
};

const panelStyle = {
  position: 'absolute', top: 0, right: 0, width: '380px', maxWidth: '100vw',
  height: '100%',
  background: 'linear-gradient(180deg, #0D0906 0%, #1A120B 50%, #2C1810 100%)',
  borderLeft: '1px solid rgba(92,64,51,0.5)',
  zIndex: 30, overflowY: 'auto', padding: '20px', boxSizing: 'border-box',
  animation: 'slideInRight 0.35s var(--ease-out)',
  boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
  pointerEvents: 'auto',
};

const closeBtnStyle = {
  position: 'absolute', top: '14px', right: '14px',
  background: 'rgba(92,64,51,0.3)', border: '1px solid rgba(92,64,51,0.5)',
  borderRadius: '6px', padding: '6px', color: '#A89070',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
};
