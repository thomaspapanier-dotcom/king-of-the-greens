// 2Cozy Golf Co. collection, drawn as cartoon clothing (from the user's lookbook and crew shots).
// Same designs as the photos: colors, stripes, scripts and artwork. No people, no accessories.
// Each piece is a 200x200 SVG cut to fit snug on an avatar, like the other drawn store items.

const ART = 'assets/store/art/';

// ---------- shared parts ----------
const shade = (id) => `<radialGradient id="${id}sh" cx=".32" cy=".22" r=".95"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></radialGradient>`;
const floor = '<ellipse cx="100" cy="188" rx="58" ry="7" fill="#000" opacity=".18"/>';
const script = (text, x, y, size, fill, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="'Brush Script MT','Segoe Script','Snell Roundhand',cursive" font-style="italic" font-weight="700" font-size="${size}" fill="${fill}" ${extra}>${text}</text>`;
const art = (file, x, y, w, h) => `<image href="${ART}${file}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;

const SPADE = 'M50 4C40 22 8 36 8 60c0 14 11 23 23 23 7 0 12-3 16-8-1 10-5 16-13 21h32c-8-5-12-11-13-21 4 5 9 8 16 8 12 0 23-9 23-23 0-24-32-38-42-56Z';
const spade = (x, y, s, fill, extra = '') => `<path d="${SPADE}" transform="translate(${x - s / 2} ${y - s / 2}) scale(${s / 100})" fill="${fill}" ${extra}/>`;
// The little fireside-spade patch: a white spade with the spade character inside.
const spadePatch = (id, x, y, s) => `<clipPath id="${id}sp"><path d="${SPADE}" transform="translate(${x - s * 0.4} ${y - s * 0.42}) scale(${s * 0.8 / 100})"/></clipPath>
  ${spade(x, y, s, '#f7f3ea', 'stroke="#111" stroke-width="1.6" vector-effect="non-scaling-stroke"')}
  <image href="${ART}spade-patch.webp" x="${x - s * 0.4}" y="${y - s * 0.42}" width="${s * 0.8}" height="${s * 0.8}" clip-path="url(#${id}sp)"/>`;

// Fabric textures
const knit = (id, base, line) => `<pattern id="${id}f" width="7" height="200" patternUnits="userSpaceOnUse"><rect width="7" height="200" fill="${base}"/><path d="M3.5 0V200" stroke="${line}" stroke-width="1.4" opacity=".55"/></pattern>`;
const sherpa = (id, base, light, dark) => `<pattern id="${id}f" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="${base}"/><circle cx="2.5" cy="2.5" r="2.6" fill="${light}" opacity=".55"/><circle cx="7" cy="6.5" r="2.4" fill="${dark}" opacity=".35"/><circle cx="7" cy="1" r="1.4" fill="${light}" opacity=".4"/></pattern>`;

// Silhouettes (front view, cut slim so they sit snug on an avatar)
const CREW = 'M70 34 L130 34 L168 56 L178 128 L160 132 L152 82 L148 172 Q100 182 52 172 L48 82 L40 132 L22 128 L32 56 Z';
const TEE = 'M70 32 Q100 46 130 32 L170 50 L182 88 L156 96 L150 80 L150 170 Q100 178 50 170 L50 80 L44 96 L18 88 L30 50 Z';
const HEM = (fill) => `<path d="M46 160 Q100 170 154 160 L154 190 L46 190 Z" fill="${fill}"/>`;
const HEM_STRIPE = (fill, y = 166) => `<path d="M46 ${y} Q100 ${y + 10} 154 ${y} L154 ${y + 4} Q100 ${y + 14} 46 ${y + 4} Z" fill="${fill}"/>`;
const CUFFS = (fill) => `<path d="M18 118 L43 122 L41 142 L16 138 Z M157 122 L182 118 L184 138 L159 142 Z" fill="${fill}"/>`;
// A band around both sleeves (top y, height h), stopping before the body.
const SLEEVE_BAND = (y, h, fill) => `<path d="M8 ${y} L46.5 ${y + 3} L46.5 ${y + 3 + h} L8 ${y + h} Z M153.5 ${y + 3} L192 ${y} L192 ${y + h} L153.5 ${y + 3 + h} Z" fill="${fill}"/>`;
const CREW_NECK = (rib, hole = '#00000066', trim = '') => `<path d="M72 34 Q100 50 128 34 Q100 40 72 34Z" fill="${hole}"/>
  <path d="M70 34 Q100 54 130 34" fill="none" stroke="${rib}" stroke-width="8" stroke-linecap="round"/>
  ${trim ? `<path d="M71 37 Q100 56 129 37" fill="none" stroke="${trim}" stroke-width="1.8" stroke-linecap="round"/>` : ''}`;
// Stand-up half-zip collar; the zip runs down to zipTo.
const ZIP_COLLAR = (fill, edge, zipTo = 70, trim = '') => `<path d="M70 28 Q100 22 130 28 L130 34 Q100 30 70 34 Z" fill="#00000055"/>
  <path d="M68 40 L70 26 Q84 30 100 40 Q116 30 130 26 L132 40 Q118 50 100 50 Q82 50 68 40Z" fill="${fill}" stroke="${edge}" stroke-width="2" stroke-linejoin="round"/>
  ${trim ? `<path d="M70 38 Q84 47 100 47 Q116 47 130 38" fill="none" stroke="${trim}" stroke-width="2.2"/>` : ''}
  <path d="M100 40 L100 ${zipTo}" stroke="${edge}" stroke-width="2.6"/><path d="M100 42 L100 ${zipTo}" stroke="#c9c4b8" stroke-width="1" stroke-dasharray="1.5 1.5"/>
  <rect x="97" y="${zipTo - 2}" width="6" height="10" rx="2" fill="#c9c4b8" stroke="${edge}" stroke-width="1"/>`;
const POLO_COLLAR = (fill, edge) => `<path d="M72 34 L100 58 L84 66 L66 40 Z" fill="${fill}" stroke="${edge}" stroke-width="2"/>
  <path d="M128 34 L100 58 L116 66 L134 40 Z" fill="${fill}" stroke="${edge}" stroke-width="2"/>`;

function wear(id, { body = CREW, fill, defs = '', behind = '', inner = '', over = '', outline }) {
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs>${shade(id)}<clipPath id="${id}c"><path d="${body}"/></clipPath>${defs}</defs>
    ${floor}${behind}
    <path d="${body}" fill="${fill}"/>
    <g clip-path="url(#${id}c)">${inner}<rect width="200" height="200" fill="url(#${id}sh)"/></g>
    ${over}
    <path d="${body}" fill="none" stroke="${outline}" stroke-width="2.4" stroke-linejoin="round"/>
  </svg>`;
}

// ---------- tops ----------
const FOREST = '#1d4a2f';
const CREAM = '#efe6d2';
const GOLD = '#f2b705';

function kingsPutterKnit() {
  const id = 'cw1';
  return wear(id, {
    fill: `url(#${id}f)`, defs: knit(id, FOREST, '#163a25'), outline: '#0f2a1a',
    inner: `${HEM('#183f28')}${HEM_STRIPE(CREAM, 164)}${HEM_STRIPE(CREAM, 172)}${CUFFS('#183f28')}
      ${SLEEVE_BAND(86, 7, CREAM)}${SLEEVE_BAND(99, 7, CREAM)}
      ${art('king-putter.webp', 64, 46, 72, 86)}
      ${script('2Cozy Co.', 100, 150, 19, CREAM)}`,
    over: CREW_NECK('#183f28', '#0b2215', CREAM),
  });
}

