// Ranked KOG: the rating math. Pure functions, so the same code can run on the server
// once accounts exist (ranked results must be decided server-side, never on one phone).
//
// Model: Elo-style MMR, like the hidden ratings behind Rocket League and Rainbow Six Siege.
// - Expected result = 1 / (1 + 10^((theirs − yours) / 400)). Beat someone rated higher and
//   you gain more; lose to someone rated lower and you lose more. Bigger gap, bigger swing.
// - Placements: the first 10 ranked matches use a much larger K, so MMR moves a lot while
//   the app learns your level; you're "Unranked" until all 10 are played.
// - 31 visible ranks: Copper V (lowest) … Diamond I, then Putt Master at the very top, 40 MMR apart.
// - Like Rocket League's "overlapping" ranges, you only drop a division once you're a
//   little below its floor, so a single loss at the edge doesn't flip your badge back and forth.

// color = the metal, light = its highlight, dark = its shadow (badges use all three for shine).
export const TIERS = [
  { key: 'copper', name: 'Copper', color: '#c0713a', light: '#f6c39d', dark: '#5e2f10' },
  { key: 'bronze', name: 'Bronze', color: '#cd8a3e', light: '#f8d9a6', dark: '#6b3f12' },
  { key: 'silver', name: 'Silver', color: '#b9c2cc', light: '#ffffff', dark: '#525e6b' },
  { key: 'gold', name: 'Gold', color: '#f2c230', light: '#fff4b8', dark: '#7d5800' },
  { key: 'platinum', name: 'Platinum', color: '#8fe3d8', light: '#effffc', dark: '#22706a' },
  { key: 'diamond', name: 'Diamond', color: '#8cc8ff', light: '#f1f9ff', dark: '#1f4f96' },
  // The top of the ladder: a single rank, no divisions.
  { key: 'master', name: 'Putt Master', color: '#d4007a', light: '#ff7cc8', dark: '#4d0030', single: true },
];
export const NUMERALS = ['V', 'IV', 'III', 'II', 'I'];
export const PLACEMENT_MATCHES = 10;
export const START_MMR = 1450; // Silver I: the middle of the ladder, like a bell curve's peak
export const DIVISION_WIDTH = 40;
export const FLOOR = 900; // Copper IV starts here; Copper V is everything below
export const DEMOTION_BUFFER = 15;
export const BAIL_PENALTY = 30; // quitting a locked match within the last hour

/** All 31 ranks, lowest first, with the MMR where each one starts. */
export const RANKS = TIERS.flatMap((tier) => (tier.single ? [''] : NUMERALS).map((numeral, i) => ({ tier, numeral, i }))).map(({ tier, numeral, i }, index) => ({
  index,
  tier: tier.key,
  tierName: tier.name,
  numeral,
  balls: tier.single ? 0 : 5 - i, // V = five golf balls on the badge … I = one
  name: numeral ? `${tier.name} ${numeral}` : tier.name,
  min: index === 0 ? -Infinity : FLOOR + (index - 1) * DIVISION_WIDTH,
}));
RANKS.forEach((r, i) => (r.max = i < RANKS.length - 1 ? RANKS[i + 1].min - 1 : Infinity));

/** The rank an MMR falls in (ignoring the demotion buffer). */
export function rankFor(mmr) {
  for (let i = RANKS.length - 1; i >= 0; i--) if (mmr >= RANKS[i].min) return RANKS[i];
  return RANKS[0];
}

/** Rank shown after a change: promote on crossing a floor, demote only below floor − buffer. */
export function displayedRank(prevIndex, mmr) {
  const raw = rankFor(mmr);
  if (prevIndex == null || raw.index >= prevIndex) return raw;
  const prev = RANKS[prevIndex];
  return mmr >= prev.min - DEMOTION_BUFFER ? prev : rankFor(mmr);
}

export const expected = (mine, theirs) => 1 / (1 + 10 ** ((theirs - mine) / 400));

/** How far one match moves you: big during placements, then settling down. */
export function kFactor(gamesPlayed) {
  if (gamesPlayed < PLACEMENT_MATCHES) return 64;
  if (gamesPlayed < 30) return 40;
  return 32;
}

