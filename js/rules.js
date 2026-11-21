// King of the Greens (KOG) — rules engine.
// Pure functions over a plain, JSON-serializable game object, so the same
// engine can later run on a server (live sync) or inside a native app.

/** A regular game is 1–3 players. A foursome plays co-op: two teams of two. */
export const MAX_PLAYERS = 3;
export const COOP_PLAYERS = 4;

export const DISTANCES = {
  S: { key: 'S', name: 'Short', range: '3–5 ft', min: 3, max: 5 },
  M: { key: 'M', name: 'Medium', range: '6–9 ft', min: 6, max: 9 },
  L: { key: 'L', name: 'Long', range: '10–15 ft', min: 10, max: 15 },
};

// Round types. Ids are unique across formats so a saved game always maps back to the right round.
const normal = (n) => ({ id: `${n}N`, num: n, label: `Round ${n}`, col: `R${n}`, kind: 'normal', sets: ['S', 'M', 'L'] });
const special = (n, d) => ({ id: `${n}${d}`, num: n, label: `Round ${n}`, col: `R${n}`, kind: 'special', title: `${DISTANCES[d].name}-putt round`, sets: [d, d, d] });
const eagle = (n) => ({ id: `${n}E`, num: n, label: `Round ${n}`, col: `R${n}`, kind: 'eagle', title: 'Eagle round', sets: [null] });

// Games saved before formats existed: 9 rounds with the Eagle round between Rounds 7 and 8.
const legacyNormal = (n) => ({ ...normal(n), id: `R${n}` });
const legacySpecial = (n, d) => ({ ...special(n, d), id: `R${n}` });

export const FORMATS = {
  // The main game: the Eagle round comes last, so the lead can change right at the end.
  standard: {
    key: 'standard',
    name: 'Standard',
    rounds: 7,
    stages: [normal(1), special(2, 'S'), normal(3), special(4, 'M'), normal(5), special(6, 'L'), eagle(7)],
  },
  legacy: {
    key: 'legacy',
    name: 'Classic',
    rounds: 9,
    stages: [
      legacyNormal(1), legacyNormal(2), legacySpecial(3, 'S'), legacyNormal(4), legacyNormal(5), legacySpecial(6, 'M'), legacyNormal(7),
      { id: 'EAGLE', num: null, label: 'Eagle round', col: 'Eagle', kind: 'eagle', title: 'Eagle round', sets: [null] },
      legacyNormal(8), legacySpecial(9, 'L'),
    ],
  },
};
export const STAGE_BY_ID = Object.fromEntries(Object.values(FORMATS).flatMap((f) => f.stages.map((s) => [s.id, s])));

/** The rounds of this game, in play order. */
export const stagesFor = (game) => FORMATS[game.format || 'legacy'].stages;
/** How many numbered rounds this game has (for "Round 3 of 7"). */
export const roundsIn = (game) => FORMATS[game.format || 'legacy'].rounds;

// Ball types and the putt count that scores even (E) for each.
// Birdie ball: in on the 1st putt = −1, 2nd = E, 3rd = +1 …
// Par ball:    in on the 1st putt = E,  2nd = +1 …
// Eagle ball:  in on the 1st putt = −2, 2nd = −1, 3rd = E …
// No maximum and no pick-ups.
export const SET_BALLS = ['birdie', 'birdie', 'par'];
export const EAGLE_BALLS = ['eagle', 'eagle', 'eagle'];
const EVEN_AT = { birdie: 2, par: 1, eagle: 3 };

export function ballScore(type, putts) {
  return Number.isInteger(putts) && putts >= 1 ? putts - EVEN_AT[type] : null;
}

export function ballTypes(def) {
  return def.kind === 'eagle' ? EAGLE_BALLS : SET_BALLS;
}

/** Lowest possible score for one set of this stage (all balls in on the first putt). */
/** Ball type at position j. Extra balls repeat the last type (co-op's 4th Eagle ball). */
export const typeAt = (types, j) => types[Math.min(j, types.length - 1)];

/** Lowest possible score for a set (every ball in on the first putt). */
export function minSetScore(def, ballCount = ballTypes(def).length) {
  const types = ballTypes(def);
  let sum = 0;
  for (let j = 0; j < ballCount; j++) sum += ballScore(typeAt(types, j), 1);
  return sum;
}

/** Eagle balls per team: 3, or 4 in co-op so each teammate putts two. */
export const eagleBallCount = (game) => (game && game.teams ? 4 : 3);

