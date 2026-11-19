// Win % crowns: a little flex at the end of the nameplate, colored by LIFETIME ranked
// win % (every season added together), so unlike the rank badge it never resets.
// Only ranked results count; overall win % is shown as a number but earns no color.
export const MIN_RANKED_GAMES = 10; // same as placements: a color needs a real sample

// Lowest win % for each color, after the "win rate badges" ladder in Warcraft Rumble.
export const LEVELS = [
  { key: 'unrated', name: 'Unrated', min: null, color: '#b8bec4', light: '#ffffff', dark: '#6b7177' },
  { key: 'blue', name: 'Blue', min: 48, color: '#1e88e5', light: '#9fd0ff', dark: '#0b4a8a' },
  { key: 'teal', name: 'Teal', min: 50, color: '#16b3a5', light: '#a4f3ea', dark: '#08635b' },
  { key: 'green', name: 'Green', min: 52, color: '#2fbf4a', light: '#b6f5c1', dark: '#126b24' },
  { key: 'lime', name: 'Lime', min: 54, color: '#a3c81a', light: '#e8f9a4', dark: '#566d05' },
  { key: 'yellow', name: 'Yellow', min: 56, color: '#f0cc1c', light: '#fff6b0', dark: '#8a7000' },
  { key: 'amber', name: 'Amber', min: 58, color: '#eaa21a', light: '#ffe2a3', dark: '#8a5600' },
  { key: 'orange', name: 'Orange', min: 60, color: '#f2641c', light: '#ffc3a1', dark: '#8a2f00' },
  { key: 'red', name: 'Red', min: 62, color: '#e3262b', light: '#ffb0b2', dark: '#7d0a0d' },
  { key: 'magenta', name: 'Magenta', min: 65, color: '#e01e87', light: '#ffb0dc', dark: '#78004a' },
];

export const winPct = (wins, games) => (games ? (wins / games) * 100 : null);

/** The crown color a player has earned from their lifetime ranked record. */
export function levelFor(wins, games) {
  const pct = winPct(wins, games);
  if (games < MIN_RANKED_GAMES || pct === null) return LEVELS[0];
  let level = LEVELS[0];
  for (const l of LEVELS) if (l.min !== null && pct >= l.min) level = l;
  return level;
}

// ---------- win % crown ----------
// The crown at the end of a nameplate, in the level's color. One family of crowns that
// gets more royal each level:
//   Unrated  plain 3-point crown          Blue   + pearl finials
//   Teal     5 points                     Green  + jewels in the band
//   Lime     + a gem on the front         Yellow + pearl trim and more jewels
//   Amber    + a big cut diamond up front Orange + red velvet cap and a glow
//   Red      + arches and an orb          Magenta + cross, sparkles, brightest glow
const GEMS = ['#e3262b', '#1e6fe0', '#18a558']; // ruby, sapphire, emerald
const VELVET = { orange: ['#7d0f2c', '#2e0410'], red: ['#3b1d6e', '#170a33'], magenta: ['#2b1460', '#0e0626'] };

