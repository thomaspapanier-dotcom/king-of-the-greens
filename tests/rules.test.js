import * as R from '../js/rules.js';
import { applyOp } from '../js/ops.js';
import * as Q from '../js/quick.js';
import * as L from '../js/lag.js';
import * as RK from '../js/ranked.js';
import * as WR from '../js/winrate.js';

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, msg: e.message });
  }
}
function eq(a, b, msg = '') {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A !== B) throw new Error(`${msg} expected ${B}, got ${A}`);
}
function throws(fn, msg) {
  try { fn(); } catch { return; }
  throw new Error(`expected throw: ${msg}`);
}

const P = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));
const balls = (...putts) => ({ mode: 'balls', balls: putts, score: null });
const quick = (score) => ({ mode: 'quick', balls: [null, null, null], score });

/** Fill the current stage so each player's sets score the given totals (via quick entry). */
function fillStage(game, perPlayer) {
  const idx = R.currentStageIdx(game);
  const st = game.stages[idx];
  for (const [pid, sets] of Object.entries(perPlayer)) st.entries[pid] = sets.map((s) => (typeof s === 'number' ? quick(s) : s));
}
function playStage(game, perPlayer) {
  fillStage(game, perPlayer);
  R.finishStage(game);
}

// ---- Ball and set scoring ----
test('birdie ball: 1 putt −1, 2 putts E, 3 putts +1', () => {
  eq([1, 2, 3].map((n) => R.ballScore('birdie', n)), [-1, 0, 1]);
});
test('par ball: 1 putt E, 2 putts +1, 3 putts +2', () => {
  eq([1, 2, 3].map((n) => R.ballScore('par', n)), [0, 1, 2]);
});
test('eagle ball: 1 putt −2, 2 putts −1, 3 putts E, 4 putts +1', () => {
  eq([1, 2, 3, 4].map((n) => R.ballScore('eagle', n)), [-2, -1, 0, 1]);
});
test('rules doc examples: both birdies + par = −2, one birdie + par = −1', () => {
  eq(R.setScore(balls(1, 1, 1)), -2);
  eq(R.setScore(balls(1, 2, 1)), -1);
});
test('missed par then made = +1; missed everything then cleaned up = +1', () => {
  eq(R.setScore(balls(2, 2, 2)), 1);
  eq(R.setScore(balls(1, 1, 2)), -1);
});
test('no pick-ups: large putt counts still score', () => {
  eq(R.setScore(balls(5, 4, 6)), 3 + 2 + 5);
});
test('incomplete set is null; quick entry is used as-is', () => {
  eq(R.setScore(balls(1, null, 1)), null);
  eq(R.setScore(quick(-1)), -1);
  eq(R.setScore(quick(null)), null);
});
test('minimum set scores', () => {
  eq(R.minSetScore(R.STAGE_BY_ID['1N']), -2);
  eq(R.minSetScore(R.STAGE_BY_ID['7E']), -6);
});

/** Play every round of a game; `scores(def)` returns each player's set scores for that round. */
function playGame(g, scores) {
  R.stagesFor(g).forEach((def, i) => {
    if (i) R.startNextStage(g);
    playStage(g, scores(def, i));
  });
}

// ---- Game formats ----
test('standard game: 7 rounds, Short R2, Medium R4, Long R6, Eagle last (R7)', () => {
  const g = R.createGame({ id: 'g', players: P(2) });
  eq(g.format, 'standard');
  eq(R.stagesFor(g).map((s) => [s.num, s.kind, s.sets.join('')]), [
    [1, 'normal', 'SML'], [2, 'special', 'SSS'], [3, 'normal', 'SML'], [4, 'special', 'MMM'],
    [5, 'normal', 'SML'], [6, 'special', 'LLL'], [7, 'eagle', ''],
  ]);
  eq(R.roundsIn(g), 7);
});
test('games saved before formats keep their old layout (Eagle between 7 and 8)', () => {
  const old = { players: P(1), stages: [] }; // no format field
  eq(R.stagesFor(old).map((s) => s.id), ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'EAGLE', 'R8', 'R9']);
  eq(R.STAGE_BY_ID.R3.sets, ['S', 'S', 'S']);
});
test('unknown format is rejected', () => {
  throws(() => R.createGame({ id: 'g', players: P(2), format: 'mega' }), 'bad format');
});
test('distances follow the rules doc', () => {
  eq([R.DISTANCES.S.range, R.DISTANCES.M.range, R.DISTANCES.L.range], ['3–5 ft', '6–9 ft', '10–15 ft']);
});

