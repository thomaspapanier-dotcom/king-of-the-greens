// KOG Ranked previews: "How it works" stories and the Find Match / Post Match board.
// Everything here is example data until accounts and the server are switched on.
import * as RK from './ranked.js';
import * as WR from './winrate.js';
import { rankBadge } from './badges.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const rankByName = (name) => RK.RANKS.find((r) => r.name === name);

// ---------- example players ----------
const P = (tag, rank, pct) => ({ tag, rank: rankByName(rank), pct });
export const ME = { tag: 'thetommyjohn', rank: RK.rankFor(1447), pct: 52, me: true }; // same example as the Current rank panel
const PEOPLE = {
  pap: P('Pap_Daddy_Kush', 'Silver II', 54),
  chex: P('xXChexterXx', 'Gold IV', 57),
  fupa: P('littleFUPA', 'Platinum III', 56),
  joey: P('JoeyStazz92', 'Diamond IV', 60),
  mike: P('SweetieMike', 'Bronze I', 51),
  quin: P('Quin_Girthmaster69', 'Gold II', 55),
  moose: P('Moosehead67', 'Silver IV', 49),
  jimm: P('JimmBurg', 'Platinum V', 58),
  sam: P('GrantedSam', 'Silver I', 52),
  mac: P('McCarthy3o6', 'Gold III', 56),
  alva: P('Alvatron88', 'Diamond II', 63),
};

/** [rank badge] gamertag [win % ball] 54% — the nameplate used on every ranked card. */
export function plate(p, { badge = 20, ball = 15, check = false } = {}) {
  const level = WR.levelFor(p.pct, 100);
  return `<span class="lf-plate${p.me ? ' me' : ''}">${rankBadge(p.rank, badge)}<b>${esc(p.tag)}</b>${WR.winBall(level, ball)}${check ? '<span class="check" title="Verified">✓</span>' : ''}</span>`;
}

// ---------- courses near the user (example distances) ----------
export const COURSES = [
  { id: 'ocala', name: 'Ocala Golf Club', mi: 5 },
  { id: 'spruce', name: 'Spruce Creek Golf Course', mi: 8 },
  { id: 'pine', name: 'Pine Oaks Golf Club', mi: 11 },
  { id: 'golden', name: 'Golden Ocala Golf Club', mi: 14 },
  { id: 'meadows', name: 'The Meadows at Citrus Hills', mi: 16 },
  { id: 'skyview', name: 'Skyview Golf Course', mi: 22 },
  { id: 'juliette', name: 'Juliette Falls Golf Club', mi: 27 },
  { id: 'diamond', name: 'Black Diamond Ranch', mi: 31 },
];
const course = (id) => COURSES.find((c) => c.id === id);

// Posts on the board. `from`/`to` = the ranks they'll accept, `wr` = win % range they'll accept.
export const POSTS = [
  { id: 'p-pap', who: ['pap'], course: 'skyview', when: 'Sat · 8:30–10:00 AM', note: 'Tee time 10:10', from: 'Bronze IV', to: 'Gold II', wr: [45, 60] },
  { id: 'p-chex', who: ['chex'], course: 'spruce', when: 'Today · 4:00–6:00 PM', from: 'Silver V', to: 'Platinum I', wr: [0, 100] },
  { id: 'p-fupa', who: ['fupa', 'joey'], course: 'meadows', when: 'Sun · 7:30–9:00 AM', note: 'Bring a partner', from: 'Silver I', to: 'Putt Master', wr: [50, 100] },
  { id: 'p-mike', who: ['mike'], course: 'ocala', when: 'Today · 5:30 PM', from: 'Copper V', to: 'Gold V', wr: [0, 100] },
  { id: 'p-quin', who: ['quin', 'moose'], course: 'pine', when: 'Sat · 11:00 AM', from: 'Bronze I', to: 'Platinum V', wr: [0, 100] },
  { id: 'p-jimm', who: ['jimm'], course: 'golden', when: 'Sun · 10:00–11:30 AM', from: 'Gold V', to: 'Diamond I', wr: [50, 100] },
  { id: 'p-sam', who: ['sam', 'mac'], course: 'diamond', when: 'Sat · 1:00 PM', from: 'Copper V', to: 'Putt Master', wr: [0, 100] },
  { id: 'p-alva', who: ['alva'], course: 'juliette', when: 'Fri · 3:30 PM', note: 'Diamonds and up please', from: 'Platinum I', to: 'Putt Master', wr: [55, 100] },
];
export const postById = (id) => POSTS.find((p) => p.id === id);
const isDuo = (post) => post.who.length === 2;
const names = (post) => post.who.map((k) => PEOPLE[k].tag).join(' & ');
const inRange = (post, p) => p.rank.index >= rankByName(post.from).index && p.rank.index <= rankByName(post.to).index && p.pct >= post.wr[0] && p.pct <= post.wr[1];
const wrText = ([a, b]) => (a <= 0 && b >= 100 ? 'any win %' : b >= 100 ? `${a}%+ win %` : `${a}–${b}% win %`);