/**
 * Playing the same opponent over and over counts less (stops two friends trading wins
 * to boost each other): full value, then half, then a quarter within a day.
 */
export const repeatFactor = (timesPlayedToday) => [1, 0.5, 0.25][Math.min(timesPlayedToday, 2)];

/** New player profile for a season. */
export const newRating = () => ({ mmr: START_MMR, games: 0, rankIndex: null });
export const isPlaced = (r) => r.games >= PLACEMENT_MATCHES;

/**
 * Rating change from one result. `score`: 1 win, 0.5 tie, 0 loss.
 * `scale` shrinks K for multi-opponent games and repeat matchups.
 */
export function delta(mine, theirs, score, gamesPlayed, scale = 1) {
  return Math.round(kFactor(gamesPlayed) * scale * (score - expected(mine, theirs)));
}

function apply(r, change) {
  const mmr = r.mmr + change;
  const games = r.games + 1;
  // Rank only appears once placements are done; it's computed fresh at that moment.
  const rankIndex = games >= PLACEMENT_MATCHES ? displayedRank(r.games >= PLACEMENT_MATCHES ? r.rankIndex : null, mmr).index : null;
  return { mmr, games, rankIndex, change };
}

/** 1 v 1 (head-to-head Compass, Lag 21, a 2-player KOG game). */
export function rate1v1(a, b, scoreA, { repeats = 0 } = {}) {
  const f = repeatFactor(repeats);
  return [apply(a, delta(a.mmr, b.mmr, scoreA, a.games, f)), apply(b, delta(b.mmr, a.mmr, 1 - scoreA, b.games, f))];
}

/**
 * Free-for-all (a 3-player KOG game): every pair is a mini-match decided by final
 * placing, each worth 1/(players − 1) of a full match. `places`: 1 = winner (ties share).
 */
export function rateFreeForAll(ratings, places) {
  const n = ratings.length;
  return ratings.map((r, i) => {
    let change = 0;
    ratings.forEach((o, j) => {
      if (i === j) return;
      const score = places[i] < places[j] ? 1 : places[i] > places[j] ? 0 : 0.5;
      change += delta(r.mmr, o.mmr, score, r.games, 1 / (n - 1));
    });
    return apply(r, change);
  });
}

/**
 * Ranked duos (2 v 2, any ranks can team up). Each player is measured on their own
 * rating against the other team's average, so within a team the higher-rated player
 * is expected to do more: on a loss they lose more than their teammate, on a win they
 * gain less. Example: Silver III + Platinum IV losing to Copper III + Bronze II, both
 * lose, the Platinum loses more.
 */
export function rateTeams(teamA, teamB, scoreA, { repeats = 0 } = {}) {
  const avg = (t) => t.reduce((s, r) => s + r.mmr, 0) / t.length;
  const [ma, mb] = [avg(teamA), avg(teamB)];
  const f = repeatFactor(repeats);
  return [
    teamA.map((r) => apply(r, delta(r.mmr, mb, scoreA, r.games, f))),
    teamB.map((r) => apply(r, delta(r.mmr, ma, 1 - scoreA, r.games, f))),
  ];
}

/**
 * Who may play a ranked match: every player must be verified (the server checks this
 * again). Duos need exactly four verified players; any ranks can pair up.
 */
export function rankedEligible(players, mode = '1v1') {
  const need = mode === 'duos' ? 4 : 2;
  if (players.length !== need) return { ok: false, reason: `${mode === 'duos' ? 'Ranked duos' : 'Ranked'} needs ${need} players.` };
  const unverified = players.filter((p) => !p.phone_verified).map((p) => p.gamertag);
  if (unverified.length) return { ok: false, reason: `Not verified yet: ${unverified.join(', ')}.` };
  return { ok: true };
}

/** Bailing on a locked match within an hour of tee time. */
export function bail(r) {
  return { ...apply(r, -BAIL_PENALTY), games: r.games }; // a penalty, not a match played
}

/** New season: pull everyone halfway back to the start so the ladder re-sorts quickly. */
export function seasonReset(r) {
  return { mmr: Math.round((r.mmr + START_MMR) / 2), games: Math.max(0, PLACEMENT_MATCHES - 3), rankIndex: null };
}