// ---- Game flow ----
test('regular games are 1–3 players; a foursome plays co-op', () => {
  throws(() => R.createGame({ id: 'g', players: [] }), '0 players');
  throws(() => R.createGame({ id: 'g', players: P(4) }), '4 players without co-op');
  R.createGame({ id: 'g', players: P(3) });
  throws(() => R.createGame({ id: 'g', teams: [P(3), P(1)] }), 'uneven teams');
});
test('solo game skips the toss', () => {
  const g = R.createGame({ id: 'g', players: P(1) });
  eq(g.status, 'playing');
  eq(g.stages[0].kingId, 'p1');
});
test('toss: closest is KOG for R1, furthest putts first', () => {
  const g = R.createGame({ id: 'g', players: P(3) });
  eq(g.status, 'toss');
  R.applyToss(g, ['p2', 'p3', 'p1']); // p2 closest, p1 furthest
  eq(g.stages[0].kingId, 'p2');
  eq(g.stages[0].order, ['p1', 'p3', 'p2']);
});
test('tee flip: two players, the tee picks the KOG and the other putts first', () => {
  const g = R.createGame({ id: 'g', players: P(2) });
  R.applyTeeFlip(g, 'p2');
  eq([g.status, g.stages[0].kingId, g.stages[0].order], ['playing', 'p2', ['p1', 'p2']]);
});
test('tee flip: three players, a second flip picks who putts first', () => {
  const g = R.createGame({ id: 'g', players: P(3) });
  R.applyTeeFlip(g, 'p1', 'p3');
  eq([g.stages[0].kingId, g.stages[0].order], ['p1', ['p3', 'p2', 'p1']]);
  throws(() => R.applyTeeFlip(R.createGame({ id: 'g', players: P(3) }), 'p1'), 'needs who putts first');
  throws(() => R.applyTeeFlip(R.createGame({ id: 'g', players: P(3) }), 'p1', 'p1'), 'KOG cannot putt first');
  throws(() => R.applyTeeFlip(R.createGame({ id: 'g', players: P(2) }), 'zz'), 'not a player');
});
test('ops: tee flip syncs, and only once', () => {
  const g = R.createGame({ id: 'g', players: P(2) });
  eq(applyOp(g, { type: 'flip', king: 'p1' }), true);
  eq(applyOp(g, { type: 'flip', king: 'p2' }), false);
  eq(g.stages[0].kingId, 'p1');
});
test('toss must rank everyone once', () => {
  const g = R.createGame({ id: 'g', players: P(3) });
  throws(() => R.applyToss(g, ['p1', 'p2']), 'missing player');
  throws(() => R.applyToss(g, ['p1', 'p1', 'p2']), 'duplicate');
});
test('cannot finish a stage until everyone is done', () => {
  const g = R.createGame({ id: 'g', players: P(2) });
  R.applyToss(g, ['p1', 'p2']);
  fillStage(g, { p1: [0, 0, 0] });
  throws(() => R.finishStage(g), 'p2 not done');
});
test('outright low round score becomes KOG', () => {
  const g = R.createGame({ id: 'g', players: P(3) });
  R.applyToss(g, ['p1', 'p2', 'p3']);
  playStage(g, { p1: [0, 0, 0], p2: [-1, 0, 0], p3: [1, 0, 0] });
  eq(g.stages[0].result.nextKingId, 'p2');
  eq(g.stages[0].result.kingKept, false);
});
test('tie for low: current KOG sets again (even if not in the tie)', () => {
  const g = R.createGame({ id: 'g', players: P(3) });
  R.applyToss(g, ['p1', 'p2', 'p3']); // p1 KOG
  playStage(g, { p1: [1, 0, 0], p2: [-1, 0, 0], p3: [-1, 0, 0] });
  eq(g.stages[0].result.nextKingId, 'p1');
  eq(g.stages[0].result.kingKept, true);
});
test('rounds 2+: the leader (lowest total) putts first, ties keep previous order', () => {
  const g = R.createGame({ id: 'g', players: P(3) });
  R.applyToss(g, ['p1', 'p2', 'p3']); // order p3, p2, p1
  playStage(g, { p1: [-1, 0, 0], p2: [1, 0, 0], p3: [1, 0, 0] });
  R.startNextStage(g);
  eq(g.stages[1].order, ['p1', 'p3', 'p2']);
  eq(g.stages[1].kingId, 'p1');
});
test('eagle round is last: leader putts first and it can decide the game', () => {
  const g = R.createGame({ id: 'g', players: P(3) });
  R.applyToss(g, ['p1', 'p2', 'p3']);
  // R1: p1 −2, p2 +1, p3 0; R2–R6 all even
  playStage(g, { p1: [-1, -1, 0], p2: [1, 0, 0], p3: [0, 0, 0] });
  for (let i = 1; i < 6; i++) {
    R.startNextStage(g);
    playStage(g, { p1: [0, 0, 0], p2: [0, 0, 0], p3: [0, 0, 0] });
  }
  R.startNextStage(g);
  eq(R.stageDef(g.stages[6]).kind, 'eagle');
  eq(g.stages[6].order, ['p1', 'p3', 'p2']);
  playStage(g, { p1: [balls(2, 2, 2)], p2: [balls(1, 1, 1)], p3: [balls(3, 3, 3)] }); // −3, −6, 0
  eq(g.stages[6].result.scores, { p1: -3, p2: -6, p3: 0 });
  // p2 came from +1 to −5 and wins on the last round
  eq(R.totals(g), { p1: -5, p2: -5, p3: 0 });
  eq(g.status, 'puttoff');
  eq(g.tiedIds, ['p1', 'p2']);
});
test('full standard game: lowest total wins; eagle counts toward total', () => {
  const g = R.createGame({ id: 'g', players: P(2) });
  R.applyToss(g, ['p1', 'p2']);
  playGame(g, (def) => (def.kind === 'eagle' ? { p1: [0], p2: [-3] } : { p1: [-1, 0, 0], p2: [0, 0, 0] }));
  eq(g.stages.length, 7);
  eq(R.totals(g), { p1: -6, p2: -3 });
  eq(g.status, 'done');
  eq(g.winnerId, 'p1');
});
test('final tie goes to a putt-off', () => {
  const g = R.createGame({ id: 'g', players: P(3) });
  R.applyToss(g, ['p1', 'p2', 'p3']);
  playGame(g, (def) => (def.kind === 'eagle' ? { p1: [0], p2: [0], p3: [0] } : { p1: [0, 0, 0], p2: [0, 0, 0], p3: [1, 0, 0] }));
  eq(g.status, 'puttoff');
  eq(g.tiedIds, ['p1', 'p2']);
  throws(() => R.setPuttOffWinner(g, 'p3'), 'p3 not tied');
  R.setPuttOffWinner(g, 'p2');
  eq([g.status, g.winnerId, g.puttOff], ['done', 'p2', true]);
});
test('reopen a finished stage to fix a score', () => {
  const g = R.createGame({ id: 'g', players: P(2) });
  R.applyToss(g, ['p1', 'p2']);
  playStage(g, { p1: [0, 0, 0], p2: [-1, 0, 0] });
  R.reopenStage(g);
  eq([g.status, g.stages[0].result], ['playing', null]);
  playStage(g, { p1: [-2, 0, 0], p2: [-1, 0, 0] });
  eq(g.stages[0].result.nextKingId, 'p1');
});
test('formatScore', () => {
  eq([-2, 0, 3, null].map(R.formatScore), ['−2', 'E', '+3', '–']);
});