// A set entry is either ball-by-ball ({mode:'balls', balls:[putts|null ×3]})
// or a typed-in set score ({mode:'quick', score}).
export function blankSet(balls = 3) {
  return { mode: 'balls', balls: Array(balls).fill(null), score: null };
}

export function setScore(entry, types = SET_BALLS) {
  if (!entry) return null;
  if (entry.mode === 'quick') return Number.isInteger(entry.score) ? entry.score : null;
  let sum = 0;
  for (let i = 0; i < entry.balls.length; i++) {
    const s = ballScore(typeAt(types, i), entry.balls[i]);
    if (s === null) return null;
    sum += s;
  }
  return sum;
}

function blankEntries(def, game) {
  return def.sets.map(() => blankSet(def.kind === 'eagle' ? eagleBallCount(game) : 3));
}

export function stageDef(stage) {
  return STAGE_BY_ID[stage.id];
}

/** A player's score for one stage. Null until every set is complete, unless partial. */
export function playerStageScore(game, stageIdx, pid, { partial = false } = {}) {
  const stage = game.stages[stageIdx];
  const def = stageDef(stage);
  const types = ballTypes(def);
  let sum = 0;
  let any = false;
  for (const entry of stage.entries[pid]) {
    const s = setScore(entry, types);
    if (s === null) {
      if (!partial) return null;
      continue;
    }
    sum += s;
    any = true;
  }
  return partial && !any ? null : sum;
}

export function playerDone(game, stageIdx, pid) {
  return playerStageScore(game, stageIdx, pid) !== null;
}

export function stageComplete(game, stageIdx) {
  return game.players.every((p) => playerDone(game, stageIdx, p.id));
}

/** Running totals (completed sets only) through the given stage index. */
export function totals(game, throughIdx = game.stages.length - 1) {
  const t = Object.fromEntries(game.players.map((p) => [p.id, 0]));
  for (let i = 0; i <= throughIdx && i < game.stages.length; i++) {
    for (const p of game.players) {
      const s = playerStageScore(game, i, p.id, { partial: true });
      if (s !== null) t[p.id] += s;
    }
  }
  return t;
}

export function standings(game) {
  const t = totals(game);
  return game.players.map((p) => ({ ...p, total: t[p.id] })).sort((a, b) => a.total - b.total);
}

/** Lowest total (the leader) first with 'asc', highest first with 'desc'. Ties keep previous order. */
export function orderByTotal(prevOrder, t, dir) {
  return [...prevOrder].sort((a, b) => (dir === 'asc' ? t[a] - t[b] : t[b] - t[a]));
}

function pushStage(game, idx, kingId, order) {
  const def = stagesFor(game)[idx];
  game.stages.push({
    id: def.id,
    kingId,
    order,
    entries: Object.fromEntries(order.map((pid) => [pid, blankEntries(def, game)])),
    result: null,
  });
}

/**
 * New game. Regular: `players` (1–3). Co-op: `teams`, two pairs of players; each team then
 * plays as one unit (one score, one turn) and its members split the balls.
 */
export function createGame({ id, players, teams, course = '', date = new Date().toISOString(), format = 'standard' }) {
  if (!FORMATS[format]) throw new Error('Unknown game format');
  let teamMap;
  if (teams) {
    if (teams.length !== 2 || teams.some((t) => t.length !== 2)) throw new Error('Co-op is two teams of two');
    players = teams.map((t, i) => ({ id: `team${i + 1}`, name: `${t[0].name} & ${t[1].name}` }));
    teamMap = Object.fromEntries(players.map((p, i) => [p.id, teams[i].map((m) => ({ id: m.id, name: m.name }))]));
  } else if (!players || !players.length || players.length > MAX_PLAYERS) {
    throw new Error(`KOG is for 1–${MAX_PLAYERS} players (4 play co-op)`);
  }
  const game = {
    v: 2,
    id,
    format,
    course,
    date,
    players: players.map((p) => ({ id: p.id, name: p.name })),
    ...(teamMap ? { teams: teamMap } : {}),
    status: 'toss',
    toss: null,
    stages: [],
    winnerId: null,
    tiedIds: null,
    puttOff: false,
  };
  if (players.length === 1) applyToss(game, [players[0].id]);
  return game;
}

