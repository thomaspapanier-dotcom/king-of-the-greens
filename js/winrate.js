// Win % golf balls: a little flex next to the gamertag, colored by LIFETIME ranked
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

/** The ball a player has earned from their lifetime ranked record. */
export function levelFor(wins, games) {
  const pct = winPct(wins, games);
  if (games < MIN_RANKED_GAMES || pct === null) return LEVELS[0];
  let level = LEVELS[0];
  for (const l of LEVELS) if (l.min !== null && pct >= l.min) level = l;
  return level;
}

// Dimples laid out once on a hex grid inside the ball.
const DIMPLES = (() => {
  const pts = [];
  for (let row = -4; row <= 4; row++) {
    for (let col = -4; col <= 4; col++) {
      const x = 20 + col * 3.4 + (row % 2 ? 1.7 : 0);
      const y = 19 + row * 2.95;
      const d = Math.hypot(x - 20, y - 19);
      if (d < 12.6) pts.push([x, y, 1 - d / 15]); // smaller and fainter toward the edge (it's a sphere)
    }
  }
  return pts;
})();

/** SVG of a cartoon golf ball in the earned color. `size` in px (or an em string). */
export function winBall(level, size = '0.85em', title = '') {
  const id = `wb-${level.key}`;
  const dimples = DIMPLES.map(([x, y, k]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.25 * (0.55 + k * 0.45)).toFixed(2)}" fill="${level.dark}" fill-opacity="${(0.18 + k * 0.17).toFixed(2)}"/><circle cx="${(x - 0.35).toFixed(1)}" cy="${(y - 0.4).toFixed(1)}" r="${(0.55 * (0.55 + k * 0.45)).toFixed(2)}" fill="#fff" fill-opacity="${(0.25 * k).toFixed(2)}"/>`).join('');
  const label = title || (level.min === null ? 'Win % ball: unrated' : `Win % ball: ${level.min}%+ ranked wins`);
  return `<svg class="win-ball" width="${size}" height="${size}" viewBox="0 0 40 40" role="img" aria-label="${label}">
    <defs>
      <radialGradient id="${id}" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="${level.light}"/><stop offset=".45" stop-color="${level.color}"/><stop offset="1" stop-color="${level.dark}"/></radialGradient>
      <clipPath id="${id}c"><circle cx="20" cy="19" r="14.2"/></clipPath>
    </defs>
    <ellipse cx="21" cy="36.5" rx="10.5" ry="2.2" fill="#000" opacity=".22"/>
    <circle cx="20" cy="19" r="15" fill="url(#${id})" stroke="#1b1b1b" stroke-width="1.6"/>
    <g clip-path="url(#${id}c)">${dimples}</g>
    <path d="M10.5 12.5 C12.5 8.2 16.5 6 21 6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>
    <circle cx="11.6" cy="16.4" r="1.2" fill="#fff" opacity=".8"/>
  </svg>`;
}

// Some screens call it winCrown (win % was briefly shown as a crown); it is the golf ball again.
export const winCrown = winBall;