// ---- Stats ----
test('stats: make % by distance, eagle %, wins, KOG rounds', () => {
  const g = R.createGame({ id: 'g', players: P(2) });
  R.applyToss(g, ['p1', 'p2']);
  playGame(g, (def) =>
    def.kind === 'eagle'
      ? { p1: [balls(1, 2, 3)], p2: [balls(3, 3, 3)] }
      : { p1: def.sets.map(() => balls(1, 2, 1)), p2: def.sets.map(() => quick(0)) },
  );
  const s = R.playerStats([g], 'p1');
  eq([s.games, s.wins], [1, 1]);
  // 3 normal rounds × 1 Short set + the Short round × 3 = 6 Short sets: 12 birdie balls, 6 par balls
  eq(s.byDist.S.birdie, [6, 12]);
  eq(s.byDist.S.par, [6, 6]);
  eq(s.byDist.L.birdie, [6, 12]);
  eq(s.byDist.M.avgSet, -1);
  eq(s.eagle, [1, 3]);
  eq([s.kingRounds, s.roundWins, s.threePlus, s.balls], [7, 7, 1, 57]);
  // Quick-entered sets count toward totals but not ball stats
  const s2 = R.playerStats([g], 'p2');
  eq([s2.games, s2.wins, s2.byDist.S.birdie, s2.byDist.S.avgSet], [1, 0, [0, 0], 0]);
});

test('stats still read games saved in the old layout', () => {
  const g = R.createGame({ id: 'g', players: P(1) });
  delete g.format; // looks like a game saved before formats existed
  g.stages = [];
  R.applyToss(g, ['p1']);
  playGame(g, (def) => ({ p1: def.kind === 'eagle' ? [balls(1, 1, 1)] : def.sets.map(() => balls(1, 1, 1)) }));
  eq(g.stages.length, 10);
  const s = R.playerStats([g], 'p1');
  eq([s.games, s.eagle, s.byDist.S.birdie], [1, [3, 3], [18, 18]]);
});

test('stats follow a person across ids (alias from a joined game)', () => {
  const g = R.createGame({ id: 'g', players: [{ id: 'remote-tom', name: 'Tom' }] });
  playGame(g, (def) => ({ 'remote-tom': def.kind === 'eagle' ? [0] : [0, 0, 0] }));
  eq(R.playerStats([g], 'local-tom').games, 0);
  eq(R.playerStats([g], ['local-tom', 'remote-tom']).games, 1);
});


