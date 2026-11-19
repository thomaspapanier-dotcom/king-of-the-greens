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
// The crown after a gamertag, in the level's color. Each level up adds detail, so the
// top win % wears the most royal crown: 3 plain points (unrated, blue) … 5 points with
// pearls, band jewels, a center gem, arches, an orb and cross, then sparkles and a glow.
const PEARL = '#fffaf0';
const BIG_GEM = { blue: '#ffffff', teal: '#ffffff', green: '#e3262b', lime: '#e3262b', yellow: '#e3262b', amber: '#e3262b', orange: '#dff4ff', red: '#dff4ff', magenta: '#dff4ff' };

/** SVG of the win % crown for a level. `size` in px (or an em string). */
export function winCrown(level, size = '0.85em', title = '') {
  const i = Math.max(0, LEVELS.findIndex((l) => l.key === level.key)); // 0 unrated … 9 magenta
  const id = `wc-${level.key}`;
  const five = i >= 3;
  // Points: [x, y] tips with valleys in between.
  const tips = five ? [[5, 13], [12.5, 10], [20, 6.5], [27.5, 10], [35, 13]] : [[5, 12], [20, 8], [35, 12]];
  let d = 'M5 27';
  tips.forEach(([x, y], k) => {
    d += ` L${x} ${y}`;
    if (k < tips.length - 1) d += ` L${(x + tips[k + 1][0]) / 2} ${five ? 19 : 20}`;
  });
  d += ' L35 27 Z';
  const metal = `url(#${id}m)`;
  const ink = i === 0 ? '#5f666c' : level.dark;
  const parts = [];
  // Glow behind the crown for the top levels.
  if (i >= 7) parts.push(`<circle cx="20" cy="20" r="${i === 9 ? 19 : 16}" fill="url(#${id}g)"/>`);
  // Arches over the top (orange and up): two curved bands meeting above the center point.
  if (i >= 7) parts.push(`<path d="M7 16 Q10 4 20 4 Q30 4 33 16" fill="none" stroke="${metal}" stroke-width="2.4"/><path d="M7 16 Q10 4 20 4 Q30 4 33 16" fill="none" stroke="${ink}" stroke-width=".6" opacity=".6"/>`);
  if (i >= 7) parts.push(`<path d="M13 17 Q14 6 20 5" fill="none" stroke="${metal}" stroke-width="1.6"/><path d="M27 17 Q26 6 20 5" fill="none" stroke="${metal}" stroke-width="1.6"/>`);
  parts.push(`<path d="${d}" fill="${metal}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>`);
  // Inner shading line so the points read as raised metal.
  if (i >= 1) parts.push(`<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".7" transform="translate(0 1.2) scale(1 .97)" stroke-linejoin="round"/>`);
  // Pearls on the tips.
  if (i >= 1) tips.forEach(([x, y]) => parts.push(`<circle cx="${x}" cy="${y - 0.6}" r="${i >= 5 ? 2.1 : 1.8}" fill="${i >= 5 ? PEARL : metal}" stroke="${ink}" stroke-width=".7"/>`));
  // The band.
  parts.push(`<rect x="4" y="26" width="32" height="7" rx="2" fill="${metal}" stroke="${ink}" stroke-width="1.2"/>`);
  if (i >= 2) parts.push(`<path d="M5.5 28 H34.5" stroke="#fff" stroke-opacity=".45" stroke-width=".8"/>`);
  // Band jewels (green and up), more of them higher up.
  if (i >= 3) {
    const xs = i >= 6 ? [8.5, 14, 20, 26, 31.5] : [11, 20, 29];
    xs.forEach((x, k) => {
      const c = k % 2 ? '#e3262b' : '#2f9bff';
      parts.push(i >= 6 && x === 20
        ? `<path d="M20 26.6 L22.3 29.5 L20 32.4 L17.7 29.5 Z" fill="${BIG_GEM[level.key] || '#fff'}" stroke="${ink}" stroke-width=".6"/>`
        : `<circle cx="${x}" cy="29.5" r="1.45" fill="${c}" stroke="${ink}" stroke-width=".5"/>`);
    });
  }
  // A big center gem on the crown face (yellow and up).
  if (i >= 5) parts.push(`<path d="M20 15 L23.4 19.6 L20 24.2 L16.6 19.6 Z" fill="${BIG_GEM[level.key]}" stroke="${ink}" stroke-width=".8"/><path d="M20 15 L21.4 19.6 L20 24.2" fill="#fff" opacity=".45"/>`);
  else if (i >= 3) parts.push(`<circle cx="20" cy="20.5" r="2" fill="#e3262b" stroke="${ink}" stroke-width=".6"/>`);
  // Orb and cross on top (red and up).
  if (i >= 8) parts.push(`<circle cx="20" cy="3.4" r="2" fill="${metal}" stroke="${ink}" stroke-width=".7"/>`);
  if (i >= 9) parts.push(`<path d="M20 -1.8 V1.6 M18.3 -0.2 H21.7" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/><path d="M20 -1.6 V1.4 M18.5 -0.2 H21.5" stroke="${level.light}" stroke-width=".8" stroke-linecap="round"/>`);
  // Sparkles (magenta only).
  if (i >= 9) {
    const star = (x, y, r) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="#fff"/>`;
    parts.push(star(3.5, 7, 2.6) + star(37, 9, 2.2) + star(36.5, 34.5, 1.8));
  }
  const label = title || (level.min === null ? 'Win % crown: unrated' : `Win % crown: ${level.min}%+ ranked wins`);
  return `<svg class="win-crown" width="${size}" height="${size}" viewBox="0 -3 40 40" role="img" aria-label="${label}">
    <defs>
      <linearGradient id="${id}m" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${level.light}"/><stop offset=".45" stop-color="${level.color}"/><stop offset="1" stop-color="${level.dark}"/></linearGradient>
      ${i >= 7 ? `<radialGradient id="${id}g"><stop offset=".35" stop-color="${level.color}" stop-opacity=".55"/><stop offset="1" stop-color="${level.color}" stop-opacity="0"/></radialGradient>` : ''}
    </defs>
    <ellipse cx="20" cy="35.5" rx="13" ry="1.8" fill="#000" opacity=".25"/>
    ${parts.join('\n    ')}
  </svg>`;
}
// Older screens call it winBall; it's a crown now.
export const winBall = winCrown;
