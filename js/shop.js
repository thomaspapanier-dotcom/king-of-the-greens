// The KOG Store. For now every item is free and on display only (no try-ons yet).
// Items are drawn here as cartoon art. Each brand is built up slowly; 2Cozy Golf Co. is first.

export const BRANDS = {
  kog: {
    name: 'KOG Originals',
    tagline: 'Limited pieces from the King of the Greens.',
  },
  '2cozy': {
    name: '2Cozy Golf Co.',
    tagline: 'Stay cozy over every putt.',
  },
};

// How hard an item is to get. Only Common and Very Rare are in use so far; the rest are ready.
export const RARITY = {
  common: { label: 'Common', rank: 0 },
  uncommon: { label: 'Uncommon', rank: 1 },
  rare: { label: 'Rare', rank: 2 },
  'very-rare': { label: 'Very Rare', rank: 3 },
  legendary: { label: 'Legendary', rank: 4 },
};

/** 2Cozy mascot: a knit putter headcover wearing a crown. */
export function cozyBadge(size = 44, id = 'cb') {
  return `<svg class="cozy-badge" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">
    <defs><radialGradient id="${id}g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#2f7d4f"/><stop offset="1" stop-color="#174a2c"/></radialGradient></defs>
    <circle cx="60" cy="60" r="56" fill="url(#${id}g)" stroke="#f3ead2" stroke-width="5"/>
    <line x1="60" y1="96" x2="60" y2="110" stroke="#d9dde1" stroke-width="6" stroke-linecap="round"/>
    <path d="M38 96 C34 72 40 50 60 48 C80 50 86 72 82 96 Z" fill="#f3ead2" stroke="#10331f" stroke-width="3"/>
    <path d="M37 80 H83 M36 88 H84" stroke="#1f5f3a" stroke-width="5"/>
    <path d="M46 62 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0" fill="none" stroke="#d9483b" stroke-width="3"/>
    <path d="M44 48 L42 30 L51 38 L60 24 L69 38 L78 30 L76 48 Z" fill="#e6be4a" stroke="#10331f" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="42" cy="29" r="3.5" fill="#e6be4a"/><circle cx="60" cy="23" r="4" fill="#e6be4a"/><circle cx="78" cy="29" r="3.5" fill="#e6be4a"/>
  </svg>`;
}

// Soft studio light used on every item so they read as rounded, not flat.
const shade = (id) => `<radialGradient id="${id}sh" cx=".32" cy=".22" r=".95"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></radialGradient>`;
const floor = '<ellipse cx="100" cy="188" rx="58" ry="7" fill="#000" opacity=".18"/>';
// A tiny embroidered mascot for chests and patches (same art as the badge, at any spot).
const miniCozy = (x, y, s = 0.18) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-60 -60)">
    <circle cx="60" cy="60" r="56" fill="#1f5f3a" stroke="#f3ead2" stroke-width="7"/>
    <path d="M38 96 C34 72 40 50 60 48 C80 50 86 72 82 96 Z" fill="#f3ead2"/>
    <path d="M37 80 H83" stroke="#1f5f3a" stroke-width="6"/>
    <path d="M44 48 L42 30 L51 38 L60 24 L69 38 L78 30 L76 48 Z" fill="#e6be4a"/>
  </g>`;
const script = (x, y, size, fill, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="'Brush Script MT','Segoe Script','Snell Roundhand',cursive" font-style="italic" font-weight="700" font-size="${size}" fill="${fill}" ${extra}>2Cozy</text>`;