function postCard(post, { button = true } = {}) {
  const who = post.who.map((k) => PEOPLE[k]);
  const c = course(post.course);
  const head = isDuo(post)
    ? `<div class="lf-who">${who.map((p) => plate(p)).join('<span class="lf-amp">&amp;</span>')}</div><div class="lf-says">are looking for a <b>ranked duos</b> match</div>`
    : `<div class="lf-who">${plate(who[0])}</div><div class="lf-says">is looking for a match</div>`;
  return `<article class="lf-post ${isDuo(post) ? 'duo' : 'solo'}">
    <span class="lf-mode">${isDuo(post) ? 'Duos · 2 v 2' : 'Head-to-Head'}</span>
    ${head}
    <div class="lf-where">📍 ${esc(c.name)} <span>(${c.mi}mi away)</span>${post.courses && post.courses.length > 1 ? ` <span>+ ${post.courses.length - 1} more: ${post.courses.slice(1).map((id) => esc(course(id).name)).join(', ')}</span>` : ''}</div>
    <div class="lf-when">🕒 ${esc(post.when)}${post.note ? ` · ${esc(post.note)}` : ''}</div>
    <div class="lf-wants">Plays: ${post.from} – ${post.to} · ${wrText(post.wr)}</div>
    ${button ? `<button class="btn lf-go" data-action="lfg-pick" data-v="${post.id}">Challenge ${esc(names(post))}</button>` : ''}
  </article>`;
}

// ---------- Find Match ----------
export function findHtml(st) {
  const shown = [...(st.mine ? [st.mine] : []), ...POSTS]
    .filter((p) => st.show === 'all' || (st.show === 'duos') === isDuo(p))
    .filter((p) => course(p.course).mi <= st.miles)
    .sort((a, b) => (a.mine ? -1 : b.mine ? 1 : st.near ? course(a.course).mi - course(b.course).mi : 0));
  const chip = (v, label) => `<button class="chip ${st.show === v ? 'on' : ''}" data-action="lfg-show" data-v="${v}">${label}</button>`;
  const cards = shown.map((p) => (p.mine ? `<div class="lf-mine-tag">Your post</div>${postCard(p, { button: false })}` : postCard(p))).join('');
  return `<p class="muted small">Ranked players near you who want a game. Tap one to challenge them.</p>
    <div class="lf-filters">
      <div class="chips">${chip('all', 'All')}${chip('solo', 'Head-to-Head')}${chip('duos', 'Duos')}</div>
      <label class="lf-miles"><select data-lfg="near" aria-label="Sort"><option value="0" ${st.near ? '' : 'selected'}>Newest</option><option value="1" ${st.near ? 'selected' : ''}>Closest</option></select></label>
      <label class="lf-miles">Within <select data-lfg="miles">${[10, 25, 50].map((m) => `<option value="${m}" ${st.miles === m ? 'selected' : ''}>${m} mi</option>`).join('')}</select></label>
    </div>
    <div class="lf-list">${cards || '<p class="muted">Nobody is looking that close right now. Try a bigger distance, or post your own match.</p>'}</div>
    <p class="muted small lf-example">Example players and distances. The real board fills in once accounts are on.</p>`;
}

