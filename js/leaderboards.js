// Leaderboards: players, Kingdoms and Realms, filtered by tapping around a map of the country.
// Example numbers until ranked play is live.
import * as KG from './kingdoms.js';
import * as MAP from './usmap.js';
import { ME, PEOPLE, plate, rankByName } from './lfg.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const HOME = 'FL'; // example player's Kingdom (the state they signed up in)
const elo = (p) => p.rank.min + 20 + (p.pct - 50) * 3;

// Each Realm's color on the map.
const COLOR = { ivy: '#2fae7a', magnolia: '#e0528a', plains: '#e6b12e', desert: '#ec7a32', peaks: '#8b7cf6', pacific: '#3a9be0' };

// A few more example players around the country, so every Realm has someone on its board.
const X = (tag, sub, rank, pct, art, kingdom) => ({ tag, sub, rank: rankByName(rank), pct, art, kingdom });
const ELSEWHERE = [
  X('Jordan K.', '', 'Platinum II', 61, 'sniper', 'CA'),
  X('Maya Chen', '', 'Gold I', 57, 'west', 'WA'),
  X('Boomer', 'Chris', 'Diamond III', 62, 'mountain-west', 'CO'),
  X('Tyler B.', '', 'Gold V', 55, 'midwest', 'IL'),
  X('Sean O’Brien', '', 'Silver III', 52, 'northeast', 'MA'),
  X('Cactus Jack', 'Jack', 'Platinum IV', 59, 'southwest', 'AZ'),
  X('Luis Ortega', '', 'Gold III', 56, 'underdog', 'TX'),
  X('Kevin L.', '', 'Silver I', 50, 'par-100', 'OH'),
];
const PLAYERS = [...new Set([ME, ...Object.values(PEOPLE), ...ELSEWHERE])]; // PEOPLE includes you as .me

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

/** Tapping the map: a Realm breaks off; tap one of its Kingdoms to pick it (again to let go). Blank = whole country. */
export function lbMapTap(st, v) {
  if (!v || v === 'country') {
    st.realm = null;
    st.kingdom = null;
  } else if (v === 'my-realm') {
    st.realm = KG.realmOf(HOME).id;
    st.kingdom = null;
  } else if (v.startsWith('realm:')) {
    st.realm = v.slice(6);
    st.kingdom = null;
  } else if (v === 'my-kingdom') {
    st.realm = KG.realmOf(HOME).id;
    st.kingdom = HOME;
  } else {
    const realm = KG.realmOf(v).id;
    if (st.realm !== realm) {
      st.realm = realm;
      st.kingdom = null;
    } else {
      st.kingdom = st.kingdom === v ? null : v;
    }
  }
  st.anim = st.realm; // play the break-off once
}

// ---------- the map ----------
const CENTER = [487, 305];
const SMALL = new Set(['RI', 'DE', 'CT', 'NJ', 'MD', 'VT', 'NH', 'MA']); // too small for a label
const avgPt = (codes) => codes.reduce((a, c) => [a[0] + MAP.LABEL[c][0] / codes.length, a[1] + MAP.LABEL[c][1] / codes.length], [0, 0]);
const STAR = (() => {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 6.5 : 15;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    p.push(`${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`);
  }
  return p.join(' ');
})();

function mapHtml(st) {
  // Zoom so the open Realm fills the map: s is how much bigger it draws.
  let zoom = '';
  let s = 1;
  const open = st.realm ? KG.realmById(st.realm) : null;
  if (open) {
    const [cx, cy] = avgPt(open.states);
    const len = Math.hypot(cx - CENTER[0], cy - CENTER[1]) || 1;
    const ox = ((cx - CENTER[0]) / len) * 24;
    const oy = ((cy - CENTER[1]) / len) * 24;
    const b = open.states.reduce((a, c) => { const q = MAP.BOX[c]; return [Math.min(a[0], q[0]), Math.min(a[1], q[1]), Math.max(a[2], q[2]), Math.max(a[3], q[3])]; }, [1e9, 1e9, -1e9, -1e9]);
    const w = (b[2] - b[0]) * 1.14 + 50;
    const h = (b[3] - b[1]) * 1.14 + 50;
    s = Math.min(1023 / w, 664 / h, 3.2);
    const mx = (b[0] + b[2]) / 2 + ox;
    const my = (b[1] + b[3]) / 2 + oy;
    zoom = ` style="transform:translate(487.5px,308px) scale(${s.toFixed(3)}) translate(${(-mx).toFixed(1)}px,${(-my).toFixed(1)}px)"`;
  }
  const order = [...KG.REALMS].sort((a, b) => (a.id === st.realm) - (b.id === st.realm)); // the open Realm draws on top
  const realms = order.map((r) => {
    const on = r.id === st.realm;
    const [cx, cy] = avgPt(r.states);
    const vx = cx - CENTER[0];
    const vy = cy - CENTER[1];
    const len = Math.hypot(vx, vy) || 1;
    const cls = `lb-realm${on ? ' on' : ''}${st.realm && !on ? ' dim' : ''}${on && st.anim === r.id ? ' anim' : ''}`;
    const states = r.states.map((code) => {
      const [x, y] = MAP.LABEL[code];
      const home = code === HOME;
      const fs = (40 / s).toFixed(1);
      const label = on && !(SMALL.has(code) && s < 2.5) && !home ? `<text class="lb-abbr" x="${x}" y="${(y + 14 / s).toFixed(1)}" font-size="${fs}">${code}</text>` : '';
      const star = home ? `<g class="lb-star" transform="translate(${x} ${y}) scale(${(on ? 2.6 / s : 1).toFixed(3)})"><polygon points="${STAR}"/>${on ? '<text class="lb-you" x="-20" y="5">Your Kingdom</text>' : ''}</g>` : '';
      return `<g class="lb-st${code === st.kingdom ? ' pick' : ''}" data-action="lb-map" data-v="${code}" style="--dx:${((x - cx) * 0.07).toFixed(1)}px;--dy:${((y - cy) * 0.07).toFixed(1)}px"><title>${esc(KG.kingdomName(code))}</title><path d="${MAP.PATHS[code]}"/>${label}${star}</g>`;
    }).join('');
    return `<g class="${cls}" style="--c:${COLOR[r.id]};--rx:${((vx / len) * 24).toFixed(1)}px;--ry:${((vy / len) * 24).toFixed(1)}px">${states}</g>`;
  }).join('');
  return `<svg class="lb-svg" viewBox="-24 -24 1023 664" role="img" aria-label="Map of the six Realms. Tap a Realm to see its Kingdoms.">
    <rect x="-24" y="-24" width="1023" height="664" fill="transparent" data-action="lb-map" data-v="country"/>
    <g class="lb-zoom${open && st.anim === open.id ? ' anim' : ''}"${zoom}>${realms}</g>
  </svg>`;
}

