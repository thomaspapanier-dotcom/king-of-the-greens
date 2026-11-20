// Realm castles: little 3D miniatures that stand on each Realm of the Leaderboards map, like the
// pieces on a 3D puzzle map. Drawn in code, each one themed to its part of the country.
// Every piece sits on a rocky base whose center is (0, 0); up is negative y. About 124 units wide.

const DX = 0.6; // depth goes back to the right…
const DY = 0.34; // …and up
const INK = '#20180f';
const f1 = (n) => +n.toFixed(1);
const pts = (a) => a.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ');
const ol = (w = 0.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"`;
const poly = (a, fill, w) => `<polygon points="${pts(a)}" fill="${fill}" ${ol(w)}/>`;
const CYL = 'url(#lbc-cyl)';

/** Darken (f < 1) or lighten toward white (f > 1) a #rrggbb color. */
function sh(hex, f) {
  return '#' + [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16);
    return Math.round(f <= 1 ? v * f : v + (255 - v) * (f - 1)).toString(16).padStart(2, '0');
  }).join('');
}

// ---------- building blocks ----------
/** A block: front face at x..x+w standing on y, h tall, d deep. */
function box(x, y, w, h, d, c, o = {}) {
  const dx = d * DX;
  const dy = -d * DY;
  let s = poly([[x + w, y], [x + w + dx, y + dy], [x + w + dx, y + dy - h], [x + w, y - h]], sh(c, 0.68));
  if (!o.noTop) s += poly([[x, y - h], [x + dx, y - h + dy], [x + w + dx, y - h + dy], [x + w, y - h]], sh(c, 1.22));
  s += poly([[x, y], [x + w, y], [x + w, y - h], [x, y - h]], c);
  if (o.cren) s += cren(x, y - h, w, d, c);
  return s;
}
/** Battlements along the front and right edges of a flat top. */
function cren(x, yt, w, d, c) {
  const m = 3;
  const step = 6;
  let s = '';
  for (let t = Math.floor((d - 2) / step) * step; t >= step; t -= step) s += box(x + w - m + t * DX, yt - t * DY, m, 2.8, 1.8, c);
  for (let i = 0; i + m <= w + 0.1; i += step) s += box(x + i, yt, m, 2.8, 1.8, c);
  return s;
}
/** Gable roof on a block whose top front edge is at yt (ridge runs front to back). */
function gable(x, yt, w, d, rh, roof, wall) {
  const dx = d * DX;
  const dy = -d * DY;
  const ap = [x + w / 2, yt - rh];
  return poly([ap, [ap[0] + dx, ap[1] + dy], [x + dx, yt + dy], [x, yt]], sh(roof, 1.15))
    + poly([ap, [ap[0] + dx, ap[1] + dy], [x + w + dx, yt + dy], [x + w, yt]], sh(roof, 0.85))
    + poly([[x, yt], ap, [x + w, yt]], wall);
}
/** Pyramid roof on a block whose top front edge is at yt. */
function hip(x, yt, w, d, rh, c) {
  const dx = d * DX;
  const dy = -d * DY;
  const ap = [x + w / 2 + dx / 2, yt + dy / 2 - rh];
  return poly([[x + w, yt], [x + w + dx, yt + dy], ap], sh(c, 0.72)) + poly([[x, yt], [x + w, yt], ap], c);
}
function flag(x, y, c, h = 12) {
  return `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x)}" y2="${f1(y - h)}" stroke="${INK}" stroke-width="0.8"/>${poly([[x, y - h], [x + 9, y - h + 2.6], [x, y - h + 5.2]], c, 0.4)}`;
}
function crown(x, y, k = 1) {
  const p = [[-5, 0], [-5, -6], [-2.5, -3], [0, -7.5], [2.5, -3], [5, -6], [5, 0]].map(([a, b]) => [x + a * k, y + b * k]);
  return poly(p, '#f2c84b', 0.5);
}
/** A round tower standing on y: r wide, h tall, with a cone or dome roof, battlements, stripes, a flag. */
function tower(cx, y, r, h, c, o = {}) {
  const ry = r * 0.34;
  const yt = y - h;
  const body = `M${f1(cx - r)},${f1(yt)}V${f1(y)}A${f1(r)},${f1(ry)} 0 0 0 ${f1(cx + r)},${f1(y)}V${f1(yt)}Z`;
  let s = `<path d="${body}" fill="${c}" ${ol()}/>`;
  for (const [ya, yb, bc] of o.bands || []) {
    s += `<path d="M${f1(cx - r)},${f1(ya)}V${f1(yb)}A${f1(r)},${f1(ry)} 0 0 0 ${f1(cx + r)},${f1(yb)}V${f1(ya)}A${f1(r)},${f1(ry)} 0 0 1 ${f1(cx - r)},${f1(ya)}Z" fill="${bc}"/>`;
  }
  s += `<path d="${body}" fill="${CYL}"/>`;
  s += `<ellipse cx="${f1(cx)}" cy="${f1(yt)}" rx="${f1(r)}" ry="${f1(ry)}" fill="${sh(c, 1.18)}" ${ol()}/>`;
  let top = yt;
  if (o.cren) {
    for (let k = 0; k < 7; k++) {
      const a = -1.25 + k * 0.42;
      s += box(cx + r * 0.9 * Math.sin(a) - 1.3, yt + ry * Math.cos(a), 2.6, 2.8, 1.4, c);
    }
  }
  const rh = o.rh || r * 1.6;
  if (o.roof === 'cone') {
    const rr = r * 1.18;
    const cone = `M${f1(cx - rr)},${f1(yt)}A${f1(rr)},${f1(ry * 1.18)} 0 0 0 ${f1(cx + rr)},${f1(yt)}L${f1(cx)},${f1(yt - rh)}Z`;
    s += `<path d="${cone}" fill="${o.rc}" ${ol()}/><path d="${cone}" fill="${CYL}"/>`;
    top = yt - rh;
  } else if (o.roof === 'dome') {
    const dome = `M${f1(cx - r)},${f1(yt)}A${f1(r)},${f1(ry)} 0 0 0 ${f1(cx + r)},${f1(yt)}A${f1(r)},${f1(rh)} 0 0 0 ${f1(cx - r)},${f1(yt)}Z`;
    s += `<path d="${dome}" fill="${o.rc}" ${ol()}/><path d="${dome}" fill="${CYL}"/>`;
    top = yt - rh;
  }
  if (o.flag) s += flag(cx, top, o.flag);
  if (o.crown) s += crown(cx, top, 0.8);
  return s;
}
/** The rocky base every piece stands on: t thick, with a ground color on top. */
function base(rx, t, ground, rock) {
  const ry = rx * 0.36;
  return `<path d="M${-rx},0V${t}A${rx},${f1(ry)} 0 0 0 ${rx},${t}V0Z" fill="${rock}" ${ol(0.8)}/>`
    + `<path d="M${-rx},0V${t}A${rx},${f1(ry)} 0 0 0 ${rx},${t}V0Z" fill="${CYL}"/>`
    + `<ellipse cx="0" cy="0" rx="${rx}" ry="${f1(ry)}" fill="${ground}" ${ol(0.8)}/>`
    + `<ellipse cx="0" cy="${f1(-ry * 0.12)}" rx="${f1(rx * 0.92)}" ry="${f1(ry * 0.8)}" fill="${sh(ground, 1.08)}"/>`;
}
/** A little putting green with a flagstick: every Realm has a place to putt. */
function green(x, y) {
  return `<ellipse cx="${x}" cy="${y}" rx="9" ry="3.4" fill="#7fd36b" ${ol(0.4)}/><ellipse cx="${x + 2}" cy="${y}" rx="1.3" ry="0.6" fill="${INK}"/>`
    + `<line x1="${x + 2}" y1="${y}" x2="${x + 2}" y2="${y - 13}" stroke="#f4f4f4" stroke-width="0.9"/>${poly([[x + 2, y - 13], [x + 9, y - 11], [x + 2, y - 9]], '#e3262f', 0.3)}`;
}
function roundTree(x, y, r, c, dots) {
  let s = `<rect x="${f1(x - 1)}" y="${f1(y - r)}" width="2" height="${f1(r)}" fill="#5a3b24"/><circle cx="${x}" cy="${f1(y - r - r * 0.7)}" r="${r}" fill="${c}" ${ol()}/><circle cx="${f1(x - r * 0.3)}" cy="${f1(y - r - r)}" r="${f1(r * 0.45)}" fill="${sh(c, 1.25)}"/>`;
  if (dots) for (const [a, b] of [[-0.5, -0.2], [0.4, -0.5], [0.1, 0.3], [-0.2, -0.8], [0.6, 0.1]]) s += `<circle cx="${f1(x + a * r)}" cy="${f1(y - r - r * 0.7 + b * r)}" r="${f1(r * 0.16)}" fill="${dots}"/>`;
  return s;
}
function pine(x, y, h, snow) {
  const c = '#2c5b3a';
  let s = `<rect x="${f1(x - 1)}" y="${f1(y - 3)}" width="2" height="3" fill="#5a3b24"/>`;
  for (let i = 0; i < 3; i++) {
    const w = h * (0.42 - i * 0.1);
    const yb = y - 2 - i * h * 0.24;
    const yt = yb - h * 0.42;
    s += poly([[x - w, yb], [x, yt], [x + w, yb]], i % 2 ? sh(c, 1.1) : c, 0.5);
    if (snow) s += poly([[x - w * 0.35, yt + h * 0.15], [x, yt], [x + w * 0.35, yt + h * 0.15]], '#f4f8fb', 0.3);
  }
  return s;
}
function redwood(x, y, h) {
  let s = `<rect x="${f1(x - 1.6)}" y="${f1(y - h * 0.5)}" width="3.2" height="${f1(h * 0.5)}" fill="#8a4a2e" ${ol(0.4)}/>`;
  for (let i = 0; i < 4; i++) s += `<ellipse cx="${x}" cy="${f1(y - h * 0.42 - i * h * 0.15)}" rx="${f1(6.5 - i * 1.2)}" ry="${f1(h * 0.11)}" fill="${i % 2 ? '#356b3c' : '#2a5732'}" ${ol(0.4)}/>`;
  return s;
}
function palm(x, y, h) {
  const tx = x + 4;
  const ty = y - h;
  let s = `<path d="M${x},${y}Q${x - 2},${f1(y - h * 0.6)} ${tx},${ty}" fill="none" stroke="#8b6a45" stroke-width="2.2" stroke-linecap="round"/>`;
  for (const [ax, ay] of [[-11, 3], [-8, -4], [0, -7], [9, -4], [11, 4]]) s += `<path d="M${tx},${ty}Q${f1(tx + ax * 0.5)},${f1(ty + ay - 4)} ${tx + ax},${ty + ay}" fill="none" stroke="#2f7d3c" stroke-width="2.4" stroke-linecap="round"/>`;
  return s;
}
function cactus(x, y, h) {
  const c = '#3f8a4a';
  const arm = (dir, at, len) => `<path d="M${x + dir * 2},${f1(y - at)}H${x + dir * 6}V${f1(y - at - len)}" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - h}" stroke="${c}" stroke-width="4.4" stroke-linecap="round"/>${arm(-1, h * 0.45, h * 0.3)}${arm(1, h * 0.6, h * 0.25)}<line x1="${x - 0.8}" y1="${y - 1}" x2="${x - 0.8}" y2="${y - h + 1}" stroke="${sh(c, 1.3)}" stroke-width="0.8"/>`;
}