function kingsCrestKnit() {
  const id = 'cw2';
  return wear(id, {
    fill: `url(#${id}f)`, defs: knit(id, '#1b462c', '#143823'), outline: '#0f2a1a',
    inner: `${HEM('#163c26')}${HEM_STRIPE(CREAM, 168)}${CUFFS('#163c26')}
      ${SLEEVE_BAND(84, 6, CREAM)}${SLEEVE_BAND(96, 6, CREAM)}
      ${art('royal-crest.webp', 55, 44, 90, 96)}
      ${script('2Cozy Co.', 100, 157, 17, CREAM)}`,
    over: CREW_NECK('#163c26', '#0b2215', CREAM),
  });
}

function cozySpadeTee() {
  const id = 'cw3';
  return wear(id, {
    body: TEE, fill: '#fbfaf6', outline: '#9a968c',
    inner: `<path d="M18 84 L44 92 L42 98 L16 90 Z M156 92 L182 84 L184 90 L158 98 Z" fill="#ecebe5"/>
      ${art('fireside.webp', 63, 50, 74, 74)}
      ${script('2Cozy', 100, 148, 28, GOLD)}`,
    over: CREW_NECK('#eceae3', '#00000030'),
  });
}

function cozySpadeHoodie() {
  const id = 'cw4';
  return wear(id, {
    fill: CREAM, outline: '#8f846c',
    behind: '<path d="M64 46 Q60 8 100 6 Q140 8 136 46 Z" fill="#e2d7bf" stroke="#8f846c" stroke-width="2.4"/>',
    inner: `${HEM('#e3d9c2')}${CUFFS('#e3d9c2')}
      <path d="M62 140 Q100 135 138 140 L144 166 Q100 171 56 166 Z" fill="none" stroke="#cbbf9f" stroke-width="2"/>
      ${art('fireside.webp', 66, 68, 68, 68)}
      ${script('2Cozy', 100, 154, 25, GOLD)}`,
    over: `<path d="M76 34 Q100 64 124 34 Q100 44 76 34Z" fill="#5d523e"/>
      <path d="M70 34 Q100 70 130 34" fill="none" stroke="#e2d7bf" stroke-width="9" stroke-linecap="round"/>
      <path d="M91 52 Q89 60 90 68 M109 52 Q111 60 110 68" stroke="#f7f1e3" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <rect x="88" y="66" width="4" height="7" rx="1.5" fill="#c9bfa8"/><rect x="108" y="66" width="4" height="7" rx="1.5" fill="#c9bfa8"/>`,
  });
}