function argyleVest() {
  const id = 'it1';
  const body = 'M66 30 L84 24 Q100 62 116 24 L134 30 Q138 48 150 58 Q141 74 144 96 L147 168 Q100 180 53 168 L56 96 Q59 74 50 58 Q62 48 66 30 Z';
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs>${shade(id)}
      <pattern id="${id}p" width="26" height="34" patternUnits="userSpaceOnUse" patternTransform="translate(9 4)">
        <rect width="26" height="34" fill="#1f4d2b"/><path d="M13 0 L26 17 L13 34 L0 17 Z" fill="#f2d31b"/>
        <path d="M0 0 L26 34 M26 0 L0 34" stroke="#fff6d8" stroke-width=".9" opacity=".85"/>
      </pattern><clipPath id="${id}c"><path d="${body}"/></clipPath></defs>
    ${floor}
    <path d="${body}" fill="url(#${id}p)"/>
    <g clip-path="url(#${id}c)">
      <path d="M50 162 Q100 172 150 162 L150 190 L50 190 Z" fill="#183d22"/>
      <path d="M53 160 Q100 170 147 160" stroke="#2a6b3a" stroke-width="1.2" stroke-dasharray="2 2" fill="none"/>
      <rect width="200" height="200" fill="url(#${id}sh)"/>
    </g>
    <path d="M84 24 Q100 62 116 24" fill="none" stroke="#183d22" stroke-width="7" stroke-linejoin="round"/>
    <path d="M66 30 Q62 50 50 58 M134 30 Q138 50 150 58" fill="none" stroke="#183d22" stroke-width="7" stroke-linecap="round"/>
    <path d="${body}" fill="none" stroke="#0f2a17" stroke-width="2.4" stroke-linejoin="round"/>
    <circle cx="124" cy="80" r="13.5" fill="#f3ead2" stroke="#c9a227" stroke-width="2.5"/>
    ${miniCozy(124, 80, 0.17)}
  </svg>`;
}

function collarPullover() {
  const id = 'it2';
  const body = 'M70 34 L130 34 L168 56 L178 128 L160 132 L152 82 L148 172 Q100 182 52 172 L48 82 L40 132 L22 128 L32 56 Z';
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs>${shade(id)}<clipPath id="${id}c"><path d="${body}"/></clipPath></defs>
    ${floor}
    <path d="${body}" fill="#11606a"/>
    <g clip-path="url(#${id}c)">
      <path d="M48 160 Q100 170 152 160 L152 190 L48 190 Z" fill="#0b4950"/>
      <path d="M20 120 L42 124 L40 140 L18 136 Z M158 124 L180 120 L182 136 L160 140 Z" fill="#0b4950"/>
      <rect width="200" height="200" fill="url(#${id}sh)"/>
    </g>
    <path d="M70 34 L100 64 L82 70 L66 40 Z" fill="#f6f2e7" stroke="#0a3f45" stroke-width="2"/>
    <path d="M130 34 L100 64 L118 70 L134 40 Z" fill="#f6f2e7" stroke="#0a3f45" stroke-width="2"/>
    <path d="M100 64 L100 92" stroke="#0a3f45" stroke-width="2"/>
    <circle cx="104" cy="74" r="2.4" fill="#f6f2e7" stroke="#0a3f45"/><circle cx="104" cy="85" r="2.4" fill="#f6f2e7" stroke="#0a3f45"/>
    ${script(126, 104, 15, '#f3ead2')}
    <path d="${body}" fill="none" stroke="#06343a" stroke-width="2.4" stroke-linejoin="round"/>
  </svg>`;
}

