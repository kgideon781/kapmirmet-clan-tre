import { X } from 'lucide-react';

export default function ClanStoryPanel({ onClose }) {
  return (
    <div style={panelStyle}>
      <button onClick={onClose} style={closeBtnStyle}>
        <X size={18} />
      </button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px', paddingTop: '8px' }}>
        <span style={{ fontSize: '52px', display: 'block', lineHeight: 1 }}>🦅</span>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '26px',
            fontWeight: 400,
            color: '#DAA520',
            margin: '14px 0 4px',
            letterSpacing: '1px',
          }}
        >
          The Kapmirmet Clan
        </h2>
        <p
          style={{
            fontSize: '10px',
            color: '#7B6845',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
          }}
        >
          Mooi Kogos
        </p>
      </div>

      <Section title="🌿 Origin" delay={0}>
        The Kapmirmet clan traces its roots to the founding ancestor known by
        multiple names: Mirmetin, Kipkenken, and a third name yet to be
        recovered. The clan's history stretches back to the 1850s and earlier,
        with deep connections to the land and its people.
      </Section>

      <Section title="🦅 Clan Totem" delay={1}>
        The eagle with a white breast and black back, known as Mooi Kogos. The
        eagle symbolizes vision, strength, and the ability to see far across
        generations. It is the spiritual guardian of the clan.
      </Section>

      <Section title="🧭 Migration History" delay={2}>
        Over the decades, members of the clan migrated across regions. Some
        branches, led by figures like Kipkoech Mirmet, established new
        communities while maintaining their Kapmirmet identity. These
        migrations shaped the geographic spread of the clan.
      </Section>

      <Section title="🌳 Clan Offshoots" delay={3}>
        Some members historically broke away to form new clans. The Kapcheboin
        offshoot, founded by Kiprotich Mirmet, remains connected to the
        original tree but has developed its own identity. The tree honors
        these connections while recognizing their distinct paths.
      </Section>

      <Section title="👑 Key Ancestors" delay={4}>
        <strong>Mirmetin (Kipkenken)</strong> — The founding patriarch, around
        whom the entire clan identity formed.
        <br /><br />
        <strong>Arap Mirmet</strong> — A legendary warrior who defended the
        clan's territory.
        <br /><br />
        <strong>Chebet Mirmet</strong> — The great keeper of oral histories.
        <br /><br />
        <strong>Kipkoech Mirmet</strong> — Leader of the southern migration.
        <br /><br />
        <strong>Kiplagat arap Mirmet</strong> — Clan builder who formalized
        gathering traditions.
      </Section>

      <Section title="📜 Cultural Practices" delay={5}>
        The clan maintains strong oral traditions. Stories are passed from
        generation to generation through gatherings and ceremonies. Elders
        serve as the keepers of knowledge, entrusted with the names,
        marriages, and migrations of the clan's many branches.
      </Section>

      <Section title="🌱 This Living Tree" delay={6}>
        This digital heritage tree is a new chapter in the Kapmirmet
        storytelling tradition. Every member who plants themselves on this
        tree adds a leaf to our shared story. The tree grows as our knowledge
        grows — branch by branch, generation by generation.
      </Section>
    </div>
  );
}

function Section({ title, children, delay }) {
  return (
    <div
      style={{
        marginBottom: '12px',
        padding: '13px',
        background: 'rgba(92,64,51,0.1)',
        borderRadius: '10px',
        borderLeft: '3px solid rgba(92,64,51,0.5)',
        animation: `slideInUp 0.4s var(--ease-out) ${delay * 0.08}s both`,
      }}
    >
      <p
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#DAA520',
          margin: '0 0 6px',
          fontFamily: 'var(--font-body)',
        }}
      >
        {title}
      </p>
      <div
        style={{
          fontSize: '13px',
          lineHeight: 1.7,
          color: '#D4C4A8',
          fontFamily: 'var(--font-body)',
        }}
      >
        {children}
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
  pointerEvents: 'auto',
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
