import * as R from './rules.js';
import * as Q from './quick.js';
import * as L from './lag.js';
import * as RK from './ranked.js';
import { rankBadge } from './badges.js';
import * as WR from './winrate.js';
import { applyOp } from './ops.js';
import { load, save, uid } from './store.js';
import * as S from './sync.js';
import * as A from './auth.js';
import { figures, mountIllustrations, nextRoundFigure, tossFigure, tiebreakFigure, compassFigure, lagFigure, dn } from './illustrations.js';
import { playHawk, unlockAudio } from './sound.js';
import { kingRain, preloadKings } from './confetti.js';

// Per-device preferences (theme, sound).
function getPref(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function setPref(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked: preference lasts until reload */
  }
}
// KOG is dark-only: it looks best that way, so there's no light mode or theme setting.
document.documentElement.dataset.theme = 'dark';
const soundOn = () => getPref('kog.sound', 'on') === 'on';

const $app = document.getElementById('app');
const db = load();
db.quick = db.quick.map(Q.normalizeQuick);
const SYNC = S.syncAvailable();
const ui = {
  view: 'home',
  params: {},
  draft: null,
  toss: [],
  activePid: null,
  activeStage: null,
  dialog: null,
  toast: null,
  sync: 'live', // live | saving | offline
  goingLive: false,
  join: { code: '', error: '', busy: false },
  kogPopup: null,
  acct: { step: 'choose', phone: '', email: '', tag: '', tagState: '', busy: false, error: '', note: '' },
  profile: null,
  kogFlash: false,
  orderPopup: null,
  seenKog: new Set(),
};

// ---------- helpers ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fs = R.formatScore;
const scoreClass = (n) => (n == null ? 'none' : n < 0 ? 'under' : n > 0 ? 'over' : 'even');
const scoreTag = (n, extra = '') => `<span class="score ${scoreClass(n)} ${extra}">${fs(n)}</span>`;
const pctText = (p) => (p == null ? '—' : `${Math.round(p * 100)}%`);
const avgText = (a) => (a == null ? '—' : a === 0 ? 'E' : (a > 0 ? '+' : '−') + Math.abs(a).toFixed(1));
const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const clone = (o) => JSON.parse(JSON.stringify(o));

const ICON = {
  crown: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M2.5 7.2l5.2 4.2L12 4l4.3 7.4 5.2-4.2-2.1 10.6H4.6zM4.8 19.4h14.4V21H4.8z"/></svg>',
  back: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M15 5l-7 7 7 7"/></svg>',
  card: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M4 4h16v16H4zM4 9.5h16M4 14.5h16M9.5 4v16"/></svg>',
  person: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" fill="currentColor"/></svg>',
  people: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8.5" cy="8" r="3.4" fill="currentColor"/><circle cx="16.5" cy="9" r="2.9" fill="currentColor" opacity=".75"/><path d="M1.5 20.5c0-3.8 3.1-6.2 7-6.2s7 2.4 7 6.2z" fill="currentColor"/><path d="M15.5 20.5c0-2.3-.8-4.1-2.1-5.3 1-.5 2-.7 3.1-.7 3.4 0 6 2 6 5.4v.6z" fill="currentColor" opacity=".75"/></svg>',
  clock: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 9v4l3 2M9 2.5h6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  flag: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M7 3.5l11 3.8L7 11.2z" fill="currentColor"/><ellipse cx="6" cy="21" rx="4" ry="1.2" fill="currentColor" opacity=".5"/></svg>',
  target: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/></svg>',
  chevron: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>',
};

function activeGame() {
  return db.games.find((g) => g.id === db.activeGameId) || null;
}
function playerName(g, pid) {
  const p = (g ? g.players : db.players).find((x) => x.id === pid);
  return p ? p.name : '?';
}
/** All ids a roster player is known by (their own + ids from games joined on other phones). */
const idsOf = (p) => [p.id, ...(p.aliases || [])];
/** A person's name in a game (team members in co-op, otherwise players). */
const personName = (g, id) => (R.people(g).find((x) => x.id === id) || { name: '?' }).name;
/** Duos teams are themed by suit color with the user's golf Kings:
 *  Team 1 = the red Kings (Hearts, Diamonds), Team 2 = the black Kings (Clubs, Spades). */
const TEAM_THEMES = [
  { name: 'Red Kings', cls: 'team-red', cards: ['assets/duos/king-hearts.webp', 'assets/duos/king-diamonds.webp'] },
  { name: 'Black Kings', cls: 'team-black', cards: ['assets/duos/king-clubs.webp', 'assets/duos/king-spades.webp'] },
];
const teamCards = (i, cls = '') => `<span class="team-cards ${cls}" aria-hidden="true">${TEAM_THEMES[i].cards.map((src) => `<img src="${src}" alt="">`).join('')}</span>`;
/** Co-op name colors by team: Team 1 red Kings, Team 2 black Kings. */
function personColor(g, id) {
  if (!R.isCoop(g)) return '';
  return `pc-${Object.keys(g.teams).indexOf(R.unitOf(g, id)) + 1}`;
}
/** This phone's scoring unit: its player, or in co-op the team of its player. */
const meUnit = (g) => (g && g.sync && g.sync.me ? R.unitOf(g, g.sync.me) : null);
/** Co-op pairings for 4 picked players: (1&2 v 3&4), (1&3 v 2&4), (1&4 v 2&3). */
const PAIRINGS = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
const coopPairs = (d) => PAIRINGS[d.pair || 0].map((team) => team.map((i) => d.selected[i]));
const rosterIdFor = (gameId) => (db.players.find((p) => idsOf(p).includes(gameId)) || {}).id;

function commit() {
  save(db);
  render();
}
function go(view, params = {}) {
  ui.view = view;
  ui.params = params;
  render();
  window.scrollTo(0, 0);
}
let toastTimer;
function toast(msg) {
  ui.toast = msg;
  render();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    ui.toast = null;
    render();
  }, 3200);
}
function stageTitle(def, g) {
  return def.num ? `Round ${def.num} of ${R.roundsIn(g)}` : 'Eagle round';
}
/** "Round 4" or, for an old-style unnumbered Eagle round, "Eagle round". */
const roundName = (def) => (def.num ? `Round ${def.num}` : 'Eagle round');
const isLastStage = (g, idx) => idx === R.stagesFor(g).length - 1;
function markerInfo(def, g = null) {
  if (def.kind === 'eagle') {
    return `Toss a ball onto the green, then pick between the two holes furthest from it. ${g && R.isCoop(g) ? 'Each team putts 4 balls from that spot, two per teammate.' : 'Everyone putts 3 balls from that spot.'}`;
  }
  if (def.kind === 'special') {
    const k = def.sets[0];
    return `All 3 sets ${dn(k)}: ${R.DISTANCES[k].range}`;
  }
  return Object.values(R.DISTANCES).map((d) => `${dn(d.key)} ${d.range}`).join(' · ');
}
/** "Short-putt round" with the distance in its color. */
const specialTitle = (def) => `${dn(def.sets[0])}-putt round`;

function topbar(title, back = 'home', right = '') {
  return `<header class="topbar">
    <div class="topbar-left"><button class="icon-btn" data-action="nav" data-view="${back}" aria-label="Back">${ICON.back}</button></div>
    <h1>${title}</h1>
    <div class="topbar-right">${right}</div>
  </header>`;
}

// ---------- live sync ----------
// A live game keeps the last copy the server confirmed (base) plus this phone's
// changes that haven't been saved yet (queue). What you see = base + queue.

function stripSync(g) {
  const { sync, ...state } = g;
  return state;
}
function replaceGame(ng) {
  const i = db.games.findIndex((x) => x.id === ng.id);
  if (i >= 0) db.games[i] = ng;
  else db.games.push(ng);
  return ng;
}
function rebuild(g) {
  const s = clone(g.sync.base.state);
  for (const op of g.sync.queue) applyOp(s, op);
  return replaceGame({ ...s, sync: g.sync });
}
function setSync(state) {
  if (ui.sync === state) return;
  ui.sync = state;
  render();
}

let flushing = false;
let retryTimer;
async function flush() {
  if (flushing) return;
  let g = activeGame();
  if (!g?.sync?.queue.length) return;
  flushing = true;
  clearTimeout(retryTimer);
  setSync('saving');
  try {
    while ((g = activeGame())?.sync?.queue.length) {
      const { code } = g.sync;
      const op = g.sync.queue[0];
      let base = g.sync.base;
      for (let attempt = 0; ; attempt++) {
        const next = clone(base.state);
        if (!applyOp(next, op)) break; // no longer applies, e.g. someone else already finished the round
        const saved = await S.pushRemote(code, base.version, next);
        if (saved) {
          base = saved;
          break;
        }
        // Another phone saved first: get their version and replay this change on top.
        if (attempt >= 6) throw new Error('Too many clashes');
        base = (await S.fetchRemote(code, 0)) || base;
      }
      g = activeGame();
      if (!g?.sync || g.sync.code !== code) break;
      g.sync.base = base;
      g.sync.queue.shift();
      rebuild(g);
      save(db);
    }
    setSync('live');
  } catch {
    setSync('offline');
    retryTimer = setTimeout(flush, 4000);
  } finally {
    flushing = false;
    render();
  }
}

async function poll() {
  const g = activeGame();
  if (!g?.sync || flushing || document.hidden) return;
  if (g.sync.queue.length) return flush();
  try {
    const row = await S.fetchRemote(g.sync.code, g.sync.base.version);
    const cur = activeGame();
    if (row && cur?.sync?.code === g.sync.code && !flushing && !cur.sync.queue.length && row.version > cur.sync.base.version) {
      const before = clone(stripSync(cur));
      cur.sync.base = row;
      const after = rebuild(cur);
      save(db);
      announce(after, detectEvents(before, after));
      render();
    }
    setSync('live');
  } catch {
    setSync('offline');
  }
}

// ---------- game events: eagle call, change of KOG ----------

/** True once a player's Eagle-round set is complete with at least one eagle (holed on the first putt). */
function hasEagle(def, e) {
  if (!e || R.setScore(e, R.ballTypes(def)) === null) return false;
  // Without an eagle each ball scores −1 at best, so a typed-in score below −(balls) means an eagle.
  return e.mode === 'quick' ? e.score < -e.balls.length : e.balls.some((p) => p === 1);
}
const eagleCount = (e) => (e.mode === 'quick' ? 1 : e.balls.filter((p) => p === 1).length);

/** Compare a game before and after a change and list what's worth announcing. */
function detectEvents(before, after) {
  const events = [];
  if (!before || !after) return events;
  after.stages.forEach((st, i) => {
    const def = R.stageDef(st);
    const was = before.stages[i];
    if (def.kind === 'eagle') {
      for (const pid of st.order) {
        if (!(was && hasEagle(def, was.entries[pid][0])) && hasEagle(def, st.entries[pid][0])) {
          const e = st.entries[pid][0];
          const owners = R.isCoop(after) && e.mode === 'balls' ? e.balls.map((p, j) => (p === 1 ? R.ballOwner(after, i, pid, 0, j) : null)).filter(Boolean) : null;
          events.push({ type: 'eagle', pid, count: eagleCount(e), owners });
        }
      }
    }
    const res = st.result;
    if (res && i < R.stagesFor(after).length - 1 && !(was && was.result) && !res.kingKept && res.nextKingId !== st.kingId) {
      events.push({ type: 'kog', stage: i, from: st.kingId, to: res.nextKingId });
    }
  });
  // A new round has started: show who putts in what order.
  if (after.stages.length > before.stages.length) events.push({ type: 'order', stage: after.stages.length - 1 });
  return events;
}

function announce(g, events) {
  for (const ev of events) {
    if (ev.type === 'eagle') {
      if (soundOn()) playHawk();
      const who = ev.owners && ev.owners.length ? [...new Set(ev.owners.map((id) => personName(g, id)))].join(' & ') : playerName(g, ev.pid);
      toast(`🦅 Eagle! ${who} drained ${ev.count > 1 ? `${ev.count} eagle putts` : 'an eagle putt'}.`);
    } else if (ev.type === 'kog') {
      const key = `${g.id}:${ev.stage}:${ev.to}`;
      if (ui.seenKog.has(key)) continue;
      ui.seenKog.add(key);
      ui.kogPopup = { stage: ev.stage, from: ev.from, to: ev.to };
      // The King card flashes only on the new KOG's own phone (or a shared phone with no "me").
      const me = meUnit(g);
      if (!me || me === ev.to) flashKogCard();
    } else if (ev.type === 'order' && g.players.length > 1) {
      ui.orderPopup = { stage: ev.stage };
    }
  }
}

const KOG_CARD = 'assets/four-kings.webp'; // the Four Kings: home screen and the New KOG flash
let flashTimer;
/** Full-screen King card for a newly crowned KOG; the change-of-KOG window follows it. */
function flashKogCard() {
  ui.kogFlash = true;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    ui.kogFlash = false;
    render();
  }, 2600);
}

/** Every change to the game goes through here, so live games can share it. */
function dispatch(op) {
  const g = activeGame();
  if (!g) return;
  const before = clone(stripSync(g));
  if (!applyOp(g, op)) {
    render();
    return;
  }
  if (g.sync) {
    g.sync.queue.push(op);
    flush();
  }
  announce(g, detectEvents(before, g));
  commit();
}

async function goLive() {
  const g = activeGame();
  if (!g || g.sync || ui.goingLive) return false;
  ui.goingLive = true;
  render();
  try {
    const snapshot = clone(stripSync(g));
    const code = await S.createRemote(snapshot);
    const cur = activeGame();
    if (!cur || cur.id !== g.id) return false;
    cur.sync = { code, base: { state: snapshot, version: 1 }, queue: [], me: null };
    rebuild(cur);
    save(db);
    ui.sync = 'live';
    return true;
  } catch {
    toast('Couldn’t go live. Check your signal and try again.');
    return false;
  } finally {
    ui.goingLive = false;
    render();
  }
}

/** Make sure everyone in a joined game is on this phone's player list (for stats later). */
function linkGamePlayers(g) {
  for (const gp of R.people(g)) {
    if (rosterIdFor(gp.id)) continue;
    const same = db.players.find((p) => p.name.toLowerCase() === gp.name.toLowerCase());
    if (same) same.aliases = [...(same.aliases || []), gp.id];
    else db.players.push({ id: gp.id, name: gp.name, createdAt: new Date().toISOString() });
  }
}

async function joinGame(raw) {
  const code = S.normalizeCode(raw);
  ui.join.code = code;
  if (code.length !== 6) {
    ui.join.error = 'Game codes are 6 letters and numbers.';
    render();
    return;
  }
  const cur = activeGame();
  if (cur?.sync?.code === code) return go('game');
  ui.join.busy = true;
  ui.join.error = '';
  render();
  try {
    const row = await S.fetchRemote(code, 0);
    if (!row) {
      ui.join.error = `No game found with code ${code}. Check the code with whoever started it.`;
      return;
    }
    afterAbandoningActive(() => {
      const g = replaceGame({ ...clone(row.state), sync: { code, base: row, queue: [], me: null } });
      db.activeGameId = g.id;
      linkGamePlayers(g);
      save(db);
      ui.activePid = null;
      ui.sync = 'live';
      go('whoami');
    });
  } catch {
    ui.join.error = 'Couldn’t reach the game. Check your signal and try again.';
  } finally {
    ui.join.busy = false;
    render();
  }
}

const inviteLink = (code) => `${location.origin}${location.pathname}?join=${code}`;

function liveButton(g) {
  if (!SYNC || g.players.length < 2) return '';
  if (!g.sync) return `<button class="pill" data-action="nav" data-view="share">Go live</button>`;
  const label = { live: 'Live', saving: 'Saving', offline: 'Offline' }[ui.sync];
  return `<button class="pill live ${ui.sync}" data-action="nav" data-view="share" aria-label="${label}. Game code ${g.sync.code}"><span class="pill-dot" aria-hidden="true"></span>${label}</button>`;
}
function gameRight(g) {
  const card = g.stages.length ? `<button class="icon-btn" data-action="nav" data-view="card" data-game="${g.id}" data-back="game" aria-label="Scorecard">${ICON.card}</button>` : '';
  return liveButton(g) + card;
}

// ---------- views ----------
function viewHome() {
  const g = activeGame();
  let resume = '';
  if (g) {
    const st = g.stages[R.currentStageIdx(g)];
    const where =
      g.status === 'toss' ? 'Opening toss'
      : g.status === 'done' ? 'Final results'
      : g.status === 'puttoff' ? 'Putt-off'
      : stageTitle(R.stageDef(st), g);
    resume = `<section class="card resume">
      <div>
        <div class="eyebrow">${g.status === 'done' ? 'Just finished' : g.sync ? `Live game · ${g.sync.code}` : 'Game in progress'}</div>
        <div class="resume-title">${where}</div>
        <div class="muted small">${g.players.map((p) => esc(p.name)).join(' · ')}</div>
      </div>
      <div class="resume-actions">
        <button class="btn primary" data-action="nav" data-view="game">${g.status === 'done' ? 'View' : 'Resume'}</button>
        ${g.status === 'done'
          ? '<button class="btn ghost small-btn" data-action="close-game">Close</button>'
          : `<button class="btn ghost small-btn danger" data-action="delete-active">${g.sync ? 'Leave' : 'Delete'}</button>`}
      </div>
    </section>`;
  }
  return `<main class="page home">
    <div class="hero">
      <img class="hero-card" src="${KOG_CARD}" alt="The four Kings of the Greens">
      <h1>King of the Greens</h1>
      <p>The putting game for 1–4 players</p>
    </div>
    ${profileBox()}
    ${resume}
    ${quickResumeCard()}
    ${lagResumeCard()}
    <div class="stack">
      <div class="play-choices">
        <button class="choice primary art-choice art-ranked" data-action="nav" data-view="ranked-modes" data-confetti="kings">
          <span class="choice-ico">${ICON.crown}</span>
          <span class="choice-title">Ranked</span>
          <span class="choice-sub">Climb from Copper to Putt Master</span>
        </button>
        <button class="choice art-choice art-casual" data-action="nav" data-view="casual-modes">
          <span class="choice-ico">${ICON.flag}</span>
          <span class="choice-title">Casual</span>
          <span class="choice-sub">Just for fun, solo or with friends</span>
        </button>
        <button class="choice wide-choice quick-choice" data-action="quick-new">
          ${COMPASS_SCENE}
          <span class="choice-ico">${ICON.clock}</span>
          <span class="choice-text"><span class="choice-title">Quickplay</span><span class="choice-sub">Compass Putt: A putting game that runs under 20 minutes; Play solo or head-to-head</span><span class="choice-fine">*Does not affect rank</span></span>
        </button>
        <button class="choice wide-choice lag-choice" data-action="lag-new">
          <span class="choice-ico ico-red">${ICON.target}</span>
          <span class="choice-text"><span class="choice-title">${L.GAME_NAME}</span><span class="choice-sub">Practice your lag putting in this cornhole-style game. First to 21 wins; Play 1v1 or 2v2</span></span>
          ${LAG_SCENE}
        </button>
      </div>
      ${SYNC ? '<button class="btn" data-action="open-join">Join a game</button>' : ''}
      <button class="btn" data-action="nav" data-view="players">Players &amp; stats</button>
      <button class="btn" data-action="nav" data-view="history">Past games</button>
      <button class="btn ghost" data-action="nav" data-view="ranked">Ranked · preview</button>
      <button class="btn ghost" data-action="nav" data-view="rules">How to play</button>
      <button class="btn ghost" data-action="nav" data-view="settings">Settings</button>
    </div>
  </main>`;
}

