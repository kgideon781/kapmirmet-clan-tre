import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

function exportSVG(svgRef) {
  const svg = svgRef?.current;
  if (!svg) return;
  const clone = svg.cloneNode(true);
  clone.setAttribute('width', svg.clientWidth);
  clone.setAttribute('height', svg.clientHeight);
  // Dark background
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', '#0D0906');
  clone.insertBefore(bg, clone.firstChild);
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kapmirmet-clan-tree.svg';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ZoomControls({ svgRef, zoomLevel, onZoomIn, onZoomOut, onReset }) {
  return (
    <div
      style={{
        position: 'absolute', bottom: '28px', left: '20px',
        zIndex: 20, display: 'flex', flexDirection: 'column', gap: '4px',
      }}
    >
      <ZoomBtn onClick={onZoomIn}><ZoomIn size={16} /></ZoomBtn>
      <ZoomBtn onClick={onReset}><RotateCcw size={14} /></ZoomBtn>
      <ZoomBtn onClick={onZoomOut}><ZoomOut size={16} /></ZoomBtn>
      <ZoomBtn onClick={() => exportSVG(svgRef)} title="Download tree as SVG">
        <Download size={14} />
      </ZoomBtn>
      <div style={{ textAlign: 'center', fontSize: '9.5px', color: '#7B6845', fontFamily: 'var(--font-mono)', marginTop: '2px', letterSpacing: '0.5px' }}>
        {Math.round(zoomLevel * 100)}%
      </div>
    </div>
  );
}

function ZoomBtn({ onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: '34px', height: '34px', borderRadius: '8px',
        background: 'rgba(13,9,6,0.85)', border: '1px solid rgba(92,64,51,0.5)',
        color: '#DAA520', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', backdropFilter: 'blur(8px)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(218,165,32,0.15)'; e.currentTarget.style.borderColor = '#8B6914'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(13,9,6,0.85)'; e.currentTarget.style.borderColor = 'rgba(92,64,51,0.5)'; }}
    >
      {children}
    </button>
  );
}