// ---------- the six Realms ----------
// Ivy Crown (Northeast): an old stone castle with ivy on its walls, slate roofs and a clock tower, fall maples.
function ivy() {
  const STONE = '#a3a7ad';
  const SLATE = '#4a5a70';
  const G = '#2fae7a';
  const ivyBlob = (x, y, w) => `<path d="M${x},${y}q${f1(w * 0.3)},-${f1(w * 0.7)} ${f1(w * 0.6)},-${f1(w * 0.2)}q${f1(w * 0.4)},${f1(w * 0.5)} ${f1(w * 0.4)},${f1(w * 0.9)}q-${f1(w * 0.5)},${f1(w * 0.4)} -${f1(w)},-${f1(w * 0.3)}z" fill="#2f7d4f" opacity="0.9"/>`;
  return base(62, 9, '#5f9150', '#4b4136')
    + roundTree(48, -12, 7, '#e08a2a')
    + box(-42, -8, 74, 20, 12, STONE, { cren: true })
    + ivyBlob(-36, -12, 9) + ivyBlob(20, -14, 8)
    + tower(-44, -4, 9, 38, STONE, { roof: 'cone', rc: SLATE, rh: 18, flag: G })
    + box(-12, -2, 26, 38, 15, STONE) + hip(-12, -40, 26, 15, 15, SLATE) + flag(1 + 4.5, -40 - 2.5 - 15, G)
    + `<circle cx="1" cy="-28" r="5.2" fill="#f6f1e1" ${ol()}/><path d="M1,-28V-31.6M1,-28H3.6" stroke="${INK}" stroke-width="0.8"/>`
    + ivyBlob(4, -10, 7)
    + tower(34, -4, 8, 32, STONE, { roof: 'cone', rc: SLATE, rh: 15, flag: G })
    + box(-30, 12, 50, 11, 5, STONE, { cren: true }) + `<path d="M-9,12V5.5A4,4 0 0 1 -1,5.5V12Z" fill="#2a2018"/>` + ivyBlob(-26, 9, 7)
    + roundTree(-53, 14, 8, '#d0532a')
    + green(42, 16);
}
// Magnolia Throne (Southeast): a white marble palace with a portico, a pink dome and magnolia trees.
function magnolia() {
  const M = '#f3eee6';
  const PINK = '#e0528a';
  const BLOOM = '#f6b5cc';
  let cols = '';
  for (let i = 0; i < 5; i++) cols += `<rect x="${f1(-15 + i * 6.6)}" y="-7" width="2.6" height="15" fill="${M}" ${ol(0.5)}/><rect x="${f1(-13.6 + i * 6.6)}" y="-7" width="1.2" height="15" fill="#cfc8bd"/>`;
  const domeX = -38 + 32 + (18 * DX) / 2;
  const domeY = -20 - (18 * DY) / 2;
  return base(62, 9, '#69a357', '#5a4a3a')
    + roundTree(-46, -8, 10, BLOOM, '#fff')
    + roundTree(44, -10, 9, BLOOM, '#fff')
    + box(-38, 0, 64, 20, 18, M)
    + tower(domeX, domeY, 12, 7, M) + tower(domeX, domeY - 7, 12, 0.1, M, { roof: 'dome', rc: PINK, rh: 14, crown: true })
    + `<rect x="-5" y="-12" width="10" height="12" fill="#3a2a22"/>`
    + tower(-40, 4, 6.5, 26, M, { roof: 'dome', rc: PINK, rh: 8, flag: PINK })
    + tower(28, 4, 6.5, 26, M, { roof: 'dome', rc: PINK, rh: 8, flag: PINK })
    + cols
    + box(-17, -7, 32, 3, 7, M) + gable(-17, -10, 32, 7, 8, PINK, M)
    + box(-19, 11, 36, 2.4, 9, '#e4ddd2')
    + green(-44, 16)
    + roundTree(50, 14, 8, BLOOM, '#fff')
    + palm(-56, 8, 22);
}
// Golden Plains (Midwest): a red barn castle with silo towers, a windmill and wheat fields.
function plains() {
  const RED = '#b8322a';
  const SILO = '#aebcc6';
  const GOLD = '#e6b12e';
  let wheat = poly([[-56, -2], [-22, -2], [-14, -12], [-48, -12]], '#ecc54f', 0.5);
  for (let i = 1; i < 6; i++) wheat += `<line x1="${-56 + i * 5.7}" y1="-2" x2="${-48 + i * 5.7}" y2="-12" stroke="#c99a28" stroke-width="0.8"/>`;
  const blades = [20, 110, 200, 290].map((a) => `<rect x="-1.6" y="-17" width="3.2" height="16" fill="#efe9dc" ${ol(0.4)} transform="translate(42,-40) rotate(${a})"/>`).join('');
  return base(62, 9, '#cfae4c', '#6b5434')
    + wheat
    + tower(-18, -12, 7, 36, SILO, { roof: 'dome', rc: '#8d9ca6', rh: 7 })
    + tower(-34, -6, 9, 46, SILO, { roof: 'dome', rc: '#8d9ca6', rh: 9, flag: GOLD, bands: [[-20, -21.2, '#8d9ca6'], [-34, -35.2, '#8d9ca6']] })
    + poly([[36, -4], [48, -4], [44.5, -40], [39.5, -40]], '#d9d2c3') + `<path d="M37.5,-12L46.5,-22M46.5,-12L37.5,-22M38.5,-26L45.5,-34" stroke="#8a7f6c" stroke-width="0.6"/>`
    + blades + `<circle cx="42" cy="-40" r="2.2" fill="#6b5434" ${ol(0.4)}/>`
    + box(-8, 2, 32, 22, 24, RED) + gable(-8, -20, 32, 24, 15, '#4a3a32', RED)
    + `<rect x="1" y="-11" width="14" height="13" fill="${sh(RED, 0.8)}" stroke="#f3efe6" stroke-width="1"/><path d="M1,-11L15,2M15,-11L1,2" stroke="#f3efe6" stroke-width="0.9"/>`
    + `<rect x="5" y="-21" width="6" height="5" fill="#2a1d16" stroke="#f3efe6" stroke-width="0.8"/>`
    + crown(8, -36, 0.9)
    + tower(28, 14, 3.4, 4.5, '#e2b844') + tower(35, 17, 3.4, 4.5, '#e2b844')
    + `<path d="M-30,20L-6,20M-30,17L-6,17" stroke="#8a6a44" stroke-width="0.8"/>` + [-30, -22, -14, -6].map((x) => `<line x1="${x}" y1="15" x2="${x}" y2="21" stroke="#8a6a44" stroke-width="1"/>`).join('')
    + green(-44, 12);
}
// Desert Sun (Southwest): a terraced adobe pueblo fortress under a red mesa, with saguaro cactus.
function desert() {
  const A = '#d8a368';
  const O = '#ec7a32';
  const door = (x, y, h = 7) => `<rect x="${x}" y="${f1(y - h)}" width="3.6" height="${h}" fill="#3a2418"/>`;
  const vigas = (x, y, n) => Array.from({ length: n }, (_, i) => `<circle cx="${f1(x + i * 5)}" cy="${f1(y)}" r="0.8" fill="#4a2c1a"/>`).join('');
  return base(62, 9, '#e3bd7d', '#9c5c2f')
    + poly([[8, -8], [18, -44], [50, -46], [60, -8]], '#c0603a') + poly([[38, -45], [50, -46], [60, -8], [44, -8]], '#9c4a2c')
    + `<path d="M14,-22H54M12,-30H52" stroke="#a54d2c" stroke-width="0.8"/>` + poly([[18, -44], [22, -48], [46, -50], [50, -46]], '#d57a4c')
    + box(-40, 4, 56, 14, 22, A)
    + box(-30, -13.4, 40, 12, 12, A)
    + box(-22.6, -26.8, 22, 10, 8, A)
    + flag(-8, -36.8 - 1.4, O)
    + door(-34, 4) + door(-16, 4) + door(2, 4) + door(-24, -13.4, 6) + door(-4, -13.4, 6) + door(-16, -26.8, 5)
    + vigas(-37, -8, 11) + vigas(-27, -23, 8) + vigas(-20, -35, 5)
    + `<path d="M8,4L12,-12M12,4L16,-12M9,0.5H13M9.8,-3.5H13.8M10.8,-7.5H14.8" stroke="#6b4a2c" stroke-width="0.9"/>`
    + tower(-44, 0, 7, 20, A, { cren: true })
    + tower(24, 8, 9, 24, A, { cren: true, flag: O })
    + cactus(-52, 16, 16) + cactus(46, 18, 12)
    + green(-22, 18);
}
// High Peaks (Mountain West): a castle with tall purple spires on a snowy mountain, a waterfall and pines.
function peaks() {
  const ROCK = '#9aa1ab';
  const S = '#c3c7cf';
  const P = '#6b5cd6';
  return base(62, 9, '#e6ecf2', '#5b5f68')
    + poly([[14, -6], [36, -54], [60, -4]], '#7c838d') + poly([[30, -42], [36, -54], [42, -42], [36, -45]], '#f4f7fb', 0.4)
    + poly([[-56, 6], [-4, -76], [10, 6]], ROCK) + poly([[-4, -76], [54, 6], [10, 6]], '#6f7680')
    + poly([[-20, -50], [-4, -76], [12, -50], [4, -55], [-4, -48], [-12, -55]], '#f4f7fb', 0.5)
    + `<path d="M14,-40Q12,-20 18,4L22,4Q17,-20 19,-40Z" fill="#a8dcf5" ${ol(0.4)}/><path d="M16,-34Q15,-16 19,2" stroke="#fff" stroke-width="0.8" fill="none"/><ellipse cx="20" cy="5" rx="6" ry="2" fill="#a8dcf5" ${ol(0.4)}/>`
    + tower(-20, -34, 6, 40, S, { roof: 'cone', rc: P, rh: 22, flag: P })
    + box(-34, -28, 30, 12, 10, '#b8bcc6', { cren: true })
    + tower(-36, -26, 6, 30, S, { roof: 'cone', rc: P, rh: 18, flag: P })
    + tower(-6, -30, 5, 24, S, { roof: 'cone', rc: P, rh: 16 })
    + pine(-50, 10, 18, true) + pine(40, 12, 16, true) + pine(50, 6, 20, true) + pine(-40, 15, 14, true) + pine(30, 17, 12, true)
    + green(4, 16);
}
// Pacific Tide (West Coast): a lighthouse castle on a sea cliff, with redwoods, palms and waves.
function pacific() {
  const W = '#f4f6f8';
  const B = '#2f86cf';
  return base(62, 13, '#6f9d57', '#7a6656')
    + `<path d="M24,20q4,-3 8,0t8,0t8,0M30,24q4,-3 8,0t8,0" stroke="#e8f6ff" stroke-width="1.2" fill="none"/>`
    + redwood(-40, -10, 52) + redwood(-50, -4, 44) + redwood(-30, -6, 40)
    + `<circle cx="18" cy="-60" r="11" fill="#ffe27a" opacity="0.35"/>`
    + tower(18, -2, 8, 52, W, { bands: [[-14, -22, B], [-30, -38, B]] })
    + tower(18, -54, 11, 2.5, '#d9e2ea')
    + tower(18, -56.5, 6, 8, '#ffe27a', { roof: 'cone', rc: B, rh: 9, flag: '#3a9be0' })
    + box(-26, 6, 28, 18, 14, '#e9edf1') + hip(-26, -12, 28, 14, 10, B)
    + `<rect x="-20" y="-6" width="3.4" height="5" fill="#2d4a66"/><rect x="-11" y="-6" width="3.4" height="5" fill="#2d4a66"/><rect x="-2" y="-6" width="3.4" height="5" fill="#2d4a66"/><path d="M-14,6V0A3,3 0 0 1 -8,0V6Z" fill="#2a2018"/>`
    + palm(46, 10, 24) + palm(36, 14, 16)
    + green(-42, 16);
}

/** Shading the pieces share (add once to the map's <defs>). */
export const CASTLE_DEFS = '<linearGradient id="lbc-cyl"><stop offset="0" stop-color="#fff" stop-opacity="0.38"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.42"/></linearGradient>';
export const CASTLES = { ivy: ivy(), magnolia: magnolia(), plains: plains(), desert: desert(), peaks: peaks(), pacific: pacific() };
