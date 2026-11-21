// How the Kings (and later the Queens) look. Players pick White, Brown or Black skin in Settings, and
// (with accounts) whether they rule as a King or a Queen. Every picture with a version for that choice is
// swapped in; anything not made yet falls back (Queen → King in that skin → the original).
// TONED and QUEENED are kept up to date by tools/add_tone_art.py.

export const TONES = [['white', 'White'], ['brown', 'Brown'], ['black', 'Black']];
// King art in Brown / Black, keyed like 'cards/king-spades' or 'challenges/banner-north'.
export const TONED = {
  brown: new Set(['cards/king-clubs', 'cards/king-diamonds', 'cards/king-hearts', 'cards/king-spades']),
  black: new Set(['cards/king-clubs', 'cards/king-diamonds', 'cards/king-hearts', 'cards/king-spades']),
};
// Queen art, keyed by the King picture it replaces ('challenges/banner-north' → challenges/queen-banner-north[-tone]).
export const QUEENED = {
  white: new Set([]),
  brown: new Set([]),
  black: new Set([]),
};

let tone = 'white';
let ruler = 'king';
export const setTone = (t) => { tone = TONES.some(([v]) => v === t) ? t : 'white'; };
export const currentTone = () => tone;
/** King or Queen. Chosen once, when a player verifies their account (coming with accounts). */
export const setRuler = (r) => { ruler = r === 'queen' ? 'queen' : 'king'; };
export const currentRuler = () => ruler;
/** How many pictures have a version in this look (for Settings). */
export const tonedCount = (t) => (TONED[t] ? TONED[t].size : 0);

/** The picture to show for an art path like 'assets/cards/king-spades.webp', in the chosen look. */
export function art(path, t = tone, r = ruler) {
  const key = path.replace(/^assets\//, '').replace(/\.webp$/, '');
  if (r === 'queen' && QUEENED[t] && QUEENED[t].has(key)) {
    const q = path.replace('assets/challenges/', 'assets/challenges/queen-').replace('assets/cards/king-', 'assets/cards/queen-');
    return t === 'white' ? q : q.replace(/\.webp$/, `-${t}.webp`);
  }
  if (t === 'white' || !TONED[t]) return path;
  return TONED[t].has(key) ? path.replace(/\.webp$/, `-${t}.webp`) : path;
}