function hoodedBomber() {
  const id = 'it3';
  const body = 'M68 40 L132 40 L168 60 L178 132 L158 136 L152 88 L150 170 Q100 180 50 170 L48 88 L42 136 L22 132 L32 60 Z';
  const stripes = (x, y, w, h, v = false) => `<g>${[0, 1, 2, 3].map((k) => `<rect x="${v ? x + k * (w / 4) : x}" y="${v ? y : y + k * (h / 4)}" width="${v ? w / 4 : w}" height="${v ? h : h / 4}" fill="${k % 2 ? '#f3ead2' : '#4a2a22'}"/>`).join('')}</g>`;
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs>${shade(id)}<clipPath id="${id}c"><path d="${body}"/></clipPath>
      <linearGradient id="${id}n" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5446"/><stop offset=".5" stop-color="#6e3f33"/><stop offset="1" stop-color="#5a3128"/></linearGradient></defs>
    ${floor}
    <path d="M70 44 Q66 14 100 12 Q134 14 130 44 Z" fill="#f4f1ea" stroke="#9c9a92" stroke-width="2"/>
    <path d="M78 42 Q80 24 100 22 Q120 24 122 42" fill="#dcd8cc"/>
    <path d="${body}" fill="url(#${id}n)"/>
    <g clip-path="url(#${id}c)">
      ${stripes(48, 158, 104, 16)}
      <g transform="rotate(8 31 132)">${stripes(18, 124, 24, 12)}</g><g transform="rotate(-8 169 132)">${stripes(158, 124, 24, 12)}</g>
      <path d="M56 70 Q60 110 54 150" stroke="#000" stroke-opacity=".12" stroke-width="3" fill="none"/>
      <path d="M144 70 Q140 110 146 150" stroke="#000" stroke-opacity=".12" stroke-width="3" fill="none"/>
      <rect width="200" height="200" fill="url(#${id}sh)"/>
    </g>
    <path d="M100 40 L100 168" stroke="#3e211b" stroke-width="2.4"/>
    ${[56, 80, 104, 128, 150].map((y) => `<circle cx="106" cy="${y}" r="3" fill="#d6dade" stroke="#555" stroke-width="1"/>`).join('')}
    <path d="M90 44 L86 74 M110 44 L114 74" stroke="#f4f1ea" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M60 116 L84 116" stroke="#3e211b" stroke-width="3" stroke-linecap="round"/>
    <rect x="118" y="66" width="24" height="24" rx="5" fill="#f3ead2" stroke="#c9a227" stroke-width="2"/>
    <text x="130" y="84" text-anchor="middle" font-family="Georgia,serif" font-weight="800" font-style="italic" font-size="15" fill="#6e3f33">2C</text>
    <path d="${body}" fill="none" stroke="#2e1813" stroke-width="2.4" stroke-linejoin="round"/>
  </svg>`;
}

function fittedCap(id, brim, brimDark, button, logoFill, logoStroke) {
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs>${shade(id)}
      <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${brim}"/><stop offset="1" stop-color="${brimDark}"/></linearGradient>
      <clipPath id="${id}c"><path d="M42 124 Q40 54 100 48 Q160 54 158 124 Z"/></clipPath></defs>
    <ellipse cx="100" cy="176" rx="64" ry="8" fill="#000" opacity=".2"/>
    <path d="M42 124 Q40 54 100 48 Q160 54 158 124 Z" fill="#17171a"/>
    <g clip-path="url(#${id}c)">
      <path d="M100 48 Q86 90 84 124 M100 48 Q114 90 116 124 M100 48 Q62 74 56 124 M100 48 Q138 74 144 124" stroke="#2c2c31" stroke-width="2" fill="none"/>
      <rect width="200" height="200" fill="url(#${id}sh)"/>
    </g>
    <circle cx="74" cy="78" r="2.4" fill="#2c2c31"/><circle cx="126" cy="78" r="2.4" fill="#2c2c31"/>
    <ellipse cx="100" cy="47" rx="7" ry="4" fill="${button}" stroke="#0c0c0e" stroke-width="1.5"/>
    <text x="100" y="106" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-weight="900" font-style="italic" font-size="38" fill="${logoFill}" stroke="${logoStroke}" stroke-width="2.2" paint-order="stroke" letter-spacing="-2">2C</text>
    <path d="M30 124 Q100 106 170 124 Q182 150 100 156 Q18 150 30 124 Z" fill="url(#${id}b)" stroke="#0c0c0e" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M38 128 Q100 113 162 128 M44 134 Q100 120 156 134" stroke="#000" stroke-opacity=".22" stroke-width="1.4" fill="none"/>
    <path d="M42 124 Q40 54 100 48 Q160 54 158 124" fill="none" stroke="#0c0c0e" stroke-width="2.4"/>
    <rect x="148" y="98" width="10" height="7" rx="1.5" fill="#f3ead2" transform="rotate(-12 153 101)"/>
  </svg>`;
}

