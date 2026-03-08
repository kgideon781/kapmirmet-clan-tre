import { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

const TOUR_KEY = 'kapmirmet_tour_v2';

// ── Main export ─────────────────────────────────────────────────
export default function WelcomeGuide({ onOpenPanel }) {
  const [step, setStep]           = useState(null); // null | 'welcome' | 'tree' | 'plant'
  const [plantRect, setPlantRect] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) setStep('welcome');
  }, []);

  function dismiss() {
    localStorage.setItem(TOUR_KEY, '1');
    setStep(null);
    setPlantRect(null);
  }

  function goToTree() { setStep('tree'); }

  function goToPlant() {
    const btn = document.querySelector('[data-tour-id="plant-btn"]');
    if (btn) setPlantRect(btn.getBoundingClientRect());
    setStep('plant');
  }

  function tryIt() {
    onOpenPanel('add');
    dismiss();
  }

  if (!step) return null;

  return (
    <>
      {/* ── Step 1: Welcome modal ─────────────────────── */}
      {step === 'welcome' && (
        <div style={overlayStyle} onClick={dismiss}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={dismiss} style={closeBtnStyle}><X size={16} /></button>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '38px', lineHeight: 1, display: 'block', marginBottom: '10px' }}>🌳</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 400, color: '#DAA520', margin: '0 0 6px' }}>
                Welcome to the Kapmirmet Tree
              </h2>
              <p style={{ fontSize: '12px', color: '#7B6845', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.5 }}>
                A living record of the clan. Let's show you around — takes 30 seconds.
              </p>
            </div>

            <MiniTreeSVG />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '18px' }}>
              <button
                onClick={goToTree}
                style={primaryBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(218,165,32,0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(218,165,32,0.18)'; }}
              >
                Show me around <ChevronRight size={14} />
              </button>
              <button onClick={dismiss} style={skipBtnStyle}>
                I'll explore on my own
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Explore — beacon on tree ─────────── */}
      {step === 'tree' && (
        <>
          {/* dim overlay — pointer-events:none so tree is still visible */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 170, background: 'rgba(0,0,0,0.62)', pointerEvents: 'none' }} />

          {/* Ripple beacon centred roughly on the tree area */}
          <Beacon />

          {/* Tooltip card at bottom-centre */}
          <div style={{ position: 'fixed', bottom: '52px', left: '50%', transform: 'translateX(-50%)', zIndex: 172, width: '310px' }}>
            <TourCard
              step={1} total={2}
              title="Tap any circle to explore"
              body="Each circle is a family member. Tap one to see their name, story, and life dates."
              onNext={goToPlant}
              onSkip={dismiss}
              nextLabel="Next →"
            />
          </div>
        </>
      )}

      {/* ── Step 3: Spotlight on Plant Yourself ──────── */}
      {step === 'plant' && plantRect && (
        <PlantSpotlight rect={plantRect} onTryIt={tryIt} onSkip={dismiss} />
      )}
    </>
  );
}

// ── Beacon (ripple rings centred on tree) ────────────────────────
function Beacon() {
  const cx = '43%', cy = '44%';
  const ring = (delay) => ({
    position: 'fixed', top: cy, left: cx,
    width: 80, height: 80,
    borderRadius: '50%',
    border: '2px solid rgba(218,165,32,0.7)',
    transform: 'translate(-50%, -50%)',
    animation: `ripple 2s ease-out ${delay}s infinite`,
    pointerEvents: 'none',
    zIndex: 171,
  });

  return (
    <>
      <div style={ring(0)} />
      <div style={ring(0.65)} />
      {/* small golden node in centre */}
      <div style={{
        position: 'fixed', top: cy, left: cx,
        width: 28, height: 28, borderRadius: '50%',
        background: 'rgba(218,165,32,0.22)',
        border: '2px solid #DAA520',
        transform: 'translate(-50%, -50%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', color: '#DAA520',
        pointerEvents: 'none', zIndex: 172,
        animation: 'pulse 2s ease-in-out infinite',
      }}>♂</div>
    </>
  );
}