// ---- Co-op (2 vs 2) ----
const FOUR = [{ id: 'a', name: 'Ann' }, { id: 'b', name: 'Bo' }, { id: 'c', name: 'Cy' }, { id: 'd', name: 'Di' }];
const coopGame = () => R.createGame({ id: 'g', teams: [[FOUR[0], FOUR[1]], [FOUR[2], FOUR[3]]] });
test('tee flip: co-op, the tee points at a team; the other team putts first', () => {
  const g = coopGame();
  R.applyTeeFlip(g, 'team2');
  eq([g.stages[0].kingId, g.stages[0].order], ['team2', ['team1', 'team2']]);
});
test('co-op: two teams play as two units named after their players', () => {
  const g = coopGame();
  eq(g.players, [{ id: 'team1', name: 'Ann & Bo' }, { id: 'team2', name: 'Cy & Di' }]);
  eq(R.people(g).map((p) => p.id), ['a', 'b', 'c', 'd']);
  eq([R.unitOf(g, 'c'), R.unitOf(g, 'b')], ['team2', 'team1']);
});
test('co-op toss: closest player’s team is KOG, furthest player’s team putts first', () => {
  let g = coopGame();
  R.applyToss(g, ['a', 'c', 'b', 'd']); // Ann closest (team1), Di furthest (team2)
  eq([g.stages[0].kingId, g.stages[0].order], ['team1', ['team2', 'team1']]);
  g = coopGame();
  R.applyToss(g, ['a', 'c', 'd', 'b']); // closest and furthest both team1
  eq([g.stages[0].kingId, g.stages[0].order], ['team1', ['team1', 'team2']]);
  throws(() => R.applyToss(coopGame(), ['team1', 'team2']), 'teams are not people');
});
test('co-op balls: birdie 1 = A, birdie 2 = B, par ball alternates; Eagle round 4 balls, 2 each', () => {
  const g = coopGame();
  const owners = (si) => [0, 1, 2].map((k) => [0, 1, 2].map((j) => R.ballOwner(g, si, 'team1', k, j)).join(''));
  eq(owners(0), ['aba', 'abb', 'aba']); // Round 1: par ball A, B, A
  eq(owners(1), ['abb', 'aba', 'abb']); // Round 2 starts with B
  eq([0, 1, 2, 3].map((j) => R.ballOwner(g, 6, 'team1', 0, j)), ['a', 'b', 'a', 'b']); // Eagle: two each
});
test('co-op stats credit each ball to the teammate who putted it', () => {
  const g = coopGame();
  R.applyToss(g, ['a', 'c', 'b', 'd']);
  playGame(g, (def) => {
    const sets = def.kind === 'eagle' ? [balls(1, 2, 1, 2)] : def.sets.map(() => balls(1, 2, 1));
    return { team1: sets, team2: sets.map(() => quick(0)) };
  });
  const ann = R.playerStats([g], 'a');
  const bo = R.playerStats([g], 'b');
  eq([ann.games, ann.wins, bo.games, bo.wins], [1, 1, 1, 1]);
  eq(ann.balls + bo.balls, 18 * 3 + 4); // every ball credited once (4 Eagle balls)
  eq(ann.byDist.S.birdie, [6, 6]); // Ann always has birdie ball 1, which always dropped
  eq(bo.byDist.S.birdie, [0, 6]); // Bo’s birdie ball 2 always took 2 putts
  eq([ann.eagle, bo.eagle], [[2, 2], [0, 2]]); // two Eagle putts each
  eq(R.playerStats([g], 'c').byDist.S.birdie, [0, 0]); // typed-in scores: no ball credit
});

test('co-op Eagle round: 4 balls per team, scored and finished like any set', () => {
  const g = coopGame();
  R.applyToss(g, ['a', 'c', 'b', 'd']);
  for (let i = 0; i < 6; i++) {
    if (i) R.startNextStage(g);
    playStage(g, { team1: [0, 0, 0], team2: [0, 0, 0] });
  }
  R.startNextStage(g);
  eq(g.stages[6].entries.team1[0].balls.length, 4);
  eq(R.minSetScore(R.stageDef(g.stages[6]), 4), -8);
  playStage(g, { team1: [balls(1, 1, 1, 1)], team2: [balls(2, 2, 2, 3)] }); // −8 vs −3
  eq([g.status, g.winnerId], ['done', 'team1']);
});
test('regular Eagle round stays 3 balls', () => {
  const g = R.createGame({ id: 'g', players: P(1) });
  for (let i = 0; i < 6; i++) {
    if (i) R.startNextStage(g);
    playStage(g, { p1: [0, 0, 0] });
  }
  R.startNextStage(g);
  eq(g.stages[6].entries.p1[0].balls.length, 3);
});