// A mini crowned King, side view, putting toward the right. Shared by the Lag 21 and Quickplay boxes.
const MINI_KING_PARTS = `
      <path d="M24 108 L33 108 L31 141 L23 141 Z" fill="#f3ead2"/>
      <path d="M33 108 L44 110 L46 141 L37 141 Z" fill="#f3ead2"/>
      <path d="M19 141 h13 q3 0 3 3 v1.5 h-16 z" fill="#fff"/>
      <path d="M35 141 h13 q3 0 3 3 v1.5 h-16 z" fill="#fff"/>
      <path d="M21 111 L45 113 L59 90 L40 79 Z" fill="#1f5f3a"/>
      <path d="M45 82 L52 86 L49 92 Z" fill="#fff" stroke-width="1"/>
      <path d="M41 98 L49 94 M37 104 L46 101" stroke="#f2c53d" stroke-width="1.4" fill="none"/>
      <path d="M52 86 Q60 97 57 106" fill="none" stroke-width="7.5"/>
      <path d="M52 86 Q60 97 57 106" fill="none" stroke="#1f5f3a" stroke-width="4.8"/>
      <g fill="#fff" stroke-width="1.1"><circle cx="53" cy="74" r="4.2"/><circle cx="52" cy="80" r="4"/><circle cx="55" cy="85.5" r="3.8"/><circle cx="61" cy="86" r="3.8"/><circle cx="66.5" cy="83.5" r="3.2"/></g>
      <circle cx="60.5" cy="76" r="7.4" fill="#f5d3b0"/>
      <g fill="#fff" stroke-width="1.1"><circle cx="61" cy="84" r="3.2"/><circle cx="65.5" cy="82" r="2.8"/></g>
      <path d="M62 80 q2.5 -1.6 5 0" fill="none" stroke-width="1.2"/>
      <circle cx="64" cy="75" r=".9" fill="#1b1b1b" stroke="none"/>
      <path d="M66.5 76 l2.4 2.6 l-2.6 .6" fill="#f5d3b0" stroke-width="1"/>
      <path d="M51.5 73 Q53 62 62 62.5 Q69.5 63.5 69 71 Z" fill="#fff"/>
      <path d="M66 70 L77 74.5 L67 73.5 Z" fill="#fff"/>
      <path d="M53.5 64 L52.5 55.5 L56.5 59.5 L59.5 52.5 L62.5 59.5 L66.5 55.5 L66 64 Z" fill="#f2c53d"/>
      <g fill="#f2c53d" stroke-width=".9"><circle cx="52.5" cy="55" r="1.4"/><circle cx="59.5" cy="52" r="1.5"/><circle cx="66.5" cy="55" r="1.4"/></g>
      <line x1="55" y1="103" x2="64" y2="141" stroke="#1b1b1b" stroke-width="3.2"/>
      <line x1="55" y1="103" x2="64" y2="141" stroke="#c9ced3" stroke-width="1.6"/>
      <line x1="54.5" y1="101" x2="56.5" y2="110" stroke="#1b1b1b" stroke-width="3.4"/>
      <rect x="59" y="139.5" width="12" height="4" rx="1.2" fill="#dfe3e7"/>
      <circle cx="56.5" cy="106.5" r="3.6" fill="#f5d3b0"/>`;
const miniKing = (transform) => `<g class="mini-king" transform="${transform}" stroke="#1b1b1b" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${MINI_KING_PARTS}</g>`;

// Quickplay box: the user's banner of four Kings putting into one hole from N, E, S and W, faint behind the words.
const COMPASS_SCENE = '<span class="compass-scene" aria-hidden="true"></span>';

// Lag 21 box: a faint scenic putting green, with a mini King on the far left lagging
// a putt toward the pin. His white ball is halfway there; two colored balls already sit by the hole.
const LAG_SCENE = `<svg class="lag-scene" viewBox="0 0 360 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <linearGradient id="lag-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fcdf0"/><stop offset="1" stop-color="#e6f6ff"/></linearGradient>
  </defs>
  <g class="lag-bg" stroke="#1b1b1b" stroke-width="1.2" stroke-linejoin="round">
    <rect width="360" height="150" fill="url(#lag-sky)" stroke="none"/>
    <circle cx="300" cy="22" r="11" fill="#ffe27a"/>
    <g fill="#fff"><path d="M28 30 a9 9 0 0 1 14 -8 a11 11 0 0 1 20 3 a8 8 0 0 1 4 15 h-36 a7 7 0 0 1 -2 -10 z"/><path d="M150 22 a8 8 0 0 1 12 -7 a10 10 0 0 1 18 3 a7 7 0 0 1 3 13 h-31 a6 6 0 0 1 -2 -9 z"/><path d="M222 40 a7 7 0 0 1 11 -6 a9 9 0 0 1 16 3 a6 6 0 0 1 3 11 h-28 a5 5 0 0 1 -2 -8 z"/></g>
    <path d="M0 80 Q50 62 110 74 T230 68 T360 74 V150 H0 Z" fill="#4f9a55"/>
    <g fill="#2f7d3a">
      <circle cx="18" cy="74" r="9"/><circle cx="30" cy="70" r="11"/><circle cx="44" cy="75" r="8"/>
      <circle cx="120" cy="72" r="8"/><circle cx="131" cy="68" r="10"/>
      <circle cx="205" cy="70" r="9"/><circle cx="218" cy="66" r="11"/><circle cx="231" cy="71" r="8"/>
      <circle cx="330" cy="72" r="9"/><circle cx="344" cy="68" r="11"/>
    </g>
    <path d="M0 94 Q90 80 180 90 T360 86 V150 H0 Z" fill="#79c167"/>
    <ellipse cx="96" cy="97" rx="24" ry="4.5" fill="#f1dfa4"/>
    <path d="M262 96 q14 -5 30 0 q-14 5 -30 0 z" fill="#8fd0f0"/>
    <path d="M-10 150 V112 Q180 98 370 110 V150 Z" fill="#94da7e"/>
    <g stroke="none" fill="#fff" opacity=".22"><path d="M-10 124 Q180 112 370 122 V130 Q180 120 -10 132 Z"/><path d="M-10 140 Q180 130 370 138 V146 Q180 138 -10 148 Z"/></g>
  </g>
  <g class="lag-play">
    <path d="M44 143 Q110 140 172 141" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="1.5 4" stroke-linecap="round" opacity=".9"/>
    <g stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".9"><path d="M163 137 h-7"/><path d="M161 141 h-9"/><path d="M163 145 h-7"/></g>
    <ellipse cx="183" cy="145" rx="4" ry="1" fill="#000" opacity=".2"/>
    <circle cx="182" cy="141" r="3.8" fill="#fff" stroke="#1b1b1b" stroke-width=".9"/>
    <circle cx="181" cy="140" r=".55" fill="#9aa"/><circle cx="183.2" cy="141.2" r=".55" fill="#9aa"/><circle cx="181.6" cy="142.6" r=".55" fill="#9aa"/>
    <ellipse cx="324" cy="142.5" rx="7.5" ry="2.3" fill="#1b1b1b"/>
    <line x1="324" y1="142" x2="324" y2="90" stroke="#1b1b1b" stroke-width="2.4" stroke-linecap="round"/>
    <line x1="324" y1="142" x2="324" y2="90" stroke="#f4f4f4" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M324.5 90 L342 95.5 L324.5 101 Z" fill="#e03131" stroke="#1b1b1b" stroke-width=".9" stroke-linejoin="round"/>
    <circle cx="307" cy="141" r="3.6" fill="#f5c400" stroke="#1b1b1b" stroke-width=".9"/>
    <circle cx="339" cy="144.5" r="3.6" fill="#f2641c" stroke="#1b1b1b" stroke-width=".9"/>
    ${miniKing('translate(-2 55) scale(.62)')}
  </g>
</svg>`;

// Faint pictures behind the Ranked mode boxes.
// Head-to-Head: the user's banner of two Kings on the green, faint behind the words.
const CROWNING_ART = '<span class="mode-art h2h-banner" aria-hidden="true"></span>';

// Duos: the user's banner of three Kings crouched reading the line while the fourth putts.
const FACEOFF_ART = '<span class="mode-art duos-banner" aria-hidden="true"></span>';

// ---------- Casual mode boxes: the user's laid-back Kings, faint like the Ranked art ----------
const CHILL_H2H_ART = '<span class="mode-art casual-h2h" aria-hidden="true"></span>';
const CHILL_DUOS_ART = '<span class="mode-art casual-duos" aria-hidden="true"></span>';

/** Ranked or Casual → pick Head-to-Head / 1v1v1 or Duos. */
function viewModes(kind) {
  const ranked = kind === 'ranked';
  const h2h = ranked
    ? 'data-action="nav" data-view="ranked" data-back="ranked-modes"'
    : 'data-action="new-game" data-mode="group"';
  const duos = ranked
    ? 'data-action="nav" data-view="ranked" data-back="ranked-modes"'
    : 'data-action="new-game" data-mode="coop"';
  return `${topbar(ranked ? 'Ranked' : 'Casual')}
  <main class="page">
    ${ranked ? `<p class="muted small">Ranked matches open once accounts are switched on. Until then, tap a mode to see how ranks and points will work.</p>` : ''}
    <div class="play-choices modes">
      <button class="choice primary art-mode" ${h2h}>
        ${ranked ? CROWNING_ART : CHILL_H2H_ART}
        <span class="choice-ico">${ICON.person}</span>
        <span class="choice-title">Head-to-Head / 1v1v1</span>
        <span class="choice-sub">${ranked ? '2 or 3 players, everyone for themselves' : '1–3 players, everyone putts their own balls. Solo practice too.'}</span>
      </button>
      <button class="choice art-mode" ${duos}>
        ${ranked ? FACEOFF_ART : CHILL_DUOS_ART}
        <span class="choice-ico">${ICON.people}</span>
        <span class="choice-title">Duos · 2 vs 2</span>
        <span class="choice-sub">${ranked ? 'Team up with any rank. Each of you gains or loses your own points.' : 'A foursome in two teams. Teammates split the balls, so it runs about twice as fast.'}</span>
      </button>
    </div>
    ${ranked ? currentRankPanel() : ''}
  </main>`;
}

/**
 * "Current rank" on the Ranked screen: your rank big in the middle with your Elo, and the two
 * ranks you're pinched between on either side (smaller), so you can see how far the next rank
 * is and how close you are to dropping. Signed out, it shows an example.
 */
function currentRankPanel() {
  const pf = A.accountsAvailable() && A.currentUser() ? ui.profile : null;
  const example = !pf;
  const mmr = example ? 1447 : pf.ranked_mmr;
  const idx = example ? RK.rankFor(mmr).index : pf.ranked_rank_index;
  const head = `<div class="section-head"><h2>Current rank</h2>${example ? '<span class="muted small">Example</span>' : ''}</div>`;
  if (idx == null || mmr == null) {
    return `${head}<section class="card cur-rank unranked">
      <div class="cr-mid">${rankBadge(null, 64)}<div class="cr-name">Unranked</div><div class="cr-elo">Finish ${RK.PLACEMENT_MATCHES} placement matches</div></div>
    </section>`;
  }
  const cur = RK.RANKS[idx];
  const below = RK.RANKS[idx - 1] || null;
  const above = RK.RANKS[idx + 1] || null;
  const dropAt = cur.min - RK.DEMOTION_BUFFER; // you only drop once you're this far under the floor
  const toUp = above ? above.min - mmr : null;
  const toDrop = below ? mmr - dropAt + 1 : null;
  const side = (r, cls, label, sub) => r
    ? `<div class="cr-side ${cls}">${rankBadge(r, 42)}<div class="cr-side-name">${r.name}</div><div class="cr-side-elo">${label}</div><div class="cr-gap">${sub}</div></div>`
    : `<div class="cr-side ${cls} cr-end"><div class="cr-side-name">${cls === 'down' ? 'Bottom of the ladder' : 'Top of the ladder'}</div></div>`;
  const low = Math.max(cur.min, dropAt);
  const pos = above ? Math.min(100, Math.max(0, ((mmr - low) / (above.min - low)) * 100)) : 100;
  return `${head}<section class="card cur-rank">
    <div class="cr-row">
      ${side(below, 'down', `Under ${dropAt} Elo`, `▼ ${toDrop} to drop`)}
      <div class="cr-mid">${rankBadge(cur, 64)}<div class="cr-name">${cur.name}</div><div class="cr-elo">${mmr} Elo</div></div>
      ${side(above, 'up', `${above ? above.min : ''} Elo`, `▲ ${toUp} to go`)}
    </div>
    ${above ? `<div class="cr-bar" role="img" aria-label="${toUp} Elo to ${above.name}"><span style="width:${pos.toFixed(0)}%"></span></div>` : ''}
    ${example ? '<p class="muted small cr-note">Sign in and play ranked to see your own.</p>' : ''}
  </section>`;
}

function addPlayerForm(disabled) {
  return `<form class="add-row" data-form="add-player">
    <input name="name" placeholder="New player name" maxlength="20" autocomplete="off" enterkeyhint="done" aria-label="New player name" ${disabled ? 'disabled' : ''}>
    <button class="btn" ${disabled ? 'disabled' : ''}>Add</button>
  </form>`;
}

function viewNew() {
  const d = ui.draft;
  const coop = d.mode === 'coop';
  const max = coop ? R.COOP_PLAYERS : R.MAX_PLAYERS;
  const full = d.selected.length >= max;
  const chips = db.players
    .map((p) => {
      const i = d.selected.indexOf(p.id);
      return `<button class="chip ${i >= 0 ? 'on' : ''}" data-action="toggle-player" data-pid="${p.id}" ${i < 0 && full ? 'disabled' : ''} aria-pressed="${i >= 0}">
        ${i >= 0 ? `<b class="chip-n">${i + 1}</b>` : ''}${esc(p.name)}</button>`;
    })
    .join('');
  const n = d.selected.length;
  const ready = coop ? n === R.COOP_PLAYERS : n >= 1;
  const live = SYNC && n > 1;
  const startLabel = ui.goingLive ? 'Going live…'
    : coop ? (n < R.COOP_PLAYERS ? `Pick ${R.COOP_PLAYERS - n} more` : live && d.live ? 'Start live Duos game' : 'Start Duos game')
    : n === 0 ? 'Pick who’s playing'
    : n === 1 ? 'Start solo game'
    : live && d.live ? 'Start live game' : 'Start game';
  const name = (id) => esc((db.players.find((x) => x.id === id) || { name: '?' }).name);
  let teams = '';
  if (coop && n === R.COOP_PLAYERS) {
    const [t1, t2] = coopPairs(d);
    teams = `<section class="card teams">
      <div class="team-row">
        <div class="team team-red">${teamCards(0)}<div class="eyebrow">Team 1 · Red Kings</div><b>${name(t1[0])} &amp; ${name(t1[1])}</b></div>
        <span class="vs">vs</span>
        <div class="team team-black">${teamCards(1)}<div class="eyebrow">Team 2 · Black Kings</div><b>${name(t2[0])} &amp; ${name(t2[1])}</b></div>
      </div>
      <button class="btn small-btn" data-action="switch-pairs">Switch teammates</button>
    </section>`;
  }
  return `${topbar(coop ? 'Duos · 2 vs 2' : 'Head-to-Head / 1v1v1', 'casual-modes')}
  <main class="page">
    <label class="field">
      <span>Course <em>(optional)</em></span>
      <input id="course" data-bind="course" value="${esc(d.course)}" placeholder="Where are you playing?" autocomplete="off">
    </label>
    ${coop ? `<p class="muted small coop-note">Teammates split each set’s 3 balls: one birdie ball each, and the par ball takes turns. The app shows whose ball is whose.</p>` : ''}
    <div class="section-head"><h2>Who’s playing?</h2><span class="muted">${n}/${max}</span></div>
    ${db.players.length ? `<div class="chips">${chips}</div>` : '<p class="muted">Add everyone who’s playing.</p>'}
    ${addPlayerForm(full)}
    ${coop && n < R.COOP_PLAYERS ? '<p class="muted small">Pick 4 players. You can switch teammates after.</p>' : ''}
    ${!coop && full ? '<p class="muted small">Playing as a foursome? <button class="link inline" data-action="switch-coop">Try Duos</button>: it splits the balls so the game runs about twice as fast.</p>' : ''}
    ${teams}
    ${live ? `<label class="switch-row">
      <input type="checkbox" id="live" data-bind="live" ${d.live ? 'checked' : ''}>
      <span><b>Live game</b><span class="muted small">Everyone scores on their own phone and sees the same game.</span></span>
    </label>` : ''}
  </main>
  <footer class="dock">
    <button class="btn primary big" data-action="start-game" ${ready && !ui.goingLive ? '' : 'disabled'}>${startLabel}</button>
  </footer>`;
}

function viewJoin() {
  const j = ui.join;
  return `${topbar('Join a game')}
  <main class="page">
    <p>Enter the 6-character code from the phone that started the game. It’s on their <b>Live</b> button.</p>
    <form class="join-form" data-form="join">
      <input id="join-code" name="code" class="code-input" value="${esc(j.code)}" maxlength="7" placeholder="ABC123" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" aria-label="Game code">
      <button class="btn primary big" ${j.busy ? 'disabled' : ''}>${j.busy ? 'Joining…' : 'Join game'}</button>
    </form>
    ${j.error ? `<p class="error" role="alert">${esc(j.error)}</p>` : ''}
  </main>`;
}

function viewWhoami() {
  const g = activeGame();
  if (!g?.sync) return viewHome();
  const me = g.sync.me;
  const list = R.people(g)
    .map((p) => `<button class="rank-btn ${me === p.id ? 'on' : ''}" data-action="set-me" data-pid="${p.id}"><span class="rank-name">${esc(p.name)}</span>${ICON.chevron}</button>`)
    .join('');
  return `${topbar(`Game ${g.sync.code}`, 'game')}
  <main class="page">
    <p class="prompt">Which player are you?</p>
    <div class="rank-list">${list}</div>
    <button class="btn ghost wide" data-action="set-me" data-pid="">I’m just following along</button>
    <p class="muted small center">This phone opens to your sets first. You can still score anyone.</p>
  </main>`;
}

