// Every change to a game is an "op": a small piece of plain data.
// Ops can be queued while offline and replayed on top of other phones' changes,
// so two people scoring different players at the same moment never overwrite each other.
import * as R from './rules.js';

const entry = (g, op) => g.stages[op.stage]?.entries[op.pid]?.[op.k];
const scoringOpen = (g, op) => g.status === 'playing' && R.currentStageIdx(g) === op.stage;

const APPLY = {
  // Opening tee flip: who the tee pointed at (KOG for Round 1) and who putts first.
  flip: (g, op) => {
    if (g.status !== 'toss') return false;
    R.applyTeeFlip(g, op.king, op.first);
  },
  // Opening toss from older versions of the app: ranking is closest → furthest.
  toss: (g, op) => {
    if (g.status !== 'toss') return false;
    R.applyToss(g, op.ranking);
  },
  // Set one ball's putt count (null clears it).
  ball: (g, op) => {
    const e = entry(g, op);
    if (!e || !scoringOpen(g, op)) return false;
    e.mode = 'balls';
    e.balls[op.j] = op.putts;
  },
  // Switch a set between ball-by-ball and typed-in score.
  mode: (g, op) => {
    const e = entry(g, op);
    if (!e || !scoringOpen(g, op)) return false;
    if (op.mode === 'quick' && e.mode !== 'quick') e.score = R.setScore(e, R.ballTypes(R.stageDef(g.stages[op.stage])));
    e.mode = op.mode === 'quick' ? 'quick' : 'balls';
  },
  // Typed-in set score (null clears it).
  quick: (g, op) => {
    const e = entry(g, op);
    if (!e || !scoringOpen(g, op)) return false;
    e.mode = 'quick';
    e.score = op.score;
  },
  finish: (g, op) => {
    if (!scoringOpen(g, op)) return false;
    R.finishStage(g);
  },
  next: (g, op) => {
    if (g.status !== 'summary' || R.currentStageIdx(g) !== op.stage) return false;
    R.startNextStage(g);
  },
  reopen: (g, op) => {
    if (!['summary', 'puttoff', 'done'].includes(g.status) || R.currentStageIdx(g) !== op.stage) return false;
    R.reopenStage(g);
  },
  // Tie-breaker too close to call: toss again.
  retoss: (g) => {
    if (g.status !== 'puttoff') return false;
    R.retossTiebreak(g);
  },
  puttoff: (g, op) => {
    if (g.status !== 'puttoff') return false;
    R.setPuttOffWinner(g, op.pid);
  },
  // Ask to change a finished round, or to end the match; the other side votes from their own phone.
  request: (g, op) => {
    R.addRequest(g, op.req);
  },
  vote: (g, op) => {
    R.castVote(g, op.id, op.who, op.yes);
  },
  // Fix a set in a round opened by an approved change, then lock it again.
  fix: (g, op) => {
    R.fixSet(g, op.stage, op.pid, op.k, op.score);
  },
  relock: (g, op) => {
    R.relockStage(g, op.stage);
  },
};

/**
 * Apply an op to a game in place. Returns false (and leaves the game unchanged)
 * when the op no longer fits, e.g. another phone already finished that round.
 */
export function applyOp(game, op) {
  const fn = APPLY[op && op.type];
  if (!fn) return false;
  const before = JSON.stringify(game);
  try {
    if (fn(game, op) === false) return false;
    return true;
  } catch {
    // Roll back any partial change.
    const restored = JSON.parse(before);
    for (const k of Object.keys(game)) delete game[k];
    Object.assign(game, restored);
    return false;
  }
}
