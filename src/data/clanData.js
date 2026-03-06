// ═══════════════════════════════════════════════
// KAPMIRMET CLAN — Demo Dataset
// ~50 people · 6 generations · 1845–present
// Includes: Founder, offshoots, historical figures
// ═══════════════════════════════════════════════

let _id = 0;

function person(name, birth, death, gender, opts = {}) {
  return {
    id: String(++_id),
    name,
    birth,
    death: death || null,
    gender: gender || 'M',
    badge: opts.badge || null,
    story: opts.story || null,
    claimed: opts.claimed ?? false,
    clan: opts.clan || 'Kapmirmet',
    children: [],
  };
}

// ── GENERATION 1 — ~1845 ──
const founder = person('Mirmetin (Kipkenken)', 1845, 1920, 'M', {
  badge: 'founder',
  claimed: true,
  story:
    'The founding ancestor of the Kapmirmet clan, known by multiple names — Mirmetin, Kipkenken, and a third name lost to time. He established the clan under the totem of the Eagle with a white breast and black back, Mooi Kogos. From his lineage, all Kapmirmet trace their roots.',
});

// ── GENERATION 2 — ~1870–1880 ──
const arapMirmet = person('Arap Mirmet', 1870, 1940, 'M', {
  badge: 'warrior',
  story:
    "A legendary warrior who defended the clan's territory during the turbulent conflicts of the late 1800s. Known for his bravery and strategic mind.",
});

const kipkoech = person('Kipkoech Mirmet', 1873, 1945, 'M', {
  badge: 'migration',
  story:
    "Led the great southern migration of a Kapmirmet sub-group. His journey established new settlements and expanded the clan's reach across the region.",
});

const chebet = person('Chebet Mirmet', 1876, 1950, 'F', {
  badge: 'storykeeper',
  story:
    'The great keeper of oral histories. Through her tireless dedication, countless stories, proverbs, and songs survived to be passed down through the generations.',
});

const kiprotich = person('Kiprotich Mirmet', 1878, 1935, 'M', {
  clan: 'Kapcheboin',
  story:
    'Broke away from the main Kapmirmet lineage to form the Kapcheboin offshoot clan. Though separate, the two clans share deep roots and mutual respect.',
});

founder.children = [arapMirmet, kipkoech, chebet, kiprotich];

// ── GENERATION 3 — ~1900 ──
const kiplagat = person('Kiplagat arap Mirmet', 1900, 1975, 'M', {
  badge: 'clanbuilder',
  story:
    "A great builder and organizer. He formalized many of the clan's gathering traditions and ensured unity among the growing branches.",
});
const jepkosgei = person('Jepkosgei arap Mirmet', 1903, 1980, 'F');
const kibet = person('Kibet Kipkoech', 1902, 1970, 'M');
const chepkemoi = person('Chepkemoi Kipkoech', 1905, 1978, 'F');
const rotich = person('Rotich Kiprotich', 1904, 1968, 'M', { clan: 'Kapcheboin' });
const jeptoo = person('Jeptoo Kiprotich', 1907, 1985, 'F', { clan: 'Kapcheboin' });
const chemosMirmet = person('Chemos Mirmet', 1908, 1980, 'M');

arapMirmet.children = [kiplagat, jepkosgei];
kipkoech.children = [kibet, chepkemoi, chemosMirmet];
kiprotich.children = [rotich, jeptoo];

// ── GENERATION 4 — ~1930 ──
const korir = person('Korir Kiplagat', 1930, 2005, 'M');
const chepkorir = person('Chepkorir Kiplagat', 1933, 2010, 'F');
const bett = person('Bett Kiplagat', 1935, null, 'M', { claimed: true });
const kiprop = person('Kiprop Kibet', 1932, 2000, 'M');
const jepchirchir = person('Jepchirchir Kibet', 1934, 2015, 'F');
const langat = person('Langat Rotich', 1933, 1998, 'M', { clan: 'Kapcheboin' });
const chesang = person('Chesang Jepkosgei', 1936, null, 'F', { claimed: true });
const kibetChemos = person('Kibet Chemos', 1937, 2001, 'M');
const jepngetich = person('Jepngetich Chepkemoi', 1938, null, 'F');

kiplagat.children = [korir, chepkorir, bett];
kibet.children = [kiprop, jepchirchir];
rotich.children = [langat];
jepkosgei.children = [chesang];
chemosMirmet.children = [kibetChemos];
chepkemoi.children = [jepngetich];

// ── GENERATION 5 — ~1960 ──
const kipchoge = person('Kipchoge Korir', 1960, null, 'M', { claimed: true });
const jebet = person('Jebet Korir', 1963, null, 'F', { claimed: true });
const tanui = person('Tanui Bett', 1962, null, 'M', { claimed: true });
const chepngeno = person("Chepng'eno Bett", 1965, null, 'F');
const kiptoo = person('Kiptoo Kiprop', 1961, null, 'M', { claimed: true });
const chelimo = person('Chelimo Kiprop', 1964, null, 'F');
const birech = person('Birech Langat', 1960, null, 'M', { clan: 'Kapcheboin', claimed: true });
const jepkemoi = person('Jepkemoi Chesang', 1962, null, 'F');
const kipngetich = person('Kipngetich Kibet', 1963, null, 'M');
const cherono = person('Cherono Jepngetich', 1966, null, 'F');