// ---------- the challenge, step by step ----------
const STEPS = ['Challenge', 'They answer', 'Pick a time', 'Locked in', 'Match day'];

function phone(label, body, cls = '') {
  return `<div class="lf-phone ${cls}"><div class="lf-phone-top">${label}</div>${body}</div>`;
}

export function challengeHtml(post, st) {
  const step = st.step;
  const who = post.who.map((k) => PEOPLE[k]);
  const lead = who[0];
  const duo = isDuo(post);
  const them = names(post);
  const partner = PEOPLE.sam;
  const you = duo ? `${plate(ME)}<span class="lf-amp">&amp;</span>${plate(partner)}` : plate(ME);
  const fits = inRange(post, ME);
  const c = course(post.course);
  const dots = STEPS.map((s, i) => `<li class="${i === step ? 'on' : i < step ? 'done' : ''}"><span>${i + 1}</span>${s}</li>`).join('');
  let body = '';
  if (step === 0) {
    body = `${postCard(post, { button: false })}
      ${duo ? `<div class="card lf-note"><b>Bring a partner:</b> ranked duos needs four verified players, so you pick a verified friend to team up with. Here: ${plate(partner)}</div>` : ''}
      <ul class="lf-checks">
        <li class="ok">You’re phone-verified ✓</li>
        <li class="${fits ? 'ok' : 'no'}">${fits ? `You fit what they asked for: ${post.from} – ${post.to}, ${wrText(post.wr)}` : `You’re outside what they asked for (${post.from} – ${post.to}, ${wrText(post.wr)}), so you can’t challenge this post`}</li>
      </ul>
      <button class="btn primary big wide" data-action="lfg-step" data-v="1" ${fits ? '' : 'disabled'}>Challenge ${esc(them)} to a ranked ${duo ? 'duos ' : ''}match</button>`;
  } else if (step === 1) {
    body = `<p class="lf-cap">${esc(lead.tag)} gets a notification and decides. They can see your rank and win % before saying yes.</p>
      ${phone(`${esc(lead.tag)}’s phone`, `
        <div class="lf-notif"><div class="lf-notif-app">👑 KOG Ranked <span>now</span></div>
          <div class="lf-notif-text"><b>Ranked challenge!</b> ${duo ? 'A duo wants' : 'Someone wants'} to play you at ${esc(c.name)}.</div></div>
        <div class="lf-challenger">
          <div class="eyebrow">Challenge from</div>
          <div class="lf-who">${you}</div>
          <div class="muted small">${duo ? 'Both' : ME.rank.name + ' ·'} verified ✓ · 38 ranked matches · ${ME.pct}% wins</div>
        </div>
        <div class="row-btns"><button class="btn primary" data-action="lfg-step" data-v="2">✓ Accept</button><button class="btn" data-action="lfg-decline">✕ Decline</button></div>`)}
      <p class="muted small">If ${esc(lead.tag)} declines, you just get a polite “not this time” and can challenge someone else. Nobody loses anything.</p>`;
  } else if (step === 2) {
    body = `<p class="lf-cap">You both settle on a date and time inside their window: ${esc(post.when)}.</p>
      ${phone('Match chat', `
        <div class="lf-chat">
          <div class="lf-msg me"><b>${esc(ME.tag)}</b> proposed <span class="lf-time">Sat · 8:30 AM</span></div>
          <div class="lf-msg"><b>${esc(lead.tag)}</b> suggested <span class="lf-time">Sat · 9:00 AM</span><em>${esc(post.note || 'Works better for me')}</em></div>
          <div class="lf-msg me"><b>${esc(ME.tag)}</b> accepted <span class="lf-time">Sat · 9:00 AM</span> ✓</div>
          <div class="lf-msg"><b>${esc(lead.tag)}</b> accepted ✓</div>
        </div>`)}
      <button class="btn primary big wide" data-action="lfg-step" data-v="3">Both accepted: lock the match 🔒</button>`;
  } else if (step === 3) {
    body = `<section class="card lf-locked">
        <div class="eyebrow">🔒 Locked ranked match</div>
        <div class="lf-vs">${you}<span class="vs">vs</span>${who.map((p) => plate(p)).join('<span class="lf-amp">&amp;</span>')}</div>
        <div class="lf-where">📍 ${esc(c.name)} · practice green</div>
        <div class="lf-when">🕒 Sat · 9:00 AM</div>
      </section>
      <ul class="lf-rules">
        <li><b>Changed your mind?</b> Cancel any time before the last hour for free.</li>
        <li><b>Bailing inside the last hour</b> costs <b>${RK.BAIL_PENALTY} MMR</b>.</li>
        <li><b>Check-in</b> opens 15 minutes before. Both phones must be at the course (within about 200 m).</li>
        <li><b>Reminder:</b> “Your ranked match starts in 1 hour” (a push notification in the App Store version).</li>
      </ul>
      <button class="btn primary big wide" data-action="lfg-step" data-v="4">Go to match day</button>`;
  } else {
    const noShow = st.outcome === 'noshow';
    const theirs = { mmr: lead.rank.min + 20, games: 40, rankIndex: lead.rank.index };
    const after = RK.bail(theirs);
    const seg = `<div class="seg-wide" role="group" aria-label="What happens on match day">
      <button class="seg-opt" data-action="lfg-outcome" data-v="show" aria-pressed="${!noShow}">Everyone shows</button>
      <button class="seg-opt" data-action="lfg-outcome" data-v="noshow" aria-pressed="${noShow}">${esc(lead.tag)} no-shows</button></div>`;
    body = noShow
      ? `${seg}
        <section class="card lf-noshow">
          <div class="eyebrow">Sat · 9:15 AM</div>
          <p><b>${esc(lead.tag)}</b> never checked in. 15 minutes after the start, it counts as a no-show.</p>
          <div class="lf-pen"><div>${plate(lead)}</div><div class="lf-pen-n">−${RK.BAIL_PENALTY} MMR</div></div>
          <div class="lf-pen ok"><div>${plate(ME)}</div><div class="lf-pen-n">±0</div></div>
          <p class="muted small">You lose nothing and the match is cancelled. Your post can go straight back up. Cancelling inside the last hour costs the same ${RK.BAIL_PENALTY} MMR, so it’s never worth ghosting.</p>
          <p class="muted small">${esc(lead.tag)} goes from ${theirs.mmr} to ${after.mmr} MMR.</p>
        </section>`
      : `${seg}
        <section class="card lf-show">
          <div class="eyebrow">Sat · 8:47 AM · check-in</div>
          <ul class="lf-checks"><li class="ok">You checked in at ${esc(c.name)} ✓</li><li class="ok">${esc(them)} checked in ✓</li></ul>
          <p>The match opens on every phone. Play the 7 rounds; each player scores their own balls and the other side confirms each round. When both sides sign off, ranks update and you head to your tee time.</p>
        </section>`;
    body += '<button class="btn wide" data-action="lfg-done">Back to Find Match</button>';
  }
  return `<ol class="lf-steps">${dots}</ol>${body}
    ${step > 0 ? `<button class="link lf-back" data-action="lfg-step" data-v="${step - 1}">‹ Back a step</button>` : ''}
    <p class="muted small lf-example">A walkthrough with example players. Nothing is sent.</p>`;
}

