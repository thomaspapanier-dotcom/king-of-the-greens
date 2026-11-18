// Lag 21 (working name): cornhole-style lag putting.
// Two sides (1 v 1 or 2 v 2) putt 4 balls each per frame from 25–35 ft, alternating.
// Each ball: holed = 3, within a putter grip of the hole = 2, within a putter length = 1.
// Only the difference scores each frame (cancellation). Knocking the other side's
// ball away is allowed. First to 21 wins. Whoever scored last putts first next frame.
export const GAME_NAME = 'Lag 21';
export const TARGET = 21;
export const BALLS = 4;
export const ZONES = [
  { v: 3, key: 'hole', label: 'Holed', short: 'In' },
  { v: 2, key: 'grip', label: 'Within a grip', short: 'Grip' },
  { v: 1, key: 'length', label: 'Within a putter', short: 'Putter' },
  { v: 0, key: 'out', label: 'Outside', short: 'Out' },
];

/** `sides` is two lists of players: [[A], [B]] or [[A, B], [C, D]]. */
export function createLag({ id, sides, date = new Date().toISOString() }) {
  if (sides.length !== 2 || sides[0].length !== sides[1].length || ![1, 2].includes(sides[0].length)) {
    throw new Error(`${GAME_NAME} is 1 v 1 or 2 v 2`);
  }
  return {
    v: 1,
    id,
    date,
    sides: sides.map((members, i) => ({
      id: `side${i + 1}`,
      name: members.map((m) => m.name).join(' & '),
      members: members.map((m) => ({ id: m.id, name: m.name })),
    })),
    frames: [],
    status: 'first', // who putts first is picked before frame 1
    winnerId: null,
  };
}

const other = (lag, sideId) => lag.sides.find((s) => s.id !== sideId).id;

function newFrame(lag, first) {
  lag.frames.push({ first, balls: Object.fromEntries(lag.sides.map((s) => [s.id, Array(BALLS).fill(null)])), done: false });
}

export function chooseFirst(lag, sideId) {
  if (lag.status !== 'first') throw new Error('Already started');
  newFrame(lag, sideId);
  lag.status = 'playing';
}

export const currentFrame = (lag) => lag.frames[lag.frames.length - 1];
export const sidePoints = (frame, sideId) => frame.balls[sideId].reduce((s, v) => s + (v || 0), 0);
export const frameComplete = (frame) => Object.values(frame.balls).every((b) => b.every((v) => v != null));

/** Cancellation: only the side with more points scores, and only the difference. */
export function frameResult(lag, frame) {
  const [a, b] = lag.sides.map((s) => sidePoints(frame, s.id));
  if (a === b) return { scorer: null, points: 0, raw: [a, b] };
  return { scorer: a > b ? lag.sides[0].id : lag.sides[1].id, points: Math.abs(a - b), raw: [a, b] };
}

export function scores(lag) {
  const out = Object.fromEntries(lag.sides.map((s) => [s.id, 0]));
  for (const f of lag.frames) {
    if (!f.done) continue;
    const r = frameResult(lag, f);
    if (r.scorer) out[r.scorer] += r.points;
  }
  return out;
}

/**
 * Putting order inside a frame: sides alternate ball by ball, starting with `first`.
 * In 2 v 2, teammates alternate their side's balls (ball 1 and 3 = first teammate).
 */
export function putOrder(lag, frame) {
  const order = [];
  const sides = [frame.first, other(lag, frame.first)];
  for (let j = 0; j < BALLS; j++) {
    for (const sid of sides) {
      const side = lag.sides.find((s) => s.id === sid);
      order.push({ side: sid, ball: j, player: side.members[j % side.members.length] });
    }
  }
  return order;
}

/** Score the frame; the game ends at 21+, otherwise the next frame starts. */
export function finishFrame(lag) {
  const f = currentFrame(lag);
  if (lag.status !== 'playing' || !frameComplete(f)) throw new Error('Mark every ball first');
  f.done = true;
  const totals = scores(lag);
  const leader = lag.sides.find((s) => totals[s.id] >= TARGET);
  if (leader) {
    lag.status = 'done';
    lag.winnerId = leader.id;
    return;
  }
  // Whoever scored putts first next; after a wash, the same side goes first again.
  const r = frameResult(lag, f);
  newFrame(lag, r.scorer || f.first);
}

/** Go back to the last scored frame to fix it. */
export function reopenFrame(lag) {
  const last = lag.frames[lag.frames.length - 1];
  if (lag.status === 'done') {
    last.done = false;
    lag.status = 'playing';
    lag.winnerId = null;
    return;
  }
  if (lag.frames.length < 2) throw new Error('No scored frame to fix');
  lag.frames.pop();
  lag.frames[lag.frames.length - 1].done = false;
}

/** Record for a player's profile. */
export function lagStats(games, ids) {
  ids = [].concat(ids);
  const out = { games: 0, wins: 0, balls: 0, holed: 0 };
  for (const g of games) {
    const side = g.sides.find((s) => s.members.some((m) => ids.includes(m.id)));
    if (!side || g.status !== 'done') continue;
    out.games++;
    if (g.winnerId === side.id) out.wins++;
    const me = side.members.findIndex((m) => ids.includes(m.id));
    for (const f of g.frames) {
      f.balls[side.id].forEach((v, j) => {
        if (j % side.members.length !== me || v == null) return;
        out.balls++;
        if (v === 3) out.holed++;
      });
    }
  }
  return out;
}