// ── Plant Yourself spotlight ─────────────────────────────────────
function PlantSpotlight({ rect, onTryIt, onSkip }) {
  const P  = 9;
  const { top, left, width: w, height: h } = rect;

  const tooltipW    = 284;
  const tooltipLeft = Math.max(8, Math.min(left + w / 2 - tooltipW / 2, window.innerWidth - tooltipW - 8));
  const arrowLeft   = Math.round(left + w / 2 - tooltipLeft); // px from tooltip left edge

  return (
    <>
      {/* 4-panel dark overlay */}
      <div style={{ position: 'fixed', top: 0,            left: 0,         right: 0,              height: top - P,           background: 'rgba(0,0,0,0.72)', zIndex: 170, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: top + h + P,  left: 0,         right: 0,  bottom: 0,  background: 'rgba(0,0,0,0.72)', zIndex: 170, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: top - P,      left: 0,         width: left - P,       height: h + P * 2,  background: 'rgba(0,0,0,0.72)', zIndex: 170, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: top - P,      left: left+w+P,  right: 0,              height: h + P * 2,  background: 'rgba(0,0,0,0.72)', zIndex: 170, pointerEvents: 'none' }} />

      {/* Golden ring around button */}
      <div style={{
        position: 'fixed', top: top - P, left: left - P,
        width: w + P * 2, height: h + P * 2,
        borderRadius: '11px',
        border: '2px solid #DAA520',
        boxShadow: '0 0 0 4px rgba(218,165,32,0.18), 0 0 28px rgba(218,165,32,0.45)',
        zIndex: 171, pointerEvents: 'none',
        animation: 'pulse 1.8s ease-in-out infinite',
      }} />

      {/* Tooltip below the button */}
      <div style={{ position: 'fixed', top: top + h + P + 10, left: tooltipLeft, zIndex: 172, width: tooltipW }}>
        {/* Speech-bubble triangle pointing up at the button */}
        <div style={{
          width: 0, height: 0,
          marginLeft: Math.max(8, Math.min(arrowLeft - 8, tooltipW - 20)),
          marginBottom: -1,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '8px solid rgba(44,24,16,0.97)',
        }} />
        <TourCard
          step={2} total={2}
          title="Add your family here"
          body={`Tap "Plant Yourself" to add yourself or any relative. It's free and takes one minute.`}
          onNext={onTryIt}
          onSkip={onSkip}
          nextLabel="Try it now →"
          nextGold
        />
      </div>
    </>
  );
}