function viewShare() {
  const g = activeGame();
  if (!g) return viewHome();
  if (!g.sync) {
    return `${topbar('Play live', 'game')}
    <main class="page">
      <section class="card">
        <p><b>Everyone scores on their own phone.</b> Taps show up on every phone in a couple of seconds, and the King, putting order and leaderboard stay in step.</p>
        <p class="muted small">You’ll get a 6-character code for the others to join with.</p>
      </section>
      <button class="btn primary big wide" data-action="go-live" ${ui.goingLive ? 'disabled' : ''}>${ui.goingLive ? 'Going live…' : 'Go live'}</button>
    </main>`;
  }
  const code = g.sync.code;
  const me = g.sync.me;
  const status = {
    live: 'Live: changes show on every phone.',
    saving: 'Saving your latest taps…',
    offline: 'No connection. Your taps are saved on this phone and will send when you’re back in signal.',
  }[ui.sync];
  const chips = R.people(g)
    .map((p) => `<button class="chip ${me === p.id ? 'on' : ''}" data-action="set-me-here" data-pid="${p.id}" aria-pressed="${me === p.id}">${esc(p.name)}</button>`)
    .join('');
  return `${topbar('Live game', 'game')}
  <main class="page">
    <section class="code-card">
      <div class="eyebrow">Game code</div>
      <div class="code" aria-label="${code.split('').join(' ')}">${code}</div>
      <p class="muted small">Others tap <b>Join a game</b> and enter this code, or open your invite link.</p>
      <div class="row-btns">
        <button class="btn primary" data-action="share-invite">Share invite</button>
        <button class="btn" data-action="copy-code">Copy code</button>
      </div>
    </section>
    <p class="sync-status ${ui.sync}" role="status"><span class="pill-dot" aria-hidden="true"></span>${status}</p>
    <div class="section-head"><h2>This phone is</h2></div>
    <div class="chips">${chips}<button class="chip ${!me ? 'on' : ''}" data-action="set-me-here" data-pid="" aria-pressed="${!me}">Just watching</button></div>
  </main>
  <footer class="dock"><button class="btn primary big" data-action="nav" data-view="game">Back to the game</button></footer>`;
}

function viewToss(g) {
  const rank = ui.toss;
  const done = rank.length === R.people(g).length;
  const list = R.people(g)
    .map((p) => {
      const i = rank.indexOf(p.id);
      return `<button class="rank-btn ${i >= 0 ? 'on' : ''}" data-action="toss-pick" data-pid="${p.id}" ${i >= 0 ? 'disabled' : ''}>
        <span class="rank-num">${i >= 0 ? i + 1 : ''}</span>
        <span class="rank-name">${esc(p.name)}</span>
        ${i === 0 ? `<span class="tag gold">${ICON.crown} KOG</span>` : ''}
        ${done && i === rank.length - 1 ? '<span class="tag">Putts first</span>' : ''}
      </button>`;
    })
    .join('');
  const next = done ? '' : `<p class="prompt">Who was ${rank.length === 0 ? '<b>closest</b> to the hole' : `${ordinal(rank.length + 1)} closest`}?</p>`;
  return `${topbar('Opening toss', 'home', gameRight(g))}
  <main class="page">
    <section class="card">
      <ol class="steps">
        <li>Someone tosses a ball onto the practice green.</li>
        <li>Everyone putts from that spot to the hole furthest from it.</li>
        <li>Tap players from <b>closest</b> to the hole to <b>furthest</b>.</li>
      </ol>
      ${g.sync ? '<p class="muted small">Only one phone needs to do this.</p>' : ''}
    </section>
    ${tossFigure()}
    ${next}
    <div class="rank-list">${list}</div>
    <p class="muted small center">Tie for closest? Toss again.</p>
    ${done ? `<section class="card callout">${ICON.crown}<div>${R.isCoop(g)
      ? `<b>${esc(personName(g, rank[0]))}</b> was closest, so <b>${esc(playerName(g, R.unitOf(g, rank[0])))}</b> are the KOG for Round 1 and set the markers. <b>${esc(personName(g, rank[rank.length - 1]))}</b> was furthest, so <b>${esc(playerName(g, R.unitOf(g, rank[rank.length - 1])))}</b> putt first.`
      : `<b>${esc(playerName(g, rank[0]))}</b> is the KOG for Round 1 and sets the markers. <b>${esc(playerName(g, rank[rank.length - 1]))}</b> was furthest away and putts first.`}</div></section>` : ''}
  </main>
  <footer class="dock row">
    <button class="btn" data-action="toss-reset" ${rank.length ? '' : 'disabled'}>Reset</button>
    <button class="btn primary" data-action="toss-confirm" ${done ? '' : 'disabled'}>Start Round 1</button>
  </footer>`;
}
const ordinal = (n) => ['', '1st', '2nd', '3rd', '4th'][n] || `${n}th`;

function pickActive(g, idx) {
  const st = g.stages[idx];
  if (ui.activeStage !== `${g.id}:${idx}`) {
    ui.activeStage = `${g.id}:${idx}`;
    ui.activePid = null;
  }
  if (!st.order.includes(ui.activePid)) {
    const me = meUnit(g);
    ui.activePid = me && st.order.includes(me) && !R.playerDone(g, idx, me) ? me : st.order.find((pid) => !R.playerDone(g, idx, pid)) ?? st.order[0];
  }
  return ui.activePid;
}

function ballLabel(type, j) {
  if (type === 'par') return 'Par ball';
  return `${type === 'eagle' ? 'Eagle' : 'Birdie'} ball ${j + 1}`;
}

function ballRow(type, j, k, putts, owner = null) {
  const sc = R.ballScore(type, putts);
  const made = putts === 1;
  const missed = putts >= 2;
  const a = `data-k="${k}" data-j="${j}"`;
  return `<div class="ball ${putts != null ? 'is-set' : ''}">
    <div class="ball-main">
      <span class="dot ${type}" aria-hidden="true"></span>
      <span class="ball-label">${ballLabel(type, j)}${owner ? `<span class="ball-owner ${owner.cls}">${esc(owner.name)}</span>` : ''}</span>
      <div class="seg" role="group" aria-label="${ballLabel(type, j)}${owner ? `, ${esc(owner.name)}` : ''}">
        <button class="seg-btn in ${made ? 'on' : ''}" aria-pressed="${made}" data-action="ball" ${a} data-v="in">In</button>
        <button class="seg-btn miss ${missed ? 'on' : ''}" aria-pressed="${missed}" data-action="ball" ${a} data-v="miss">Miss</button>
      </div>
      <span class="ball-score">${sc === null ? '' : scoreTag(sc)}</span>
    </div>
    ${missed ? `<div class="holeout">
      <span class="muted small">Holed out in</span>
      <div class="stepper">
        <button data-action="ball" ${a} data-v="dec" ${putts <= 2 ? 'disabled' : ''} aria-label="One fewer putt">−</button>
        <span class="stepper-val">${putts} putts</span>
        <button data-action="ball" ${a} data-v="inc" aria-label="One more putt">+</button>
      </div>
    </div>` : ''}
  </div>`;
}

function quickPicker(def, k, e) {
  const min = R.minSetScore(def, e.balls.length);
  const vals = Array.from({ length: 8 }, (_, i) => min + i);
  if (e.score != null && !vals.includes(e.score)) vals.push(e.score);
  const chips = vals
    .map((x) => `<button class="qchip ${x === e.score ? 'on' : ''}" data-action="quick" data-k="${k}" data-v="${x}" aria-pressed="${x === e.score}">${fs(x)}</button>`)
    .join('');
  return `<div class="quick">
    <div class="qchips">${chips}<button class="qchip more" data-action="quick-more" data-k="${k}" aria-label="Higher score">+</button></div>
    <p class="muted small">Typed-in set scores count toward totals but not toward ball-by-ball stats.</p>
  </div>`;
}

function setBlock(def, k, e, owners = null) {
  const types = R.ballTypes(def);
  const sc = R.setScore(e, types);
  const d = def.sets[k] && R.DISTANCES[def.sets[k]];
  const title = def.kind === 'eagle' ? 'Eagle balls' : `Set ${k + 1} · ${dn(d.key)}`;
  const sub = def.kind === 'eagle' ? '−2 if holed, then −1, E…' : d.range;
  const body = e.mode === 'quick' ? quickPicker(def, k, e) : e.balls.map((p, j) => ballRow(R.typeAt(types, j), j, k, p, owners && owners[j])).join('');
  return `<section class="set ${sc !== null ? 'complete' : ''}">
    <div class="set-head">
      <div><div class="set-title">${title}</div><div class="muted small">${sub}</div></div>
      ${scoreTag(sc, 'big')}
    </div>
    ${body}
    <button class="link" data-action="toggle-mode" data-k="${k}">${e.mode === 'quick' ? 'Score ball by ball' : 'Enter set score instead'}</button>
  </section>`;
}

function viewPlay(g) {
  const idx = R.currentStageIdx(g);
  const st = g.stages[idx];
  const def = R.stageDef(st);
  const active = pickActive(g, idx);
  const t = R.totals(g);
  const solo = g.players.length === 1;
  const me = meUnit(g);
  const coop = R.isCoop(g);

  const turns = st.order
    .map((pid, i) => {
      const sc = R.playerStageScore(g, idx, pid, { partial: true });
      const done = R.playerDone(g, idx, pid);
      const theme = R.isCoop(g) ? TEAM_THEMES[Object.keys(g.teams).indexOf(pid)].cls : '';
      return `<button class="turn ${theme} ${pid === active ? 'active' : ''} ${done ? 'done' : ''}" data-action="select-player" data-pid="${pid}" aria-pressed="${pid === active}">
        <span class="turn-n">${i + 1}</span>
        <span class="turn-name">${pid === st.kingId && !solo ? ICON.crown : ''}${esc(playerName(g, pid))}${pid === me ? ' <em class="you">you</em>' : ''}</span>
        <span class="turn-score">${done ? fs(sc) : sc !== null ? `${fs(sc)}…` : '—'}</span>
      </button>`;
    })
    .join('');

  const entries = st.entries[active];
  const types = R.ballTypes(def);
  const setsDone = entries.filter((e) => R.setScore(e, types) !== null).length;
  const complete = R.stageComplete(g, idx);
  const ai = st.order.indexOf(active);
  const nextPid = [...st.order.slice(ai + 1), ...st.order.slice(0, ai)].find((pid) => !R.playerDone(g, idx, pid));

  let dock;
  if (complete) dock = `<button class="btn primary big" data-action="finish-stage">Finish ${roundName(def)}</button>`;
  else if (R.playerDone(g, idx, active) && nextPid) dock = `<button class="btn primary big" data-action="select-player" data-pid="${nextPid}">Next: ${esc(playerName(g, nextPid))} ${ICON.chevron}</button>`;
  else if (def.kind === 'eagle' && entries[0].mode === 'balls') dock = `<button class="btn big" disabled>${entries[0].balls.filter((p) => p != null).length} of ${entries[0].balls.length} balls scored</button>`;
  else dock = `<button class="btn big" disabled>${setsDone} of ${entries.length} ${entries.length === 1 ? 'set' : 'sets'} scored</button>`;

  return `${topbar(stageTitle(def, g), 'home', gameRight(g))}
  <main class="page">
    ${def.kind === 'eagle' ? `<div class="banner eagle">🦅 ${isLastStage(g, idx) ? 'Final round' : 'Bonus round'}: Eagle round · leader putts first</div>` : def.kind === 'special' ? `<div class="banner special">${specialTitle(def)}</div>` : ''}
    <section class="king-card">
      <div class="king-crown">${ICON.crown}</div>
      <div class="king-body">
        <div class="king-label">${solo ? 'Set your own markers:' : 'Marker is set by current KOG:'}</div>
        <div class="king-name">${esc(playerName(g, st.kingId))}</div>
        <div class="muted small">${markerInfo(def, g)}</div>
        ${def.kind === 'eagle' ? '' : '<div class="muted small any-hole">Around any hole on the practice green.</div>'}
      </div>
    </section>
    ${solo ? '' : `<div class="section-head"><h2>Putting order</h2><button class="link" data-action="show-order">Who’s up?</button></div><div class="turns">${turns}</div>`}
    <section class="player-panel">
      <div class="panel-head">
        <h2>${esc(playerName(g, active))}</h2>
        <div class="panel-score"><span class="muted small">Round</span> ${scoreTag(R.playerStageScore(g, idx, active, { partial: true }))} <span class="muted small">Total</span> ${scoreTag(t[active])}</div>
      </div>
      <p class="hint">Score each ball by its own putts. The order you clean up in doesn’t change the score.</p>
      ${coop ? '<p class="hint">Duos: each ball shows which teammate putts it.</p>' : ''}
      ${entries.map((e, k) => setBlock(def, k, e, coop ? e.balls.map((_, j) => { const id = R.ballOwner(g, idx, active, k, j); return { name: personName(g, id), cls: personColor(g, id) }; }) : null)).join('')}
    </section>
  </main>
  <footer class="dock">${dock}</footer>`;
}

function leaderboard(g) {
  const s = R.standings(g);
  // A putt-off winner ranks ahead of the players they tied with.
  if (g.winnerId) s.unshift(...s.splice(s.findIndex((p) => p.id === g.winnerId), 1));
  const rank = (p) => (p.id === g.winnerId ? 1 : s.findIndex((x) => x.total === p.total && x.id !== g.winnerId) + 1);
  return `<ol class="board">${s
    .map((p) => `<li><span class="board-rank">${rank(p)}</span><span class="board-name">${p.id === g.winnerId ? `<span class="gold">${ICON.crown}</span>` : ''}${esc(p.name)}</span>${scoreTag(p.total)}</li>`)
    .join('')}</ol>`;
}

function viewSummary(g) {
  const idx = R.currentStageIdx(g);
  const st = g.stages[idx];
  const def = R.stageDef(st);
  const res = st.result;
  const solo = g.players.length === 1;
  const next = R.stagesFor(g)[idx + 1];
  const rows = [...g.players]
    .sort((a, b) => res.scores[a.id] - res.scores[b.id])
    .map((p) => `<li><span class="board-name">${p.id === res.nextKingId && !solo ? `<span class="gold">${ICON.crown}</span>` : ''}${esc(p.name)}</span>${scoreTag(res.scores[p.id])}</li>`)
    .join('');
  const what = def.kind === 'eagle' ? 'Eagle score' : 'round';
  let note = '';
  if (!solo) {
    const nk = esc(playerName(g, res.nextKingId));
    const team = R.isCoop(g);
    if (res.kingKept) note = `Tie for the low ${what}. <b>${nk}</b> ${team ? 'stay' : 'stays'} KOG.`;
    else if (res.nextKingId === st.kingId) note = `<b>${nk}</b> had the low ${what} and ${team ? 'stay' : 'stays'} KOG.`;
    else note = `<b>${nk}</b> had the low ${what} and ${team ? 'are' : 'is'} the new KOG.`;
  }
  const order = next.kind === 'eagle' ? 'The leader putts first, so trailing players get to read the green.' : 'The leader (lowest total) putts first.';
  return `${topbar(`${roundName(def)} done`, 'home', gameRight(g))}
  <main class="page">
    ${note ? `<section class="card callout">${ICON.crown}<div>${note}</div></section>` : ''}
    <div class="section-head"><h2>${def.kind === 'eagle' ? 'Eagle scores' : 'This round'}</h2></div>
    <ol class="board plain">${rows}</ol>
    <div class="section-head"><h2>Leaderboard</h2></div>
    ${leaderboard(g)}
    <section class="card next ${next.kind}">
      <div class="eyebrow">Up next</div>
      <div class="next-title">${next.kind === 'eagle' ? `${roundName(next)} · 🦅 Eagle round${isLastStage(g, idx + 1) ? ' (final)' : ' (bonus)'}` : `${roundName(next)}${next.kind === 'special' ? ` · ${specialTitle(next)}` : ''}`}</div>
      <p class="muted small">${markerInfo(next, g)}</p>
      ${next.kind === 'eagle' ? '' : '<p class="muted small">Around any hole the KOG picks.</p>'}
      ${solo ? '' : `<p class="muted small">${order}</p>`}
    </section>
    ${nextRoundFigure(next)}
  </main>
  <footer class="dock row">
    <button class="btn" data-action="reopen">Edit scores</button>
    <button class="btn primary" data-action="next-stage">Start ${roundName(next)}</button>
  </footer>`;
}

function viewFinal(g) {
  const s = R.standings(g);
  if (g.status === 'puttoff') {
    const toss = g.tieTosses || 1;
    const coop = R.isCoop(g);
    // Who putts: the tied players, or in co-op everyone on the tied teams.
    const putters = coop ? g.tiedIds.flatMap((t) => g.teams[t]) : g.tiedIds.map((id) => ({ id, name: playerName(g, id) }));
    const buttons = putters
      .map((p) => `<button class="rank-btn" data-action="tiebreak-win" data-pid="${p.id}">
        <span class="rank-name">${coop ? `<span class="ball-owner inline ${personColor(g, p.id)}">${esc(p.name)}</span> <span class="muted small">${esc(playerName(g, R.unitOf(g, p.id)))}</span>` : esc(p.name)}</span>${ICON.chevron}</button>`)
      .join('');
    const names = g.tiedIds.map((id) => `<b>${esc(playerName(g, id))}</b>`).join(', ').replace(/, ([^,]*)$/, ' and $1');
    return `${topbar('Tie-breaker', 'home', gameRight(g))}
    <main class="page">
      <section class="card callout">${ICON.crown}<div>${names} are tied for the lead at <b>${fs(s[0].total)}</b>. One toss decides it.</div></section>
      <section class="card">
        <ol class="steps">
          <li>Toss a ball onto the green. Where it lands is the marker.</li>
          <li>${coop ? 'Everyone on the tied teams' : 'Each tied player'} putts once from there to the hole furthest from it.</li>
          <li>Closest to the hole wins${coop ? ' it for their team' : ''}. Too close to call? Toss again.</li>
        </ol>
      </section>
      ${tiebreakFigure()}
      <div class="section-head"><h2>Toss ${toss}: who was closest?</h2></div>
      <div class="rank-list">${buttons}</div>
      <button class="btn wide" data-action="tiebreak-retoss">Too close to call: toss again</button>
      <div class="section-head"><h2>Final totals</h2></div>
      ${leaderboard(g)}
    </main>
    <footer class="dock row"><button class="btn" data-action="reopen">Edit ${roundName(R.stageDef(g.stages[R.currentStageIdx(g)]))}</button><button class="btn" data-action="nav" data-view="card" data-game="${g.id}" data-back="game">Scorecard</button></footer>`;
  }
  const w = s.find((p) => p.id === g.winnerId);
  return `${topbar('Final', 'home', gameRight(g))}
  <main class="page">
    <section class="winner">
      <div class="hero-crown">${ICON.crown}</div>
      <div class="eyebrow">King of the Greens</div>
      <div class="winner-name">${esc(w.name)}</div>
      <div>${scoreTag(w.total, 'big')}${g.puttOff ? ` <span class="muted small">won the tie-breaker${(g.tieTosses || 1) > 1 ? ` on toss ${g.tieTosses}` : ''}</span>` : ''}</div>
    </section>
    <div class="section-head"><h2>Final standings</h2></div>
    ${leaderboard(g)}
    <div class="stack">
      <button class="btn" data-action="nav" data-view="card" data-game="${g.id}" data-back="game">Scorecard</button>
      <button class="btn ghost" data-action="reopen">Edit ${roundName(R.stageDef(g.stages[R.currentStageIdx(g)]))}</button>
    </div>
  </main>
  <footer class="dock row">
    <button class="btn" data-action="rematch">Rematch</button>
    <button class="btn primary" data-action="close-game">Done</button>
  </footer>`;
}

