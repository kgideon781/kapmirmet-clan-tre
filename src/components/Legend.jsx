import { BADGE_MAP } from '../data/clanData';

export default function Legend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '56px',
        right: '20px',
        zIndex: 15,
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        maxWidth: '500px',
      }}
    >
      {Object.entries(BADGE_MAP).map(([key, val]) => (
        <LegendItem key={key} icon={val.icon} label={val.label} />
      ))}
      <LegendItem icon="●" label="Claimed" color="#4CAF50" />
      <LegendItem icon="●" label="Kapmirmet" color="#DAA520" />
      <LegendItem icon="●" label="Kapcheboin" color="#9ACD32" />
    </div>
  );
}

function LegendItem({ icon, label, color }) {
  return (
    <span
      style={{
        fontSize: '9.5px',
        color: color || '#A89070',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.3px',
        whiteSpace: 'nowrap',
      }}
    >
      {icon} <span style={{ color: '#7B6845' }}>{label}</span>
    </span>
  );
}
