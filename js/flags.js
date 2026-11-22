// Small flags for the Empires, drawn here (no image files, and the same on every phone: Windows doesn't
// show flag emoji). Simplified so they still read at icon size. Every flag uses a 30 × 20 frame.
// flagImg('US') gives a tiny <img> for the page; flagImage('US') an image to draw on the globe.

const star = (cx, cy, r, fill, extra = '') => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}"${extra}/>`;
};
const bands = (dir, colors) => colors
  .map((c, i) => (dir === 'v'
    ? `<rect x="${(30 / colors.length) * i}" width="${30 / colors.length + 0.05}" height="20" fill="${c}"/>`
    : `<rect y="${(20 / colors.length) * i}" width="30" height="${20 / colors.length + 0.05}" fill="${c}"/>`))
  .join('');
// The Union Jack, filling a 30 × 20 frame (scaled down for Australia's and New Zealand's corners).
const UNION = '<rect width="30" height="20" fill="#012169"/>'
  + '<path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" stroke-width="4"/>'
  + '<path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" stroke-width="1.4"/>'
  + '<path d="M15,0 V20 M0,10 H30" stroke="#fff" stroke-width="6"/>'
  + '<path d="M15,0 V20 M0,10 H30" stroke="#C8102E" stroke-width="3.4"/>';

function usFlag() {
  let s = '<rect width="30" height="20" fill="#fff"/>';
  for (let i = 0; i < 13; i += 2) s += `<rect y="${((20 / 13) * i).toFixed(3)}" width="30" height="${(20 / 13).toFixed(3)}" fill="#B22234"/>`;
  s += `<rect width="12" height="${((20 / 13) * 7).toFixed(3)}" fill="#3C3B6E"/>`;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) s += `<circle cx="${1.2 + c * 1.95}" cy="${1.25 + r * 2.2}" r="0.42" fill="#fff"/>`;
  return s;
}
const MAPLE = 'M15 4.2l1 1.9 1.3-.6-.6 3 1.9-1.9.5 1 1.9-.4-.6 1.9.9.4-2.9 2.4.4 1.1-2.7-.4.1 2.9h-.8l.1-2.9-2.7.4.4-1.1-2.9-2.4.9-.4-.6-1.9 1.9.4.5-1 1.9 1.9-.6-3 1.3.6z';
function koreaFlag() {
  const bars = (x, y, deg) => `<g transform="translate(${x} ${y}) rotate(${deg})">${[-1.3, 0, 1.3].map((dy) => `<rect x="-2.4" y="${dy - 0.35}" width="4.8" height="0.7" fill="#111"/>`).join('')}</g>`;
  return '<rect width="30" height="20" fill="#fff"/>'
    + '<circle cx="15" cy="10" r="4.6" fill="#0047A0"/>'
    + '<path d="M10.4,10 a4.6,4.6 0 0 1 9.2,0 a2.3,2.3 0 0 1 -4.6,0 a2.3,2.3 0 0 0 -4.6,0 z" fill="#CD2E3A"/>'
    + bars(6.2, 4.6, -56) + bars(23.8, 15.4, -56) + bars(23.8, 4.6, 56) + bars(6.2, 15.4, 56);
}

const DRAW = {
  US: usFlag(),
  GB: UNION,
  IE: bands('v', ['#169B62', '#fff', '#FF883E']),
  CA: '<rect width="30" height="20" fill="#fff"/><rect width="7.5" height="20" fill="#D52B1E"/><rect x="22.5" width="7.5" height="20" fill="#D52B1E"/>'
    + `<path d="${MAPLE}" fill="#D52B1E"/>`,
  AU: `<rect width="30" height="20" fill="#012169"/><g transform="scale(.5)">${UNION}</g>${star(7.5, 15, 2.4, '#fff')}`
    + [[22.5, 16.8, 1.1], [18.6, 9.2, 1], [22.5, 3.6, 1], [26.4, 8, 1], [24.6, 11.6, 0.6]].map(([x, y, r]) => star(x, y, r, '#fff')).join(''),
  NZ: `<rect width="30" height="20" fill="#012169"/><g transform="scale(.5)">${UNION}</g>`
    + [[22.5, 16.4, 1.3], [19.2, 9.4, 1.1], [22.5, 4, 1.1], [25.8, 8.4, 1.2]].map(([x, y, r]) => star(x, y, r, '#C8102E', ' stroke="#fff" stroke-width=".45"')).join(''),
  JP: '<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#BC002D"/>',
  DE: bands('h', ['#000', '#DD0000', '#FFCE00']),
  SE: '<rect width="30" height="20" fill="#006AA7"/><rect x="9.4" width="3.8" height="20" fill="#FECC02"/><rect y="8.1" width="30" height="3.8" fill="#FECC02"/>',
  CN: `<rect width="30" height="20" fill="#EE1C25"/>${star(5, 5, 3, '#FFFF00')}`
    + [[10, 2, 1], [12, 4, 1], [12, 7, 1], [10, 9, 1]].map(([x, y, r]) => star(x, y, r, '#FFFF00')).join(''),
  FR: bands('v', ['#0055A4', '#fff', '#EF4135']),
  NL: bands('h', ['#AE1C28', '#fff', '#21468B']),
  ES: '<rect width="30" height="20" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/>',
  KR: koreaFlag(),
};

export const flagSvg = (code) => (DRAW[code]
  ? `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" viewBox="0 0 30 20" preserveAspectRatio="none">${DRAW[code]}</svg>`
  : '');
const uri = (code) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(flagSvg(code))}`;

/** A tiny flag to put before an Empire's name. */
export function flagImg(code, h = 12) {
  if (!DRAW[code]) return '';
  return `<img class="flag" src="${uri(code)}" width="${Math.round(h * 1.5)}" height="${h}" alt="" draggable="false">`;
}

const images = {};
/** The flag as an image for the globe's canvas (loads on first use; draws once it's ready). */
export function flagImage(code) {
  if (!DRAW[code]) return null;
  if (!images[code]) {
    const im = new Image();
    im.src = uri(code);
    images[code] = im;
  }
  return images[code].complete && images[code].naturalWidth ? images[code] : null;
}