function viewGame() {
  const g = activeGame();
  if (!g) return viewHome();
  if (g.status === 'toss') return viewToss(g);
  if (g.status === 'playing') return viewPlay(g);
  if (g.status === 'summary') return viewSummary(g);
  return viewFinal(g);
}

function viewCard() {
  const g = db.games.find((x) => x.id === ui.params.game);
  if (!g) return viewHome();
  const back = ui.params.back || 'history';
  const rows = ['S', 'M', 'L'];
  const t = R.totals(g);
  const stages = R.stagesFor(g);
  const head = `<tr><th class="sticky"></th>${stages.map((d) => `<th class="${d.kind}">${d.kind === 'eagle' ? `${d.num ? d.col : ''}<small>🦅</small>` : d.col}${d.kind === 'special' ? `<small>${dn(d.sets[0])}</small>` : ''}</th>`).join('')}<th class="tot">Total</th></tr>`;
  const blocks = g.players
    .map((p) => {
      const body = rows
        .map((key, r) => {
          let byDist = null;
          const cells = stages.map((def, i) => {
            const st = g.stages[i];
            if (def.kind === 'eagle') {
              if (r > 0) return '';
              const v = st ? R.playerStageScore(g, i, p.id, { partial: true }) : null;
              return `<td rowspan="3" class="eagle">${st && v !== null ? fs(v) : ''}</td>`;
            }
            if (!st) return `<td class="${def.kind}"></td>`;
            const types = R.ballTypes(def);
            st.entries[p.id].forEach((e, k) => {
              const sc = R.setScore(e, types);
              if (def.sets[k] === key && sc !== null) byDist = (byDist ?? 0) + sc;
            });
            const v = R.setScore(st.entries[p.id][r], types);
            return `<td class="${def.kind} ${scoreClass(v)}">${v === null ? '' : fs(v)}</td>`;
          }).join('');
          return `<tr><th class="sticky">${dn(key)}</th>${cells}<td class="tot">${fs(byDist)}</td></tr>`;
        })
        .join('');
      const roundRow = stages.map((def, i) => {
        const v = g.stages[i] ? R.playerStageScore(g, i, p.id, { partial: true }) : null;
        return `<td class="${def.kind} ${scoreClass(v)}">${v === null ? '' : fs(v)}</td>`;
      }).join('');
      return `<div class="sc-block">
        ${R.isCoop(g)
          ? (() => { const ti = Object.keys(g.teams).indexOf(p.id); return `<div class="sc-name team-bar team-${ti + 1} ${TEAM_THEMES[ti].cls}">${teamCards(ti, 'mini')}<span class="team-names"><span class="team-label">${TEAM_THEMES[ti].name}</span><span>${g.winnerId === p.id ? ICON.crown : ''}${g.teams[p.id].map((m) => esc(m.name)).join(' &amp; ')}</span></span><span class="sc-total">${scoreTag(t[p.id])}</span></div>`; })()
          : `<div class="sc-name">${g.winnerId === p.id ? `<span class="gold">${ICON.crown}</span>` : ''}${esc(p.name)} <span class="sc-total">${scoreTag(t[p.id])}</span></div>`}
        <div class="sc-scroll"><table class="sc">
          <thead>${head}</thead>
          <tbody>${body}<tr class="round-row"><th class="sticky">Round</th>${roundRow}<td class="tot">${fs(t[p.id])}</td></tr></tbody>
        </table></div>
      </div>`;
    })
    .join('');
  const canDelete = back === 'history';
  return `${topbar('Scorecard', back === 'game' ? 'game' : 'history')}
  <main class="page">
    <div class="card-meta">${g.course ? `<b>${esc(g.course)}</b> · ` : ''}${fmtDate(g.date)}${g.sync ? ` · live game ${g.sync.code}` : ''}</div>
    ${blocks}
    <p class="muted small">In the Short, Medium and Long rounds (R2, R4, R6) the three rows are sets 1–3, all the same distance. Distance totals add them where they belong.</p>
    ${canDelete ? `<button class="btn ghost danger" data-action="delete-game" data-game="${g.id}">Delete this game</button>` : ''}
  </main>`;
}

/** A player's round picture: their photo, or their initial. */
function avatarHtml(p, cls = '') {
  if (p && p.photo) return `<img class="avatar photo ${cls}" src="${p.photo}" alt="">`;
  return `<span class="avatar ${cls}">${esc((p ? p.name : '?').slice(0, 1).toUpperCase())}</span>`;
}

function viewPlayers() {
  const list = db.players
    .map((p) => {
      const s = R.playerStats(db.games, idsOf(p));
      return `<button class="list-row" data-action="nav" data-view="player" data-pid="${p.id}">
        ${avatarHtml(p)}
        <span class="list-main"><span class="list-title">${esc(p.name)}</span><span class="muted small">${s.games} ${s.games === 1 ? 'game' : 'games'} · ${s.wins} ${s.wins === 1 ? 'win' : 'wins'}${s.avg != null ? ` · avg ${avgText(s.avg)}` : ''}</span></span>
        ${ICON.chevron}
      </button>`;
    })
    .join('');
  return `${topbar('Players & stats')}
  <main class="page">
    ${db.players.length ? `<div class="list">${list}</div>` : '<p class="muted">No players yet. Add one below or start a game.</p>'}
    ${addPlayerForm(false)}
    <section class="card soon">
      <div class="eyebrow">Coming next</div>
      <p class="small">Accounts (Google, Apple or phone number), friends from your contacts, and your friends’ stats.</p>
    </section>
  </main>`;
}

function viewPlayer() {
  const p = db.players.find((x) => x.id === ui.params.pid);
  if (!p) return viewPlayers();
  const s = R.playerStats(db.games, idsOf(p));
  const tile = (label, val) => `<div class="tile"><div class="tile-val">${val}</div><div class="tile-label">${label}</div></div>`;
  // First putts from each distance: birdie balls and the par ball together.
  const qs = Q.quickStats(db.quick, idsOf(p)); // Quick Play putts count too
  const firstPutts = (k) => {
    const b = s.byDist[k];
    return [b.birdie[0] + b.par[0] + qs.byDist[k][0], b.birdie[1] + b.par[1] + qs.byDist[k][1]];
  };
  const pctTile = (label, [made, tries], noun) => `<div class="pct-tile">
      <div class="pct-label">${label}</div>
      <div class="pct-val">${tries ? `${Math.round((made / tries) * 100)}%` : '—'}</div>
      <div class="pct-sub">${tries ? `(${made} of ${tries} ${noun} putts made)` : `(no ${noun} putts yet)`}</div>
    </div>`;
  const ballRows = Object.values(R.DISTANCES)
    .map((d) => {
      const b = s.byDist[d.key];
      return `<tr><th>${dn(d.key)}<small>${d.range}</small></th><td>${pctText(b.birdiePct)}<small>${b.birdie[0]}/${b.birdie[1]}</small></td><td>${pctText(b.parPct)}<small>${b.par[0]}/${b.par[1]}</small></td><td>${avgText(b.avgSet)}</td></tr>`;
    })
    .join('');
  return `${topbar(esc(p.name), 'players')}
  <main class="page">
    <section class="profile-head">
      ${avatarHtml(p, 'xl')}
      <div class="profile-actions">
        <label class="btn small-btn">${p.photo ? 'Change photo' : 'Add photo'}<input type="file" accept="image/*" class="visually-hidden" data-photo-pid="${p.id}"></label>
        ${p.photo ? `<button class="btn ghost small-btn" data-action="remove-photo" data-pid="${p.id}">Remove</button>` : ''}
      </div>
    </section>
    ${qs.sessions ? `<p class="muted small">Includes ${qs.sessions} Quick Play ${qs.sessions === 1 ? 'session' : 'sessions'}${qs.wins ? ` (${qs.wins} head-to-head ${qs.wins === 1 ? 'win' : 'wins'})` : ''}.</p>` : ''}
    ${(() => {
      const ls = L.lagStats(db.lag, idsOf(p));
      return ls.games ? `<p class="muted small">${L.GAME_NAME}: ${ls.wins} ${ls.wins === 1 ? 'win' : 'wins'} in ${ls.games} ${ls.games === 1 ? 'game' : 'games'}, ${ls.holed} of ${ls.balls} lag putts holed.</p>` : '';
    })()}
    ${winSection(overallRecord(idsOf(p)), { wins: 0, games: 0, signedOut: true })}
    <div class="section-head"><h2>Putts made</h2><span class="muted small">first putt from each spot</span></div>
    <div class="pct-grid">
      ${pctTile(dn('S'), firstPutts('S'), 'short')}
      ${pctTile(dn('M'), firstPutts('M'), 'medium')}
      ${pctTile(dn('L'), firstPutts('L'), 'long')}
      ${pctTile('<span class="d-E">Eagle</span>', s.eagle, 'eagle')}
    </div>
    <div class="tiles">
      ${tile('Games', s.games)}
      ${tile('Wins', s.wins)}
      ${tile('Avg score', avgText(s.avg))}
      ${tile('Best', s.best == null ? '—' : fs(s.best))}
      ${tile('Rounds as KOG', s.kingRounds)}
      ${tile('Rounds won', s.roundWins)}
      ${tile('3+ putt balls', s.threePlus + qs.threePlus)}
      ${tile('Balls tracked', s.balls + qs.balls)}
    </div>
    <div class="section-head"><h2>Birdie balls vs. par ball</h2></div>
    <table class="stats">
      <thead><tr><th></th><th>Birdie balls</th><th>Par ball</th><th>Avg set</th></tr></thead>
      <tbody>${ballRows}</tbody>
    </table>
    <p class="muted small">Stats count finished games only. Sets entered as a typed-in score count toward totals but not make percentages.</p>
    <div class="stack">
      <button class="btn" data-action="rename-player" data-pid="${p.id}">Rename</button>
      <button class="btn ghost danger" data-action="delete-player" data-pid="${p.id}">Remove player</button>
    </div>
  </main>`;
}

// ---------- Quick Play (Compass) ----------
const activeQuick = () => db.quick.find((q) => q.id === db.activeQuickId) || null;
const distList = (dists) => dists.map((d) => dn(d)).join(', ');
const qName = (q, pid) => (q.players.find((x) => x.id === pid) || { name: '?' }).name;
const qTitle = (q) => q.players.map((x) => x.name).join(' vs ');

function quickResumeCard() {
  const q = activeQuick();
  if (!q) return '';
  const done = q.status === 'done';
  return `<section class="card resume">
    <div>
      <div class="eyebrow">${done ? 'Quick Play · finished' : 'Quick Play in progress'}</div>
      <div class="resume-title">Compass · ${esc(qTitle(q))}</div>
      <div class="muted small">${distList(q.dists)}</div>
    </div>
    <div class="resume-actions">
      <button class="btn primary" data-action="nav" data-view="quick">${done ? 'View' : 'Resume'}</button>
      ${done ? '<button class="btn ghost small-btn" data-action="quick-close">Close</button>' : '<button class="btn ghost small-btn danger" data-action="quick-delete">Delete</button>'}
    </div>
  </section>`;
}

function viewQuickSetup() {
  const d = ui.qdraft;
  const opts = Object.values(R.DISTANCES)
    .map((x) => `<button class="dist-opt" data-action="quick-dist" data-d="${x.key}" aria-pressed="${d.dists.includes(x.key)}">${dn(x.key)}<small>${x.range}</small></button>`)
    .join('');
  const full = d.pids.length >= Q.MAX_PLAYERS;
  const chips = db.players
    .map((pl) => {
      const i = d.pids.indexOf(pl.id);
      return `<button class="chip ${i >= 0 ? 'on' : ''}" data-action="quick-player" data-pid="${pl.id}" ${i < 0 && full ? 'disabled' : ''} aria-pressed="${i >= 0}">${i >= 0 && d.pids.length > 1 ? `<b class="chip-n">${i + 1}</b>` : ''}${esc(pl.name)}</button>`;
    })
    .join('');
  const n = d.dists.length;
  const players = d.pids.length;
  const balls = n * 12;
  const ready = n && players;
  return `${topbar('Quick Play')}
  <main class="page">
    <p><b>Compass.</b> Put 4 tees around one hole: north, east, south and west. Putt 3 balls from each tee. Every ball is a birdie ball: −1 if it drops, E in two, +1 in three.</p>
    ${compassFigure(d.dists[0] || 'M', 0)}
    <div class="section-head"><h2>Distances</h2><span class="muted small">pick any mix</span></div>
    <div class="dist-pick" role="group" aria-label="Distances">${opts}</div>
    <p class="muted small">${n ? `${balls} balls each, about ${Math.max(4, n * 4 * Math.max(1, players))} minutes${players > 1 ? ` for ${players} players` : ''}.` : 'Pick at least one distance.'}</p>
    <div class="section-head"><h2>Who’s putting?</h2><span class="muted">${players}/${Q.MAX_PLAYERS}</span></div>
    ${db.players.length ? `<div class="chips">${chips}</div>` : '<p class="muted">Add your name.</p>'}
    ${addPlayerForm(full)}
    <p class="muted small">${players > 1 ? 'Head-to-head: a toss decides who putts first, and the order rotates every tee so everyone leads equally.' : 'Pick one player to practice solo, or 2–4 to go head-to-head.'}</p>
  </main>
  <footer class="dock">
    <button class="btn primary big" data-action="quick-start" ${ready ? '' : 'disabled'}>${!n ? 'Pick a distance' : !players ? 'Pick who’s putting' : players > 1 ? 'Start head-to-head' : 'Start Compass'}</button>
  </footer>`;
}

function viewQuickToss(q) {
  const rank = ui.qtoss || [];
  const done = rank.length === q.players.length;
  const list = q.players
    .map((pl) => {
      const i = rank.indexOf(pl.id);
      return `<button class="rank-btn ${i >= 0 ? 'on' : ''}" data-action="qtoss-pick" data-pid="${pl.id}" ${i >= 0 ? 'disabled' : ''}>
        <span class="rank-num">${i >= 0 ? i + 1 : ''}</span><span class="rank-name">${esc(pl.name)}</span>
        ${i === 0 ? '<span class="tag gold">Putts first</span>' : ''}
      </button>`;
    })
    .join('');
  return `${topbar('Compass toss', 'home')}
  <main class="page">
    <section class="card">
      <ol class="steps">
        <li>Someone tosses a ball onto the green.</li>
        <li>Everyone putts from that spot to the hole furthest from it.</li>
        <li>Tap players from <b>closest</b> to <b>furthest</b>. Closest putts first at the first tee.</li>
      </ol>
    </section>
    <div class="rank-list">${list}</div>
    <p class="muted small center">After that, the order rotates every tee so everyone leads equally.</p>
  </main>
  <footer class="dock row">
    <button class="btn" data-action="qtoss-reset" ${rank.length ? '' : 'disabled'}>Reset</button>
    <button class="btn primary" data-action="qtoss-confirm" ${done ? '' : 'disabled'}>Start putting</button>
  </footer>`;
}

function quickBallRow(pid, d, t, j, putts) {
  const sc = R.ballScore('birdie', putts);
  const made = putts === 1;
  const missed = putts >= 2;
  const a = `data-p="${pid}" data-d="${d}" data-t="${t}" data-j="${j}"`;
  return `<div class="ball ${putts != null ? 'is-set' : ''}">
    <div class="ball-main">
      <span class="dot birdie" aria-hidden="true"></span>
      <span class="ball-label">Ball ${j + 1}</span>
      <div class="seg" role="group" aria-label="Ball ${j + 1}">
        <button class="seg-btn in ${made ? 'on' : ''}" aria-pressed="${made}" data-action="qball" ${a} data-v="in">In</button>
        <button class="seg-btn miss ${missed ? 'on' : ''}" aria-pressed="${missed}" data-action="qball" ${a} data-v="miss">Miss</button>
      </div>
      <span class="ball-score">${sc === null ? '' : scoreTag(sc)}</span>
    </div>
    ${missed ? `<div class="holeout">
      <span class="muted small">Holed out in</span>
      <div class="stepper">
        <button data-action="qball" ${a} data-v="dec" ${putts <= 2 ? 'disabled' : ''} aria-label="One fewer putt">−</button>
        <span class="stepper-val">${putts} putts</span>
        <button data-action="qball" ${a} data-v="inc" aria-label="One more putt">+</button>
      </div>
    </div>` : ''}
  </div>`;
}

/** The tee on screen: the one picked, else the first unfinished tee at this distance. */
function currentTee(q, d) {
  if (ui.qtee != null && ui.qtee >= 0 && ui.qtee < Q.TEES.length) return ui.qtee;
  const t = Q.TEES.findIndex((_, i) => !Q.teeDone(q, d, i));
  return t >= 0 ? t : Q.TEES.length - 1;
}