function baroqueShorts() {
  const id = 'it6';
  const body = 'M48 40 L152 40 L162 150 L110 156 L100 92 L90 156 L38 150 Z';
  const scroll = (x, y, r, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})"><circle r="${r}" fill="none" stroke="#e0a526" stroke-width="3"/><path d="M0 ${-r} q${r} ${r / 2} 0 ${r} q${-r / 2} ${-r / 3} 0 ${-r / 2}" fill="none" stroke="#f7d36b" stroke-width="2.2"/><circle r="${r / 3}" fill="#f2c33c"/></g>`;
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs>${shade(id)}<clipPath id="${id}c"><path d="${body}"/></clipPath></defs>
    ${floor}
    <path d="${body}" fill="#f6efe0"/>
    <g clip-path="url(#${id}c)">
      <path d="M30 60 L80 40 L96 90 L40 110 Z" fill="#c62f37"/>
      <path d="M110 110 L170 90 L170 160 L120 160 Z" fill="#c62f37"/>
      <path d="M100 40 L160 40 L150 80 L110 74 Z" fill="#2c5a3a"/>
      <path d="M30 120 L80 112 L76 160 L30 160 Z" fill="#2c5a3a"/>
      <g stroke="#1a1a1a" stroke-width="4" fill="none" stroke-linecap="round">
        <path d="M84 100 q8 -6 16 0 t16 0"/><path d="M80 112 q8 -6 16 0 t16 0"/><path d="M118 60 q6 6 0 12 t0 12"/><path d="M130 58 q6 6 0 12 t0 12"/>
        <path d="M54 76 q6 6 0 12 t0 12"/>
      </g>
      ${scroll(66, 58, 11)}${scroll(140, 122, 12, 40)}${scroll(58, 134, 10, -30)}${scroll(124, 88, 8, 80)}${scroll(92, 140, 9)}
      <path d="M48 40 L152 40 L153 54 L47 54 Z" fill="#1a1a1a"/>
      <path d="M50 47 L150 47" stroke="#3a3a3a" stroke-width="1.5" stroke-dasharray="3 3"/>
      <rect width="200" height="200" fill="url(#${id}sh)"/>
    </g>
    <path d="M94 50 Q90 70 84 78 M106 50 Q110 70 116 78" stroke="#f4f1ea" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <rect x="128" y="132" width="20" height="10" rx="2" fill="#f3ead2" stroke="#1f5f3a" stroke-width="1.2" transform="rotate(-6 138 137)"/>
    <text x="138" y="140" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-weight="800" font-size="7" fill="#1f5f3a" transform="rotate(-6 138 137)">2Cozy</text>
    <path d="${body}" fill="none" stroke="#3b2a12" stroke-width="2.4" stroke-linejoin="round"/>
  </svg>`;
}

function stripedTee() {
  const id = 'it7';
  const body = 'M70 32 Q100 46 130 32 L170 50 L182 88 L156 96 L150 80 L150 170 Q100 178 50 170 L50 80 L44 96 L18 88 L30 50 Z';
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs>${shade(id)}<clipPath id="${id}c"><path d="${body}"/></clipPath>
      <pattern id="${id}p" width="20" height="22" patternUnits="userSpaceOnUse" patternTransform="translate(0 6)"><rect width="20" height="22" fill="#c62828"/><rect y="11" width="20" height="11" fill="#151515"/></pattern></defs>
    ${floor}
    <path d="${body}" fill="url(#${id}p)"/>
    <g clip-path="url(#${id}c)"><rect width="200" height="200" fill="url(#${id}sh)"/></g>
    <path d="M70 32 Q100 46 130 32" fill="none" stroke="#151515" stroke-width="7" stroke-linecap="round"/>
    <rect x="58" y="150" width="26" height="14" rx="2" fill="#f3ead2" stroke="#151515" stroke-width="1.4"/>
    ${script(71, 161, 10, '#1f5f3a')}
    ${miniCozy(122, 70, 0.13)}
    <path d="${body}" fill="none" stroke="#0b0b0b" stroke-width="2.4" stroke-linejoin="round"/>
  </svg>`;
}