function royalCrestSherpa() {
  const id = 'cw5';
  return wear(id, {
    fill: `url(#${id}f)`, defs: sherpa(id, '#efe5cf', '#fffaf0', '#cdbf9f'), outline: '#9b8e70',
    inner: `${HEM('#e2d6bb')}${CUFFS('#e2d6bb')}
      ${art('royal-crest.webp', 58, 54, 84, 90)}
      ${script('2Cozy Co.', 100, 160, 14, '#1f5a37')}`,
    over: `${CREW_NECK('#e2d6bb', '#00000040')}
      <path d="M78 34 L100 50 L88 56 L74 38 Z M122 34 L100 50 L112 56 L126 38 Z" fill="#1f5a37" stroke="#123a23" stroke-width="1.6"/>`,
  });
}

function firesideSherpa() {
  const id = 'cw6';
  return wear(id, {
    fill: `url(#${id}f)`, defs: sherpa(id, '#1f4a30', '#2d6644', '#10301d'), outline: '#0d2416',
    inner: `${HEM('#1a4029')}${CUFFS('#1a4029')}
      <rect x="61" y="76" width="78" height="72" rx="5" fill="#f1e9d6" stroke="#111" stroke-width="1.6"/>
      ${art('fireside.webp', 64, 78, 72, 68)}`,
    over: ZIP_COLLAR('#efe4cc', '#8f846c', 66),
  });
}

function navySherpaHalfZip() {
  const id = 'cw7';
  return wear(id, {
    fill: `url(#${id}f)`, defs: sherpa(id, '#1b2547', '#2b3866', '#0e1530'), outline: '#0a1026',
    inner: `${HEM('#16203d')}${HEM_STRIPE(CREAM, 160)}${CUFFS('#16203d')}${SLEEVE_BAND(116, 3, CREAM)}
      ${script('2Cozy', 100, 114, 36, '#f3ead6', 'stroke="#d8cdb2" stroke-width=".6"')}`,
    over: ZIP_COLLAR('#efe4cc', '#8f846c', 72),
  });
}

function sherpaSpadeZip() {
  const id = 'cw8';
  return wear(id, {
    fill: `url(#${id}f)`, defs: sherpa(id, '#efe5cf', '#fffaf0', '#cdbf9f'), outline: '#9b8e70',
    inner: `${HEM('#e2d6bb')}${HEM_STRIPE(FOREST, 164)}${CUFFS(FOREST)}${SLEEVE_BAND(124, 3, CREAM)}
      <path d="M62 118 L74 150 M138 118 L126 150" stroke="${FOREST}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M96 40 L96 178 M104 40 L104 178" stroke="${FOREST}" stroke-width="3"/>`,
    over: `<path d="M70 28 Q100 22 130 28 L130 34 Q100 30 70 34 Z" fill="#00000055"/>
      <path d="M68 40 L70 26 Q84 30 100 40 Q116 30 130 26 L132 40 Q118 50 100 50 Q82 50 68 40Z" fill="url(#${id}f)" stroke="#9b8e70" stroke-width="2" stroke-linejoin="round"/>
      <path d="M70 38 Q84 47 100 47 Q116 47 130 38" fill="none" stroke="${FOREST}" stroke-width="2.6"/>
      <path d="M100 40 L100 176" stroke="#7d7461" stroke-width="2"/><rect x="97" y="46" width="6" height="11" rx="2" fill="#c9c4b8" stroke="#555" stroke-width="1"/>
      ${spadePatch(id, 126, 88, 24)}`,
  });
}