// ---------- co-op ----------
export const isCoop = (game) => Boolean(game.teams);
/** Everyone holding a putter: team members in co-op, otherwise the players. */
export const people = (game) => (isCoop(game) ? Object.values(game.teams).flat() : game.players);
/** The scoring unit (team id in co-op, otherwise the player id) for a person. */
export function unitOf(game, personId) {
  if (!isCoop(game)) return personId;
  const hit = Object.entries(game.teams).find(([, ms]) => ms.some((m) => m.id === personId));
  return hit ? hit[0] : null;
}
/** How many sets were played before set k of this stage (drives the par-ball rotation). */
function setNumber(game, stageIdx, k) {
  const stages = stagesFor(game);
  let n = 0;
  for (let i = 0; i < stageIdx; i++) n += stages[i].sets.length;
  return n + k;
}
/**
 * Who putts ball j of set k for a team. Birdie ball 1 is always teammate A, birdie
 * ball 2 teammate B, and the par ball alternates every set across the whole game:
 * A, B, A, then B starts the next round, and so on. The Eagle round has 4 balls, two each.
 */
export function ballOwner(game, stageIdx, teamId, k, j) {
  const [a, b] = game.teams[teamId];
  // Eagle round in co-op: 4 balls, teammates alternate A, B, A, B (two each).
  if (stagesFor(game)[stageIdx].kind === 'eagle') return j % 2 === 0 ? a.id : b.id;
  if (j === 0) return a.id;
  if (j === 1) return b.id;
  return setNumber(game, stageIdx, k) % 2 === 0 ? a.id : b.id;
}

/**
 * Opening tee flip: someone flips a tee and whoever it points at (a player, or a team in co-op) is
 * the KOG for Round 1 and sets the markers. The other player or team putts first. With three
 * players the other two flip again: the tee points at who putts first, and the third goes second.
 */
export function applyTeeFlip(game, kingId, firstId) {
  const ids = game.players.map((p) => p.id);
  if (!ids.includes(kingId)) throw new Error('The tee must point at a player');
  const others = ids.filter((id) => id !== kingId);
  if (others.length > 1 && !others.includes(firstId)) throw new Error('Pick who putts first');
  const first = others.length > 1 ? firstId : others[0];
  game.toss = { flip: { kingId, firstId: first || kingId } };
  pushStage(game, 0, kingId, first ? [first, ...others.filter((id) => id !== first), kingId] : [kingId]);
  game.status = 'playing';
}

/**
 * Opening toss (games started before the tee flip). `ranking` lists everyone from closest to the hole to furthest.
 * Closest is KOG for Round 1; furthest putts first. In co-op everyone putts, the
 * closest player's team is KOG, and the furthest player's team putts first.
 */
export function applyToss(game, ranking) {
  const ids = people(game).map((p) => p.id);
  if (ranking.length !== ids.length || new Set(ranking).size !== ids.length || !ids.every((id) => ranking.includes(id))) {
    throw new Error('Rank every player exactly once');
  }
  game.toss = { ranking: [...ranking] };
  if (isCoop(game)) {
    const king = unitOf(game, ranking[0]);
    const first = unitOf(game, ranking[ranking.length - 1]);
    const other = game.players.find((p) => p.id !== king).id;
    pushStage(game, 0, king, first === king ? [king, other] : [first, king]);
  } else {
    pushStage(game, 0, ranking[0], [...ranking].reverse());
  }
  game.status = 'playing';
}

export function currentStageIdx(game) {
  return game.stages.length - 1;
}

/** Close the current stage: record scores and decide the next King. */
export function finishStage(game) {
  const idx = currentStageIdx(game);
  if (game.status !== 'playing') throw new Error('No stage in progress');
  if (!stageComplete(game, idx)) throw new Error('Not every player has finished');
  const stage = game.stages[idx];
  const scores = Object.fromEntries(game.players.map((p) => [p.id, playerStageScore(game, idx, p.id)]));
  const low = Math.min(...Object.values(scores));
  const lowIds = game.players.filter((p) => scores[p.id] === low).map((p) => p.id);
  // Outright low score becomes King; any tie and the current King sets again.
  const kingKept = lowIds.length !== 1;
  stage.result = { scores, low, lowIds, kingKept, nextKingId: kingKept ? stage.kingId : lowIds[0] };
  if (idx === stagesFor(game).length - 1) resolveFinal(game);
  else game.status = 'summary';
}

export function startNextStage(game) {
  if (game.status !== 'summary') throw new Error('Finish the current stage first');
  const idx = currentStageIdx(game);
  const prev = game.stages[idx];
  // Rounds 2–9 and the Eagle round: the leader (lowest running total, most under par) putts first.
  const order = orderByTotal(prev.order, totals(game, idx), 'asc');
  pushStage(game, idx + 1, prev.result.nextKingId, order);
  game.status = 'playing';
}