// ---------- Post Match ----------
const WR_OPTS = [0, 40, 42, 44, 45, 46, 48, 50, 52, 54, 55, 56, 58, 60, 62, 65, 70, 100];
export const newForm = () => ({ mode: 'solo', courses: ['spruce', 'skyview'], day: 'Sat', start: '8:30 AM', end: '10:00 AM', from: 'Bronze IV', to: 'Gold II', wrFrom: 0, wrTo: 100, partner: 'sam' });
const TIMES = ['7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];

export function formToPost(f) {
  const cs = f.courses.length ? f.courses : [COURSES[0].id];
  return {
    id: 'p-mine', mine: true, who: f.mode === 'duos' ? ['me', f.partner] : ['me'], course: cs[0], courses: cs,
    when: `${f.day} · ${f.start}–${f.end}`, from: f.from, to: f.to, wr: [f.wrFrom, f.wrTo],
  };
}

export function postHtml(f) {
  const sel = (key, opts, val, label = (o) => o) => `<select data-lfg-form="${key}">${opts.map((o) => `<option value="${o}" ${String(o) === String(val) ? 'selected' : ''}>${label(o)}</option>`).join('')}</select>`;
  const rankNames = RK.RANKS.map((r) => r.name);
  const fromIdx = rankByName(f.from).index;
  const courseChips = COURSES.map((c) => `<button class="chip lf-course ${f.courses.includes(c.id) ? 'on' : ''}" data-action="lfg-course" data-v="${c.id}">${esc(c.name)} <small>${c.mi}mi</small></button>`).join('');
  const wrLabel = (v) => (v === 0 ? 'Any' : v === 100 ? 'Any' : `${v}%`);
  const summary = `Only search for matches between: <b>${f.from}</b> and <b>${f.to}</b>${f.wrFrom > 0 || f.wrTo < 100 ? `, with a win % of <b>${f.wrTo >= 100 ? `${f.wrFrom}% or more` : `${f.wrFrom}% to ${f.wrTo}%`}</b>` : ''}`;
  const preview = { ...formToPost(f) };
  const where = f.courses.length === 1 ? course(f.courses[0]).name : `${f.courses.length} courses`;
  return `<p class="muted small">Post when and where you can play, and who you want to play. Players who fit can challenge you.</p>
    <section class="card lf-form">
      <div class="field"><span>Match</span><div class="seg-wide" role="group" aria-label="Match type">
        <button class="seg-opt" data-action="lfg-form-mode" data-v="solo" aria-pressed="${f.mode === 'solo'}">Head-to-Head</button>
        <button class="seg-opt" data-action="lfg-form-mode" data-v="duos" aria-pressed="${f.mode === 'duos'}">Duos · 2 v 2</button></div></div>
      ${f.mode === 'duos' ? `<label class="field"><span>Your partner <em>(a verified friend)</em></span>${sel('partner', ['sam', 'jimm', 'mike', 'moose'], f.partner, (k) => PEOPLE[k].tag)}</label>` : ''}
      <div class="field"><span>Courses <em>(pick one or several)</em></span><div class="chips lf-courses">${courseChips}</div></div>
      <div class="lf-row3">
        <label class="field"><span>Day</span>${sel('day', ['Today', 'Tomorrow', 'Fri', 'Sat', 'Sun'], f.day)}</label>
        <label class="field"><span>From</span>${sel('start', TIMES, f.start)}</label>
        <label class="field"><span>To</span>${sel('end', TIMES, f.end)}</label>
      </div>
      <div class="field"><span>Opponent ranks</span><div class="lf-row2">
        ${sel('from', rankNames, f.from)}<span class="lf-to">to</span>${sel('to', rankNames.filter((n) => rankByName(n).index >= fromIdx), f.to)}</div></div>
      <div class="field"><span>Opponent win %</span><div class="lf-row2">
        ${sel('wrFrom', WR_OPTS.filter((v) => v < 100), f.wrFrom, wrLabel)}<span class="lf-to">to</span>${sel('wrTo', WR_OPTS.filter((v) => v > f.wrFrom), f.wrTo, wrLabel)}</div></div>
      <p class="lf-summary">${summary}</p>
    </section>
    <div class="section-head"><h2>How your post looks</h2><span class="muted small">${esc(where)}</span></div>
    ${postCard(preview, { button: false })}
    <button class="btn primary big wide" data-action="lfg-post" ${f.courses.length ? '' : 'disabled'}>Post match</button>
    <p class="muted small lf-example">Demo: your post shows on the Find Match tab on this phone only.</p>`;
}
PEOPLE.me = ME;

// ---------- How it works: a clickable slideshow of phone screens ----------
const deltaTag = (n) => `<span class="hw-delta ${n >= 0 ? 'up' : 'down'}">${n >= 0 ? '+' : '−'}${Math.abs(n)}</span>`;
const rating = (p) => ({ mmr: p.rank.min + 20, games: 40, rankIndex: p.rank.index });

/** An iPhone-style frame around a mock app screen. */
function phoneFrame(body, { lock = false, time = '9:41' } = {}) {
  return `<div class="mk-phone${lock ? ' lock' : ''}"><div class="mk-island"></div>
    <div class="mk-status"><span>${time}</span><span class="mk-icons">▂▄▆ ᯤ ▮</span></div>
    <div class="mk-screen">${body}</div><div class="mk-home"></div></div>`;
}
const mkTop = (title) => `<div class="mk-top"><span class="mk-back">‹</span><b>${title}</b><span></span></div>`;
const mkBtn = (label, cls = '') => `<div class="mk-btn ${cls}">${label}</div>`;
const tap = '<span class="mk-tap" aria-hidden="true"></span>';
const mkRow = (p, right = '', cls = '') => `<div class="mk-row ${cls}">${plate(p, { badge: 18, ball: 13 })}<span class="mk-right">${right}</span></div>`;
const KING = (suit) => `<img class="mk-king" src="assets/duos/king-${suit}.webp" alt="">`;

/** A nameplate with tiny arrows labelling the rank badge, the KOG username and the win % ball. */
function annotatedPlate(p) {
  const level = WR.levelFor(p.pct, 100);
  return `<div class="mk-anno">
    <span class="an-lbl" style="grid-area:r1">Rank</span><span class="an-arr" style="grid-area:a1">↓</span>
    <span class="an-item" style="grid-area:i1">${rankBadge(p.rank, 28)}</span>
    <b class="an-name" style="grid-area:i2">${esc(p.tag)}</b>
    <span class="an-arr" style="grid-area:a2">↑</span><span class="an-lbl" style="grid-area:r2">KOG username</span>
    <span class="an-lbl" style="grid-area:r3">Win %</span><span class="an-arr" style="grid-area:a3">↓</span>
    <span class="an-item" style="grid-area:i3">${WR.winBall(level, 20)}</span>
    <span class="check an-check" style="grid-area:i4" title="Verified">✓</span>
  </div>`;
}

function slides1v1() {
  const friend = PEOPLE.mac;
  const [a, b] = RK.rate1v1(rating(ME), rating(friend), 1);
  const rank = ME.rank;
  const next = RK.RANKS[rank.index + 1];
  return [
    {
      title: 'Verify your phone', text: 'Ranked needs a verified phone number, one per player. You each do this once, the first time you play ranked.',
      screen: `${mkTop('Your account')}
        <div class="mk-card"><div class="mk-label">Phone number</div><div class="mk-input">(352) ••• ••47</div>
          <div class="mk-label">Enter the 6-digit code</div><div class="mk-code">${'482916'.split('').map((d) => `<span>${d}</span>`).join('')}</div></div>
        <div class="mk-banner ok">✓ Phone-verified · Ranked unlocked</div>
        <div class="mk-card"><div class="mk-label">Your nameplate</div>${annotatedPlate(ME)}</div>`,
    },
    {
      title: 'Start a ranked match', text: `On the practice green, open <b>KOG Ranked → Head-to-Head</b> and invite ${friend.tag}.`,
      screen: `${mkTop('KOG Ranked')}
        <div class="mk-mode on"><img src="assets/h2h-banner.webp" alt="">${tap}<b>Head-to-Head</b></div>
        <div class="mk-mode"><img src="assets/duos-banner.webp" alt=""><b>Duos · 2 v 2</b></div>
        <div class="mk-sheet"><div class="mk-grab"></div><b>Invite to a ranked match</b>
          <div class="mk-input search">🔍 mcc</div>
          <div class="mk-row">${plate(friend, { badge: 18, ball: 13 })}<span class="mk-pill">Invite${tap}</span></div></div>`,
    },
    {
      title: 'Your friend accepts', text: `${friend.tag} gets the invite on their own phone and taps Accept.`,
      screen: `<div class="mk-lock"><div class="mk-lock-day">Saturday, November 21</div><div class="mk-lock-time">9:32</div></div>
        <div class="mk-notif"><div class="mk-notif-app">👑 KOG Ranked <span>now</span></div>
          <b>Ranked match invite from</b><div>${plate(ME, { badge: 16, ball: 12 })}</div><div>wants a ranked 1 v 1 at Skyview Golf Course.</div>
          <div class="mk-notif-btns"><span>Decline</span><span class="yes">Accept${tap}</span></div></div>`,
      lock: true, time: '9:32',
    },
    {
      title: 'Check in at the course', text: 'Both phones confirm you’re at the course (within about 200 m). That keeps every ranked match real.',
      screen: `${mkTop('Check in')}
        <div class="mk-map"><div class="mk-ring"></div><div class="mk-pin">📍</div><span>Skyview Golf Course</span></div>
        <div class="mk-card">${mkRow(ME, '<span class="mk-ok">✓</span>')}${mkRow(friend, '<span class="mk-ok">✓</span>')}</div>
        ${mkBtn(`Start ranked match${tap}`, 'primary')}`,
    },
    {
      title: 'Play the 7 rounds', text: 'About 30 minutes. Each of you enters your own balls, and the other confirms every round.',
      screen: `${mkTop('Round 3 of 7')}
        <div class="mk-card"><div class="mk-label">Totals</div>${mkRow(ME, '<b class="mk-score">−2</b>', 'lead')}${mkRow(friend, '<b class="mk-score">−1</b>')}</div>
        <div class="mk-card"><div class="mk-label">Your balls this round</div>
          <div class="mk-balls"><span class="b">Birdie</span><span class="p">Par</span><span class="b">Birdie</span></div></div>
        <div class="mk-banner">✓ ${friend.tag} confirmed round 3</div>
        ${mkBtn('Next round', 'primary')}`,
    },
    {
      title: 'Both sign off, ranks update', text: `You win. Beating a higher rank (${friend.rank.name}) pays more than beating a lower one. Then head to your tee time.`,
      screen: `${mkTop('Ranked result')}
        <div class="mk-win">🏆 Victory</div>
        <div class="mk-card"><div class="mk-label">MMR change</div>${mkRow(ME, deltaTag(a.change))}${mkRow(friend, deltaTag(b.change))}</div>
        <div class="mk-card"><div class="mk-label">${rank.name} → ${next.name}</div><div class="mk-bar"><span style="width:${Math.min(96, 40 + a.change * 2)}%"></span></div></div>
        ${mkBtn('⛳ Head to your tee time', 'primary')}`,
    },
  ];
}

function slidesDuos() {
  const t1 = [ME, PEOPLE.jimm];
  const t2 = [PEOPLE.moose, PEOPLE.mike];
  const [a, b] = RK.rateTeams(t1.map(rating), t2.map(rating), 1);
  const team = (cls, name, kings, ps) => `<div class="mk-team ${cls}"><div class="mk-team-head">${kings}<b>${name}</b></div>${ps.map((p) => plate(p, { badge: 18, ball: 13 })).join('')}</div>`;
  return [
    {
      title: 'All four are verified', text: 'You and three friends show up an hour early. Ranked duos needs all four players phone-verified.',
      screen: `${mkTop('Ranked duos lobby')}
        <div class="mk-card">${[...t1, ...t2].map((p) => mkRow(p, '<span class="check">✓</span>')).join('')}</div>
        <div class="mk-banner ok">4 of 4 verified · ready</div>
        ${mkBtn(`Pick teams${tap}`, 'primary')}`,
    },
    {
      title: 'Pick the teams', text: `Any ranks can team up. You (${ME.rank.name}) pair with JimmBurg (${PEOPLE.jimm.rank.name}).`,
      screen: `${mkTop('Teams')}
        ${team('red', 'Red Kings', KING('hearts') + KING('diamonds'), t1)}
        <div class="mk-vs">VS</div>
        ${team('black', 'Black Kings', KING('clubs') + KING('spades'), t2)}
        ${mkBtn(`Lock teams${tap}`, 'primary')}`,
    },
    {
      title: 'Everyone checks in', text: 'All four phones confirm you’re at the course before the match opens.',
      screen: `${mkTop('Check in')}
        <div class="mk-map"><div class="mk-ring"></div><div class="mk-pin">📍</div><span>The Meadows at Citrus Hills</span></div>
        <div class="mk-card">${[...t1, ...t2].map((p) => mkRow(p, '<span class="mk-ok">✓</span>')).join('')}</div>`,
    },
    {
      title: 'Play as teams', text: 'Teammates split the balls, so duos runs about 25 minutes. The other team confirms every round.',
      screen: `${mkTop('Round 5 of 7')}
        <div class="mk-card"><div class="mk-label">Team totals</div>
          <div class="mk-row lead"><span class="mk-tname red">${KING('hearts')} Red Kings</span><b class="mk-score">−3</b></div>
          <div class="mk-row"><span class="mk-tname black">${KING('spades')} Black Kings</span><b class="mk-score">−1</b></div></div>
        <div class="mk-card"><div class="mk-label">This set</div>
          <div class="mk-balls"><span class="b">thetommyjohn · Birdie</span><span class="p">JimmBurg · Par</span></div></div>
        <div class="mk-banner">✓ Black Kings confirmed round 5</div>`,
    },
    {
      title: 'Ranks update for each player', text: 'Red Kings win. Everyone moves on their own rating, so the higher-ranked teammate gains less on a win and loses more on a loss.',
      screen: `${mkTop('Ranked result')}
        <div class="mk-win">🏆 Red Kings win</div>
        <div class="mk-card"><div class="mk-label">MMR change</div>${mkRow(t1[0], deltaTag(a[0].change))}${mkRow(t1[1], deltaTag(a[1].change))}${mkRow(t2[0], deltaTag(b[0].change))}${mkRow(t2[1], deltaTag(b[1].change))}</div>`,
    },
    {
      title: 'Run it back, or tee off', text: 'Still time? A rematch with the same four counts half today, then a quarter, so nobody can farm points off friends.',
      screen: `${mkTop('Ranked result')}
        <div class="mk-card mk-center"><div class="mk-big">Run it back?</div><div class="mk-label">Same four players today counts ½</div></div>
        ${mkBtn('Rematch (½ points)')}
        ${mkBtn('⛳ Head to the first tee', 'primary')}`,
    },
  ];
}

export const HOW_COUNT = { '1v1': 6, duos: 6 };

export function howHtml(tab, idx = 0) {
  const list = tab === 'duos' ? slidesDuos() : slides1v1();
  const i = Math.max(0, Math.min(idx, list.length - 1));
  const s = list[i];
  const tabs = `<div class="seg-wide" role="group" aria-label="Which match">
    <button class="seg-opt" data-action="how-tab" data-v="1v1" aria-pressed="${tab !== 'duos'}">1 v 1 before tee time</button>
    <button class="seg-opt" data-action="how-tab" data-v="duos" aria-pressed="${tab === 'duos'}">Duos with your foursome</button></div>`;
  const dots = list.map((_, k) => `<button class="hw-dot ${k === i ? 'on' : ''}" data-action="how-slide" data-v="${k}" aria-label="Slide ${k + 1}"></button>`).join('');
  return `${tabs}
    <div class="hw-deck" data-deck="${tab}">
      <div class="hw-slide" key="${tab}-${i}">${phoneFrame(s.screen, s)}</div>
      <div class="hw-caption"><div class="hw-count">${i + 1} of ${list.length}</div><h3>${s.title}</h3><p>${s.text}</p></div>
      <div class="hw-nav">
        <button class="btn" data-action="how-slide" data-v="${i - 1}" ${i === 0 ? 'disabled' : ''}>‹ Back</button>
        <div class="hw-dots">${dots}</div>
        ${i < list.length - 1 ? `<button class="btn primary" data-action="how-slide" data-v="${i + 1}">Next ›</button>` : `<button class="btn primary" data-action="how-slide" data-v="0">Replay</button>`}
      </div>
    </div>
    <section class="card hw-other"><b>No friends free?</b> Use <b>Find Match / Post Match</b> to play a ranked match against someone near you.
      <button class="btn wide" data-action="nav" data-view="lfg" data-back="ranked-how">Find Match / Post Match</button></section>
    <p class="muted small lf-example">How ranked could look once it’s live. Example players.</p>`;
}