function maroonRugby() {
  const id = 'cw9';
  return wear(id, {
    fill: '#5e1a22', outline: '#2e0a0f',
    inner: `<rect y="104" width="200" height="10" fill="${CREAM}"/><rect y="122" width="200" height="10" fill="${CREAM}"/>
      ${HEM('#4e141b')}${HEM_STRIPE(CREAM, 168)}${CUFFS('#4e141b')}
      <path d="M100 58 L100 86" stroke="#3e0e14" stroke-width="2"/>
      ${script('2Cozy', 124, 84, 18, GOLD)}`,
    over: `${POLO_COLLAR('#f4efe2', '#9e9584')}
      <circle cx="104" cy="66" r="2.4" fill="#f4efe2" stroke="#3e0e14"/><circle cx="104" cy="78" r="2.4" fill="#f4efe2" stroke="#3e0e14"/>`,
  });
}

function varsitySpadeCardigan() {
  const id = 'cw10';
  return wear(id, {
    fill: `url(#${id}f)`, defs: knit(id, FOREST, '#163a25'), outline: '#0f2a1a',
    inner: `${HEM('#183f28')}${HEM_STRIPE(CREAM, 168)}${CUFFS('#183f28')}
      ${SLEEVE_BAND(88, 7, '#e0a526')}${SLEEVE_BAND(99, 4, CREAM)}
      ${script('2Cozy', 70, 112, 17, CREAM, 'transform="rotate(-8 70 112)"')}
      ${spadePatch(id, 128, 112, 26)}`,
    over: `<path d="M74 34 L100 94 L126 34 Z" fill="#f4f1ea"/>
      <path d="M80 34 L92 52 L100 44 L108 52 L120 34" fill="#fbf9f4" stroke="#b8b2a4" stroke-width="1.4"/>
      <path d="M100 46 L100 92" stroke="#c9c3b5" stroke-width="1.2"/>
      <path d="M71 34 L100 99 L129 34" fill="none" stroke="${CREAM}" stroke-width="11" stroke-linejoin="round"/>
      <path d="M71 34 L100 99 L129 34" fill="none" stroke="${FOREST}" stroke-width="3.6" stroke-linejoin="round"/>
      <path d="M100 100 L100 176" stroke="#0f2a1a" stroke-width="1.6"/>
      ${[112, 128, 144, 160].map((y) => `<circle cx="100" cy="${y}" r="2.6" fill="${CREAM}" stroke="#0f2a1a" stroke-width="1"/>`).join('')}`,
  });
}

function spadeBandSweater() {
  const id = 'cw11';
  const spades = [64, 82, 100, 118, 136].map((x) => spade(x, 122, 15, '#111')).join('');
  return wear(id, {
    fill: `url(#${id}f)`, defs: knit(id, '#1b462c', '#143823'), outline: '#0f2a1a',
    inner: `${HEM('#163c26')}${CUFFS('#163c26')}
      ${script('2Cozy', 100, 90, 34, CREAM)}
      <rect x="49" y="101" width="102" height="4" fill="${CREAM}"/>
      <rect x="49" y="109" width="102" height="26" fill="${CREAM}"/>${spades}
      <rect x="49" y="139" width="102" height="4" fill="${CREAM}"/>`,
    over: CREW_NECK(CREAM, '#0b2215'),
  });
}

function stripeSherpaPullover() {
  const id = 'cw12';
  return wear(id, {
    fill: `url(#${id}f)`, defs: sherpa(id, '#efe5cf', '#fffaf0', '#cdbf9f'), outline: '#9b8e70',
    inner: `${HEM('#e2d6bb')}${CUFFS('#e2d6bb')}
      ${SLEEVE_BAND(90, 8, '#e0a526')}${SLEEVE_BAND(100, 8, FOREST)}
      ${script('2Cozy', 122, 94, 19, FOREST, 'transform="rotate(-6 122 94)"')}`,
    over: ZIP_COLLAR('#efe4cc', '#8f846c', 70),
  });
}

function clubhouseQuarterZip() {
  const id = 'cw13';
  return wear(id, {
    fill: `url(#${id}f)`, defs: knit(id, CREAM, '#ddd2ba'), outline: '#8f846c',
    inner: `${HEM('#e3d9c2')}${CUFFS('#e3d9c2')}
      ${SLEEVE_BAND(94, 5, FOREST)}${SLEEVE_BAND(104, 5, FOREST)}
      ${script('2Cozy', 122, 88, 17, FOREST)}`,
    over: ZIP_COLLAR(CREAM, '#8f846c', 68),
  });
}