korir.children = [kipchoge, jebet];
bett.children = [tanui, chepngeno];
kiprop.children = [kiptoo, chelimo];
langat.children = [birech];
chesang.children = [jepkemoi];
kibetChemos.children = [kipngetich];
jepngetich.children = [cherono];

// ── GENERATION 6 — ~1990–2005 ──
const brian = person('Brian Kipchoge', 1990, null, 'M', { claimed: true });
const faith = person('Faith Kipchoge', 1993, null, 'F', { claimed: true });
const emmanuel = person('Emmanuel Tanui', 1992, null, 'M', { claimed: true });
const mercy = person('Mercy Tanui', 1995, null, 'F');
const kevin = person('Kevin Kiptoo', 1991, null, 'M', { claimed: true });
const sharon = person('Sharon Kiptoo', 1994, null, 'F', { claimed: true });
const dennis = person('Dennis Birech', 1993, null, 'M', { clan: 'Kapcheboin' });
const joy = person('Joy Jepkemoi', 1996, null, 'F');
const victor = person('Victor Chelimo', 1997, null, 'M');
const gloria = person("Gloria Chepng'eno", 1998, null, 'F');
const ian = person('Ian Jebet', 2000, null, 'M');
const linet = person('Linet Jebet', 2003, null, 'F');
const hilda = person('Hilda Kipngetich', 1995, null, 'F');
const cyrus = person('Cyrus Cherono', 2001, null, 'M');

kipchoge.children = [brian, faith];
tanui.children = [emmanuel, mercy];
kiptoo.children = [kevin, sharon];
birech.children = [dennis];
jepkemoi.children = [joy];
chelimo.children = [victor];
chepngeno.children = [gloria];
jebet.children = [ian, linet];
kipngetich.children = [hilda];
cherono.children = [cyrus];

// ── SEEDLINGS (unattached) ──
export const seedlings = [
  person('Joseph Kiprono', 1985, null, 'M', {
    story: "Believes he descends from Kipkoech Mirmet's line but is unsure of the exact connection.",
  }),
  person('Anne Jeptanui', 1990, null, 'F', {
    story: 'Her grandmother told her they are Kapmirmet, but the specific branch is unknown.',
  }),
  person('Michael Chebii', 2001, null, 'M', {
    story: 'Recently learned of his Kapmirmet heritage and is seeking to connect with the clan.',
  }),
];

// ── EXPORTS ──
export const clanTree = founder;

export const BADGE_MAP = {
  founder:     { icon: '👑', label: 'Founder',           color: '#FFD700', description: 'The founding ancestor of the clan — from whose lineage all members trace their roots.' },
  warrior:     { icon: '🛡️', label: 'Warrior',            color: '#CD7F32', description: 'A defender of the clan who showed remarkable courage and protected the community in times of conflict.' },
  migration:   { icon: '🧭', label: 'Migration Leader',   color: '#4682B4', description: 'Led a great journey that expanded the clan\'s reach and established new settlements.' },
  storykeeper: { icon: '📜', label: 'Story Keeper',       color: '#DAA520', description: 'Preserved the clan\'s oral history, proverbs, and songs — ensuring they survived for future generations.' },
  clanbuilder: { icon: '🌱', label: 'Clan Builder',       color: '#6B8E23', description: 'Grew the clan\'s strength through wise leadership, alliances, and tireless community building.' },
  uniter:      { icon: '🤝', label: 'The Uniter',         color: '#C9917B', description: 'A bridge between families and generations — known for resolving conflicts and keeping the clan whole through love and diplomacy.' },
  historian:   { icon: '📖', label: 'Family Historian',   color: '#9ACD32', description: 'Passionately preserves family memories and stories, and ensures that generations stay connected to their roots and to each other.' },
  elder:       { icon: '🌿', label: 'Respected Elder',    color: '#A89070', description: 'A voice of wisdom and lived experience whose guidance shaped the family\'s path across many seasons.' },
  matriarch:   { icon: '🌸', label: 'Matriarch',          color: '#D4A892', description: 'The heart of the family — a pillar of quiet strength, warmth, and love who held everyone together.' },
  patriarch:   { icon: '⚓', label: 'Patriarch',          color: '#8B8682', description: 'An anchor of strength and stability who provided for and protected the family across generations.' },
  pioneer:     { icon: '⚡', label: 'Pioneer',            color: '#E8C040', description: 'A trailblazer who opened new paths — in education, work, or life — making it easier for those who followed.' },
};

export const CLAN_COLORS = {
  Kapmirmet:  { primary: '#B8860B', branch: '#8B6914', leaf: '#DAA520', glow: 'rgba(218,165,32,0.25)' },
  Kapcheboin: { primary: '#6B8E23', branch: '#556B2F', leaf: '#9ACD32', glow: 'rgba(154,205,50,0.25)' },
};

export const TIMELINE_YEARS = [1850, 1880, 1910, 1940, 1970, 2000, 2026];

// Flatten helpers
export function flattenTree(node, depth = 0, parent = null) {
  const result = [{ ...node, depth, parentId: parent ? parent.id : null, children: node.children }];
  for (const child of node.children || []) {
    result.push(...flattenTree(child, depth + 1, node));
  }
  return result;
}

export function countNodes(node) {
  let count = 1;
  for (const child of node.children || []) {
    count += countNodes(child);
  }
  return count;
}

export const totalMembers = countNodes(founder) + seedlings.length;
export const totalGenerations = 6;
