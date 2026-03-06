import { signInWithGoogle } from '../lib/auth';

export default function LoginPrompt({ onClose, message }) {
  async function handleGoogle() {
    try { await signInWithGoogle(); }
    catch (e) { console.error(e); }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <span style={{ fontSize: '40px', display: 'block', textAlign: 'center', marginBottom: '12px' }}>🔐</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 400, color: '#DAA520', textAlign: 'center', margin: '0 0 8px' }}>
          Sign in to continue
        </h2>
        <p style={{ fontSize: '12.5px', color: '#A89070', fontFamily: 'var(--font-body)', textAlign: 'center', lineHeight: 1.5, margin: '0 0 20px' }}>
          {message || 'Adding to the clan tree requires a verified identity to keep the record trustworthy.'}
        </p>

        <button onClick={handleGoogle} style={googleBtnStyle}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        <button onClick={onClose} style={cancelStyle}>Maybe later</button>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 100,
  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  animation: 'fadeIn 0.2s ease',
};

const cardStyle = {
  background: 'linear-gradient(180deg, #1A120B 0%, #2C1810 100%)',
  border: '1px solid rgba(218,165,32,0.2)',
  borderRadius: '16px', padding: '32px 28px',
  width: '340px', maxWidth: '90vw',
  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  animation: 'slideInUp 0.3s var(--ease-out)',
};

const googleBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
  width: '100%', padding: '12px',
  background: '#fff', border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '10px', color: '#333',
  cursor: 'pointer', fontSize: '14px', fontWeight: 600,
  fontFamily: 'var(--font-body)', transition: 'all 0.2s', marginBottom: '10px',
};

const cancelStyle = {
  display: 'block', width: '100%', padding: '10px',
  background: 'transparent', border: 'none',
  color: '#7B6845', cursor: 'pointer',
  fontSize: '12px', fontFamily: 'var(--font-body)',
};