function blackSpadeTee() {
  const id = 'cw14';
  return wear(id, {
    body: TEE, fill: '#151515', outline: '#000',
    inner: `<path d="M18 84 L44 92 L42 98 L16 90 Z M156 92 L182 84 L184 90 L158 98 Z" fill="#0c0c0c"/>
      ${spade(124, 70, 22, 'none', 'stroke="#f3ead6" stroke-width="1.8" vector-effect="non-scaling-stroke"')}
      ${spade(124, 71, 11, '#f3ead6')}
      ${script('2Cozy', 124, 96, 13, GOLD)}`,
    over: CREW_NECK('#0c0c0c', '#000'),
  });
}

// ---------- bottoms ----------
function loungeTrousers() {
  const id = 'cw15';
  const pairs = [['#efe6d2', '#d9ceb5', '#1f5a37'], ['#4a3326', '#3a271c', '#efe6d2'], ['#1f4a30', '#173a25', '#efe6d2'], ['#17171a', '#0e0e10', '#efe6d2']];
  const leg = (x) => `M${x + 4} 32 L${x + 44} 32 L${x + 48} 178 L${x + 27} 178 L${x + 24} 74 L${x + 21} 178 L${x} 178 Z`;
  const drawn = pairs.map(([c, band, ink], i) => {
    const x = 4 + i * 48;
    return `<clipPath id="${id}c${i}"><path d="${leg(x)}"/></clipPath>
      <path d="${leg(x)}" fill="${c}"/>
      <g clip-path="url(#${id}c${i})"><rect x="${x}" y="32" width="48" height="9" fill="${band}"/>
        <path d="M${x + 24} 41 L${x + 24} 74" stroke="${band}" stroke-width="1.4"/><rect x="${x}" y="0" width="48" height="200" fill="url(#${id}sh)"/></g>
      <path d="M${x + 20} 40 Q${x + 18} 50 ${x + 16} 54 M${x + 28} 40 Q${x + 30} 50 ${x + 32} 54" stroke="${ink}" stroke-width="1.2" fill="none" opacity=".8"/>
      ${script('2Cozy', x + 13, 60, 8, ink)}
      <path d="${leg(x)}" fill="none" stroke="#00000088" stroke-width="1.8" stroke-linejoin="round"/>`;
  }).join('');
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs>${shade(id)}</defs>
    <ellipse cx="100" cy="184" rx="94" ry="6" fill="#000" opacity=".18"/>${drawn}</svg>`;
}

// ---------- hats ----------
function cap(id, { crown, seam, cord = '', brim, brimDark, button, edge, front }) {
  const dome = 'M42 124 Q40 54 100 48 Q160 54 158 124 Z';
  const ribs = cord ? Array.from({ length: 24 }, (_, k) => `<path d="M${36 + k * 5.5} 40 L${36 + k * 5.5} 130" stroke="${cord}" stroke-width="2.2"/>`).join('') : '';
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs>${shade(id)}
      <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${brim}"/><stop offset="1" stop-color="${brimDark}"/></linearGradient>
      <clipPath id="${id}c"><path d="${dome}"/></clipPath></defs>
    <ellipse cx="100" cy="176" rx="64" ry="8" fill="#000" opacity=".2"/>
    <path d="${dome}" fill="${crown}"/>
    <g clip-path="url(#${id}c)">${ribs}
      <path d="M100 48 Q86 90 84 124 M100 48 Q114 90 116 124 M100 48 Q62 74 56 124 M100 48 Q138 74 144 124" stroke="${seam}" stroke-width="2" fill="none"/>
      <rect width="200" height="200" fill="url(#${id}sh)"/>
    </g>
    <circle cx="74" cy="78" r="2.4" fill="${seam}"/><circle cx="126" cy="78" r="2.4" fill="${seam}"/>
    <ellipse cx="100" cy="47" rx="7" ry="4" fill="${button}" stroke="${edge}" stroke-width="1.5"/>
    ${front}
    <path d="M30 124 Q100 106 170 124 Q182 150 100 156 Q18 150 30 124 Z" fill="url(#${id}b)" stroke="${edge}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M38 128 Q100 113 162 128 M44 134 Q100 120 156 134" stroke="#000" stroke-opacity=".22" stroke-width="1.4" fill="none"/>
    <path d="${dome.slice(0, -2)}" fill="none" stroke="${edge}" stroke-width="2.4"/>
  </svg>`;
}