// ---- Tie-breaker ----
test('tie-breaker: toss again until there’s a winner; tosses are counted', () => {
  const g = R.createGame({ id: 'g', players: P(2) });
  R.applyToss(g, ['p1', 'p2']);
  playGame(g, (def) => (def.kind === 'eagle' ? { p1: [0], p2: [0] } : { p1: [0, 0, 0], p2: [0, 0, 0] }));
  eq([g.status, g.tieTosses], ['puttoff', 1]);
  R.retossTiebreak(g);
  R.retossTiebreak(g);
  eq(g.tieTosses, 3);
  R.setPuttOffWinner(g, 'p2');
  eq([g.status, g.winnerId, g.puttOff, g.tieTosses], ['done', 'p2', true, 3]);
  throws(() => R.retossTiebreak(g), 'game already decided');
});
test('tie-breaker re-toss travels as a live-sync op', () => {
  const g = R.createGame({ id: 'g', players: P(2) });
  R.applyToss(g, ['p1', 'p2']);
  eq(applyOp(g, { type: 'retoss' }), false); // no tie yet
  playGame(g, (def) => (def.kind === 'eagle' ? { p1: [0], p2: [0] } : { p1: [0, 0, 0], p2: [0, 0, 0] }));
  eq(applyOp(g, { type: 'retoss' }), true);
  eq(g.tieTosses, 2);
});

// ---- Quick Play: Compass ----
const TOM = { id: 'p1', name: 'Tom' };
const ANN = { id: 'p2', name: 'Ann' };
const CY = { id: 'p3', name: 'Cy' };
test('compass solo: 4 tees × 3 balls per distance, every ball a birdie ball', () => {
  const q = Q.createQuick({ id: 'q', players: [TOM], dists: ['L', 'S'] });
  eq([q.dists, q.status, q.order], [['S', 'L'], 'playing', ['p1']]);
  eq(Q.ballCount(q), 24);
  q.tees.p1.S.forEach((tee) => tee.fill(1)); // all 12 short putts drop
  eq(Q.distScore(q, 'p1', 'S'), -12);
  eq(Q.playerScore(q, 'p1'), null); // Long not scored yet
  q.tees.p1.L.forEach((tee, t) => tee.fill(t === 0 ? 3 : 2)); // north three-putts, rest two-putt
  eq([Q.teeScore(q, 'p1', 'L', 0), Q.distScore(q, 'p1', 'L'), Q.playerScore(q, 'p1')], [3, 3, -9]);
  Q.finishQuick(q);
  eq([q.status, q.winnerId], ['done', 'p1']);
  throws(() => Q.createQuick({ id: 'x', players: [TOM], dists: [] }), 'no distance');
  throws(() => Q.createQuick({ id: 'x', players: [TOM, ANN, CY, { id: 'p4' }, { id: 'p5' }], dists: ['S'] }), '5 players');
});
test('compass head-to-head: toss sets first putter, order rotates every tee', () => {
  const q = Q.createQuick({ id: 'q', players: [TOM, ANN, CY], dists: ['S', 'M'] });
  eq(q.status, 'toss');
  Q.applyQuickToss(q, ['p2', 'p3', 'p1']); // Ann closest
  eq(q.status, 'playing');
  eq(Q.teeOrder(q, 'S', 0), ['p2', 'p3', 'p1']);
  eq(Q.teeOrder(q, 'S', 1), ['p3', 'p1', 'p2']);
  eq(Q.teeOrder(q, 'S', 2), ['p1', 'p2', 'p3']);
  eq(Q.teeOrder(q, 'M', 0), ['p3', 'p1', 'p2']); // keeps rotating across distances (tee #5)
});
test('compass head-to-head: lowest total wins, a tie goes to the toss tie-breaker', () => {
  let q = Q.createQuick({ id: 'q', players: [TOM, ANN], dists: ['S'] });
  Q.applyQuickToss(q, ['p1', 'p2']);
  q.tees.p1.S.forEach((tee) => tee.fill(1));
  q.tees.p2.S.forEach((tee) => tee.fill(2));
  Q.finishQuick(q);
  eq([q.status, q.winnerId], ['done', 'p1']);
  q = Q.createQuick({ id: 'q', players: [TOM, ANN, CY], dists: ['S'] });
  Q.applyQuickToss(q, ['p1', 'p2', 'p3']);
  q.tees.p1.S.forEach((tee) => tee.fill(1));
  q.tees.p2.S.forEach((tee) => tee.fill(1));
  q.tees.p3.S.forEach((tee) => tee.fill(2));
  Q.finishQuick(q);
  eq([q.status, q.tiedIds, q.tieTosses], ['tiebreak', ['p1', 'p2'], 1]);
  Q.retossQuick(q);
  throws(() => Q.setQuickWinner(q, 'p3'), 'p3 was not tied');
  Q.setQuickWinner(q, 'p2');
  eq([q.status, q.winnerId, q.tieTosses], ['done', 'p2', 2]);
});
test('compass putts count toward profile stats; old 4-ball solo sessions still read', () => {
  const q = Q.createQuick({ id: 'q', players: [TOM, ANN], dists: ['M'] });
  Q.applyQuickToss(q, ['p1', 'p2']);
  q.tees.p1.M.forEach((tee) => { tee[0] = 1; tee[1] = 2; tee[2] = 3; });
  q.tees.p2.M.forEach((tee) => tee.fill(2));
  q.tees.p2.M[0][0] = 3; // Ann +1, Tom E: Tom wins
  eq(Q.quickStats([q], 'p1').sessions, 0); // not finished yet
  Q.finishQuick(q);
  const s = Q.quickStats([q], 'p1');
  eq([s.sessions, s.wins, s.balls, s.byDist.M, s.threePlus], [1, 1, 12, [4, 12], 4]);
  eq(Q.quickStats([q], 'p2').wins, 0);
  const old = { id: 'o', player: TOM, dists: ['S'], tees: { S: [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]] }, status: 'done' };
  eq(Q.quickStats([old], 'p1').byDist.S, [16, 16]);
  eq(Q.playerScore(Q.normalizeQuick(old), 'p1'), -16);
});