/** Re-open the last finished stage for corrections. */
export function reopenStage(game) {
  if (!['summary', 'puttoff', 'done'].includes(game.status)) throw new Error('Nothing to reopen');
  game.stages[currentStageIdx(game)].result = null;
  game.status = 'playing';
  game.winnerId = null;
  game.tiedIds = null;
  game.puttOff = false;
  delete game.tieTosses;
}

function resolveFinal(game) {
  const s = standings(game);
  const tied = s.filter((x) => x.total === s[0].total).map((x) => x.id);
  if (tied.length === 1) {
    game.status = 'done';
    game.winnerId = tied[0];
  } else {
    game.status = 'puttoff';
    game.tiedIds = tied;
    game.tieTosses = 1;
  }
}

/**
 * Tie-breaker for the lowest final total: a ball is tossed onto the green, the tied
 * players putt from where it lands to the hole furthest from it, and the closest wins.
 * If it's too close to call, toss again.
 */
export function retossTiebreak(game) {
  if (game.status !== 'puttoff') throw new Error('No tie-breaker in progress');
  game.tieTosses = (game.tieTosses || 1) + 1;
}

/** Record the tie-breaker winner (a player, or a team in co-op). */
export function setPuttOffWinner(game, pid) {
  if (game.status !== 'puttoff' || !game.tiedIds.includes(pid)) throw new Error('Not in the putt-off');
  game.winnerId = pid;
  game.puttOff = true;
  game.status = 'done';
}

export function formatScore(n) {
  if (n === null || n === undefined) return '–';
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : `−${-n}`;
}

// ---------- Stats ----------

const pct = ([made, tries]) => (tries ? made / tries : null);

/**
 * Stats for one person across finished games. `ids` is their player id, or a list of ids
 * when the same person appears under different ids (e.g. games joined from another phone).
 */
export function playerStats(games, ids) {
  ids = [].concat(ids);
  // Where this person sits in a game: their scoring unit, and (co-op) their own id for ball credit.
  const seat = (g) => {
    const person = people(g).find((p) => ids.includes(p.id));
    return person ? { unit: unitOf(g, person.id), person: isCoop(g) ? person.id : null } : null;
  };
  const idIn = (g) => (seat(g) || {}).unit;
  const finished = games.filter((g) => g.status === 'done' && idIn(g));
  const byDist = {};
  for (const k of Object.keys(DISTANCES)) byDist[k] = { birdie: [0, 0], par: [0, 0], setSum: 0, sets: 0 };
  const s = { games: finished.length, wins: 0, best: null, avg: null, eagle: [0, 0], kingRounds: 0, roundWins: 0, threePlus: 0, balls: 0 };
  let sumTotals = 0;

  for (const g of finished) {
    const { unit: pid, person } = seat(g);
    const total = totals(g)[pid];
    sumTotals += total;
    if (s.best === null || total < s.best) s.best = total;
    if (g.winnerId === pid) s.wins++;

    g.stages.forEach((stage, si) => {
      const def = stageDef(stage);
      const types = ballTypes(def);
      if (stage.kingId === pid) s.kingRounds++;
      if (stage.result && stage.result.lowIds.length === 1 && stage.result.lowIds[0] === pid) s.roundWins++;
      stage.entries[pid].forEach((entry, k) => {
        const dist = def.sets[k];
        const sc = setScore(entry, types);
        if (dist && sc !== null) {
          byDist[dist].setSum += sc;
          byDist[dist].sets++;
        }
        if (entry.mode !== 'balls') return;
        entry.balls.forEach((putts, j) => {
          if (!Number.isInteger(putts)) return;
          if (person && ballOwner(g, si, pid, k, j) !== person) return; // a teammate's ball
          s.balls++;
          if (putts >= 3) s.threePlus++;
          const type = typeAt(types, j);
          const bucket = type === 'eagle' ? s.eagle : byDist[dist][type];
          bucket[1]++;
          if (putts === 1) bucket[0]++;
        });
      });
    });
  }
  if (s.games) s.avg = sumTotals / s.games;
  s.byDist = Object.fromEntries(
    Object.entries(byDist).map(([k, d]) => [k, { birdiePct: pct(d.birdie), birdie: d.birdie, parPct: pct(d.par), par: d.par, avgSet: d.sets ? d.setSum / d.sets : null }]),
  );
  s.eaglePct = pct(s.eagle);
  return s;
}
