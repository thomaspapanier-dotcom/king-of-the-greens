// Rank badges: a golf crest that gets more elaborate each tier, with golf balls showing
// the division (V = five balls … I = one), all in polished metal of the tier's color.
// Putt Master, the top rank, is deep magenta with every ornament and one big ball.
import { TIERS } from './ranked.js';

const SHIELD = 'M32 6 L55 13 V34 C55 49 45 59 32 66 C19 59 9 49 9 34 V13 Z';
const INNER = 'M32 11 L50 17 V34 C50 46 42 54 32 60 C22 54 14 46 14 34 V17 Z';
const LEVEL = Object.fromEntries(TIERS.map((t, i) => [t.key, i])); // 0 copper … 5 diamond, 6 Putt Master

function ballsRow(n, id) {
  // A gentle arc of n polished balls across the lower face of the crest.
  const gap = 7.4;
  return Array.from({ length: n }, (_, i) => {
    const x = 32 + (i - (n - 1) / 2) * gap;
    const y = 45 - Math.cos(((i - (n - 1) / 2) / 3) * Math.PI * 0.5) * 2;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="url(#${id}b)" stroke="rgba(0,0,0,.55)" stroke-width=".6"/><circle cx="${(x - 1.1).toFixed(1)}" cy="${(y - 1.2).toFixed(1)}" r="1" fill="#fff" opacity=".9"/>`;
  }).join('');
}

const flag = (id) => `<line x1="30" y1="21" x2="30" y2="36" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M30 21 L39 24 L30 27 Z" fill="url(#${id}m)"/><ellipse cx="30" cy="36.5" rx="3" ry="1" fill="rgba(0,0,0,.35)"/>`;

function putters(id) {
  const club = (rot) => `<g transform="rotate(${rot} 32 36)"><line x1="32" y1="2" x2="32" y2="68" stroke="url(#${id}m)" stroke-width="2.4" stroke-linecap="round"/><rect x="27" y="64" width="10" height="4" rx="1.5" fill="url(#${id}m)"/></g>`;
  return club(-38) + club(38);
}

function laurels(id) {
  const leaf = (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="2.5" ry="5.2" transform="rotate(${r} ${x} ${y})" fill="url(#${id}m)" stroke="rgba(0,0,0,.25)" stroke-width=".4"/>`;
  const side = (s) => [[8, 52, -40], [5, 43, -20], [4, 33, 0], [5, 23, 20]].map(([x, y, r]) => leaf(s < 0 ? 64 - x : x, y, s < 0 ? -r : r)).join('');
  return side(1) + side(-1);
}

const crown = (id, dark) => `<path d="M22 9 L25 1 L29 6 L32 0 L35 6 L39 1 L42 9 Z" fill="url(#${id}m)" stroke="${dark}" stroke-width=".9" stroke-linejoin="round"/><path d="M23 7.5 H41" stroke="#fff" stroke-opacity=".6" stroke-width=".8"/>`;
const gem = (fill, dark) => `<path d="M32 -2 L38 4 L32 11 L26 4 Z" fill="${fill}" stroke="${dark}" stroke-width=".9"/><path d="M26 4 H38 M32 -2 L30 4 L32 11 L34 4 Z" fill="none" stroke="${dark}" stroke-width=".5" opacity=".7"/><path d="M32 -1 L35.5 3.5 L32 4 Z" fill="#fff" opacity=".7"/>`;

function rays(color) {
  return Array.from({ length: 12 }, (_, i) => `<path d="M32 36 L${(32 + 40 * Math.cos(((i * 30 - 4) * Math.PI) / 180)).toFixed(1)} ${(36 + 40 * Math.sin(((i * 30 - 4) * Math.PI) / 180)).toFixed(1)} L${(32 + 40 * Math.cos(((i * 30 + 4) * Math.PI) / 180)).toFixed(1)} ${(36 + 40 * Math.sin(((i * 30 + 4) * Math.PI) / 180)).toFixed(1)} Z" fill="${color}" opacity=".35"/>`).join('');
}

/** SVG markup for a rank badge. `rank` from RANKS; null = unranked. */
export function rankBadge(rank, size = 40, title = '') {
  if (!rank) {
    return `<svg class="rank-badge" width="${size}" height="${size * 1.1}" viewBox="0 -4 64 74" role="img" aria-label="${title || 'Unranked'}">
      <path d="${SHIELD}" fill="none" stroke="#8a948f" stroke-width="2.5" stroke-dasharray="4 3"/>
      <text x="32" y="44" text-anchor="middle" font-size="22" font-weight="800" fill="#8a948f">?</text>
    </svg>`;
  }
  const tier = TIERS.find((t) => t.key === rank.tier);
  const lvl = LEVEL[rank.tier];
  const master = lvl === 6;
  const id = `rb${rank.index}`;
  const defs = `<defs>
    <!-- brushed metal: highlight, metal, shadow, metal, highlight bands -->
    <linearGradient id="${id}m" x1="0" y1="0" x2=".35" y2="1">
      <stop offset="0" stop-color="${tier.light}"/><stop offset=".22" stop-color="${tier.color}"/><stop offset=".5" stop-color="${tier.dark}"/>
      <stop offset=".64" stop-color="${tier.color}"/><stop offset=".82" stop-color="${tier.light}"/><stop offset="1" stop-color="${tier.dark}"/>
    </linearGradient>
    <radialGradient id="${id}f" cx=".5" cy=".25" r=".85"><stop offset="0" stop-color="${tier.color}" stop-opacity=".55"/><stop offset=".55" stop-color="${tier.dark}"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
    <radialGradient id="${id}b" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${tier.light}"/><stop offset=".7" stop-color="${tier.color}"/><stop offset="1" stop-color="${tier.dark}"/></radialGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".55"/><stop offset=".55" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <clipPath id="${id}c"><path d="${SHIELD}"/></clipPath>
    ${lvl >= 5 ? `<radialGradient id="${id}g"><stop offset=".5" stop-color="${tier.color}" stop-opacity="${master ? '.75' : '.55'}"/><stop offset="1" stop-color="${tier.color}" stop-opacity="0"/></radialGradient>` : ''}
  </defs>`;
  const centre = master
    ? `<circle cx="32" cy="41" r="8.5" fill="url(#${id}b)" stroke="rgba(0,0,0,.55)" stroke-width=".8"/><circle cx="29" cy="38" r="2.4" fill="#fff" opacity=".85"/>
       ${[[34, 40], [36, 43], [31, 44], [34, 46], [29, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7" fill="rgba(0,0,0,.25)"/>`).join('')}`
    : ballsRow(rank.balls, id);
  return `<svg class="rank-badge" width="${size}" height="${size * 1.1}" viewBox="0 -4 64 74" role="img" aria-label="${title || rank.name}">
    ${defs}
    ${lvl >= 5 ? `<circle cx="32" cy="36" r="34" fill="url(#${id}g)"/>` : ''}
    ${master ? rays(tier.light) : ''}
    ${lvl >= 2 ? putters(id) : ''}
    ${lvl >= 3 ? laurels(id) : ''}
    <path d="${SHIELD}" fill="url(#${id}m)" stroke="${tier.dark}" stroke-width="1.4"/>
    <path d="${INNER}" fill="url(#${id}f)" stroke="${lvl >= 1 ? tier.light : tier.dark}" stroke-opacity="${lvl >= 1 ? '.85' : '1'}" stroke-width="1.1"/>
    ${master ? '' : flag(id)}
    ${centre}
    <!-- gloss: a diagonal sheen across the crest -->
    <g clip-path="url(#${id}c)"><path d="M0 0 H40 L16 70 H-8 Z" fill="url(#${id}s)"/></g>
    <path d="M12 14.5 L32 8 L52 14.5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".9" stroke-linecap="round"/>
    ${lvl >= 4 ? crown(id, tier.dark) : ''}
    ${lvl === 5 ? gem('#e7f6ff', tier.dark) : ''}
    ${master ? gem(`url(#${id}b)`, tier.dark) : ''}
  </svg>`;
}