function viewQuick() {
  const q = activeQuick();
  if (!q) return viewHome();
  if (q.status === 'toss') return viewQuickToss(q);
  if (q.status === 'tiebreak') return viewQuickTiebreak(q);
  if (q.status === 'done') return viewQuickResult(q);
  const solo = q.players.length === 1;
  const step = Math.min(ui.qstep || 0, q.dists.length - 1);
  const d = q.dists[step];
  const t = currentTee(q, d);
  const order = Q.teeOrder(q, d, t);
  const distTabs = q.dists
    .map((x, i) => `<button class="chip ${i === step ? 'on' : ''}" data-action="quick-tab" data-i="${i}" aria-pressed="${i === step}">${Q.distDone(q, x) ? '✓ ' : ''}${R.DISTANCES[x].name}</button>`)
    .join('');
  const teeTabs = Q.TEES
    .map((name, i) => `<button class="chip ${i === t ? 'on' : ''}" data-action="quick-tee" data-t="${i}" aria-pressed="${i === t}">${Q.teeDone(q, d, i) ? '✓ ' : ''}${name}</button>`)
    .join('');
  const blocks = order
    .map((pid, i) => `<section class="set ${Q.teeScore(q, pid, d, t) !== null ? 'complete' : ''}">
      <div class="set-head">
        <div><div class="set-title">${solo ? `${Q.TEES[t]} tee` : `${ordinal(i + 1)} · ${esc(qName(q, pid))}`}</div><div class="muted small">${dn(d)} · ${R.DISTANCES[d].range}</div></div>
        ${scoreTag(Q.teeScore(q, pid, d, t, { partial: true }), 'big')}
      </div>
      ${q.tees[pid][d][t].map((pt, j) => quickBallRow(pid, d, t, j, pt)).join('')}
    </section>`)
    .join('');
  const board = solo
    ? `<div class="quick-total"><span><b>${esc(q.players[0].name)}</b></span><span class="muted small">Total ${scoreTag(Q.playerScore(q, q.players[0].id, { partial: true }))}</span></div>`
    : `<ol class="board plain mini-board">${Q.standings(q).map((x, i) => `<li><span class="board-rank">${i + 1}</span><span class="board-name">${esc(x.name)}</span>${scoreTag(Q.playerScore(q, x.id, { partial: true }))}</li>`).join('')}</ol>`;
  const nextTee = Q.TEES.findIndex((_, i) => i !== t && !Q.teeDone(q, d, i));
  const nextDist = q.dists.findIndex((x, i) => i !== step && !Q.distDone(q, x));
  const atTee = order.reduce((n, pid) => n + q.tees[pid][d][t].filter((x) => x != null).length, 0);
  let dock;
  if (Q.quickDone(q)) dock = `<button class="btn primary big" data-action="quick-finish">${solo ? 'See my score' : 'See who won'}</button>`;
  else if (Q.teeDone(q, d, t) && nextTee >= 0) dock = `<button class="btn primary big" data-action="quick-tee" data-t="${nextTee}">Next: ${Q.TEES[nextTee]} tee ${ICON.chevron}</button>`;
  else if (Q.distDone(q, d) && nextDist >= 0) dock = `<button class="btn primary big" data-action="quick-tab" data-i="${nextDist}">Next: ${R.DISTANCES[q.dists[nextDist]].name} ${ICON.chevron}</button>`;
  else dock = `<button class="btn big" disabled>${atTee} of ${order.length * Q.BALLS_PER_TEE} balls at this tee</button>`;
  return `${topbar(solo ? 'Compass' : 'Compass · head-to-head')}
  <main class="page">
    ${q.dists.length > 1 ? `<div class="quick-tabs">${distTabs}</div>` : ''}
    <div class="quick-tabs tee-tabs">${teeTabs}</div>
    ${compassFigure(d, t, `<b>${Q.TEES[t]}</b> tee: ${dn(d)}, ${R.DISTANCES[d].range} from the hole.${solo ? '' : ` ${esc(qName(q, order[0]))} putts first here.`}`)}
    ${board}
    ${blocks}
  </main>
  <footer class="dock">${dock}</footer>`;
}

function viewQuickTiebreak(q) {
  const names = q.tiedIds.map((id) => `<b>${esc(qName(q, id))}</b>`).join(', ').replace(/, ([^,]*)$/, ' and $1');
  const total = Q.playerScore(q, q.tiedIds[0]);
  const buttons = q.tiedIds.map((id) => `<button class="rank-btn" data-action="qtb-win" data-pid="${id}"><span class="rank-name">${esc(qName(q, id))}</span>${ICON.chevron}</button>`).join('');
  return `${topbar('Tie-breaker', 'home')}
  <main class="page">
    <section class="card callout">${ICON.crown}<div>${names} are tied at <b>${fs(total)}</b>. One toss decides it.</div></section>
    <section class="card">
      <ol class="steps">
        <li>Toss a ball onto the green. Where it lands is the marker.</li>
        <li>Each tied player putts once from there to the hole furthest from it.</li>
        <li>Closest to the hole wins. Too close to call? Toss again.</li>
      </ol>
    </section>
    ${tiebreakFigure()}
    <div class="section-head"><h2>Toss ${q.tieTosses}: who was closest?</h2></div>
    <div class="rank-list">${buttons}</div>
    <button class="btn wide" data-action="qtb-retoss">Too close to call: toss again</button>
  </main>`;
}

function viewQuickResult(q) {
  const solo = q.players.length === 1;
  const made = (pid) => {
    const all = q.dists.flatMap((d) => q.tees[pid][d].flat());
    return [all.filter((x) => x === 1).length, all.length];
  };
  if (solo) {
    const pid = q.players[0].id;
    const [m, n] = made(pid);
    const rows = q.dists
      .map((d) => `<li><span class="board-name">${dn(d)} <span class="muted small">${q.tees[pid][d].flat().filter((x) => x === 1).length} of ${q.tees[pid][d].flat().length} made</span></span>${scoreTag(Q.distScore(q, pid, d))}</li>`)
      .join('');
    return `${topbar('Compass')}
    <main class="page">
      <section class="result-big">
        <div class="eyebrow">${esc(q.players[0].name)} · ${distList(q.dists)}</div>
        ${scoreTag(Q.playerScore(q, pid), 'big')}
        <p class="muted">${m} of ${n} putts made on the first try (${Math.round((m / n) * 100)}%).</p>
      </section>
      <ol class="board plain">${rows}</ol>
      <p class="muted small">These putts count toward ${esc(q.players[0].name)}’s stats.</p>
    </main>
    <footer class="dock row"><button class="btn" data-action="quick-again">Play again</button><button class="btn primary" data-action="quick-close">Done</button></footer>`;
  }
  const s = Q.standings(q);
  // A tie-breaker winner ranks ahead of the players they tied with.
  s.unshift(...s.splice(s.findIndex((x) => x.id === q.winnerId), 1));
  const rows = s
    .map((x, i) => {
      const [m, n] = made(x.id);
      return `<li><span class="board-rank">${i + 1}</span><span class="board-name">${x.id === q.winnerId ? `<span class="gold">${ICON.crown}</span>` : ''}${esc(x.name)} <span class="muted small">${m} of ${n} made</span></span>${scoreTag(x.total)}</li>`;
    })
    .join('');
  const w = s[0];
  return `${topbar('Compass · head-to-head')}
  <main class="page">
    <section class="winner">
      <div class="hero-crown">${ICON.crown}</div>
      <div class="eyebrow">Compass winner · ${distList(q.dists)}</div>
      <div class="winner-name">${esc(w.name)}</div>
      <div>${scoreTag(w.total, 'big')}${q.tieTosses ? ` <span class="muted small">won the tie-breaker${q.tieTosses > 1 ? ` on toss ${q.tieTosses}` : ''}</span>` : ''}</div>
    </section>
    <ol class="board">${rows}</ol>
    <p class="muted small">Everyone’s putts count toward their own stats.</p>
  </main>
  <footer class="dock row"><button class="btn" data-action="quick-again">Rematch</button><button class="btn primary" data-action="quick-close">Done</button></footer>`;
}

// ---------- Lag 21 ----------
const activeLag = () => db.lag.find((x) => x.id === db.activeLagId) || null;
const sideClass = (lag, sid) => `side-${lag.sides.findIndex((x) => x.id === sid) + 1}`;
const sideName = (lag, sid) => (lag.sides.find((x) => x.id === sid) || { name: '?' }).name;
const ldraftSides = (d) => {
  const pick = (id) => db.players.find((x) => x.id === id);
  if (d.pids.length === 2) return d.pids.map((id) => [pick(id)]);
  return PAIRINGS[d.pair || 0].map((team) => team.map((i) => pick(d.pids[i])));
};

function lagResumeCard() {
  const lag = activeLag();
  if (!lag) return '';
  const done = lag.status === 'done';
  const sc = L.scores(lag);
  return `<section class="card resume">
    <div>
      <div class="eyebrow">${L.GAME_NAME} ${done ? '· finished' : 'in progress'}</div>
      <div class="resume-title">${esc(lag.sides[0].name)} ${sc[lag.sides[0].id]} – ${sc[lag.sides[1].id]} ${esc(lag.sides[1].name)}</div>
    </div>
    <div class="resume-actions">
      <button class="btn primary" data-action="nav" data-view="lag">${done ? 'View' : 'Resume'}</button>
      ${done ? '<button class="btn ghost small-btn" data-action="lag-close">Close</button>' : '<button class="btn ghost small-btn danger" data-action="lag-delete">Delete</button>'}
    </div>
  </section>`;
}

function viewLagSetup() {
  const d = ui.ldraft;
  const n = d.pids.length;
  const full = n >= 4;
  const chips = db.players
    .map((pl) => {
      const i = d.pids.indexOf(pl.id);
      return `<button class="chip ${i >= 0 ? 'on' : ''}" data-action="lag-player" data-pid="${pl.id}" ${i < 0 && full ? 'disabled' : ''} aria-pressed="${i >= 0}">${i >= 0 ? `<b class="chip-n">${i + 1}</b>` : ''}${esc(pl.name)}</button>`;
    })
    .join('');
  const ready = n === 2 || n === 4;
  let teams = '';
  if (ready) {
    const [a, b] = ldraftSides(d);
    teams = `<section class="card teams">
      <div class="team-row">
        <div class="team side-1"><b>${a.map((x) => esc(x.name)).join(' &amp; ')}</b></div>
        <span class="vs">vs</span>
        <div class="team side-2"><b>${b.map((x) => esc(x.name)).join(' &amp; ')}</b></div>
      </div>
      ${n === 4 ? '<button class="btn small-btn" data-action="lag-pairs">Switch teammates</button>' : ''}
    </section>`;
  }
  return `${topbar(L.GAME_NAME)}
  <main class="page">
    <p>Lag putting, cornhole-style. Pick a hole and a spot 25–35 ft away. Both sides putt 4 balls per frame, taking turns, and you can knock the other side’s ball away.</p>
    ${lagFigure()}
    <div class="section-head"><h2>Who’s playing?</h2><span class="muted">${n}/4</span></div>
    ${db.players.length ? `<div class="chips">${chips}</div>` : '<p class="muted">Add the players.</p>'}
    ${addPlayerForm(full)}
    <p class="muted small">Pick 2 players for 1 v 1, or 4 for 2 v 2.</p>
    ${teams}
  </main>
  <footer class="dock">
    <button class="btn primary big" data-action="lag-start" ${ready ? '' : 'disabled'}>${ready ? `Start ${L.GAME_NAME}` : n < 2 ? 'Pick 2 or 4 players' : 'Pick 2 or 4 players'}</button>
  </footer>`;
}

function lagScoreboard(lag) {
  const sc = L.scores(lag);
  return `<section class="lag-board">
    ${lag.sides.map((sd) => `<div class="lag-side ${sideClass(lag, sd.id)} ${lag.winnerId === sd.id ? 'won' : ''}">
      <div class="lag-name">${lag.winnerId === sd.id ? ICON.crown : ''}${esc(sd.name)}</div>
      <div class="lag-score">${sc[sd.id]}</div>
    </div>`).join('<div class="lag-to">first to ' + L.TARGET + '</div>')}
  </section>`;
}

function viewLag() {
  const lag = activeLag();
  if (!lag) return viewHome();
  if (lag.status === 'first') {
    return `${topbar(L.GAME_NAME)}
    <main class="page">
      ${lagScoreboard(lag)}
      <p class="prompt">Who putts first?</p>
      <p class="muted small center">Flip a coin, or everyone lags one ball: closest goes first.</p>
      <div class="rank-list">${lag.sides.map((sd) => `<button class="rank-btn" data-action="lag-first" data-sid="${sd.id}"><span class="rank-name ${sideClass(lag, sd.id)}-text">${esc(sd.name)}</span>${ICON.chevron}</button>`).join('')}</div>
      ${lagFigure()}
    </main>`;
  }
  if (lag.status === 'done') return viewLagResult(lag);
  const f = L.currentFrame(lag);
  const order = L.putOrder(lag, f);
  const rows = (sd) => f.balls[sd.id]
    .map((v, j) => {
      const who = sd.members[j % sd.members.length];
      const zones = L.ZONES.map((z) => `<button class="zone-btn ${v === z.v ? 'on' : ''} zone-${z.key}" aria-pressed="${v === z.v}" data-action="lball" data-s="${sd.id}" data-j="${j}" data-v="${z.v}"><b>${z.short}</b><small>${z.v}</small></button>`).join('');
      return `<div class="ball lag-ball">
        <div class="lag-ball-label">Ball ${j + 1}${sd.members.length > 1 ? ` · <span class="${sideClass(lag, sd.id)}-text">${esc(who.name)}</span>` : ''}</div>
        <div class="zone-seg" role="group" aria-label="Ball ${j + 1}">${zones}</div>
      </div>`;
    })
    .join('');
  const cards = [f.first, lag.sides.find((x) => x.id !== f.first).id]
    .map((sid) => {
      const sd = lag.sides.find((x) => x.id === sid);
      return `<section class="set">
        <div class="set-head"><div><div class="set-title ${sideClass(lag, sid)}-text">${esc(sd.name)}</div><div class="muted small">${sd.members.length > 1 ? 'putt' : 'putts'} ${sid === f.first ? 'first' : 'second'}</div></div><span class="score big">${L.sidePoints(f, sid)}</span></div>
        ${rows(sd)}
      </section>`;
    })
    .join('');
  const marked = Object.values(f.balls).flat().filter((v) => v != null).length;
  const r = L.frameResult(lag, f);
  const preview = L.frameComplete(f)
    ? `<section class="card callout lag-preview">${ICON.target}<div>${r.scorer ? `<b>${esc(sideName(lag, r.scorer))}</b> score <b>${r.points}</b> (${r.raw[0]} – ${r.raw[1]})` : `A wash: ${r.raw[0]} – ${r.raw[1]}, nobody scores`}.</div></section>`
    : '';
  return `${topbar(`${L.GAME_NAME} · Frame ${lag.frames.length}`)}
  <main class="page">
    ${lagScoreboard(lag)}
    <p class="muted small">Order: ${order.map((o) => `<span class="${sideClass(lag, o.side)}-text">${esc(o.player.name)}</span>`).join(' → ')}</p>
    <p class="hint">After all 8 balls, mark where each one finished. Measure with a putter grip and a putter length.</p>
    ${cards}
    ${preview}
    ${lag.frames.length > 1 ? '<button class="link" data-action="lag-fix">Fix the last frame</button>' : ''}
  </main>
  <footer class="dock">${L.frameComplete(f) ? '<button class="btn primary big" data-action="lag-score">Score this frame</button>' : `<button class="btn big" disabled>${marked} of ${L.BALLS * 2} balls marked</button>`}</footer>`;
}

function viewLagResult(lag) {
  const w = lag.sides.find((x) => x.id === lag.winnerId);
  const sc = L.scores(lag);
  const frames = lag.frames
    .filter((f) => f.done)
    .map((f, i) => {
      const r = L.frameResult(lag, f);
      return `<li><span class="board-rank">${i + 1}</span><span class="board-name">${r.scorer ? `<span class="${sideClass(lag, r.scorer)}-text">${esc(sideName(lag, r.scorer))}</span>` : '<span class="muted">Wash</span>'}</span><span class="score">${r.scorer ? `+${r.points}` : '0'}</span></li>`;
    })
    .join('');
  return `${topbar(L.GAME_NAME)}
  <main class="page">
    <section class="winner">
      <div class="hero-crown">${ICON.crown}</div>
      <div class="eyebrow">${L.GAME_NAME} winner</div>
      <div class="winner-name">${esc(w.name)}</div>
      <div class="muted">${sc[lag.sides[0].id]} – ${sc[lag.sides[1].id]}</div>
    </section>
    <div class="section-head"><h2>Frame by frame</h2></div>
    <ol class="board plain">${frames}</ol>
    <button class="btn ghost wide" data-action="lag-fix">Fix the last frame</button>
  </main>
  <footer class="dock row"><button class="btn" data-action="lag-again">Rematch</button><button class="btn primary" data-action="lag-close">Done</button></footer>`;
}

function lagHistory() {
  const games = db.lag.filter((x) => x.status === 'done').sort((a, b) => b.date.localeCompare(a.date));
  if (!games.length) return '';
  const rows = games
    .map((x) => {
      const sc = L.scores(x);
      return `<div class="list-row static">
        <span class="avatar">${ICON.target}</span>
        <span class="list-main">
          <span class="list-title">${ICON.crown} ${esc(sideName(x, x.winnerId))}</span>
          <span class="muted small">${fmtDate(x.date)} · ${esc(x.sides[0].name)} ${sc[x.sides[0].id]} – ${sc[x.sides[1].id]} ${esc(x.sides[1].name)}</span>
        </span>
      </div>`;
    })
    .join('');
  return `<div class="section-head"><h2>${L.GAME_NAME}</h2></div><div class="list">${rows}</div>`;
}

// ---------- Ranked (preview) ----------
/** A typical MMR for a rank, for the calculator. */
const rankMid = (r) => (r.min === -Infinity ? RK.FLOOR - 20 : r.max === Infinity ? r.min + 20 : Math.round((r.min + r.max) / 2));

function duosCalculator() {
  const st = ui.rkd || (ui.rkd = { a1: 12, a2: 21, b1: 2, b2: 8, result: null }); // Silver III + Plat IV vs Copper III + Bronze II
  const opt = (sel) => RK.RANKS.map((r) => `<option value="${r.index}" ${r.index === sel ? 'selected' : ''}>${r.name}</option>`).reverse().join('');
  const pick = (k, label) => `<label class="field"><span>${label}</span><select data-rkd="${k}">${opt(st[k])}</select></label>`;
  let result = '';
  if (st.result) {
    const placed = (i) => ({ mmr: rankMid(RK.RANKS[i]), games: 40, rankIndex: i });
    const [ta, tb] = RK.rateTeams([placed(st.a1), placed(st.a2)], [placed(st.b1), placed(st.b2)], st.result === 'a' ? 1 : 0);
    const row = (i, r) => `<li><span class="board-name">${rankBadge(RK.RANKS[i], 26)} ${RK.RANKS[i].name}</span><span class="score ${r.change >= 0 ? 'under' : 'over'}">${r.change >= 0 ? '+' : '−'}${Math.abs(r.change)}</span></li>`;
    result = `<p class="muted small">${st.result === 'a' ? 'Team 1' : 'Team 2'} wins:</p>
      <ol class="board plain duo-result">${row(st.a1, ta[0])}${row(st.a2, ta[1])}<li class="duo-sep">vs</li>${row(st.b1, tb[0])}${row(st.b2, tb[1])}</ol>`;
  }
  return `<div class="section-head"><h2>Try a duos match</h2></div>
  <section class="card rk-calc">
    <div class="duo-grid">
      <div><div class="eyebrow">Team 1</div>${pick('a1', 'Player 1')}${pick('a2', 'Player 2')}</div>
      <div><div class="eyebrow">Team 2</div>${pick('b1', 'Player 3')}${pick('b2', 'Player 4')}</div>
    </div>
    <div class="row-btns"><button class="btn" data-action="rkd-play" data-v="a">Team 1 wins</button><button class="btn" data-action="rkd-play" data-v="b">Team 2 wins</button></div>
    ${result}
  </section>`;
}