const capKingPatch = () => cap('cw16', { crown: '#1d4a2f', seam: '#143823', cord: '#183f28', brim: '#1f5034', brimDark: '#143823', button: '#1d4a2f', edge: '#0b2215', front: art('king-patch.webp', 68, 54, 64, 64) });
const capScriptCo = () => cap('cw17', { crown: CREAM, seam: '#d6cab0', brim: '#1f5a37', brimDark: '#143d25', button: '#1f5a37', edge: '#6d6450', front: script('2Cozy Co.', 100, 100, 22, '#1f5a37') });
const capSpade = () => cap('cw18', { crown: CREAM, seam: '#d6cab0', brim: '#e8ddc6', brimDark: '#cfc2a5', button: CREAM, edge: '#7d735e', front: spade(100, 88, 32, '#111') });
const capGoldCord = () => cap('cw19', { crown: '#18181b', seam: '#2a2a2e', cord: '#222226', brim: '#1f1f23', brimDark: '#0e0e10', button: '#18181b', edge: '#000', front: script('2Cozy', 100, 100, 28, GOLD) });

const item = (id, type, rarity, name, colorway, note, art) => ({ id: `2c-${id}`, brand: '2cozy', type, rarity, name, colorway, note, art });

export const COZY_WEAR = [
  item('kings-putter-knit', 'Tops', 'legendary', "King's Putter Knit", 'Forest & Cream', 'Heavy varsity knit with the 2Cozy King and his putter across the back.', kingsPutterKnit),
  item('kings-crest-knit', 'Tops', 'legendary', 'Royal Court Crest Knit', 'Forest Green', 'Varsity knit with the full royal-court crest on the back and cream sleeve stripes.', kingsCrestKnit),
  item('cozy-spade-tee', 'Tops', 'very-rare', 'Cozy Spade Tee', 'White & Gold', 'The cozy spade by the fire, sipping tea under a knit blanket, with gold 2Cozy script.', cozySpadeTee),
  item('cozy-spade-hoodie', 'Tops', 'very-rare', 'Cozy Spade Hoodie', 'Cream & Gold', 'Heavyweight hoodie with the fireside spade print and gold 2Cozy script.', cozySpadeHoodie),
  item('royal-crest-sherpa', 'Tops', 'very-rare', 'Royal Crest Sherpa', 'Cream Sherpa', 'Fluffy sherpa crewneck with the royal-court crest.', royalCrestSherpa),
  item('fireside-sherpa', 'Tops', 'very-rare', 'Fireside Sherpa Half-Zip', 'Forest Sherpa', 'Green sherpa half-zip with the fireside spade print.', firesideSherpa),
  item('navy-sherpa-half-zip', 'Tops', 'very-rare', 'Midnight Sherpa Half-Zip', 'Navy & Cream', 'Navy sherpa half-zip with big cream 2Cozy script.', navySherpaHalfZip),
  item('sherpa-spade-zip', 'Tops', 'rare', 'Sherpa Spade Zip Jacket', 'Cream & Forest', 'Full-zip sherpa jacket with forest trim and a spade patch.', sherpaSpadeZip),
  item('maroon-rugby', 'Tops', 'rare', 'Clubhouse Rugby', 'Maroon & Cream', 'Striped rugby shirt with a gold 2Cozy chest script.', maroonRugby),
  item('varsity-spade-cardigan', 'Tops', 'rare', 'Varsity Spade Cardigan', 'Forest, Cream & Gold', 'Varsity V-neck cardigan with a spade patch and striped sleeves.', varsitySpadeCardigan),
  item('spade-band-sweater', 'Tops', 'rare', 'Spade Band Sweater', 'Forest & Cream', 'Chunky knit with 2Cozy script and a band of spades.', spadeBandSweater),
  item('stripe-sherpa-pullover', 'Tops', 'rare', 'Fairway Stripe Sherpa', 'Cream, Forest & Gold', 'Cream sherpa pullover with forest and gold sleeve stripes.', stripeSherpaPullover),
  item('cap-green-king-patch', 'Hats', 'uncommon', 'King Patch Corduroy Cap', 'Forest', 'Corduroy cap with the 2Cozy King patch on the front.', capKingPatch),
  item('clubhouse-quarter-zip', 'Tops', 'common', 'Clubhouse Quarter-Zip', 'Cream & Forest', 'Cream quarter-zip with forest sleeve stripes.', clubhouseQuarterZip),
  item('black-spade-tee', 'Tops', 'common', 'Spade Crest Tee', 'Black', 'Black tee with a small spade and 2Cozy chest crest.', blackSpadeTee),
  item('lounge-trousers', 'Bottoms', 'common', 'Lounge Trousers', 'Cream, Cocoa, Forest & Black', 'Relaxed wide-leg trousers with a small 2Cozy script, in four colors.', loungeTrousers),
  item('cap-cream-2cozy-co', 'Hats', 'common', '2Cozy Co. Script Cap', 'Cream & Forest', 'Cream cap with a forest brim and 2Cozy Co. script.', capScriptCo),
  item('cap-cream-spade', 'Hats', 'common', 'Spade Cap', 'Cream', 'Clean cream cap with a single black spade.', capSpade),
  item('cap-black-cord', 'Hats', 'common', 'Gold Script Corduroy Cap', 'Black & Gold', 'Black corduroy cap with gold 2Cozy script.', capGoldCord),
];

