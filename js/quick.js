// Quick Play: "Compass". Four tees around one hole (north, east, south, west) at the
// chosen distance(s); 3 balls from each tee, and every ball is a birdie ball:
// in on the 1st putt = −1, 2nd = E, 3rd = +1 …
//
// Solo or head-to-head (2–4 players). Head-to-head: a tee flip decides who putts first
// at the first tee, the order rotates every tee so everyone leads equally, each
// player putts all 3 balls before the next, lowest total wins, and a tie goes to
// the same toss tie-breaker as the main game.
import { ballScore, DISTANCES } from './rules.js';

export const TEES = ['North', 'East', 'South', 'West'];
export const BALLS_PER_TEE = 3;
export const MAX_PLAYERS = 4;
const ORDER = ['S', 'M', 'L'];

/** Sessions saved before head-to-head had one player and 4 balls per tee; bring them up to date. */
export function normalizeQuick(q) {
  if (q.players) return q;
  return {
    ...q,
    v: 2,
    players: [q.player],
    order: [q.player.id],
    tees: { [q.player.id]: q.tees },
    winnerId: q.status === 'done' ? q.player.id : null,
  };
}

export function createQuick({ id, players, dists, date = new Date().toISOString() }) {
  const chosen = ORDER.filter((d) => dists.includes(d));
  if (!chosen.length) throw new Error('Pick at least one distance');
  if (!players.length || players.length > MAX_PLAYERS) throw new Error(`Compass is for 1–${MAX_PLAYERS} players`);
  const blank = () => Object.fromEntries(chosen.map((d) => [d, TEES.map(() => Array(BALLS_PER_TEE).fill(null))]));
  return {
    v: 2,
    id,
    date,
    players: players.map((p) => ({ id: p.id, name: p.name })),
    dists: chosen,
    order: players.length === 1 ? [players[0].id] : null, // set by the toss
    // tees[playerId][dist][teeIndex] = putts for each ball (null until scored)
    tees: Object.fromEntries(players.map((p) => [p.id, blank()])),
    status: players.length === 1 ? 'playing' : 'toss',
    winnerId: null,
    tiedIds: null,
    tieTosses: 0,
  };
}

/** Opening order from the tee flip: `ranking` is first to putt → last (older sessions: closest → furthest). */
export function applyQuickToss(q, ranking) {
  const ids = q.players.map((p) => p.id);
  if (ranking.length !== ids.length || !ids.every((id) => ranking.includes(id))) throw new Error('Rank every player once');
  q.order = [...ranking];
  q.status = 'playing';
}

/** Tee number across the whole session (0 = first tee of the first distance). */
export const teeNumber = (q, d, t) => q.dists.indexOf(d) * TEES.length + t;

/** Putting order at a tee: the first-tee order, rotated one place per tee. */
export function teeOrder(q, d, t) {
  const n = teeNumber(q, d, t) % q.order.length;
  return [...q.order.slice(n), ...q.order.slice(0, n)];
}

function sumBalls(balls, partial) {
  let sum = 0;
  let any = false;
  for (const p of balls) {
    const s = ballScore('birdie', p);
    if (s === null) {
      if (!partial) return null;
      continue;
    }
    sum += s;
    any = true;
  }
  return partial && !any ? null : sum;
}

const ballsOf = (q, pid, d = null) => (d ? q.tees[pid][d].flat() : q.dists.flatMap((x) => q.tees[pid][x].flat()));
export const teeScore = (q, pid, d, t, opts = {}) => sumBalls(q.tees[pid][d][t], opts.partial);
export const distScore = (q, pid, d, opts = {}) => sumBalls(ballsOf(q, pid, d), opts.partial);
export const playerScore = (q, pid, opts = {}) => sumBalls(ballsOf(q, pid), opts.partial);
export const teeDone = (q, d, t) => q.players.every((p) => q.tees[p.id][d][t].every((x) => x != null));
export const distDone = (q, d) => TEES.every((_, t) => teeDone(q, d, t));
export const quickDone = (q) => q.dists.every((d) => distDone(q, d));
/** Balls per player in this session. */
export const ballCount = (q) => ballsOf(q, q.players[0].id).length;

export function standings(q) {
  return q.players
    .map((p) => ({ ...p, total: playerScore(q, p.id, { partial: true }) ?? 0 }))
    .sort((a, b) => a.total - b.total);
}

/** Close the session: lowest total wins; a tie for the lead goes to the tie-breaker. */
export function finishQuick(q) {
  if (!quickDone(q)) throw new Error('Not every ball is scored');
  const s = standings(q);
  const tied = s.filter((p) => p.total === s[0].total).map((p) => p.id);
  if (tied.length > 1) {
    q.status = 'tiebreak';
    q.tiedIds = tied;
    q.tieTosses = 1;
  } else {
    q.status = 'done';
    q.winnerId = tied[0];
  }
}

export function retossQuick(q) {
  if (q.status !== 'tiebreak') throw new Error('No tie-breaker in progress');
  q.tieTosses += 1;
}

export function setQuickWinner(q, pid) {
  if (q.status !== 'tiebreak' || !q.tiedIds.includes(pid)) throw new Error('Not in the tie-breaker');
  q.winnerId = pid;
  q.status = 'done';
}

/** Putts from finished Compass sessions, for a player's profile stats. */
export function quickStats(sessions, ids) {
  ids = [].concat(ids);
  const byDist = Object.fromEntries(Object.keys(DISTANCES).map((k) => [k, [0, 0]]));
  const out = { sessions: 0, wins: 0, balls: 0, threePlus: 0, byDist };
  for (const raw of sessions) {
    const q = normalizeQuick(raw);
    const me = q.players.find((p) => ids.includes(p.id));
    if (q.status !== 'done' || !me) continue;
    out.sessions++;
    if (q.players.length > 1 && q.winnerId === me.id) out.wins++;
    for (const d of q.dists) {
      for (const p of q.tees[me.id][d].flat()) {
        out.balls++;
        byDist[d][1]++;
        if (p === 1) byDist[d][0]++;
        if (p >= 3) out.threePlus++;
      }
    }
  }
  return out;
}