function viewRanked() {
  const st = ui.rk || (ui.rk = { me: 14, opp: 19, placement: false, result: null });
  const opt = (sel) => RK.RANKS.map((r) => `<option value="${r.index}" ${r.index === sel ? 'selected' : ''}>${r.name}</option>`).reverse().join('');
  const me = RK.RANKS[st.me];
  const opp = RK.RANKS[st.opp];
  let result = '';
  if (st.result) {
    const mine = { mmr: rankMid(me), games: st.placement ? 3 : 40, rankIndex: st.placement ? null : me.index };
    const theirs = { mmr: rankMid(opp), games: 40, rankIndex: opp.index };
    const [a] = RK.rate1v1(mine, theirs, st.result === 'win' ? 1 : 0);
    const after = a.rankIndex != null ? RK.RANKS[a.rankIndex] : null;
    result = `<section class="card rk-result ${a.change >= 0 ? 'up' : 'down'}">
      <div class="rk-change">${a.change >= 0 ? '+' : '−'}${Math.abs(a.change)} <span>MMR</span></div>
      <p>${st.result === 'win' ? 'Win' : 'Loss'} against <b>${opp.name}</b> as ${st.placement ? 'a player in placements' : `<b>${me.name}</b>`}.${after && after.index !== me.index ? ` That moves you to <b>${after.name}</b>.` : ''}</p>
    </section>`;
  }
  const ladder = [...RK.TIERS]
    .reverse()
    .map((tier) => {
      const ranks = RK.RANKS.filter((r) => r.tier === tier.key);
      if (tier.single) {
        const r = ranks[0];
        return `<div class="rk-tier rk-master">
          ${rankBadge(r, 88)}
          <div><div class="rk-tier-name" style="color:${tier.color}">${tier.name}</div><div class="muted small">The top of the ladder. ${r.min}+ MMR.</div></div>
        </div>`;
      }
      return `<div class="rk-tier">
        <div class="rk-tier-name" style="color:${tier.dark}">${tier.name}</div>
        <div class="rk-row">${ranks.map((r) => `<div class="rk-cell">${rankBadge(r, 46)}<b>${r.numeral}</b><small>${r.min === -Infinity ? `under ${r.max + 1}` : r.max === Infinity ? `${r.min}+` : r.min}</small></div>`).join('')}</div>
      </div>`;
    })
    .join('');
  return `${topbar('Ranked · preview', ui.params.back || 'home')}
  <main class="page">
    <section class="card soon">
      <div class="eyebrow">Coming with accounts</div>
      <p class="small">Ranked play needs sign-in, so every result is confirmed by both players on their own phones and saved on the server, where nobody can edit it. This page shows the ranks and exactly how the rating will move.</p>
    </section>

    <div class="section-head"><h2>Try a match</h2></div>
    <section class="card rk-calc">
      <div class="rk-vs">
        <label class="field"><span>You</span><select data-rk="me">${opt(st.me)}</select></label>
        <div class="rk-badges">${st.placement ? rankBadge(null, 40) : rankBadge(me, 40)}<span class="vs">vs</span>${rankBadge(opp, 40)}</div>
        <label class="field"><span>Opponent</span><select data-rk="opp">${opt(st.opp)}</select></label>
      </div>
      <label class="switch-row compact"><input type="checkbox" data-rk="placement" ${st.placement ? 'checked' : ''}><span><b>I’m still in placements</b><span class="muted small">First ${RK.PLACEMENT_MATCHES} matches swing much more.</span></span></label>
      <div class="row-btns"><button class="btn primary" data-action="rk-play" data-v="win">I win</button><button class="btn" data-action="rk-play" data-v="loss">I lose</button></div>
    </section>
    ${result}

    ${duosCalculator()}

    <div class="section-head"><h2>The ladder</h2><span class="muted small">MMR to reach each rank</span></div>
    <div class="rk-ladder">${ladder}</div>

    <button class="btn wide wb-button" data-action="nav" data-view="winballs">${WR.winBall(WR.LEVELS[7], 30)} Win % Breakdown</button>
    <div class="section-head"><h2>How ranked works</h2></div>
    <ul class="rk-rules">
      <li><b>Placements:</b> everyone starts the season Unranked. Your first ${RK.PLACEMENT_MATCHES} ranked matches move your rating a lot, then your badge appears.</li>
      <li><b>Rank gaps matter:</b> beat someone ranked above you and you gain more; lose to someone below you and you lose more. The bigger the gap, the bigger the swing.</li>
      <li><b>No flip-flopping:</b> you only drop a division once you’re ${RK.DEMOTION_BUFFER} MMR below its floor.</li>
      <li><b>Only verified players, only head-to-head:</b> solo games never change your rank.</li>
      <li><b>Ranked duos:</b> 2 v 2, all four players verified, and any ranks can team up, even Diamond I with Copper V. Each player is rated on their own MMR against the other team, so the higher-ranked teammate loses more on a loss and gains less on a win.</li>
      <li><b>No boosting:</b> playing the same person again the same day counts half, then a quarter.</li>
      <li><b>Locked matches:</b> bail within an hour of a scheduled match and lose ${RK.BAIL_PENALTY} MMR.</li>
      <li><b>New season:</b> ratings pull halfway back to the middle and you play 3 placement matches.</li>
    </ul>
  </main>`;
}

// ---------- nameplate: (rank badge) gamertag (win % ball) ----------
/** A signed-in player's nameplate. Rank badge resets each season; the ball never does. */
function nameplate(pf, cls = '', { badge = cls === 'big' ? 30 : 18, ball = '0.85em' } = {}) {
  const rank = pf.ranked_rank_index != null ? RK.RANKS[pf.ranked_rank_index] : null;
  const level = WR.levelFor(pf.ranked_wins || 0, pf.ranked_games || 0);
  return `<span class="nameplate ${cls}">${rankBadge(rank, badge)}<b>${esc(pf.gamertag)}</b>${WR.winBall(level, ball)}${pf.id_verified ? '<span class="check" title="Verified">✓</span>' : ''}</span>`;
}

/** Games played against other people (any mode) and how many this person won. */
function overallRecord(ids) {
  const mine = (list) => list.find((x) => ids.includes(x.id));
  let games = 0;
  let wins = 0;
  for (const g of db.games) {
    if (g.status !== 'done' || !(R.isCoop(g) || g.players.length > 1)) continue;
    const me = mine(R.people(g));
    if (!me) continue;
    games++;
    if (R.unitOf(g, me.id) === g.winnerId) wins++;
  }
  for (const q of db.quick) {
    if (q.status !== 'done' || q.players.length < 2 || !mine(q.players)) continue;
    games++;
    if (ids.includes(q.winnerId)) wins++;
  }
  const lag = L.lagStats(db.lag, ids);
  return { games: games + lag.games, wins: wins + lag.wins };
}

/** The "Win %" section shared by local profiles and accounts. */
function winSection(overall, ranked) {
  const level = WR.levelFor(ranked.wins, ranked.games);
  const pct = (w, g) => (g ? `${Math.round((w / g) * 100)}%` : '—');
  const rankedNote = ranked.signedOut
    ? 'Ranked needs an account.'
    : ranked.games < WR.MIN_RANKED_GAMES
      ? `${ranked.games} of ${WR.MIN_RANKED_GAMES} ranked matches to earn a color.`
      : `${ranked.wins} wins in ${ranked.games} ranked matches. Never resets.`;
  return `<div class="section-head"><h2>Win %</h2><button class="link" data-action="nav" data-view="winballs">How the golf balls are earned</button></div>
  <div class="win-grid">
    <div class="pct-tile win-tile">
      ${WR.winBall(level, 46)}
      <div class="pct-label">Ranked</div>
      <div class="pct-val">${pct(ranked.wins, ranked.games)}</div>
      <div class="pct-sub">${rankedNote}</div>
    </div>
    <div class="pct-tile">
      <div class="pct-label">Overall</div>
      <div class="pct-val">${pct(overall.wins, overall.games)}</div>
      <div class="pct-sub">${overall.games ? `${overall.wins} of ${overall.games} games against others` : 'No games against others yet'} · no ball</div>
    </div>
  </div>`;
}

function viewWinBalls() {
  const rows = WR.LEVELS.map((l) => `<li>
      ${WR.winBall(l, 40)}
      <span class="board-name">${l.name}</span>
      <span class="wb-min">${l.min === null ? `first ${WR.MIN_RANKED_GAMES} matches` : `${l.min}%+`}</span>
    </li>`).join('');
  const example = { gamertag: 'thetommyjohn', ranked_rank_index: RK.RANKS.find((r) => r.name === 'Gold II').index, ranked_wins: 61, ranked_games: 100 };
  return `${topbar('Win % Breakdown', 'ranked')}
  <main class="page">
    <p>The golf ball after your gamertag shows your <b>ranked win %</b> across every season. Ranked badges reset every 4 months; the ball never does. It’s a flex that sticks.</p>
    <section class="card np-example"><div class="eyebrow">How it looks</div>${nameplate(example, 'big', { badge: 45, ball: '1.28em' })}<p class="muted small">Gold II badge, gamertag, and an orange ball for winning 61% of ranked matches.</p></section>
    <ol class="board plain wb-table">${rows}</ol>
    <ul class="rk-rules">
      <li>Only <b>ranked</b> matches count. Your overall win % shows on your profile but doesn’t earn a color.</li>
      <li>You need ${WR.MIN_RANKED_GAMES} ranked matches before the ball takes a color.</li>
      <li>It follows your win % up <i>and</i> down, so keep winning to keep your color.</li>
    </ul>
  </main>`;
}

// ---------- accounts ----------
async function refreshProfile() {
  if (!A.currentUser()) {
    ui.profile = null;
    return render();
  }
  try {
    ui.profile = await A.loadProfile();
  } catch {
    ui.profile = null;
  }
  render();
}

/** Home: [rank] [gamertag] [win % ball] box that opens the signed-in player's profile. */
function profileBox() {
  const pf = A.accountsAvailable() && A.currentUser() ? ui.profile : null;
  let inner;
  let sub;
  if (pf) {
    inner = `${pf.avatar_url ? `<img class="pb-avatar" src="${esc(pf.avatar_url)}" alt="">` : ''}${nameplate(pf, 'big', { badge: 34, ball: '0.95em' })}`;
    sub = 'Your profile and stats';
  } else {
    // Signed out (or accounts not switched on yet): show the empty slots so it's clear what goes here.
    const label = !A.accountsAvailable() ? 'Your gamertag' : A.currentUser() ? 'Pick your gamertag' : 'Sign in';
    inner = `<span class="nameplate big">${rankBadge(null, 34)}<b>${label}</b>${WR.winBall(WR.LEVELS[0], '0.95em')}</span>`;
    sub = A.accountsAvailable() ? 'Your profile and stats' : 'Accounts turn on with the KOG server';
  }
  return `<button class="profile-box" data-action="nav" data-view="account">
    <span class="pb-main">${inner}<span class="pb-sub">${sub}</span></span>
    <span class="pb-go">${ICON.chevron}</span>
  </button>`;
}

function viewAccount() {
  const a = ui.acct;
  if (!A.accountsAvailable()) {
    return `${topbar('Account', 'settings')}
    <main class="page">
      <section class="card soon"><div class="eyebrow">Needs the KOG server</div>
      <p class="small">Accounts turn on once KOG is connected to its online database and has its own website. This preview link can’t reach outside servers.</p></section>
    </main>`;
  }
  const u = A.currentUser();
  const err = a.error ? `<p class="error" role="alert">${esc(a.error)}</p>` : '';
  const note = a.note ? `<p class="muted small">${esc(a.note)}</p>` : '';
  if (!u) {
    if (a.step === 'phone-code') {
      return `${topbar('Sign in', 'account')}
      <main class="page">
        <p>Enter the 6-digit code we texted to <b>${esc(a.phone)}</b>.</p>
        <form class="join-form" data-form="phone-code">
          <input name="code" class="code-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" aria-label="Code">
          <button class="btn primary big" ${a.busy ? 'disabled' : ''}>${a.busy ? 'Checking…' : 'Sign in'}</button>
        </form>
        ${err}
        <button class="link" data-action="acct-step" data-v="choose">Use a different method</button>
      </main>`;
    }
    return `${topbar('Sign in')}
    <main class="page">
      <p>One account keeps your gamertag, photo and stats on every phone, and lets you play ranked.</p>
      <div class="stack">
        <button class="btn big signin google" data-action="acct-provider" data-v="google">Continue with Google</button>
        <button class="btn big signin apple" data-action="acct-provider" data-v="apple">Continue with Apple</button>
      </div>
      <div class="section-head"><h2>Phone number</h2></div>
      <form class="add-row" data-form="phone">
        <input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(555) 123-4567" value="${esc(a.phone)}" aria-label="Phone number">
        <button class="btn" ${a.busy ? 'disabled' : ''}>Text me</button>
      </form>
      <p class="muted small">Signing in with your phone also makes you phone-verified, which ranked play will need.</p>
      <div class="section-head"><h2>Email</h2></div>
      <form class="add-row" data-form="email">
        <input name="email" type="email" autocomplete="email" placeholder="you@example.com" value="${esc(a.email)}" aria-label="Email">
        <button class="btn" ${a.busy ? 'disabled' : ''}>Send link</button>
      </form>
      ${note}${err}
    </main>`;
  }
  const pf = ui.profile;
  if (!pf) {
    const states = { ok: '✓ Available', taken: '✗ Taken', invalid: '3–16 letters, numbers or _', checking: 'Checking…' };
    return `${topbar('Pick your gamertag', 'home')}
    <main class="page">
      <p>Your gamertag is how everyone finds you. It’s one of a kind, so nobody else can use it.</p>
      <form class="join-form" data-form="gamertag">
        <input id="gamertag" name="tag" class="tag-input" maxlength="16" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="KingOfTheGreens" value="${esc(a.tag)}" aria-label="Gamertag">
        <p id="tag-status" class="tag-status ${a.tagState}" aria-live="polite">${states[a.tagState] || '3–16 letters, numbers or _'}</p>
        <button class="btn primary big" ${a.busy ? 'disabled' : ''}>${a.busy ? 'Saving…' : 'Claim gamertag'}</button>
      </form>
      ${err}
      <p class="muted small">You can’t change it later for now. Paid renames are planned.</p>
    </main>`;
  }
  return `${topbar('Account', 'home')}
  <main class="page">
    <section class="profile-head">
      ${pf.avatar_url ? `<img class="avatar photo xl" src="${esc(pf.avatar_url)}" alt="">` : `<span class="avatar xl">${esc(pf.gamertag.slice(0, 1).toUpperCase())}</span>`}
      <div>
        <div class="acct-tag">${nameplate(pf, 'big')}</div>
        <div class="muted small">${pf.phone_verified ? '✓ Phone-verified' : 'Not phone-verified yet'}</div>
        <div class="profile-actions" style="margin-top:8px">
          <label class="btn small-btn">${pf.avatar_url ? 'Change photo' : 'Add photo'}<input type="file" accept="image/*" class="visually-hidden" data-account-photo="1"></label>
        </div>
      </div>
    </section>
    ${err}
    ${winSection({ games: pf.overall_games || 0, wins: pf.overall_wins || 0 }, { wins: pf.ranked_wins || 0, games: pf.ranked_games || 0 })}
    <section class="card soon"><div class="eyebrow">Coming next</div><p class="small">Friends, your stats saved to your account, and ranked play.</p></section>
    <button class="btn ghost danger wide" data-action="acct-signout">Sign out</button>
  </main>`;
}

function viewHistory() {
  const done = db.games.filter((g) => g.status === 'done').sort((a, b) => b.date.localeCompare(a.date));
  const rows = done
    .map((g) => {
      const s = R.standings(g);
      const w = s.find((p) => p.id === g.winnerId);
      return `<button class="list-row" data-action="nav" data-view="card" data-game="${g.id}" data-back="history">
        <span class="avatar gold">${ICON.crown}</span>
        <span class="list-main">
          <span class="list-title">${esc(w.name)} ${scoreTag(w.total)}</span>
          <span class="muted small">${fmtDate(g.date)}${g.course ? ` · ${esc(g.course)}` : ''} · ${s.length} ${s.length === 1 ? 'player' : 'players'}</span>
        </span>
        ${ICON.chevron}
      </button>`;
    })
    .join('');
  const quick = db.quick.filter((q) => q.status === 'done').sort((a, b) => b.date.localeCompare(a.date));
  const qrows = quick
    .map((q) => `<div class="list-row static">
        <span class="avatar">${ICON.clock}</span>
        <span class="list-main">
          <span class="list-title">${q.players.length > 1 ? `${ICON.crown} ` : ''}${esc(qName(q, q.winnerId || q.players[0].id))} ${scoreTag(Q.playerScore(q, q.winnerId || q.players[0].id))}</span>
          <span class="muted small">${fmtDate(q.date)} · Compass${q.players.length > 1 ? ` · ${esc(qTitle(q))}` : ''} · ${distList(q.dists)}</span>
        </span>
      </div>`)
    .join('');
  return `${topbar('Past games')}
  <main class="page">
    ${done.length ? `<div class="list">${rows}</div>` : '<p class="muted">Finished games show up here.</p>'}
    ${quick.length ? `<div class="section-head"><h2>Quick Play</h2></div><div class="list">${qrows}</div>` : ''}
    ${lagHistory()}
  </main>`;
}

