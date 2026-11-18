// KOG Ranked previews: "How it works" stories and the Find Match / Post Match board.
// Everything here is example data until accounts and the server are switched on.
import * as RK from './ranked.js';
import * as WR from './winrate.js';
import { rankBadge } from './badges.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const rankByName = (name) => RK.RANKS.find((r) => r.name === name);

// ---------- example players ----------
const P = (tag, rank, pct) => ({ tag, rank: rankByName(rank), pct });
export const ME = { tag: 'You', rank: RK.rankFor(1447), pct: 52, me: true }; // same example as the Current rank panel
const PEOPLE = {
  pap: P('Pap_Daddy_Kid', 'Silver II', 54),
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
  return `<span class="lf-plate${p.me ? ' me' : ''}">${rankBadge(p.rank, badge)}<b>${esc(p.tag)}</b>${WR.winBall(level, ball)}<span class="lf-pct" style="color:${level.light}">${p.pct}%</span>${check ? '<span class="check" title="Verified">✓</span>' : ''}</span>`;
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
          <div class="lf-msg me"><b>You</b> proposed <span class="lf-time">Sat · 8:30 AM</span></div>
          <div class="lf-msg"><b>${esc(lead.tag)}</b> suggested <span class="lf-time">Sat · 9:00 AM</span><em>${esc(post.note || 'Works better for me')}</em></div>
          <div class="lf-msg me"><b>You</b> accepted <span class="lf-time">Sat · 9:00 AM</span> ✓</div>
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

// ---------- How it works ----------
function timeline(steps) {
  return `<ol class="hw-steps">${steps.map(([title, text], i) => `<li><span class="hw-n">${i + 1}</span><div><h3>${title}</h3>${text}</div></li>`).join('')}</ol>`;
}
const deltaTag = (n) => `<span class="hw-delta ${n >= 0 ? 'up' : 'down'}">${n >= 0 ? '+' : '−'}${Math.abs(n)}</span>`;
const rating = (p) => ({ mmr: p.rank.min + 20, games: 40, rankIndex: p.rank.index });

export function howHtml(tab) {
  const tabs = `<div class="seg-wide" role="group" aria-label="Which match">
    <button class="seg-opt" data-action="how-tab" data-v="1v1" aria-pressed="${tab === '1v1'}">1 v 1 before tee time</button>
    <button class="seg-opt" data-action="how-tab" data-v="duos" aria-pressed="${tab === 'duos'}">Duos with your foursome</button></div>`;
  if (tab === 'duos') {
    const t1 = [ME, PEOPLE.jimm];
    const t2 = [PEOPLE.moose, PEOPLE.mike];
    const [a, b] = RK.rateTeams(t1.map(rating), t2.map(rating), 1);
    const row = (p, r) => `<div class="hw-res">${plate(p)}${deltaTag(r.change)}</div>`;
    return `${tabs}
      <section class="card hw-story"><div class="eyebrow">Saturday · Tee time 9:00 AM</div>
        <p>You and three friends show up an hour early and play a <b>ranked duos</b> match on the practice green.</p></section>
      ${timeline([
        ['All four are verified', `<p>Ranked duos needs four phone-verified players. Each of you verifies your number once.</p>
          <div class="hw-plates">${[...t1, ...t2].map((p) => plate(p, { check: true })).join('')}</div>`],
        ['Pick the teams', `<p>Any ranks can team up. Here you (${ME.rank.name}) pair with JimmBurg (${PEOPLE.jimm.rank.name}).</p>
          <div class="hw-teams"><div class="hw-team red"><span>Red Kings</span>${t1.map((p) => plate(p)).join('')}</div><div class="vs">vs</div><div class="hw-team black"><span>Black Kings</span>${t2.map((p) => plate(p)).join('')}</div></div>`],
        ['Start the match and check in', '<p>You tap <b>KOG Ranked → Duos</b> and invite the other three. Everyone accepts on their own phone, and all four phones check in at the course.</p>'],
        ['Play', '<p>Teammates split the balls, so a duos match runs about 25 minutes. Each team enters its own balls and the other team confirms each round.</p>'],
        ['Everyone signs off, ranks update', `<p>Red Kings win. Each player moves on their <b>own</b> rating against the other team, so the higher-ranked teammate gains less on a win (and would lose more on a loss).</p>
          <div class="hw-results">${row(t1[0], a[0])}${row(t1[1], a[1])}${row(t2[0], b[0])}${row(t2[1], b[1])}</div>`],
        ['Rematch or tee off', '<p>Still time? A rematch with the same four counts half today, then a quarter, so nobody can farm points off friends. Then head to the first tee.</p>'],
      ])}`;
  }
  const friend = PEOPLE.mac;
  const [a, b] = RK.rate1v1(rating(ME), rating(friend), 1);
  return `${tabs}
    <section class="card hw-story"><div class="eyebrow">Saturday · Tee time 10:10 AM</div>
      <p>You and a friend get to the course 40 minutes early and play a <b>ranked 1 v 1</b> on the practice green.</p></section>
    ${timeline([
      ['Both of you are verified', `<p>Ranked needs a phone-verified account, one number per player. You each verify once, the first time you play ranked.</p>
        <div class="hw-plates">${plate(ME, { check: true })}${plate(friend, { check: true })}</div>`],
      ['Start a ranked match', `<p>You tap <b>KOG Ranked → Head-to-Head</b> and invite ${friend.tag}, who accepts on their own phone.</p>`],
      ['Check in', '<p>Both phones confirm you’re at the course (within about 200 m). That keeps ranked matches real.</p>'],
      ['Play the 7 rounds', '<p>About 30 minutes. Each of you scores your own balls on your own phone, and the other confirms each round.</p>'],
      ['Both sign off, ranks update', `<p>You win. Ranks move by the gap between you, so beating a higher rank (${friend.rank.name}) pays more.</p>
        <div class="hw-results"><div class="hw-res">${plate(ME)}${deltaTag(a.change)}</div><div class="hw-res">${plate(friend)}${deltaTag(b.change)}</div></div>`],
      ['Head to the first tee', '<p>Done with time to spare for a warm-up swing.</p>'],
    ])}
    <section class="card hw-other"><b>No friend free?</b> Use <b>Find Match / Post Match</b> to play a ranked match against someone near you.
      <button class="btn wide" data-action="nav" data-view="lfg" data-back="ranked-how">Find Match / Post Match</button></section>`;
}
