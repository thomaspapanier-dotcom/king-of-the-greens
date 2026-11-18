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
  mccarthy: {
    name: 'McCarthy Links',
    tagline: 'Since the first green.',
  },
  stazz: {
    name: 'Stazz Stance Co.',
    tagline: 'It starts with your stance.',
  },
  quiggs: {
    name: 'Quiggs Break Co.',
    tagline: 'Read it. Roll it. Quigg it.',
  },
};

// How hard an item is to get. Only Common and Very Rare are in use so far; the rest are ready.
export const RARITY = {
  common: { label: 'Common', rank: 0 },
  uncommon: { label: 'Uncommon', rank: 1 },
  rare: { label: 'Rare', rank: 2 },
  'very-rare': { label: 'Very Rare', rank: 3 },
  legendary: { label: 'Legendary', rank: 4 },
  // Not a rarity: logo ideas on display while each brand picks its look.
  concept: { label: 'Logo concept', rank: -1 },
};

/** 2Cozy Co. brand logo: the spade crest. `variant` picks the color to match a garment. */
export const COZY_VARIANTS = ['green', 'teal', 'cocoa', 'red', 'royal'];
export const cozyLogoSrc = (variant = 'green') => `assets/brands/2cozy-${variant}.webp`;
export function cozyBadge(size = 44, _id = '', variant = 'green') {
  return `<img class="cozy-badge" src="${cozyLogoSrc(variant)}" width="${size}" height="${size}" alt="2Cozy Co." draggable="false">`;
}
// The crest printed or embroidered onto an item, centered on (x, y).
const crest = (variant, x, y, size) => `<image href="${cozyLogoSrc(variant)}" x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}"/>`;

