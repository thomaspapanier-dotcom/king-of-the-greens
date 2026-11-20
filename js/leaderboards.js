// Leaderboards: players, Kingdoms and Realms. Example numbers until ranked play is live.
import * as KG from './kingdoms.js';
import { ME, PEOPLE, plate } from './lfg.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const HOME = 'FL'; // example player's Kingdom (the state they signed up in)
const elo = (p) => p.rank.min + 20 + (p.pct - 50) * 3;

// Steady made-up numbers per Kingdom, so the example board doesn't reshuffle on every visit.
function seeded(code) {
  let h = 0;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return h;
}
const KINGDOMS = Object.keys(KG.STATES).map((code) => {
  const h = seeded(code);
  return { code, name: KG.kingdomName(code), realm: KG.realmOf(code), avg: 1380 + (h % 190), players: 40 + (h % 900), matches: 120 + ((h * 7) % 4200) };
});
const REALM_ROWS = KG.REALMS.map((r) => {
  const ks = KINGDOMS.filter((k) => k.realm.id === r.id);
  const players = ks.reduce((n, k) => n + k.players, 0);
  return { ...r, players, matches: ks.reduce((n, k) => n + k.matches, 0), avg: Math.round(ks.reduce((n, k) => n + k.avg * k.players, 0) / players), top: [...ks].sort((a, b) => b.avg - a.avg)[0] };
});

export function leaderboardsHtml(st) {
  const tab = st.tab || 'players';
  const myRealm = KG.realmOf(HOME);
  const seg = (v, label) => `<button class="seg-opt" data-action="lb-tab" data-v="${v}" aria-pressed="${tab === v}">${label}</button>`;
  const chip = (key, v, label) => `<button class="chip ${st[key] === v ? 'on' : ''}" data-action="lb-scope" data-k="${key}" data-v="${v}">${label}</button>`;
  let body = '';
  if (tab === 'players') {
    const scope = st.scope || 'kingdom';
    const all = [...new Set([ME, ...Object.values(PEOPLE)])]; // PEOPLE includes you as .me
    const list = all
      .filter((p) => scope === 'country' || (scope === 'realm' ? KG.realmOf(p.kingdom).id === myRealm.id : p.kingdom === HOME))
      .sort((a, b) => elo(b) - elo(a));
    body = `<div class="chips lb-chips">${chip('scope', 'kingdom', `${KG.STATES[HOME]} Kingdom`)}${chip('scope', 'realm', 'My Realm')}${chip('scope', 'country', 'Country')}</div>
      <ol class="lb-list">${list.map((p, i) => `<li class="${p.me ? 'me' : ''}">
        <span class="lb-pos">${i + 1}</span>
        <div class="lb-card">${plate(p, { badge: 30, ball: 18 })}<div class="lb-meta">${elo(p)} Elo · ${esc(KG.kingdomName(p.kingdom))}</div></div>
      </li>`).join('')}</ol>`;
  } else if (tab === 'kingdoms') {
    const scope = st.kscope || 'all';
    const list = KINGDOMS.filter((k) => scope === 'all' || k.realm.id === myRealm.id).sort((a, b) => b.avg - a.avg);
    body = `<div class="chips lb-chips">${chip('kscope', 'all', 'All 50 Kingdoms')}${chip('kscope', 'realm', myRealm.name.replace('Realm of the ', ''))}</div>
      <ol class="lb-table">${list.map((k, i) => `<li class="${k.code === HOME ? 'me' : ''}">
        <span class="lb-pos">${i + 1}</span>
        <span class="lb-name"><b>${esc(k.name)}</b><small>${esc(k.realm.name)}</small></span>
        <span class="lb-num"><b>${k.avg}</b><small>avg Elo</small></span>
        <span class="lb-num"><b>${k.players}</b><small>players</small></span>
      </li>`).join('')}</ol>`;
  } else {
    const list = [...REALM_ROWS].sort((a, b) => b.avg - a.avg);
    body = `<ol class="lb-table realms">${list.map((r, i) => `<li class="${r.id === myRealm.id ? 'me' : ''}">
        <span class="lb-pos">${i + 1}</span>
        <span class="lb-name"><b>${esc(r.name)}</b><small>${r.region} · ${r.states.length} Kingdoms · top: ${esc(r.top.name)}</small></span>
        <span class="lb-num"><b>${r.avg}</b><small>avg Elo</small></span>
        <span class="lb-num"><b>${r.players.toLocaleString()}</b><small>players</small></span>
      </li>`).join('')}</ol>`;
  }
  return `<section class="card lb-intro">
      <div class="eyebrow">Your Kingdom</div>
      <div class="lb-home"><b>${esc(KG.kingdomName(HOME))}</b><span>${esc(myRealm.name)}</span></div>
      <p class="muted small">Your Kingdom is the state you sign up in, and Kingdoms band together into six Realms. Climb your Kingdom’s board, then see how your whole Kingdom and Realm stack up against the rest of the country.</p>
    </section>
    <div class="seg-wide lb-tabs" role="group" aria-label="Leaderboard">${seg('players', 'Players')}${seg('kingdoms', 'Kingdoms')}${seg('realms', 'Realms')}</div>
    ${body}
    <p class="muted small lf-example">Example players and numbers. Real leaderboards go live with ranked play.</p>`;
}