// ---- Lag 21 ----
const mark = (lag, side, vals) => { L.currentFrame(lag).balls[side] = [...vals]; };
test('lag: cancellation scoring, scorer putts first next frame, a wash keeps the order', () => {
  const lag = L.createLag({ id: 'l', sides: [[TOM], [ANN]] });
  eq(lag.status, 'first');
  L.chooseFirst(lag, 'side2');
  mark(lag, 'side1', [3, 2, 0, 1]); // 6
  mark(lag, 'side2', [2, 1, 1, 0]); // 4
  eq(L.frameResult(lag, L.currentFrame(lag)), { scorer: 'side1', points: 2, raw: [6, 4] });
  L.finishFrame(lag);
  eq(L.scores(lag), { side1: 2, side2: 0 });
  eq(L.currentFrame(lag).first, 'side1'); // scorer goes first
  mark(lag, 'side1', [1, 1, 0, 0]);
  mark(lag, 'side2', [2, 0, 0, 0]);
  L.finishFrame(lag); // wash
  eq([L.scores(lag), L.currentFrame(lag).first], [{ side1: 2, side2: 0 }, 'side1']);
});
test('lag: first to 21 wins; the last frame can be fixed', () => {
  const lag = L.createLag({ id: 'l', sides: [[TOM], [ANN]] });
  L.chooseFirst(lag, 'side1');
  for (let i = 0; i < 2; i++) { mark(lag, 'side1', [3, 3, 3, 3]); mark(lag, 'side2', [0, 0, 0, 0]); L.finishFrame(lag); }
  eq([L.scores(lag).side1, lag.status], [24, 'done']);
  eq(lag.winnerId, 'side1');
  L.reopenFrame(lag);
  eq([lag.status, lag.winnerId, L.scores(lag).side1], ['playing', null, 12]);
  mark(lag, 'side2', [3, 3, 3, 3]); // wash instead
  L.finishFrame(lag);
  eq([lag.status, L.scores(lag)], ['playing', { side1: 12, side2: 0 }]);
});
test('lag 2 v 2: sides alternate ball by ball, teammates alternate within a side', () => {
  const lag = L.createLag({ id: 'l', sides: [[TOM, ANN], [CY, { id: 'p4', name: 'Di' }]] });
  eq(lag.sides.map((x) => x.name), ['Tom & Ann', 'Cy & Di']);
  L.chooseFirst(lag, 'side2');
  eq(L.putOrder(lag, L.currentFrame(lag)).map((o) => o.player.name), ['Cy', 'Tom', 'Di', 'Ann', 'Cy', 'Tom', 'Di', 'Ann']);
  throws(() => L.createLag({ id: 'x', sides: [[TOM], [ANN, CY]] }), 'uneven sides');
});
test('lag record: wins and holed putts per player', () => {
  const lag = L.createLag({ id: 'l', sides: [[TOM, ANN], [CY, { id: 'p4', name: 'Di' }]] });
  L.chooseFirst(lag, 'side1');
  mark(lag, 'side1', [3, 0, 3, 3]); mark(lag, 'side2', [0, 0, 0, 0]); L.finishFrame(lag); // 9
  mark(lag, 'side1', [3, 3, 3, 3]); mark(lag, 'side2', [0, 0, 0, 0]); L.finishFrame(lag); // 21
  eq(lag.status, 'done');
  eq(L.lagStats([lag], 'p1'), { games: 1, wins: 1, balls: 4, holed: 4 }); // Tom: balls 1 and 3
  eq(L.lagStats([lag], 'p2'), { games: 1, wins: 1, balls: 4, holed: 3 }); // Ann: balls 2 and 4
  eq(L.lagStats([lag], 'p3').wins, 0);
});