// Soft studio light used on every item so they read as rounded, not flat.
const shade = (id) => `<radialGradient id="${id}sh" cx=".32" cy=".22" r=".95"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></radialGradient>`;
const floor = '<ellipse cx="100" cy="188" rx="58" ry="7" fill="#000" opacity=".18"/>';
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
    ${crest('green', 123, 82, 36)}
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
    ${crest('teal', 74, 96, 32)}
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
    ${crest('cocoa', 130, 80, 34)}
    <path d="${body}" fill="none" stroke="#2e1813" stroke-width="2.4" stroke-linejoin="round"/>
  </svg>`;
}

function fittedCap(id, brim, brimDark, button, variant) {
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
    ${crest(variant, 100, 88, 54)}
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
    ${crest('green', 66, 128, 26)}
    <rect x="125" y="132" width="26" height="10" rx="2" fill="#f3ead2" stroke="#1f5f3a" stroke-width="1.2" transform="rotate(-6 138 137)"/>
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
    ${crest('red', 124, 74, 30)}
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
  { id: '2c-argyle-vest', brand: '2cozy', type: 'Tops', rarity: 'common', name: 'Clubhouse Argyle Vest', colorway: 'Forest & Sunflower', note: 'Knit V-neck vest with the 2Cozy spade crest on the chest.', art: argyleVest },
  { id: '2c-collar-pullover', brand: '2cozy', type: 'Tops', rarity: 'common', name: 'Range Collar Pullover', colorway: 'Deep Teal', note: 'Fleece pullover with a white collar, a teal 2Cozy crest and script.', art: collarPullover },
  { id: '2c-hooded-bomber', brand: '2cozy', type: 'Tops', rarity: 'common', name: 'Back Nine Hooded Bomber', colorway: 'Cocoa & Cream', note: 'Snap-front bomber with a cream hood, striped cuffs and a cocoa 2Cozy crest.', art: hoodedBomber },
  { id: '2c-striped-tee', brand: '2cozy', type: 'Tops', rarity: 'common', name: 'Rough Stripe Tee', colorway: 'Red & Black', note: 'Heavy cotton tee with bold stripes, a red 2Cozy crest and a woven hem tag.', art: stripedTee },
  { id: '2c-cap-black-red', brand: '2cozy', type: 'Hats', rarity: 'common', name: '2Cozy Fitted Cap', colorway: 'Black & Red', note: 'Structured fitted cap with the 2Cozy spade crest in red.', art: () => fittedCap('it4', '#d62f2f', '#9c1d1d', '#d62f2f', 'red') },
  { id: '2c-cap-black-royal', brand: '2cozy', type: 'Hats', rarity: 'common', name: '2Cozy Fitted Cap', colorway: 'Black & Royal', note: 'Structured fitted cap with the 2Cozy spade crest in royal blue.', art: () => fittedCap('it5', '#2f5fe0', '#1d3c9c', '#2f5fe0', 'royal') },
  { id: '2c-baroque-shorts', brand: '2cozy', type: 'Bottoms', rarity: 'common', name: 'Royal Court Shorts', colorway: 'Baroque Print', note: 'Drawstring shorts in a gold baroque and zebra print, with the 2Cozy crest.', art: baroqueShorts },
];

// Potential logos for the three brands still choosing their look (display only, not wearable).
const LOGO_STYLES = {
  mccarthy: ['Shield crest', 'Cap profile', 'Round badge', 'Script banner', 'Heart hands crest'],
  stazz: ['Shield crest', 'Cap profile', 'Round badge', 'Lounge banner', 'Diamond hands crest'],
  quiggs: ['Shield crest', 'Cap profile', 'Round badge', 'Course banner', 'Q monogram'],
};
const logoArt = (src) => () => `<img class="shop-logo" src="${src}" alt="" draggable="false">`;

// Legendary drops: one signature piece per house, from the user's product art.
ITEMS.push(
  { id: 'quiggs-raglan-7', brand: 'quiggs', type: 'Tops', rarity: 'legendary', name: 'Quiggs Break Raglan #7', colorway: 'Cream & Navy', note: 'Baseball-style raglan with the Q crest, Quiggs script and a navy #7.', art: logoArt('assets/store/items/quiggs-raglan-7.webp') },
  { id: 'stazz-stance-beanie', brand: 'stazz', type: 'Hats', rarity: 'legendary', name: 'Stazz Stance Beanie', colorway: 'White, Black & Red', note: 'Chunky rib-knit beanie with the round Stazz Stance patch.', art: logoArt('assets/store/items/stazz-beanie-white.webp') },
  { id: 'mccarthy-argyle-polo', brand: 'mccarthy', type: 'Tops', rarity: 'legendary', name: 'McCarthy Links Argyle Polo', colorway: 'Cream & Forest', note: 'Cream polo with an argyle band, a forest-green body and the tartan heart crest.', art: logoArt('assets/store/items/mccarthy-argyle-polo.webp') },
);
for (const [brand, styles] of Object.entries(LOGO_STYLES)) {
  styles.forEach((style, i) => ITEMS.push({
    id: `logo-${brand}-${i + 1}`, brand, type: 'Logos', rarity: 'concept', displayOnly: true,
    name: `Potential ${BRANDS[brand].name.replace(' Co.', '')} logo ${i + 1}`, colorway: style,
    note: `Logo idea ${i + 1} for ${BRANDS[brand].name}.`,
    art: logoArt(`assets/store/logos/${brand}-${i + 1}.webp`),
  }));
}

// 2Cozy Co. collection from the user's lookbook and crew shots (photos cropped per item).
const photoArt = (src) => () => `<img class="shop-photo" src="${src}" alt="" draggable="false">`;
ITEMS.push(
  { id: "2c-kings-putter-knit", brand: '2cozy', type: "Tops", rarity: "legendary", name: "King's Putter Knit", colorway: "Forest & Cream", note: "Heavy varsity knit with the 2Cozy King and his putter across the chest.", art: photoArt('assets/store/2cozy/kings-putter-knit.webp') },
  { id: "2c-kings-crest-knit", brand: '2cozy', type: "Tops", rarity: "legendary", name: "Royal Court Crest Knit", colorway: "Forest Green", note: "Zip knit with the full royal-court crest on the back and cream sleeve stripes.", art: photoArt('assets/store/2cozy/kings-crest-knit.webp') },
  { id: "2c-cozy-spade-tee", brand: '2cozy', type: "Tops", rarity: "very-rare", name: "Cozy Spade Tee", colorway: "White & Gold", note: "The cozy spade by the fire, sipping tea under a knit blanket, with gold 2Cozy script.", art: logoArt('assets/store/2cozy/cozy-spade-tee.webp') },
  { id: "2c-cozy-spade-hoodie", brand: '2cozy', type: "Tops", rarity: "very-rare", name: "Cozy Spade Hoodie", colorway: "Cream & Gold", note: "Heavyweight hoodie with the fireside spade print and gold 2Cozy script.", art: photoArt('assets/store/2cozy/cozy-spade-hoodie.webp') },
  { id: "2c-royal-crest-sherpa", brand: '2cozy', type: "Tops", rarity: "very-rare", name: "Royal Crest Sherpa", colorway: "Cream Sherpa", note: "Fluffy sherpa crewneck with the royal-court crest.", art: photoArt('assets/store/2cozy/royal-crest-sherpa.webp') },
  { id: "2c-fireside-sherpa", brand: '2cozy', type: "Tops", rarity: "very-rare", name: "Fireside Sherpa Half-Zip", colorway: "Forest Sherpa", note: "Green sherpa half-zip with the fireside spade print.", art: photoArt('assets/store/2cozy/fireside-sherpa.webp') },
  { id: "2c-navy-sherpa-half-zip", brand: '2cozy', type: "Tops", rarity: "very-rare", name: "Midnight Sherpa Half-Zip", colorway: "Navy & Cream", note: "Navy sherpa half-zip with big cream 2Cozy script.", art: photoArt('assets/store/2cozy/navy-sherpa-half-zip.webp') },
  { id: "2c-sherpa-spade-zip", brand: '2cozy', type: "Tops", rarity: "rare", name: "Sherpa Spade Zip Jacket", colorway: "Cream & Forest", note: "Full-zip sherpa jacket with forest trim and a spade patch.", art: photoArt('assets/store/2cozy/sherpa-spade-zip.webp') },
  { id: "2c-maroon-rugby", brand: '2cozy', type: "Tops", rarity: "rare", name: "Clubhouse Rugby", colorway: "Maroon & Cream", note: "Striped rugby shirt with a gold 2Cozy chest script.", art: photoArt('assets/store/2cozy/maroon-rugby.webp') },
  { id: "2c-varsity-spade-cardigan", brand: '2cozy', type: "Tops", rarity: "rare", name: "Varsity Spade Cardigan", colorway: "Forest, Cream & Gold", note: "Varsity V-neck cardigan with a spade patch and striped sleeves.", art: photoArt('assets/store/2cozy/varsity-spade-cardigan.webp') },
  { id: "2c-spade-band-sweater", brand: '2cozy', type: "Tops", rarity: "rare", name: "Spade Band Sweater", colorway: "Forest & Cream", note: "Chunky knit with 2Cozy script and a band of spades.", art: photoArt('assets/store/2cozy/spade-band-sweater.webp') },
  { id: "2c-stripe-sherpa-pullover", brand: '2cozy', type: "Tops", rarity: "rare", name: "Fairway Stripe Sherpa", colorway: "Cream, Forest & Gold", note: "Cream sherpa pullover with forest and gold sleeve stripes.", art: photoArt('assets/store/2cozy/stripe-sherpa-pullover.webp') },
  { id: "2c-king-headcover", brand: '2cozy', type: "Accessories", rarity: "rare", name: "King Putter Headcover", colorway: "Cream", note: "Knit putter headcover with the 2Cozy King patch.", art: photoArt('assets/store/2cozy/king-headcover.webp') },
  { id: "2c-cap-green-king-patch", brand: '2cozy', type: "Hats", rarity: "uncommon", name: "King Patch Corduroy Cap", colorway: "Forest", note: "Corduroy cap with the 2Cozy King patch on the front.", art: photoArt('assets/store/2cozy/cap-green-king-patch.webp') },
  { id: "2c-royal-crest-tote", brand: '2cozy', type: "Accessories", rarity: "uncommon", name: "Royal Crest Tote", colorway: "Canvas", note: "Canvas tote with the royal-court crest and 2Cozy Co. script.", art: photoArt('assets/store/2cozy/royal-crest-tote.webp') },
  { id: "2c-spade-tote", brand: '2cozy', type: "Accessories", rarity: "uncommon", name: "Fireside Spade Tote", colorway: "Canvas", note: "Canvas tote with the fireside spade print.", art: photoArt('assets/store/2cozy/spade-tote.webp') },
  { id: "2c-clubhouse-duffel", brand: '2cozy', type: "Accessories", rarity: "uncommon", name: "Clubhouse Duffel", colorway: "Navy & Gold", note: "Weekend duffel with gold 2Cozy script.", art: photoArt('assets/store/2cozy/clubhouse-duffel.webp') },
  { id: "2c-king-patch", brand: '2cozy', type: "Accessories", rarity: "uncommon", name: "King Embroidered Patch", colorway: "Embroidered", note: "The 2Cozy King, stitched as an iron-on patch.", art: photoArt('assets/store/2cozy/king-patch.webp') },
  { id: "2c-cozy-spade-print", brand: '2cozy', type: "Accessories", rarity: "uncommon", name: "Fireside Spade Print", colorway: "Black & White", note: "The original fireside spade artwork as a print.", art: logoArt('assets/store/2cozy/cozy-spade-print.webp') },
  { id: "2c-clubhouse-quarter-zip", brand: '2cozy', type: "Tops", rarity: "common", name: "Clubhouse Quarter-Zip", colorway: "Cream & Forest", note: "Cream quarter-zip with forest sleeve stripes.", art: photoArt('assets/store/2cozy/clubhouse-quarter-zip.webp') },
  { id: "2c-black-spade-tee", brand: '2cozy', type: "Tops", rarity: "common", name: "Spade Crest Tee", colorway: "Black", note: "Black tee with a small spade and 2Cozy chest crest.", art: photoArt('assets/store/2cozy/black-spade-tee.webp') },
  { id: "2c-lounge-trousers", brand: '2cozy', type: "Bottoms", rarity: "common", name: "Lounge Trousers", colorway: "Cream, Cocoa, Forest & Black", note: "Relaxed wide-leg trousers with a small 2Cozy script, in four colors.", art: photoArt('assets/store/2cozy/lounge-trousers.webp') },
  { id: "2c-cap-cream-2cozy-co", brand: '2cozy', type: "Hats", rarity: "common", name: "2Cozy Co. Script Cap", colorway: "Cream & Forest", note: "Cream cap with a forest brim and 2Cozy Co. script.", art: photoArt('assets/store/2cozy/cap-cream-2cozy-co.webp') },
  { id: "2c-cap-cream-spade", brand: '2cozy', type: "Hats", rarity: "common", name: "Spade Cap", colorway: "Cream", note: "Clean cream cap with a single black spade.", art: photoArt('assets/store/2cozy/cap-cream-spade.webp') },
  { id: "2c-cap-black-cord", brand: '2cozy', type: "Hats", rarity: "common", name: "Gold Script Corduroy Cap", colorway: "Black & Gold", note: "Black corduroy cap with gold 2Cozy script.", art: photoArt('assets/store/2cozy/cap-black-cord.webp') },
  { id: "2c-clubhouse-bottle", brand: '2cozy', type: "Accessories", rarity: "common", name: "Clubhouse Bottle", colorway: "Forest", note: "Insulated bottle with 2Cozy script.", art: photoArt('assets/store/2cozy/clubhouse-bottle.webp') },
  { id: "2c-spade-knit-scarf", brand: '2cozy', type: "Accessories", rarity: "common", name: "Spade Knit Scarf", colorway: "Cream & Forest", note: "Fringed knit scarf with a spade pattern.", art: photoArt('assets/store/2cozy/spade-knit-scarf.webp') },
  { id: "2c-caddie-towel", brand: '2cozy', type: "Accessories", rarity: "common", name: "Caddie Towel", colorway: "Forest & Cream", note: "Golf towel with 2Cozy Co. script and cream stripes.", art: photoArt('assets/store/2cozy/caddie-towel.webp') },
);

export const ITEM_TYPES = ['All', 'Hats', 'Tops', 'Bottoms', 'Accessories', 'Logos'];
