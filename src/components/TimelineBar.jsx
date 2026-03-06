import { TIMELINE_YEARS, totalMembers, totalGenerations, seedlings } from '../data/clanData';

export default function TimelineBar({ zoomLevel }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 15,
        background:
          'linear-gradient(0deg, rgba(13,9,6,0.95) 0%, rgba(13,9,6,0.7) 70%, transparent 100%)',
        padding: '20px 20px 14px',
      }}
    >
      {/* Timeline ruler */}
      <div
        style={{
          position: 'relative',
          maxWidth: '800px',
          margin: '0 auto',
          height: '32px',
        }}
      >
        {/* Line */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '0',
            right: '0',
            height: '2px',
            background: 'linear-gradient(90deg, #5C4033 0%, #8B6914 50%, #DAA520 100%)',
            borderRadius: '1px',
          }}
        />

        {/* Year marks */}
        {TIMELINE_YEARS.map((year, i) => {
          const pct = ((year - 1845) / (2026 - 1845)) * 100;
          const isLast = year === 2026;
          return (
            <div
              key={year}
              style={{
                position: 'absolute',
                left: `${pct}%`,
                top: 0,
                transform: 'translateX(-50%)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '2px',
                  height: '16px',
                  background: isLast ? '#DAA520' : '#5C4033',
                  margin: '0 auto',
                  borderRadius: '1px',
                }}
              />
              <span
                style={{
                  display: 'block',
                  marginTop: '2px',
                  fontSize: '9px',
                  color: isLast ? '#DAA520' : '#7B6845',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: isLast ? 500 : 300,
                  letterSpacing: '0.5px',
                }}
              >
                {isLast ? 'Today' : year}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '16px',
          marginTop: '6px',
          paddingRight: '4px',
        }}
      >
        <Stat icon="🌿" label={`${totalMembers} members`} />
        <Stat icon="🌳" label={`${totalGenerations} generations`} />
        <Stat icon="🌱" label={`${seedlings.length} seedlings`} />
      </div>
    </div>
  );
}

function Stat({ icon, label }) {
  return (
    <span
      style={{
        fontSize: '10px',
        color: '#7B6845',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.3px',
      }}
    >
      {icon} {label}
    </span>
  );
}