// ---------- K.O.G. Originals (drawn from the user's designs) ----------
const SUITS = {
  spade: SPADE,
  heart: 'M50 94C22 72 5 55 5 33 5 17 17 6 30 6c9 0 16 5 20 13 4-8 11-13 20-13 13 0 25 11 25 27 0 22-17 39-45 61Z',
  diamond: 'M50 3Q68 28 93 50 68 72 50 97 32 72 7 50 32 28 50 3Z',
  club: 'M50 6a21 21 0 0 1 17 33 21 21 0 1 1-12 34q2 13 13 21H32q11-8 13-21a21 21 0 1 1-12-34A21 21 0 0 1 50 6Z',
};
const suitAt = (kind, x, y, s, fill, extra = '') => `<path d="${SUITS[kind]}" transform="translate(${x - s / 2} ${y - s / 2}) scale(${s / 100})" fill="${fill}" ${extra}/>`;
const RED = '#e3141e';
const INK = '#141414';

// All-over suit print on a black crewneck: rows of white spades and clubs, red hearts and diamonds.
function suitPrintCrewneck() {
  const id = 'kw1';
  const tile = `<pattern id="${id}p" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="translate(2 -4)">
      <rect width="40" height="40" fill="${INK}"/>
      ${suitAt('heart', 10, 10, 13, RED)}${suitAt('club', 30, 10, 13, '#fff')}
      ${suitAt('spade', 10, 30, 13, '#fff')}${suitAt('diamond', 30, 30, 13, RED)}
    </pattern>`;
  return wear(id, {
    fill: `url(#${id}p)`, defs: tile, outline: '#000',
    inner: `${HEM('#0e0e0e')}<path d="M46 162 Q100 172 154 162 M46 168 Q100 178 154 168 M46 174 Q100 184 154 174" stroke="#262626" stroke-width="1.2" fill="none"/>${CUFFS('#0e0e0e')}`,
    over: CREW_NECK('#0e0e0e', '#000', '#262626'),
  });
}

// White tee: crossed irons with the four suits around them.
function crossedClubsTee() {
  const id = 'kw2';
  const iron = (flip) => {
    const t = flip ? 'transform="translate(200 0) scale(-1 1)"' : '';
    return `<g ${t}>
      <path d="M78 128 L122 66" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M78 128 L122 66" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>
      <path d="M74 134 L84 120" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
      <path d="M75 131 L83 121 M77 133 L85 123" stroke="#fff" stroke-width=".8" opacity=".8"/>
      <path d="M120 69 L127 53 Q130 47 137 49 Q142 51 140 56 L125 71 Z" fill="#fff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M127 60 L137 53 M126 63 L136 56 M125 66 L134 59" stroke="${INK}" stroke-width="1"/>
    </g>`;
  };
  return wear(id, {
    body: TEE, fill: '#fbfaf6', outline: '#9a968c',
    inner: `<path d="M18 84 L44 92 L42 98 L16 90 Z M156 92 L182 84 L184 90 L158 98 Z" fill="#ecebe5"/>
      ${iron(false)}${iron(true)}
      <circle cx="100" cy="97" r="4" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="100" cy="97" r="1.4" fill="${INK}"/>
      ${suitAt('diamond', 100, 64, 20, RED)}${suitAt('spade', 72, 97, 22, INK)}${suitAt('club', 128, 97, 22, INK)}${suitAt('heart', 100, 128, 22, RED)}`,
    over: CREW_NECK('#eceae3', '#00000030'),
  });
}

// White long sleeve with the four suits in a row, each with a cracked, lava-style finish.
function crackedSuitsLongSleeve() {
  const id = 'kw3';
  const row = [['spade', 62, INK, RED], ['heart', 87, RED, '#8f1515'], ['club', 113, INK, RED], ['diamond', 138, RED, '#8f1515']];
  const cracks = (x, y) => `M${x - 11} ${y - 5} l5 3 l3 -4 l5 5 l4 -1 l3 3 M${x - 9} ${y + 6} l4 -3 l4 4 l5 -1 l3 3 M${x + 1} ${y - 12} l-2 5 l3 4 l-3 5 l2 4 M${x + 6} ${y + 2} l4 5 l-1 4 M${x - 4} ${y - 1} l-4 -4`;
  const suits = row.map(([kind, x, fill, crack], i) => `<clipPath id="${id}s${i}"><path d="${SUITS[kind]}" transform="translate(${x - 12} 74) scale(.24)"/></clipPath>
      ${suitAt(kind, x, 86, 24, fill)}
      <path d="${cracks(x, 86)}" clip-path="url(#${id}s${i})" stroke="${crack}" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`).join('');
  return wear(id, {
    fill: '#fbfaf6', outline: '#9a968c',
    inner: `${HEM('#efeee8')}${CUFFS('#efeee8')}
      <path d="M18 122 L43 126 M157 126 L182 122" stroke="#d8d6ce" stroke-width="1.2"/>
      ${suits}`,
    over: CREW_NECK('#eceae3', '#00000030'),
  });
}

