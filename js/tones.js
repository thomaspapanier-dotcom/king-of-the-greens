// How the Kings look: players pick White, Brown or Black in Settings. Every picture with a version
// in that look is swapped in (e.g. assets/cards/king-spades-brown.webp); the rest show the original.
// TONED is kept up to date by tools/add_tone_art.py.

export const TONES = [['white', 'White'], ['brown', 'Brown'], ['black', 'Black']];
export const TONED = {
  brown: new Set(['cards/king-clubs', 'cards/king-diamonds', 'cards/king-hearts', 'cards/king-spades']),
  black: new Set(['cards/king-clubs', 'cards/king-diamonds', 'cards/king-hearts', 'cards/king-spades']),
};

let tone = 'white';
export const setTone = (t) => { tone = TONES.some(([v]) => v === t) ? t : 'white'; };
export const currentTone = () => tone;
/** How many pictures have a version in this look (for Settings). */
export const tonedCount = (t) => (TONED[t] ? TONED[t].size : 0);

/** The picture to show for an art path like 'assets/cards/king-spades.webp', in the chosen look. */
export function art(path, t = tone) {
  if (t === 'white' || !TONED[t]) return path;
  const key = path.replace(/^assets\//, '').replace(/\.webp$/, '');
  return TONED[t].has(key) ? path.replace(/\.webp$/, `-${t}.webp`) : path;
}