function viewRules() {
  const fig = figures();
  return `${topbar('How to play')}
  <main class="page prose">
    <p class="lede">7 rounds on the practice green, built for warming up before your tee time. Lowest total at the end wins.</p>
    <table class="stats rules-table format-table">
      <thead><tr><th>Round</th><th>Sets</th></tr></thead>
      <tbody>
        <tr><th>1, 3, 5</th><td>One ${dn('S')}, one ${dn('M')}, one ${dn('L')}</td></tr>
        <tr><th>2</th><td>All ${dn('S')}</td></tr>
        <tr><th>4</th><td>All ${dn('M')}</td></tr>
        <tr><th>6</th><td>All ${dn('L')}</td></tr>
        <tr><th>7</th><td>🦅 Eagle round (last)</td></tr>
      </tbody>
    </table>

    <h2>1 · Opening toss</h2>
    <p>Each round is run by the <b>current King of the Greens (KOG)</b>, who sets the markers. Nobody is KOG yet, so a toss decides it: whoever ends up closest to the hole is KOG for Round 1.</p>
    <p class="muted small">Tap <b>Next</b> to step through it.</p>
    ${fig.toss}

    <h2>2 · The KOG sets the markers</h2>
    <p>Each round the current KOG places three markers, one per set: ${dn('S')} 3–5 ft, ${dn('M')} 6–9 ft and ${dn('L')} 10–15 ft. Lowest score each round becomes the next KOG. Any tie, and the current KOG sets again.</p>
    <p>The KOG can set the markers around <b>any hole</b> on the practice green, so pick one that reads tricky.</p>
    ${fig.anyHole}
    ${fig.markers}

    <h2>3 · Each set</h2>
    <p>Putt both <b>birdie balls</b> first, then the <b>par ball</b>. Balls in the way stay put, but you may knock into them. Then hole out every ball that missed, closest first.</p>
    ${fig.set}
    <table class="stats rules-table">
      <thead><tr><th>Ball</th><th>1 putt</th><th>2 putts</th><th>3 putts</th></tr></thead>
      <tbody>
        <tr><th>Birdie ball</th><td>−1</td><td>E</td><td>+1</td></tr>
        <tr><th>Par ball</th><td>E</td><td>+1</td><td>+2</td></tr>
        <tr><th>Eagle ball</th><td>−2</td><td>−1</td><td>E</td></tr>
      </tbody>
    </table>
    <p class="muted small">No maximum and no pick-ups: every ball is holed out.</p>

    <h2>4 · Special rounds</h2>
    <p>Three rounds use one distance for all three sets: a ${dn('S')} round, a ${dn('M')} round and a ${dn('L')} round. They’re Rounds 2, 4 and 6.</p>
    ${fig.special}

    <h2>5 · 🦅 Eagle round</h2>
    <p>The last round of every game, Round 7. The KOG picks the spot and the leader putts first, so trailing players get to watch the line. Each ball is worth −2 if it drops, so the lead can change right at the end.</p>
    <p class="muted small">Tap <b>Next</b> to step through it.</p>
    ${fig.eagle}

    <h2>6 · Putting order</h2>
    <p><b>Round 1:</b> whoever was furthest from the hole in the opening toss goes first.</p>
    <p><b>Every round after that, including the Eagle round:</b> the <b>leader</b> goes first, meaning the lowest running total, the most under par. For example, a player at −4 putts before −1, who putts before +2. In golf terms, the leader “has the honor.” Tied players keep the order from the round before.</p>

    <h2>7 · Winning</h2>
    <p>Lowest total after the Eagle round wins the game.</p>
    <p><b>Tie-breaker:</b> if the lead is tied, someone tosses a ball onto the green and where it lands is the marker. Each tied player putts once to the hole furthest from it, and the closest wins. Too close to call? Toss again until there’s a winner. In co-op, everyone on the tied teams putts and the closest player wins it for their team.</p>
    ${fig.tiebreak}

    <h2>8 · Co-op: 2 vs 2</h2>
    <p>For a foursome warming up before a tee time. Two teams of two, and each team plays like one player: one score, one turn, same rules. Teammates split each set’s 3 balls, so a co-op game takes about as long as a 2-player game.</p>
    <table class="stats rules-table">
      <thead><tr><th>Ball</th><th>Who putts it</th></tr></thead>
      <tbody>
        <tr><th>Birdie ball 1</th><td>Teammate A, every set</td></tr>
        <tr><th>Birdie ball 2</th><td>Teammate B, every set</td></tr>
        <tr><th>Par ball</th><td>Takes turns: A, B, A, then B starts the next round</td></tr>
        <tr><th>🦅 Eagle round</th><td>4 balls instead of 3, two each, alternating</td></tr>
      </tbody>
    </table>
    <p>Whoever misses holes out their own ball. In the opening toss all four putt: the closest player’s team is the KOG, and the furthest player’s team putts first. The app shows whose ball is whose, and each player’s stats count only the balls they putted.</p>

    <h2>9 · Quick Play: Compass</h2>
    <p>A putting session in under 20 minutes. Put 4 tees around one hole, north, east, south and west, at ${dn('S')}, ${dn('M')} or ${dn('L')} distance (or any mix). Putt 3 balls from each tee. Every ball is a birdie ball: −1 if it drops, E in two, +1 in three. The putts count toward your stats.</p>
    <p><b>Head-to-head (2–4 players):</b> a toss decides who putts first at the first tee, and the order rotates every tee so everyone leads equally. Each player putts all 3 balls before the next. Lowest total wins; a tie goes to the same toss tie-breaker as the main game.</p>

    <h2>10 · ${L.GAME_NAME}</h2>
    <p>Lag putting, cornhole-style, for 1 v 1 or 2 v 2. Pick a hole and a spot 25–35 ft away. Each side putts 4 balls per frame, taking turns (teammates alternate). Knocking the other side’s ball away is allowed.</p>
    ${lagFigure()}
    <p>Only the difference scores each frame: if you have 5 points and they have 3, you score 2. Whoever scored putts first next frame. First to ${L.TARGET} wins.</p>
    ${compassFigure('M', 0)}
  </main>`;
}

function viewSettings() {
  return `${topbar('Settings')}
  <main class="page">
    <div class="section-head"><h2>Account</h2></div>
    <button class="btn wide" data-action="nav" data-view="account">${A.currentUser() ? (ui.profile ? `@${esc(ui.profile.gamertag)}` : 'Finish setting up your account') : 'Sign in'}</button>
    <div class="section-head"><h2>Sound</h2></div>
    <label class="switch-row">
      <input type="checkbox" id="sound" data-pref="sound" ${soundOn() ? 'checked' : ''}>
      <span><b>Eagle call</b><span class="muted small">Plays when someone drains an eagle putt. Turn off your phone’s silent switch to hear it.</span></span>
    </label>
    <button class="btn wide" data-action="test-sound">Play the eagle call</button>
    <section class="card soon">
      <div class="eyebrow">Coming next</div>
      <p class="small">Sign in with Google, Apple or your phone number, a profile picture that follows you, and friends from your contacts.</p>
    </section>
  </main>`;
}

/** Strokes between a player and the new KOG, in words. */
function gapText(diff) {
  const n = Math.abs(diff);
  const strokes = `${n} stroke${n === 1 ? '' : 's'}`;
  if (diff > 0) return `${strokes} behind the new KOG`;
  if (diff < 0) return `${strokes} ahead of the new KOG`;
  return 'tied with the new KOG';
}

function kogPopupHtml(pop) {
  const g = activeGame();
  if (!g || !g.stages[pop.stage]) return '';
  const t = R.totals(g, pop.stage);
  const newName = esc(playerName(g, pop.to));
  const oldName = esc(playerName(g, pop.from));
  const me = meUnit(g);
  const plural = R.isCoop(g); // a team: "are", "have"
  let title;
  let body;
  if (me && me === pop.from) {
    title = 'You have been dethroned!';
    body = `<p><b>${newName}</b> ${plural ? 'have' : 'has'} stolen your crown.</p><p>You are ${gapText(t[me] - t[pop.to])}.</p>`;
  } else if (me && me === pop.to) {
    title = 'You are the new KOG!';
    body = `<p>You took the crown from <b>${oldName}</b>.</p>`;
  } else if (me) {
    title = 'A Change to the current King!';
    body = `<p><b>${newName}</b> ${plural ? 'are' : 'is'} the current KOG.</p><p>You are currently ${gapText(t[me] - t[pop.to])}.</p>`;
  } else {
    // One shared phone: show where everyone stands against the new KOG.
    const rows = g.players
      .filter((p) => p.id !== pop.to)
      .map((p) => `<li><span>${esc(p.name)}${p.id === pop.from ? ' <em class="dethroned">dethroned</em>' : ''}</span><span>${gapText(t[p.id] - t[pop.to])}</span></li>`)
      .join('');
    title = 'A Change to the current King!';
    body = `<p><b>${newName}</b> ${plural ? 'are' : 'is'} the current KOG.</p><ul class="gap-list">${rows}</ul>`;
  }
  return `<div class="modal-backdrop" data-action="kog-close"></div>
  <div class="modal kog-pop" role="alertdialog" aria-modal="true" aria-labelledby="kog-title">
    <div class="kog-crown">${ICON.crown}</div>
    <h2 id="kog-title">${title}</h2>
    ${body}
    <button class="btn primary big" data-action="kog-close">OK</button>
  </div>`;
}

/** Strokes between a player and the KOG, in words. */
function kogGap(diff) {
  const n = Math.abs(diff);
  const strokes = `${n} stroke${n === 1 ? '' : 's'}`;
  if (diff > 0) return `${strokes} behind KOG`;
  if (diff < 0) return `${strokes} ahead of KOG`;
  return 'tied with KOG';
}

function orderPopupHtml(pop) {
  const g = activeGame();
  const st = g && g.stages[pop.stage];
  if (!st) return '';
  const def = R.stageDef(st);
  const t = R.totals(g, pop.stage - 1); // standings going into this round
  const gaps = pop.stage > 0;
  const me = meUnit(g);
  const coop = R.isCoop(g);
  const rows = st.order
    .map((pid, i) => {
      const pos = ordinal(i + 1);
      const name = `${esc(playerName(g, pid))}${pid === me ? ' (you)' : ''}`;
      if (pid === st.kingId) {
        return `<li class="is-kog"><span class="pos">${pos}</span><span><span class="gold">${ICON.crown}</span><b>${name} (KOG)</b> ${coop ? 'set the markers and putt' : 'is the marker placer and putts'} ${pos}</span></li>`;
      }
      return `<li><span class="pos">${pos}</span><span><b>${name}</b> ${coop ? 'putt' : 'putts'} ${pos}${gaps ? ` <span class="muted">(${kogGap(t[pid] - t[st.kingId])})</span>` : ''}</span></li>`;
    })
    .join('');
  const why = pop.stage === 0 ? 'Furthest from the opening toss putts first.' : 'The leader (lowest total) putts first.';
  return `<div class="modal-backdrop" data-action="order-close"></div>
  <div class="modal order-pop" role="dialog" aria-modal="true" aria-labelledby="order-title">
    <div class="eyebrow">${stageTitle(def, g)}${def.kind === 'special' ? ` · ${specialTitle(def)}` : ''}</div>
    <h2 id="order-title">For this round:</h2>
    <ol class="order-list">${rows}</ol>
    <p class="muted small">${why}</p>
    <button class="btn primary big" data-action="order-close">Let’s putt</button>
  </div>`;
}

// In-page dialog (browser confirm/prompt are blocked in some hosts and look out of place).
function dialogHtml(d) {
  return `<div class="modal-backdrop" data-action="dialog-cancel"></div>
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
    <h2 id="dlg-title">${esc(d.title)}</h2>
    ${d.text ? `<p class="muted">${esc(d.text)}</p>` : ''}
    ${d.input != null ? `<input id="dlg-input" value="${esc(d.input)}" maxlength="20" autocomplete="off" enterkeyhint="done" aria-label="${esc(d.title)}">` : ''}
    <div class="modal-actions">
      <button class="btn" data-action="dialog-cancel">Cancel</button>
      <button class="btn ${d.danger ? 'danger-fill' : 'primary'}" data-action="dialog-ok">${esc(d.confirmLabel)}</button>
    </div>
  </div>`;
}
function ask(opts) {
  ui.dialog = opts;
  render();
  const input = document.getElementById('dlg-input');
  if (input) {
    input.focus();
    input.select();
  } else $app.querySelector('[data-action="dialog-ok"]').focus();
}

function render() {
  const views = {
    home: viewHome, new: viewNew, game: viewGame, card: viewCard, players: viewPlayers, player: viewPlayer,
    history: viewHistory, rules: viewRules, join: viewJoin, whoami: viewWhoami, share: viewShare, settings: viewSettings,
    'quick-setup': viewQuickSetup, quick: viewQuick, 'lag-setup': viewLagSetup, lag: viewLag, ranked: viewRanked, account: viewAccount, winballs: viewWinBalls,
    'ranked-modes': () => viewModes('ranked'), 'casual-modes': () => viewModes('casual'),
  };
  // Keep a half-typed code if the screen redraws (e.g. a sync update).
  const codeInput = document.getElementById('join-code');
  if (codeInput) ui.join.code = codeInput.value;
  $app.innerHTML =
    (views[ui.view] || viewHome)() +
    (ui.toast ? `<div class="toast" role="status">${esc(ui.toast)}</div>` : '') +
    // One window at a time: a change of KOG first, then the order for the next round.
    (ui.kogFlash
      ? `<div class="kog-flash" data-action="flash-close" role="img" aria-label="You are the new King of the Greens"><img src="${KOG_CARD}" alt=""><div class="kog-flash-text">New KOG!</div></div>`
      : ui.kogPopup ? kogPopupHtml(ui.kogPopup) : ui.orderPopup ? orderPopupHtml(ui.orderPopup) : '') +
    (ui.dialog ? dialogHtml(ui.dialog) : '');
  if (ui.view === 'rules' || ui.view === 'game') mountIllustrations($app);
}

// ---------- actions ----------
function addPlayer(name) {
  const existing = db.players.find((p) => p.name.toLowerCase() === name.toLowerCase());
  const p = existing || { id: uid(), name, createdAt: new Date().toISOString() };
  if (!existing) db.players.push(p);
  const max = ui.draft && ui.draft.mode === 'coop' ? R.COOP_PLAYERS : R.MAX_PLAYERS;
  if (ui.view === 'new' && !ui.draft.selected.includes(p.id) && ui.draft.selected.length < max) ui.draft.selected.push(p.id);
  if (ui.view === 'lag-setup' && !ui.ldraft.pids.includes(p.id) && ui.ldraft.pids.length < 4) ui.ldraft.pids.push(p.id);
  if (ui.view === 'quick-setup' && !ui.qdraft.pids.includes(p.id) && ui.qdraft.pids.length < Q.MAX_PLAYERS) ui.qdraft.pids.push(p.id);
  return p;
}

function currentStage() {
  const g = activeGame();
  const idx = R.currentStageIdx(g);
  const st = g.stages[idx];
  // Always resolve whose sets are on screen, so a cleared selection can't block taps.
  return { g, idx, st, def: R.stageDef(st), pid: pickActive(g, idx) };
}

function startGame(playerIds, course = '', pairs = null) {
  const find = (id) => db.players.find((p) => p.id === id);
  const g = pairs
    ? R.createGame({ id: uid(), teams: pairs.map((team) => team.map(find)), course })
    : R.createGame({ id: uid(), players: playerIds.map(find), course });
  db.games.push(g);
  db.activeGameId = g.id;
  ui.toss = [];
  ui.activePid = null;
}

/** Start a game; if it should be live, upload it and show the join code. */
async function launch(playerIds, course, live, pairs = null) {
  startGame(playerIds, course, pairs);
  save(db);
  if (live && SYNC && playerIds.length > 1 && (await goLive())) go('share');
  else go('game');
}

/** Runs `then` once any unfinished game has been closed on this phone (asking first). */
function afterAbandoningActive(then) {
  const g = activeGame();
  if (!g || g.status === 'done') return then();
  ask({
    title: g.sync ? 'Leave the live game on this phone?' : 'Abandon the game in progress?',
    text: g.sync ? `It carries on for everyone else. You can rejoin with code ${g.sync.code}.` : 'Its scores will be lost.',
    confirmLabel: g.sync ? 'Leave game' : 'Abandon game',
    danger: true,
    onConfirm: () => {
      db.games = db.games.filter((x) => x.id !== g.id);
      db.activeGameId = null;
      then();
    },
  });
}

async function copyText(text, done) {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
  } catch {
    toast(`Code: ${activeGame()?.sync?.code || ''}`);
  }
}