// ── Reusable tour card ───────────────────────────────────────────
function TourCard({ step, total, title, body, onNext, onSkip, nextLabel, nextGold }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, rgba(44,24,16,0.98) 0%, rgba(26,18,11,0.98) 100%)',
      border: '1px solid rgba(92,64,51,0.55)',
      borderRadius: '14px',
      padding: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
      animation: 'slideInUp 0.3s var(--ease-out)',
    }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            flex: i === step - 1 ? 2 : 1,
            height: 3, borderRadius: 2,
            background: i === step - 1 ? '#DAA520' : 'rgba(92,64,51,0.4)',
            transition: 'flex 0.3s ease',
          }} />
        ))}
        <span style={{ fontSize: '10px', color: '#5C4033', fontFamily: 'var(--font-mono)', marginLeft: '4px', flexShrink: 0 }}>
          {step}/{total}
        </span>
      </div>

      <p style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: '#DAA520', margin: '0 0 5px', fontWeight: 400 }}>
        {title}
      </p>
      <p style={{ fontSize: '12px', color: '#A89070', fontFamily: 'var(--font-body)', margin: '0 0 14px', lineHeight: 1.55 }}>
        {body}
      </p>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onNext}
          style={{
            flex: 1, padding: '9px 12px',
            background: nextGold ? 'rgba(218,165,32,0.22)' : 'rgba(92,64,51,0.25)',
            border: `1px solid ${nextGold ? 'rgba(218,165,32,0.55)' : 'rgba(92,64,51,0.5)'}`,
            borderRadius: '8px',
            color: nextGold ? '#DAA520' : '#D4C4A8',
            cursor: 'pointer', fontSize: '12.5px',
            fontFamily: 'var(--font-body)', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
          }}
        >
          {nextLabel}
        </button>
        <button
          onClick={onSkip}
          style={{
            padding: '9px 12px', background: 'none',
            border: '1px solid rgba(92,64,51,0.3)',
            borderRadius: '8px', color: '#5C4033',
            cursor: 'pointer', fontSize: '11.5px',
            fontFamily: 'var(--font-body)',
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// ── Mini tree SVG for welcome modal ─────────────────────────────
function MiniTreeSVG() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width="230" height="108" viewBox="0 0 230 108" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="115" y1="28" x2="115" y2="50" stroke="rgba(92,64,51,0.55)" strokeWidth="1.5" />
        <line x1="60"  y1="50" x2="170" y2="50" stroke="rgba(92,64,51,0.55)" strokeWidth="1.5" />
        <line x1="60"  y1="50" x2="60"  y2="72" stroke="rgba(92,64,51,0.55)" strokeWidth="1.5" />
        <line x1="170" y1="50" x2="170" y2="72" stroke="rgba(92,64,51,0.55)" strokeWidth="1.5" />

        {/* Root — highlighted */}
        <circle cx="115" cy="18" r="18" fill="rgba(218,165,32,0.1)"  stroke="rgba(218,165,32,0.4)"  strokeWidth="1" strokeDasharray="3 2" />
        <circle cx="115" cy="18" r="14" fill="rgba(218,165,32,0.18)" stroke="#DAA520"               strokeWidth="1.5" />
        <text x="115" y="23" textAnchor="middle" fill="#DAA520" fontSize="13">♂</text>

        {/* Left child */}
        <circle cx="60"  cy="86" r="13" fill="rgba(92,64,51,0.18)" stroke="rgba(92,64,51,0.5)" strokeWidth="1" />
        <text x="60" y="91" textAnchor="middle" fill="#A89070" fontSize="12">♂</text>

        {/* Right child */}
        <circle cx="170" cy="86" r="13" fill="rgba(92,64,51,0.18)" stroke="rgba(92,64,51,0.5)" strokeWidth="1" />
        <text x="170" y="91" textAnchor="middle" fill="#A89070" fontSize="12">♀</text>

        {/* + button */}
        <circle cx="192" cy="74" r="11" fill="rgba(218,165,32,0.28)" stroke="#DAA520" strokeWidth="1.5" />
        <text x="192" y="79" textAnchor="middle" fill="#DAA520" fontSize="14" fontWeight="bold">+</text>

        {/* Labels */}
        <text x="192" y="62" textAnchor="middle" fill="#8B6914" fontSize="8" fontFamily="monospace">add here</text>
        <text x="115" y="7"  textAnchor="middle" fill="#8B6914" fontSize="8" fontFamily="monospace">tap to view</text>
      </svg>
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────
const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(4px)',
  zIndex: 200,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  animation: 'fadeIn 0.3s ease',
};

const modalStyle = {
  position: 'relative',
  width: '360px', maxWidth: 'calc(100vw - 32px)',
  background: 'linear-gradient(180deg, #0D0906 0%, #1A120B 60%, #2C1810 100%)',
  border: '1px solid rgba(92,64,51,0.5)',
  borderRadius: '16px',
  padding: '24px 20px 20px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
  animation: 'slideInUp 0.4s var(--ease-out)',
  maxHeight: 'calc(100vh - 40px)', overflowY: 'auto',
};

const closeBtnStyle = {
  position: 'absolute', top: '12px', right: '12px',
  background: 'rgba(92,64,51,0.3)', border: '1px solid rgba(92,64,51,0.5)',
  borderRadius: '6px', padding: '5px', color: '#A89070',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const primaryBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  width: '100%', padding: '12px',
  background: 'rgba(218,165,32,0.18)', border: '1px solid rgba(218,165,32,0.45)',
  borderRadius: '10px', color: '#DAA520',
  cursor: 'pointer', fontSize: '13.5px',
  fontFamily: 'var(--font-body)', fontWeight: 600,
  transition: 'background 0.2s',
};

const skipBtnStyle = {
  width: '100%', padding: '10px',
  background: 'none', border: '1px solid rgba(92,64,51,0.3)',
  borderRadius: '10px', color: '#5C4033',
  cursor: 'pointer', fontSize: '12px',
  fontFamily: 'var(--font-body)',
};