/** SVG of the win % crown for a level. `size` in px (or an em string). */
export function winCrown(level, size = '0.85em', title = '') {
  const i = Math.max(0, LEVELS.findIndex((l) => l.key === level.key)); // 0 unrated … 9 magenta
  const id = `wc-${level.key}`;
  const metal = `url(#${id}m)`;
  const ink = i === 0 ? '#4d5459' : level.dark;
  const royal = i >= 8; // arches + orb, so the center point sits lower
  // Crown body: points with curved (scooped) sides, sitting on a curved band.
  const body = i < 2
    ? 'M6 27 L6 13 Q15 24 24 7.5 Q33 24 42 13 L42 27 Q24 31 6 27 Z'
    : `M6 27 L6 14 Q10.5 22 15 10.5 Q19.5 21 24 ${royal ? 9.5 : 6.5} Q28.5 21 33 10.5 Q37.5 22 42 14 L42 27 Q24 31 6 27 Z`;
  const tips = i < 2 ? [[6, 13], [24, 7.5], [42, 13]] : [[6, 14], [15, 10.5], [24, royal ? 9.5 : 6.5], [33, 10.5], [42, 14]];
  const band = 'M5.5 26.5 Q24 31 42.5 26.5 L41.5 34 Q24 38.6 6.5 34 Z';
  const out = [];

  if (i >= 7) out.push(`<ellipse cx="24" cy="21" rx="${i === 9 ? 24 : 21}" ry="${i === 9 ? 20 : 17}" fill="url(#${id}g)"/>`);
  // Velvet cap behind the points.
  if (i >= 7) {
    const [v1, v2] = VELVET[level.key] || VELVET.orange;
    out.push(`<path d="M8 25 C8 ${royal ? -4 : -3} 40 ${royal ? -4 : -3} 40 25 Z" fill="url(#${id}v)" stroke="${ink}" stroke-width=".8"/>`);
    out.push(`<path d="M14 12 Q17 7 22 6" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1.6" stroke-linecap="round"/>`);
    out.push(`<defs><radialGradient id="${id}v" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="${v1}"/><stop offset="1" stop-color="${v2}"/></radialGradient></defs>`);
  }
  // Arches over the cap, meeting under the orb.
  if (royal) {
    out.push(`<path d="M9 17 Q11 6 24 5.5 Q37 6 39 17" fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"/>`);
    out.push(`<path d="M9 17 Q11 6 24 5.5 Q37 6 39 17" fill="none" stroke="${metal}" stroke-width="2" stroke-linecap="round"/>`);
    out.push(`<path d="M17 16 Q18 7.5 24 6 Q30 7.5 31 16" fill="none" stroke="${metal}" stroke-width="1.4" opacity=".9"/>`);
  }
  // Body and its shine.
  out.push(`<path d="${body}" fill="${metal}" stroke="${ink}" stroke-width="1.1" stroke-linejoin="round"/>`);
  out.push(`<path d="${body}" fill="url(#${id}s)"/>`);
  // Pearl finials on every tip (blue and up); the front tip gets a cut diamond from amber up.
  if (i >= 1) {
    tips.forEach(([x, y], k) => {
      const front = k === Math.floor(tips.length / 2);
      if (front && i >= 6 && !royal) {
        out.push(`<path d="M24 ${y - 5} L27 ${y - 1.3} L24 ${y + 2} L21 ${y - 1.3} Z" fill="${i >= 7 ? '#e8f6ff' : GEMS[0]}" stroke="${ink}" stroke-width=".7"/><path d="M24 ${y - 5} L25.1 ${y - 1.3} L24 ${y + 2}" fill="#fff" opacity=".5"/>`);
      } else {
        out.push(`<circle cx="${x}" cy="${y - 1.6}" r="2.25" fill="url(#${id}p)" stroke="${ink}" stroke-width=".6"/>`);
      }
    });
  }
  // A gem on the front of the crown (lime and up).
  if (i >= 4) {
    const big = i >= 6;
    out.push(big
      ? `<path d="M24 15.5 L27.6 19.6 L24 23.7 L20.4 19.6 Z" fill="${i >= 7 ? '#e8f6ff' : GEMS[0]}" stroke="${ink}" stroke-width=".8"/><path d="M20.4 19.6 H27.6 M24 15.5 L22.6 19.6 L24 23.7 L25.4 19.6 Z" fill="none" stroke="${ink}" stroke-width=".35" opacity=".6"/><path d="M24 15.8 L26.4 18.9 L24 19.3 Z" fill="#fff" opacity=".7"/>`
      : `<ellipse cx="24" cy="19.8" rx="2.4" ry="3" fill="${GEMS[0]}" stroke="${ink}" stroke-width=".7"/><ellipse cx="23.3" cy="18.7" rx=".8" ry="1" fill="#fff" opacity=".7"/>`);
  }
  // The band.
  out.push(`<path d="${band}" fill="${metal}" stroke="${ink}" stroke-width="1.1" stroke-linejoin="round"/>`);
  out.push(`<path d="M7 28.4 Q24 32.9 41 28.4" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".9"/>`);
  // Pearl trim along the band (yellow and up).
  if (i >= 5) {
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      const x = 7.5 + t * 33;
      const y = 27.6 + 4 * t * (1 - t) * 1.0 + 0.1;
      out.push(`<circle cx="${x.toFixed(1)}" cy="${(y + 0.4).toFixed(1)}" r=".75" fill="#fffaf0" opacity=".95"/>`);
    }
  }
  // Jewels set in the band (green and up), five of them from yellow up.
  if (i >= 3) {
    const xs = i >= 5 ? [11, 17.5, 24, 30.5, 37] : [14, 24, 34];
    xs.forEach((x, k) => {
      const t = (x - 6.5) / 35;
      const y = 31.2 + 4.3 * t * (1 - t);
      const c = GEMS[k % GEMS.length];
      out.push(x === 24 && i >= 6
        ? `<path d="M24 ${(y - 2.4).toFixed(1)} L26.2 ${y.toFixed(1)} L24 ${(y + 2.4).toFixed(1)} L21.8 ${y.toFixed(1)} Z" fill="${GEMS[1]}" stroke="${ink}" stroke-width=".5"/>`
        : `<ellipse cx="${x}" cy="${y.toFixed(1)}" rx="1.7" ry="1.9" fill="${c}" stroke="${ink}" stroke-width=".5"/><circle cx="${x - 0.5}" cy="${(y - 0.6).toFixed(1)}" r=".5" fill="#fff" opacity=".8"/>`);
    });
  }
  // Orb on top (red and up) and a cross (magenta).
  if (royal) {
    if (i >= 9) out.push(`<path d="M24 -3.2 V2 M21.6 -1 H26.4" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/><path d="M24 -3 V1.8 M21.8 -1 H26.2" stroke="${metal}" stroke-width="1.2" stroke-linecap="round"/>`);
    out.push(`<circle cx="24" cy="4" r="2.8" fill="url(#${id}p)" stroke="${ink}" stroke-width=".8"/>`);
  }
  // Sparkles (magenta).
  if (i >= 9) {
    const star = (x, y, r) => `<path d="M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z" fill="#fff"/>`;
    out.push(star(4, 6, 3) + star(44.5, 8.5, 2.4) + star(45, 33, 2));
  }
  const label = title || (level.min === null ? 'Win % crown: unrated' : `Win % crown: ${level.min}%+ ranked wins`);
  return `<svg class="win-crown" width="${size}" height="${size}" viewBox="0 -4 48 44" role="img" aria-label="${label}">
    <defs>
      <linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${level.light}"/><stop offset=".38" stop-color="${level.color}"/><stop offset=".72" stop-color="${level.dark}"/><stop offset="1" stop-color="${level.color}"/></linearGradient>
      <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".2" stop-color="#fff" stop-opacity=".35"/><stop offset=".32" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
      <radialGradient id="${id}p" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="${i >= 5 ? '#f4eee0' : level.light}"/><stop offset="1" stop-color="${i >= 5 ? '#b9ad94' : level.color}"/></radialGradient>
      ${i >= 7 ? `<radialGradient id="${id}g"><stop offset=".3" stop-color="${level.color}" stop-opacity=".6"/><stop offset="1" stop-color="${level.color}" stop-opacity="0"/></radialGradient>` : ''}
    </defs>
    <ellipse cx="24" cy="37.5" rx="15" ry="1.8" fill="#000" opacity=".28"/>
    ${out.join('\n    ')}
  </svg>`;
}
// Older screens call it winBall; it's a crown now.
export const winBall = winCrown;