// White tee: the four suits dripping, over "King Drippy" in script with a little crown.
function kingDrippyTee() {
  const id = 'kw4';
  // A drip: a thin run that ends in a round drop, hanging from (x, y) for `len`.
  const drip = (x, y, len, w, fill) => `<path d="M${x - w / 2} ${y} L${x - w / 2} ${y + len} a${w / 2} ${w / 2} 0 0 0 ${w} 0 L${x + w / 2} ${y} Z" fill="${fill}"/>`;
  const drips = (x, y, fill, list) => list.map(([dx, len, w = 2.2]) => drip(x + dx, y, len, w, fill)).join('');
  const row = [
    ['spade', 66, INK, [[-6, 6], [-1, 9], [5, 5]]],
    ['diamond', 89, RED, [[-4, 7], [1, 10], [4, 5]]],
    ['club', 111, INK, [[-6, 5], [-1, 8], [5, 7]]],
    ['heart', 134, RED, [[-7, 6], [-2, 10], [3, 6], [7, 4]]],
  ];
  const suits = row.map(([kind, x, fill, list]) => `${suitAt(kind, x, 62, 18, fill)}${drips(x, kind === 'heart' ? 64 : 66, fill, list)}`).join('');
  const crownMark = `<path d="M66 89 L68 82 L71.5 86 L74 80.5 L76.5 86 L80 82 L82 89 Z" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="68" cy="81.3" r="1" fill="${INK}"/><circle cx="74" cy="79.6" r="1" fill="${INK}"/><circle cx="80" cy="81.3" r="1" fill="${INK}"/>`;
  const font = `font-family="'Brush Script MT','Segoe Script','Snell Roundhand',cursive" font-style="italic" font-weight="700"`;
  return wear(id, {
    body: TEE, fill: '#fbfaf6', outline: '#9a968c',
    inner: `<path d="M18 84 L44 92 L42 98 L16 90 Z M156 92 L182 84 L184 90 L158 98 Z" fill="#ecebe5"/>
      ${suits}
      ${crownMark}
      <text x="96" y="104" text-anchor="end" ${font} font-size="20" fill="${INK}">King</text>
      <text x="97" y="104" text-anchor="start" ${font} font-size="20" fill="${RED}">Drippy</text>
      <path d="M99 108 Q117 104 136 107" stroke="${RED}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${drips(72, 104, INK, [[0, 6, 1.8], [8, 9, 1.8], [16, 5, 1.8]])}
      ${drips(103, 108, RED, [[0, 6, 1.8], [8, 9, 1.8], [16, 5, 1.8], [24, 8, 1.8], [31, 4, 1.8]])}`,
    over: CREW_NECK('#eceae3', '#00000030'),
  });
}

export const KOG_WEAR = [
  { id: 'kog-suit-print-crewneck', brand: 'kog', type: 'Tops', rarity: 'very-rare', name: 'Full House Crewneck', colorway: 'Black, Red & White', note: 'Black crewneck covered in all four suits: white spades and clubs, red hearts and diamonds.', art: suitPrintCrewneck },
  { id: 'kog-cracked-suits-ls', brand: 'kog', type: 'Tops', rarity: 'rare', name: 'Cracked Suits Long Sleeve', colorway: 'White, Black & Red', note: 'White long sleeve with the four suits across the chest in a cracked, lava-style finish.', art: crackedSuitsLongSleeve },
  { id: 'kog-king-drippy-tee', brand: 'kog', type: 'Tops', rarity: 'rare', name: 'King Drippy Tee', colorway: 'White, Black & Red', note: 'White tee with all four suits dripping over King Drippy script and a little crown.', art: kingDrippyTee },
  { id: 'kog-crossed-clubs-tee', brand: 'kog', type: 'Tops', rarity: 'uncommon', name: 'Crossed Irons Tee', colorway: 'White', note: 'White tee with two crossed irons and the four suits around them.', art: crossedClubsTee },
];