export function leaderboardsHtml(st) {
  const tab = st.tab || 'players';
  const realm = st.realm ? KG.realmById(st.realm) : null;
  const kingdom = st.kingdom || null;
  const homeRealm = KG.realmOf(HOME);
  st.anim = null; // the next redraw shouldn't replay the break-off

  // What's picked on the map
  const head = kingdom
    ? `<b>${esc(KG.kingdomName(kingdom))}</b><span>${esc(realm.name)}${kingdom === HOME ? ' · <em>Your Kingdom</em>' : ''}</span>`
    : realm
      ? `<b style="color:${COLOR[realm.id]}">${esc(realm.name)}</b><span>${realm.region} · ${realm.states.length} Kingdoms${realm.id === homeRealm.id ? ' · <em>Your Realm</em>' : ''} · tap a Kingdom</span>`
      : '<b>United States</b><span>Six Realms, 50 Kingdoms · tap a Realm</span>';
  const quick = (v, label, on) => `<button class="chip ${on ? 'on' : ''}" data-action="lb-map" data-v="${v}">${label}</button>`;
  const mapCard = `<section class="card lb-mapcard">
      <div class="lb-maphead">${head}</div>
      <div class="lb-map">${mapHtml(st)}</div>
      <div class="chips lb-chips">${quick('my-kingdom', 'My Kingdom', kingdom === HOME)}${quick('my-realm', 'My Realm', realm?.id === homeRealm.id && !kingdom)}${quick('country', 'Country', !realm)}</div>
    </section>`;

  const seg = (v, label) => `<button class="seg-opt" data-action="lb-tab" data-v="${v}" aria-pressed="${tab === v}">${label}</button>`;
  const where = kingdom ? KG.kingdomName(kingdom) : realm ? realm.name : 'the country';
  let body = '';
  if (tab === 'players') {
    const list = PLAYERS
      .filter((p) => (kingdom ? p.kingdom === kingdom : realm ? KG.realmOf(p.kingdom).id === realm.id : true))
      .sort((a, b) => elo(b) - elo(a));
    body = list.length
      ? `<ol class="lb-list">${list.map((p, i) => `<li class="${p.me ? 'me' : ''}">
        <span class="lb-pos">${i + 1}</span>
        <div class="lb-card">${plate(p, { badge: 30, ball: 18 })}<div class="lb-meta">${elo(p)} Elo · ${esc(KG.kingdomName(p.kingdom))}</div></div>
      </li>`).join('')}</ol>`
      : `<p class="muted lb-empty">No example players in ${esc(where)} yet.</p>`;
  } else if (tab === 'kingdoms') {
    const list = KINGDOMS.filter((k) => !realm || k.realm.id === realm.id).sort((a, b) => b.avg - a.avg);
    body = `<ol class="lb-table">${list.map((k, i) => `<li class="${k.code === (kingdom || HOME) ? 'me' : ''}" data-action="lb-map" data-v="${k.code}">
        <span class="lb-pos">${i + 1}</span>
        <span class="lb-name"><b>${esc(k.name)}</b><small>${esc(k.realm.name)}</small></span>
        <span class="lb-num"><b>${k.avg}</b><small>avg Elo</small></span>
        <span class="lb-num"><b>${k.players}</b><small>players</small></span>
      </li>`).join('')}</ol>`;
  } else {
    const list = [...REALM_ROWS].sort((a, b) => b.avg - a.avg);
    body = `<ol class="lb-table realms">${list.map((r, i) => `<li class="${r.id === (realm || homeRealm).id ? 'me' : ''}" data-action="lb-map" data-v="realm:${r.id}" style="--c:${COLOR[r.id]}">
        <span class="lb-pos">${i + 1}</span>
        <span class="lb-name"><b><i class="lb-dot"></i>${esc(r.name)}</b><small>${r.region} · ${r.states.length} Kingdoms · top: ${esc(r.top.name)}</small></span>
        <span class="lb-num"><b>${r.avg}</b><small>avg Elo</small></span>
        <span class="lb-num"><b>${r.players.toLocaleString()}</b><small>players</small></span>
      </li>`).join('')}</ol>`;
  }
  return `${mapCard}
    <div class="seg-wide lb-tabs" role="group" aria-label="Leaderboard">${seg('players', 'Players')}${seg('kingdoms', 'Kingdoms')}${seg('realms', 'Realms')}</div>
    ${body}
    <p class="muted small lf-example">Your Kingdom is the state you sign up in; Kingdoms band together into six Realms. Example players and numbers until ranked play goes live.</p>`;
}