const actions = {
  'dialog-cancel': () => {
    ui.dialog = null;
    render();
  },
  'dialog-ok': () => {
    const d = ui.dialog;
    const input = document.getElementById('dlg-input');
    ui.dialog = null;
    d.onConfirm(input ? input.value : undefined);
    render();
  },
  nav: (d) => {
    go(d.view, { pid: d.pid, game: d.game, back: d.back });
    if (d.confetti === 'kings') kingRain();
  },
  'new-game': (d) => {
    ui.draft = { course: '', selected: [], live: true, mode: d.mode === 'coop' ? 'coop' : 'group', pair: 0 };
    go('new');
  },
  'open-join': () => {
    ui.join = { code: '', error: '', busy: false };
    go('join');
  },
  'switch-pairs': () => {
    ui.draft.pair = ((ui.draft.pair || 0) + 1) % PAIRINGS.length;
    render();
  },
  'switch-coop': () => {
    ui.draft.mode = 'coop';
    render();
  },
  'toggle-player': (d) => {
    const s = ui.draft.selected;
    const max = ui.draft.mode === 'coop' ? R.COOP_PLAYERS : R.MAX_PLAYERS;
    const i = s.indexOf(d.pid);
    if (i >= 0) s.splice(i, 1);
    else if (s.length < max) s.push(d.pid);
    render();
  },
  'start-game': () => afterAbandoningActive(() => launch(ui.draft.selected, ui.draft.course.trim(), ui.draft.live, ui.draft.mode === 'coop' ? coopPairs(ui.draft) : null)),
  'go-live': async () => {
    if (await goLive()) render();
  },
  'set-me': (d) => {
    const g = activeGame();
    g.sync.me = d.pid || null;
    ui.activePid = null;
    save(db);
    go('game');
  },
  'set-me-here': (d) => {
    const g = activeGame();
    g.sync.me = d.pid || null;
    ui.activePid = null;
    commit();
  },
  'share-invite': () => {
    const { code } = activeGame().sync;
    const url = inviteLink(code);
    if (navigator.share) {
      navigator.share({ title: 'King of the Greens', text: `Join my KOG game. Code: ${code}`, url }).catch(() => {});
    } else copyText(url, 'Invite link copied');
  },
  'copy-code': () => copyText(activeGame().sync.code, 'Code copied'),
  'toss-pick': (d) => {
    if (!ui.toss.includes(d.pid)) ui.toss.push(d.pid);
    render();
  },
  'toss-reset': () => {
    ui.toss = [];
    render();
  },
  'toss-confirm': () => {
    ui.activePid = null;
    dispatch({ type: 'toss', ranking: [...ui.toss] });
    window.scrollTo(0, 0);
  },
  'select-player': (d) => {
    ui.activePid = d.pid;
    render();
    window.scrollTo(0, 0);
  },
  ball: (d) => {
    const { idx, st, pid } = currentStage();
    const k = Number(d.k);
    const j = Number(d.j);
    let p = st.entries[pid][k].balls[j];
    if (d.v === 'in') p = p === 1 ? null : 1;
    else if (d.v === 'miss') p = p >= 2 ? null : 2;
    else if (d.v === 'inc') p = Math.max(2, (p || 1) + 1);
    else if (d.v === 'dec') p = Math.max(2, (p || 2) - 1);
    dispatch({ type: 'ball', stage: idx, pid, k, j, putts: p });
  },
  'toggle-mode': (d) => {
    const { idx, st, pid } = currentStage();
    const k = Number(d.k);
    const e = st.entries[pid][k];
    dispatch({ type: 'mode', stage: idx, pid, k, mode: e.mode === 'quick' ? 'balls' : 'quick' });
  },
  quick: (d) => {
    const { idx, st, pid } = currentStage();
    const k = Number(d.k);
    const v = Number(d.v);
    const e = st.entries[pid][k];
    dispatch({ type: 'quick', stage: idx, pid, k, score: e.score === v ? null : v });
  },
  'quick-more': (d) => {
    const { idx, st, def, pid } = currentStage();
    const k = Number(d.k);
    const e = st.entries[pid][k];
    dispatch({ type: 'quick', stage: idx, pid, k, score: Math.max(e.score ?? -Infinity, R.minSetScore(def, e.balls.length) + 7) + 1 });
  },
  'finish-stage': () => {
    dispatch({ type: 'finish', stage: currentStage().idx });
    window.scrollTo(0, 0);
  },
  'next-stage': () => {
    ui.activePid = null;
    dispatch({ type: 'next', stage: currentStage().idx });
    window.scrollTo(0, 0);
  },
  reopen: () => {
    ui.activePid = null;
    dispatch({ type: 'reopen', stage: currentStage().idx });
    window.scrollTo(0, 0);
  },
  'puttoff-win': (d) => dispatch({ type: 'puttoff', pid: d.pid }),
  // Tie-breaker: the closest putter wins (for their team in co-op).
  'tiebreak-win': (d) => {
    const g = activeGame();
    dispatch({ type: 'puttoff', pid: R.unitOf(g, d.pid) });
    window.scrollTo(0, 0);
  },
  'tiebreak-retoss': () => {
    dispatch({ type: 'retoss' });
    toast(`Toss ${activeGame().tieTosses}: toss again and everyone putts.`);
  },
  'quick-new': () => {
    const last = db.quick[db.quick.length - 1];
    const known = (id) => db.players.some((x) => x.id === id);
    ui.qdraft = { pids: last ? last.players.map((x) => x.id).filter(known) : [], dists: last ? [...last.dists] : ['S', 'M', 'L'] };
    go('quick-setup');
  },
  'quick-dist': (d) => {
    const ds = ui.qdraft.dists;
    ui.qdraft.dists = ds.includes(d.d) ? ds.filter((x) => x !== d.d) : ['S', 'M', 'L'].filter((x) => ds.includes(x) || x === d.d);
    render();
  },
  'quick-player': (d) => {
    const ps = ui.qdraft.pids;
    const i = ps.indexOf(d.pid);
    if (i >= 0) ps.splice(i, 1);
    else if (ps.length < Q.MAX_PLAYERS) ps.push(d.pid);
    render();
  },
  'quick-start': () => {
    const old = activeQuick();
    if (old && old.status !== 'done') db.quick = db.quick.filter((x) => x.id !== old.id); // one session at a time
    const players = ui.qdraft.pids.map((id) => db.players.find((x) => x.id === id));
    const q = Q.createQuick({ id: uid(), players, dists: ui.qdraft.dists });
    db.quick.push(q);
    db.activeQuickId = q.id;
    ui.qstep = 0;
    ui.qtee = null;
    ui.qtoss = [];
    save(db);
    go('quick');
  },
  'qtoss-pick': (d) => {
    if (!ui.qtoss.includes(d.pid)) ui.qtoss.push(d.pid);
    render();
  },
  'qtoss-reset': () => {
    ui.qtoss = [];
    render();
  },
  'qtoss-confirm': () => {
    Q.applyQuickToss(activeQuick(), ui.qtoss);
    commit();
  },
  qball: (d) => {
    const q = activeQuick();
    const t = Number(d.t);
    const j = Number(d.j);
    let p = q.tees[d.p][d.d][t][j];
    if (d.v === 'in') p = p === 1 ? null : 1;
    else if (d.v === 'miss') p = p >= 2 ? null : 2;
    else if (d.v === 'inc') p = Math.max(2, (p || 1) + 1);
    else if (d.v === 'dec') p = Math.max(2, (p || 2) - 1);
    q.tees[d.p][d.d][t][j] = p;
    ui.qtee = t; // stay on this tee while scoring it
    commit();
  },
  'quick-tab': (d) => {
    ui.qstep = Number(d.i);
    ui.qtee = null;
    render();
    window.scrollTo(0, 0);
  },
  'quick-tee': (d) => {
    ui.qtee = Number(d.t);
    render();
    window.scrollTo(0, 0);
  },
  'quick-finish': () => {
    Q.finishQuick(activeQuick());
    commit();
    window.scrollTo(0, 0);
  },
  'qtb-win': (d) => {
    Q.setQuickWinner(activeQuick(), d.pid);
    commit();
    window.scrollTo(0, 0);
  },
  'qtb-retoss': () => {
    const q = activeQuick();
    Q.retossQuick(q);
    commit();
    toast(`Toss ${q.tieTosses}: toss again and everyone putts.`);
  },
  'quick-again': () => {
    const q = activeQuick();
    ui.qdraft = { pids: q.players.map((x) => x.id).filter((id) => db.players.some((x) => x.id === id)), dists: [...q.dists] };
    actions['quick-start']();
  },
  'quick-close': () => {
    db.activeQuickId = null;
    save(db);
    go('home');
  },
  'quick-delete': () =>
    ask({
      title: 'Delete this Quick Play session?',
      text: 'Its putts won’t count toward stats.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        db.quick = db.quick.filter((x) => x.id !== db.activeQuickId);
        db.activeQuickId = null;
        save(db);
        go('home');
      },
    }),
  'acct-provider': (d) => A.signInWithProvider(d.v),
  'acct-step': (d) => {
    ui.acct.step = d.v;
    ui.acct.error = '';
    render();
  },
  'acct-signout': async () => {
    await A.signOut();
    ui.profile = null;
    ui.acct = { step: 'choose', phone: '', email: '', tag: '', tagState: '', busy: false, error: '', note: '' };
    go('home');
  },
  'rkd-play': (d) => {
    ui.rkd.result = d.v;
    render();
  },
  'rk-play': (d) => {
    ui.rk.result = d.v;
    render();
  },
  'lag-new': () => {
    const last = db.lag[db.lag.length - 1];
    const known = (id) => db.players.some((x) => x.id === id);
    ui.ldraft = { pids: last ? last.sides.flatMap((sd) => sd.members.map((m) => m.id)).filter(known) : [], pair: 0 };
    if (![2, 4].includes(ui.ldraft.pids.length)) ui.ldraft.pids = [];
    go('lag-setup');
  },
  'lag-player': (d) => {
    const ps = ui.ldraft.pids;
    const i = ps.indexOf(d.pid);
    if (i >= 0) ps.splice(i, 1);
    else if (ps.length < 4) ps.push(d.pid);
    render();
  },
  'lag-pairs': () => {
    ui.ldraft.pair = ((ui.ldraft.pair || 0) + 1) % PAIRINGS.length;
    render();
  },
  'lag-start': () => {
    const old = activeLag();
    if (old && old.status !== 'done') db.lag = db.lag.filter((x) => x.id !== old.id); // one game at a time
    const lag = L.createLag({ id: uid(), sides: ldraftSides(ui.ldraft) });
    db.lag.push(lag);
    db.activeLagId = lag.id;
    save(db);
    go('lag');
  },
  'lag-first': (d) => {
    L.chooseFirst(activeLag(), d.sid);
    commit();
  },
  lball: (d) => {
    const f = L.currentFrame(activeLag());
    const v = Number(d.v);
    f.balls[d.s][Number(d.j)] = f.balls[d.s][Number(d.j)] === v ? null : v;
    commit();
  },
  'lag-score': () => {
    const lag = activeLag();
    const f = L.currentFrame(lag);
    const r = L.frameResult(lag, f);
    L.finishFrame(lag);
    save(db);
    window.scrollTo(0, 0);
    toast(r.scorer ? `${sideName(lag, r.scorer)} +${r.points}` : 'A wash: nobody scores');
  },
  'lag-fix': () => {
    L.reopenFrame(activeLag());
    commit();
  },
  'lag-again': () => {
    const lag = activeLag();
    const sides = lag.sides.map((sd) => sd.members.map((m) => db.players.find((x) => x.id === m.id)).filter(Boolean));
    if (sides.some((sd, i) => sd.length !== lag.sides[i].members.length)) return;
    const next = L.createLag({ id: uid(), sides });
    db.lag.push(next);
    db.activeLagId = next.id;
    save(db);
    go('lag');
  },
  'lag-close': () => {
    db.activeLagId = null;
    save(db);
    go('home');
  },
  'lag-delete': () =>
    ask({
      title: `Delete this ${L.GAME_NAME} game?`,
      text: 'This can’t be undone.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        db.lag = db.lag.filter((x) => x.id !== db.activeLagId);
        db.activeLagId = null;
        save(db);
        go('home');
      },
    }),
  'close-game': () => {
    db.activeGameId = null;
    save(db);
    go('home');
  },
  'delete-active': () => {
    const g = activeGame();
    if (!g) return;
    ask({
      title: g.sync ? 'Leave this live game?' : 'Delete this game?',
      text: g.sync ? `It carries on for everyone else. You can rejoin with code ${g.sync.code}.` : 'Its scores will be lost. This can’t be undone.',
      confirmLabel: g.sync ? 'Leave game' : 'Delete game',
      danger: true,
      onConfirm: () => {
        db.games = db.games.filter((x) => x.id !== g.id);
        db.activeGameId = null;
        save(db);
        go('home');
      },
    });
  },
  'test-sound': () => playHawk(),
  'flash-close': () => {
    clearTimeout(flashTimer);
    ui.kogFlash = false;
    render();
  },
  'kog-close': () => {
    ui.kogPopup = null;
    render();
  },
  'order-close': () => {
    ui.orderPopup = null;
    render();
  },
  'show-order': () => {
    const g = activeGame();
    ui.orderPopup = { stage: R.currentStageIdx(g) };
    render();
  },
  'remove-photo': (d) => {
    const p = db.players.find((x) => x.id === d.pid);
    delete p.photo;
    commit();
  },
  rematch: () => {
    const g = activeGame();
    if (R.isCoop(g)) {
      const pairs = Object.values(g.teams).map((team) => team.map((m) => rosterIdFor(m.id)));
      if (pairs.flat().some((id) => !id)) return;
      launch(pairs.flat(), g.course, Boolean(g.sync), pairs);
      return;
    }
    const ids = g.players.map((p) => rosterIdFor(p.id)).filter(Boolean);
    if (!ids.length) return;
    launch(ids, g.course, Boolean(g.sync));
  },
  'rename-player': (d) => {
    const p = db.players.find((x) => x.id === d.pid);
    ask({
      title: 'Rename player',
      input: p.name,
      confirmLabel: 'Save',
      onConfirm: (value) => {
        const name = String(value || '').trim().slice(0, 20);
        if (!name || name === p.name) return;
        p.name = name;
        // Unfinished local games pick up the new name; finished and live games keep the name used there.
        db.games.filter((g) => g.status !== 'done' && !g.sync).forEach((g) => g.players.forEach((gp) => gp.id === p.id && (gp.name = name)));
        save(db);
      },
    });
  },
  'delete-player': (d) => {
    const p = db.players.find((x) => x.id === d.pid);
    ask({
      title: `Remove ${p.name}?`,
      text: 'Past scorecards keep their scores.',
      confirmLabel: 'Remove',
      danger: true,
      onConfirm: () => {
        db.players = db.players.filter((x) => x.id !== d.pid);
        save(db);
        go('players');
      },
    });
  },
  'delete-game': (d) =>
    ask({
      title: 'Delete this game?',
      text: 'It’s removed from this phone. This can’t be undone.',
      confirmLabel: 'Delete game',
      danger: true,
      onConfirm: () => {
        db.games = db.games.filter((g) => g.id !== d.game);
        save(db);
        go('history');
      },
    }),
};

document.addEventListener('click', (e) => {
  unlockAudio(); // phones only allow sound after a tap
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (fn) fn(el.dataset, el);
});

/** Shrink a chosen photo to a small square so it fits in the phone's storage. */
async function photoToDataUrl(file, size = 160) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset.rkd) {
    ui.rkd[t.dataset.rkd] = Number(t.value);
    ui.rkd.result = null;
    render();
    return;
  }
  if (t.dataset.rk) {
    if (t.dataset.rk === 'placement') ui.rk.placement = t.checked;
    else ui.rk[t.dataset.rk] = Number(t.value);
    ui.rk.result = null;
    render();
    return;
  }
  if (t.dataset.pref === 'sound') {
    setPref('kog.sound', t.checked ? 'on' : 'off');
    return;
  }
  if (t.dataset.accountPhoto && t.files && t.files[0]) {
    acctTask(async () => {
      const blob = await (await fetch(await photoToDataUrl(t.files[0], 320))).blob();
      ui.profile = await A.uploadAvatar(blob);
    });
    return;
  }
  if (t.dataset.photoPid && t.files && t.files[0]) {
    const p = db.players.find((x) => x.id === t.dataset.photoPid);
    try {
      p.photo = await photoToDataUrl(t.files[0]);
      if (!save(db)) {
        delete p.photo;
        toast('This phone is out of storage for photos.');
      }
      render();
    } catch {
      toast('That photo couldn’t be opened. Try a JPG or PNG.');
    }
  }
});
let tagTimer;
document.addEventListener('input', (e) => {
  if (e.target.id !== 'gamertag') return;
  const tag = e.target.value.trim();
  ui.acct.tag = tag;
  const status = document.getElementById('tag-status');
  const show = (state, text) => {
    ui.acct.tagState = state;
    if (status) {
      status.className = `tag-status ${state}`;
      status.textContent = text;
    }
  };
  clearTimeout(tagTimer);
  if (!A.validGamertag(tag)) return show('invalid', '3–16 letters, numbers or _');
  show('checking', 'Checking…');
  tagTimer = setTimeout(async () => {
    try {
      const ok = await A.gamertagAvailable(tag);
      if (ui.acct.tag === tag) show(ok ? 'ok' : 'taken', ok ? '✓ Available' : '✗ Taken');
    } catch {
      show('', 'Couldn’t check right now');
    }
  }, 400);
});
function onBind(e) {
  const b = e.target.dataset && e.target.dataset.bind;
  if (!b || !ui.draft) return;
  if (b === 'course') ui.draft.course = e.target.value;
  if (b === 'live') ui.draft.live = e.target.checked;
  if (b === 'live') render();
}
document.addEventListener('input', onBind);
document.addEventListener('change', onBind);
document.addEventListener('keydown', (e) => {
  if (ui.kogPopup && !ui.dialog && e.key === 'Escape') return actions['kog-close']();
  if (ui.orderPopup && !ui.dialog && e.key === 'Escape') return actions['order-close']();
  if (!ui.dialog) return;
  if (e.key === 'Escape') actions['dialog-cancel']();
  else if (e.key === 'Enter' && e.target.id === 'dlg-input') {
    e.preventDefault();
    actions['dialog-ok']();
  }
});
/** US numbers can be typed plainly; anything else needs a leading +country code. */
function normalizePhone(raw) {
  const digits = String(raw || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  const d = digits.replace(/\D/g, '');
  return d.length === 10 ? `+1${d}` : d.length === 11 && d.startsWith('1') ? `+${d}` : `+${d}`;
}

async function acctTask(fn) {
  ui.acct.busy = true;
  ui.acct.error = '';
  render();
  try {
    await fn();
  } catch (err) {
    ui.acct.error = err.message || 'Something went wrong. Try again.';
  } finally {
    ui.acct.busy = false;
    render();
  }
}

document.addEventListener('submit', (e) => {
  const acctForm = e.target.dataset.form;
  if (['phone', 'phone-code', 'email', 'gamertag'].includes(acctForm)) {
    e.preventDefault();
    const v = (name) => String(new FormData(e.target).get(name) || '').trim();
    if (acctForm === 'phone') {
      ui.acct.phone = normalizePhone(v('phone'));
      acctTask(async () => {
        await A.sendPhoneCode(ui.acct.phone);
        ui.acct.step = 'phone-code';
      });
    } else if (acctForm === 'phone-code') {
      acctTask(async () => {
        await A.verifyPhoneCode(ui.acct.phone, v('code'));
        await refreshProfile();
        go('account');
      });
    } else if (acctForm === 'email') {
      ui.acct.email = v('email');
      acctTask(async () => {
        await A.sendEmailLink(ui.acct.email);
        ui.acct.note = `Check ${ui.acct.email} for a sign-in link, then open it on this phone.`;
      });
    } else {
      ui.acct.tag = v('tag');
      acctTask(async () => {
        ui.profile = await A.createProfile(ui.acct.tag);
      });
    }
    return;
  }
  const form = e.target.dataset.form;
  if (form === 'join') {
    e.preventDefault();
    joinGame(new FormData(e.target).get('code'));
    return;
  }
  if (form !== 'add-player') return;
  e.preventDefault();
  const name = String(new FormData(e.target).get('name') || '').trim().slice(0, 20);
  if (!name) return;
  addPlayer(name);
  commit();
  const input = $app.querySelector('[data-form="add-player"] input');
  if (input && !input.disabled) input.focus();
});

// ---------- start ----------
if (A.accountsAvailable()) A.handleRedirect().then(refreshProfile);
new Image().src = KOG_CARD; // preload the King card so it flashes instantly
if (activeGame() && activeGame().status !== 'done') ui.view = 'game';
const joinParam = new URLSearchParams(location.search).get('join');
if (joinParam && SYNC) {
  history.replaceState(null, '', location.pathname);
  ui.join = { code: S.normalizeCode(joinParam), error: '', busy: false };
  ui.view = 'join';
}
render();
if (ui.view === 'join' && ui.join.code) joinGame(ui.join.code);

if (SYNC) {
  setInterval(poll, 2500);
  document.addEventListener('visibilitychange', poll);
  window.addEventListener('online', () => {
    flush();
    poll();
  });
  flush();
  poll();
}

// Offline support where the host allows service workers (not inside a claude.ai preview).
try {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
  preloadKings();
  // Opening splash (markup in index.html, timing in CSS): tap to skip, and tidy it away when done.
  const splash = document.getElementById('splash');
  if (splash) {
    const done = () => splash.remove();
    splash.addEventListener('click', () => { splash.classList.add('out'); setTimeout(done, 400); }, { once: true });
    setTimeout(done, 4200);
  }
} catch {
  /* not available here */
}
