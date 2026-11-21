// How the Kings (and later the Queens) look. Players pick White, Brown or Black skin in Settings, and
// (with accounts) whether they rule as a King or a Queen. Every picture with a version for that choice is
// swapped in; anything not made yet falls back (Queen → King in that skin → the original).
// TONED and QUEENED are kept up to date by tools/add_tone_art.py.

// The three looks, shown as "King v1 / v2 / v3" (or "Queen v1 …"). Kept as white/brown/black in file names.
export const TONES = [['white', 'v1'], ['brown', 'v2'], ['black', 'v3']];
// King art in Brown / Black, keyed like 'cards/king-spades' or 'challenges/banner-north'.
export const TONED = {
  brown: new Set(['cards/king-clubs', 'cards/king-diamonds', 'cards/king-hearts', 'cards/king-spades']),
  black: new Set(['cards/king-clubs', 'cards/king-diamonds', 'cards/king-hearts', 'cards/king-spades']),
};
// Queen art, keyed by the King picture it replaces ('challenges/banner-north' → challenges/queen-banner-north[-tone]).
export const QUEENED = {
  white: new Set(['cards/king-clubs', 'cards/king-diamonds', 'cards/king-hearts', 'cards/king-spades']),
  brown: new Set(['cards/king-clubs', 'cards/king-diamonds', 'cards/king-hearts', 'cards/king-spades']),
  black: new Set(['cards/king-clubs', 'cards/king-diamonds', 'cards/king-hearts', 'cards/king-spades']),
};

let tone = 'white';
let ruler = 'king';
export const setTone = (t) => { tone = TONES.some(([v]) => v === t) ? t : 'white'; };
export const currentTone = () => tone;
/** King or Queen. Chosen once, when a player verifies their account (coming with accounts). */
export const setRuler = (r) => { ruler = r === 'queen' ? 'queen' : 'king'; };
export const currentRuler = () => ruler;
/** "King v2", "Queen v1": the name of a look for the current ruler. */
export const lookName = (t = tone, r = ruler) => `${r === 'queen' ? 'Queen' : 'King'} ${(TONES.find(([v]) => v === t) || TONES[0])[1]}`;
/** How many pictures have a version in this look (for Settings). */
export const tonedCount = (t) => (TONED[t] ? TONED[t].size : 0);

// The version you picked for each challenge you've unlocked ({ north: 'black', … }); others follow your deck.
let picks = {};
export const setPicks = (p) => { picks = p && typeof p === 'object' ? p : {}; };
const challengeId = (path) => (path.match(/^assets\/challenges\/(?:badge|banner)-(.+)\.webp$/) || [])[1];
/** The version a challenge shows: the one you picked for it, or your deck. */
export const pickFor = (id) => (picks[id] && TONES.some(([v]) => v === picks[id]) ? picks[id] : tone);
/** Does this picture exist in that version yet? (v1 King art always does.) */
export function hasVersion(path, t, r = ruler) {
  const key = path.replace(/^assets\//, '').replace(/\.webp$/, '');
  if (r === 'queen') return QUEENED[t] ? QUEENED[t].has(key) : false;
  return t === 'white' || (TONED[t] ? TONED[t].has(key) : false);
}

/** The picture to show for an art path like 'assets/cards/king-spades.webp', in the chosen look. */
export function art(path, t, r = ruler) {
  const key = path.replace(/^assets\//, '').replace(/\.webp$/, '');
  if (t === undefined) t = challengeId(path) ? pickFor(challengeId(path)) : tone; // challenge art follows your pick
  const queen = (look) => {
    const q = path.replace('assets/challenges/', 'assets/challenges/queen-').replace('assets/cards/king-', 'assets/cards/queen-');
    return look === 'white' ? q : q.replace(/\.webp$/, `-${look}.webp`);
  };
  if (r === 'queen' && QUEENED[t] && QUEENED[t].has(key)) return queen(t);
  // A Queen card that isn't made in this look yet shows the v1 Queen, never a King.
  if (r === 'queen' && key.startsWith('cards/') && QUEENED.white.has(key)) return queen('white');
  if (t === 'white' || !TONED[t]) return path;
  return TONED[t].has(key) ? path.replace(/\.webp$/, `-${t}.webp`) : path;
}