// White knit pullover with a navy collar and the Four Houses card print on the chest.
function fourHousesPullover() {
  const id = 'it8';
  const body = 'M70 34 L130 34 L168 56 L178 128 L160 132 L152 82 L148 172 Q100 182 52 172 L48 82 L40 132 L22 128 L32 56 Z';
  const knit = Array.from({ length: 16 }, (_, k) => `<path d="M${30 + k * 10} 40 L${30 + k * 10} 180" stroke="#d9d4c8" stroke-width=".8" opacity=".55"/>`).join('');
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs>${shade(id)}<clipPath id="${id}c"><path d="${body}"/></clipPath>
      <clipPath id="${id}p"><rect x="68" y="76" width="64" height="80" rx="4"/></clipPath>
      <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ece7dc"/></linearGradient></defs>
    ${floor}
    <path d="${body}" fill="url(#${id}w)"/>
    <g clip-path="url(#${id}c)">
      ${knit}
      <path d="M48 160 Q100 170 152 160 L152 190 L48 190 Z" fill="#e4dfd3"/>
      <path d="M50 164 Q100 174 150 164 M50 170 Q100 180 150 170" stroke="#cfc9bc" stroke-width="1" fill="none"/>
      <path d="M20 120 L42 124 L40 140 L18 136 Z M158 124 L180 120 L182 136 L160 140 Z" fill="#e4dfd3"/>
    </g>
    <rect x="66" y="74" width="68" height="84" rx="5" fill="#c9a227"/>
    <image href="assets/store/four-houses-print.webp" x="68" y="76" width="64" height="80" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id}p)"/>
    <g clip-path="url(#${id}c)"><rect width="200" height="200" fill="url(#${id}sh)"/></g>
    <path d="M70 34 L100 64 L82 70 L66 40 Z" fill="#1b2a4a" stroke="#0f1a30" stroke-width="2"/>
    <path d="M130 34 L100 64 L118 70 L134 40 Z" fill="#1b2a4a" stroke="#0f1a30" stroke-width="2"/>
    <path d="M70 37 L99 62 M130 37 L101 62" stroke="#f3ead2" stroke-width="1.2" opacity=".7"/>
    <path d="${body}" fill="none" stroke="#9a9488" stroke-width="2.4" stroke-linejoin="round"/>
  </svg>`;
}

export const ITEMS = [
  { id: 'kog-four-houses-pullover', brand: 'kog', type: 'Tops', rarity: 'very-rare', name: 'Four Houses Pullover', colorway: 'White & Navy', note: 'White knit pullover with a navy collar, printed with all four house Kings.', art: fourHousesPullover },
  { id: '2c-argyle-vest', brand: '2cozy', type: 'Tops', rarity: 'common', name: 'Clubhouse Argyle Vest', colorway: 'Forest & Sunflower', note: 'Knit V-neck vest with the 2Cozy crest patch.', art: argyleVest },
  { id: '2c-collar-pullover', brand: '2cozy', type: 'Tops', rarity: 'common', name: 'Range Collar Pullover', colorway: 'Deep Teal', note: 'Fleece pullover with a crisp white collar and 2Cozy script.', art: collarPullover },
  { id: '2c-hooded-bomber', brand: '2cozy', type: 'Tops', rarity: 'common', name: 'Back Nine Hooded Bomber', colorway: 'Cocoa & Cream', note: 'Snap-front bomber with a cream hood and striped cuffs.', art: hoodedBomber },
  { id: '2c-striped-tee', brand: '2cozy', type: 'Tops', rarity: 'common', name: 'Rough Stripe Tee', colorway: 'Red & Black', note: 'Heavy cotton tee with bold stripes and a woven hem tag.', art: stripedTee },
  { id: '2c-cap-black-red', brand: '2cozy', type: 'Hats', rarity: 'common', name: '2C Fitted Cap', colorway: 'Black & Red', note: 'Structured fitted cap with a gold 2C monogram.', art: () => fittedCap('it4', '#d62f2f', '#9c1d1d', '#d62f2f', '#f2c230', '#b81f1f') },
  { id: '2c-cap-black-royal', brand: '2cozy', type: 'Hats', rarity: 'common', name: '2C Fitted Cap', colorway: 'Black & Royal', note: 'Structured fitted cap with a royal 2C monogram.', art: () => fittedCap('it5', '#2f5fe0', '#1d3c9c', '#2f5fe0', '#2f5fe0', '#f2722b') },
  { id: '2c-baroque-shorts', brand: '2cozy', type: 'Bottoms', rarity: 'common', name: 'Royal Court Shorts', colorway: 'Baroque Print', note: 'Drawstring shorts in a gold baroque, zebra and crest print.', art: baroqueShorts },
];

export const ITEM_TYPES = ['All', 'Hats', 'Tops', 'Bottoms'];