// ---- Ranked ----
test('ranked ladder: 31 ranks, Copper V lowest, Diamond I, then Putt Master on top', () => {
  eq(RK.RANKS.length, 31);
  eq([RK.RANKS[0].name, RK.RANKS[29].name, RK.RANKS[30].name], ['Copper V', 'Diamond I', 'Putt Master']);
  eq([RK.RANKS[30].balls, RK.RANKS[30].min, RK.RANKS[29].max], [0, 2060, 2059]);
  eq([RK.RANKS[0].balls, RK.RANKS[4].balls, RK.RANKS[13].name, RK.RANKS[13].balls], [5, 1, 'Silver II', 2]);
  eq([RK.rankFor(0).name, RK.rankFor(899).name, RK.rankFor(900).name, RK.rankFor(2059).name, RK.rankFor(5000).name], ['Copper V', 'Copper V', 'Copper IV', 'Diamond I', 'Putt Master']);
  eq(RK.rankFor(RK.START_MMR).name, 'Silver I');
});
test('ranked: beating a higher rank gains more; losing to a lower rank costs more', () => {
  const placed = (mmr) => ({ mmr, games: 40, rankIndex: RK.rankFor(mmr).index });
  const [even] = RK.rate1v1(placed(1500), placed(1500), 1);
  const [upset] = RK.rate1v1(placed(1500), placed(1800), 1);
  const [expectedWin] = RK.rate1v1(placed(1800), placed(1500), 1);
  eq([even.change, upset.change > even.change, expectedWin.change < even.change], [16, true, true]);
  const [, favouriteLoses] = RK.rate1v1(placed(1500), placed(1800), 1);
  eq(favouriteLoses.change < -even.change, true); // the higher rank loses more than 16
});
test('ranked placements: unranked for 10 matches, big swings, then a rank appears', () => {
  let me = RK.newRating();
  const opp = { mmr: 1450, games: 40, rankIndex: RK.rankFor(1450).index };
  let firstChange = null;
  for (let i = 0; i < 9; i++) {
    [me] = RK.rate1v1(me, opp, 1);
    if (firstChange === null) firstChange = me.change;
    eq(me.rankIndex, null);
  }
  eq(firstChange, 32); // placement K is double the settled K (an even match is worth 32, not 16)
  [me] = RK.rate1v1(me, opp, 1);
  eq([me.games, RK.isPlaced(me), me.rankIndex != null], [10, true, true]);
});
test('ranked: no flip-flopping at a division edge (15 MMR buffer)', () => {
  const gold5 = RK.RANKS.find((r) => r.name === 'Gold V');
  eq(RK.displayedRank(gold5.index, gold5.min - 10).name, 'Gold V');
  eq(RK.displayedRank(gold5.index, gold5.min - 16).name, 'Silver I');
  eq(RK.displayedRank(gold5.index - 1, gold5.min).name, 'Gold V'); // promotion is immediate
});
test('ranked: free-for-all, teams, repeat opponents and bailing', () => {
  const r = (mmr) => ({ mmr, games: 40, rankIndex: RK.rankFor(mmr).index });
  const ffa = RK.rateFreeForAll([r(1500), r(1500), r(1500)], [1, 2, 3]);
  eq(ffa.map((x) => x.change), [16, 0, -16]);
  const [ta, tb] = RK.rateTeams([r(1400), r(1600)], [r(1500), r(1500)], 1);
  eq([ta[0].change, ta[1].change, tb[0].change], [20, 12, -16]); // weaker teammate gains more
  const [first] = RK.rate1v1(r(1500), r(1500), 1, { repeats: 0 });
  const [third] = RK.rate1v1(r(1500), r(1500), 1, { repeats: 2 });
  eq([first.change, third.change], [16, 4]);
  const b = RK.bail(r(1500));
  eq([b.mmr, b.games], [1500 - RK.BAIL_PENALTY, 40]);
  eq(RK.seasonReset(r(1850)), { mmr: 1650, games: 7, rankIndex: null });
});

test('ranked duos: both lose, the higher-ranked teammate loses more (your example)', () => {
  const at = (name) => { const rk = RK.RANKS.find((x) => x.name === name); return { mmr: rk.min + 20, games: 40, rankIndex: rk.index }; };
  // Team 1: Silver III + Platinum IV, Team 2: Copper III + Bronze II; Team 2 wins.
  const [t1, t2] = RK.rateTeams([at('Silver III'), at('Platinum IV')], [at('Copper III'), at('Bronze II')], 0);
  eq(t1.every((x) => x.change < 0), true);
  eq(t1[1].change < t1[0].change, true); // Platinum loses more than Silver
  eq(t2.every((x) => x.change > 0), true);
  eq(t2[0].change > t2[1].change, true); // the lower-ranked winner (Copper) gains the most
});
test('ranked duos: all four must be verified, any ranks can team up', () => {
  const v = (tag, ok = true) => ({ gamertag: tag, phone_verified: ok });
  eq(RK.rankedEligible([v('a'), v('b'), v('c'), v('d')], 'duos'), { ok: true });
  eq(RK.rankedEligible([v('a'), v('b'), v('c', false), v('d')], 'duos').reason, 'Not verified yet: c.');
  eq(RK.rankedEligible([v('a'), v('b'), v('c')], 'duos').ok, false);
});

// ---- Win % golf balls ----
test('win % ball: unrated under 10 ranked matches, then colored by lifetime ranked win %', () => {
  eq(WR.levelFor(9, 9).key, 'unrated'); // 100% but only 9 matches
  eq(WR.levelFor(4, 10).key, 'unrated'); // 40%: below the first color
  eq(WR.levelFor(48, 100).key, 'blue');
  eq(WR.levelFor(50, 100).key, 'teal');
  eq(WR.levelFor(57, 100).key, 'yellow');
  eq(WR.levelFor(61, 100).key, 'orange');
  eq(WR.levelFor(64, 100).key, 'red');
  eq(WR.levelFor(65, 100).key, 'magenta');
  eq(WR.levelFor(90, 100).key, 'magenta');
  eq(WR.LEVELS.map((l) => l.min), [null, 48, 50, 52, 54, 56, 58, 60, 62, 65]);
});

// ---- Ops (live sync) ----
const clone = (o) => JSON.parse(JSON.stringify(o));
function liveGame() {
  const g = R.createGame({ id: 'g', players: P(2) });
  applyOp(g, { type: 'toss', ranking: ['p1', 'p2'] });
  return g;
}
test('ops: two phones scoring different players merge in either order', () => {
  const base = liveGame();
  const a = { type: 'ball', stage: 0, pid: 'p1', k: 0, j: 0, putts: 1 };
  const b = { type: 'quick', stage: 0, pid: 'p2', k: 1, score: -1 };
  const x = clone(base), y = clone(base);
  applyOp(x, a); applyOp(x, b);
  applyOp(y, b); applyOp(y, a);
  eq(x, y);
  eq(R.setScore(x.stages[0].entries.p2[1]), -1);
});
test('ops: second "finish round" from another phone is ignored', () => {
  const g = liveGame();
  fillStage(g, { p1: [0, 0, 0], p2: [-1, 0, 0] });
  eq(applyOp(g, { type: 'finish', stage: 0 }), true);
  eq(applyOp(g, { type: 'finish', stage: 0 }), false);
  eq(applyOp(g, { type: 'next', stage: 0 }), true);
  eq(applyOp(g, { type: 'next', stage: 0 }), false);
  eq(g.stages.length, 2);
});
test('ops: a late tap on a finished round is dropped, not applied', () => {
  const g = liveGame();
  fillStage(g, { p1: [0, 0, 0], p2: [-1, 0, 0] });
  applyOp(g, { type: 'finish', stage: 0 });
  const before = JSON.stringify(g);
  eq(applyOp(g, { type: 'ball', stage: 0, pid: 'p1', k: 0, j: 0, putts: 3 }), false);
  eq(JSON.stringify(g), before);
});
test('ops: invalid op leaves the game untouched', () => {
  const g = R.createGame({ id: 'g', players: P(2) });
  const before = JSON.stringify(g);
  eq(applyOp(g, { type: 'toss', ranking: ['p1'] }), false);
  eq(applyOp(g, { type: 'nope' }), false);
  eq(JSON.stringify(g), before);
});
test('ops: switching to typed-in score keeps the ball-by-ball total', () => {
  const g = liveGame();
  [1, 2, 1].forEach((putts, j) => applyOp(g, { type: 'ball', stage: 0, pid: 'p1', k: 0, j, putts }));
  applyOp(g, { type: 'mode', stage: 0, pid: 'p1', k: 0, mode: 'quick' });
  eq(g.stages[0].entries.p1[0].score, -1);
});

const out = document.getElementById('out');
const failed = results.filter((r) => !r.ok);
out.innerHTML =
  `<h1 class="${failed.length ? 'bad' : 'good'}">${results.length - failed.length}/${results.length} passed</h1>` +
  results.map((r) => `<div class="${r.ok ? 'good' : 'bad'}">${r.ok ? '✓' : '✗'} ${r.name}${r.ok ? '' : ` — ${r.msg}`}</div>`).join('');
window.__testResults = { passed: results.length - failed.length, failed };
