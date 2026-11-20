// Leaderboards: players, Kingdoms, Realms and Empires. Start on a globe of the world, tap an Empire
// (a country) to zoom into its 3D map, then tap around its Realms and Kingdoms to filter the boards.
// Example numbers until ranked play is live.
import * as KG from './kingdoms.js';
import * as MAP from './usmap.js';
import { CASTLES, CASTLE_DEFS } from './realmcastles.js';
import { mountGlobe } from './globe.js';
import { ME, PEOPLE, plate, rankByName } from './lfg.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const HOME = 'FL'; // example player's Kingdom (the state they signed up in)
const elo = (p) => p.rank.min + 20 + (p.pct - 50) * 3;

// Each Realm's color on the map.
const COLOR = { ivy: '#2fae7a', magnolia: '#e0528a', plains: '#e6b12e', desert: '#ec7a32', peaks: '#8b7cf6', pacific: '#3a9be0' };

// A few more example players around the Empire, so every Realm has someone on its board.
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

/**
 * Tapping around: 'world' shows the globe; 'my-empire' / 'empire' the whole American Empire map;
 * a Realm breaks off; tap one of its Kingdoms to pick it (again to let go).
 */
export function lbMapTap(st, v) {
  const wasWorld = st.world;
  st.world = false;
  if (v === 'world') {
    st.world = true;
    st.realm = null;
    st.kingdom = null;
    st.zoomOut = !wasWorld; // pull back out from the Empire to the globe
  } else if (!v || v === 'empire' || v === 'my-empire') {
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
  if (wasWorld && !st.world) st.enter = true; // the Empire map grows in as the globe zooms
}

/** Called after the screen is drawn: start the globe if it's showing. */
export function mountLeaderboards(root, st, rerender) {
  const canvas = root.querySelector('.lb-globe');
  if (!canvas) return;
  const tip = root.querySelector('.lb-globe-tip');
  const zoomOut = st.zoomOut;
  st.zoomOut = false;
  mountGlobe(canvas, st, {
    zoomOut,
    onInfo: (text) => { if (tip) tip.textContent = text; },
    onEmpire: () => {
      st.world = false;
      st.realm = null;
      st.kingdom = null;
      st.enter = true;
      rerender();
    },
  });
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

// The map is drawn like a board tilted away from you: squashed top to bottom (TILT), each state a raised
// slab with darker sides (DEPTH). The open Realm lifts up off the board (LIFT) and zooms in.
const TILT = 0.8;
const DEPTH = 18;
const LIFT = 26;
const VB = [-24, -36, 1023, 576]; // viewBox
const darken = (hex, f) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * f).toString(16).padStart(2, '0')).join('');
// Where each Realm's landmark stands (a Kingdom near the middle of the Realm).
const ANCHOR = { ivy: 'NY', magnolia: 'TN', plains: 'IA', desert: 'TX', peaks: 'UT', pacific: 'CA' };
// How big a Realm's castle stands: smaller on the whole map, bigger (but not huge) when zoomed in.
const castleK = (on, s) => (on ? 1.35 / Math.sqrt(s) : 1.35);

function mapHtml(st) {
  // Zoom so the open Realm fills the map: s is how much bigger it draws.
  let zoom = '';
  let s = 1;
  const open = st.realm ? KG.realmById(st.realm) : null;
  const pull = (r) => {
    // which way a Realm breaks away from the middle of the country
    const [cx, cy] = avgPt(r.states);
    const len = Math.hypot(cx - CENTER[0], cy - CENTER[1]) || 1;
    return [((cx - CENTER[0]) / len) * 24, ((cy - CENTER[1]) / len) * 24];
  };
  if (open) {
    const [ox, oy] = pull(open);
    const b = open.states.reduce((a, c) => { const q = MAP.BOX[c]; return [Math.min(a[0], q[0]), Math.min(a[1], q[1]), Math.max(a[2], q[2]), Math.max(a[3], q[3])]; }, [1e9, 1e9, -1e9, -1e9]);
    const w = (b[2] - b[0]) * 1.14 + 50;
    const h = ((b[3] - b[1]) * 1.14 + DEPTH + LIFT + 60) * TILT;
    s = Math.min(VB[2] / w, VB[3] / h, 3.2);
    const mx = (b[0] + b[2]) / 2 + ox;
    const my = ((b[1] + b[3]) / 2 + oy - LIFT / 2 - 18) * TILT;
    zoom = ` style="transform:translate(${VB[0] + VB[2] / 2}px,${VB[1] + VB[3] / 2}px) scale(${s.toFixed(3)}) translate(${(-mx).toFixed(1)}px,${(-my).toFixed(1)}px)"`;
  }
  // Draw from the back (north) to the front (south) so nearer slabs cover the sides of farther ones;
  // the open Realm goes last, on top.
  const order = [...KG.REALMS].sort((a, b) => (a.id === st.realm) - (b.id === st.realm) || avgPt(a.states)[1] - avgPt(b.states)[1]);
  const realms = order.map((r) => {
    const on = r.id === st.realm;
    const [cx, cy] = avgPt(r.states);
    const [rx, ry] = pull(r);
    const cls = `lb-realm${on ? ' on' : ''}${st.realm && !on ? ' dim' : ''}${on && st.anim === r.id ? ' anim' : ''}`;
    const side = darken(COLOR[r.id], 0.5);
    const depth = DEPTH + (on ? LIFT : 0);
    const nudge = (code) => {
      const [x, y] = MAP.LABEL[code];
      return `--dx:${((x - cx) * 0.07).toFixed(1)}px;--dy:${((y - cy) * 0.07).toFixed(1)}px`;
    };
    const sides = r.states.map((code) => {
      let u = '';
      for (let d = depth; d > 0; d -= 3) u += `<use href="#lbp-${code}" y="${d}"/>`;
      return `<g class="lb-side" style="${nudge(code)}">${u}</g>`;
    }).join('');
    const tops = r.states.map((code) => {
      const [x, y] = MAP.LABEL[code];
      const home = code === HOME;
      const fs = (40 / s).toFixed(1);
      // labels are stretched back up so they read upright on the tilted board
      const up = `transform="translate(0 ${(y * (1 - 1 / TILT)).toFixed(1)}) scale(1 ${(1 / TILT).toFixed(3)})"`;
      // (the Kingdom under the castle gets its label on the castle's base instead)
      const label = on && !(SMALL.has(code) && s < 2.5) && !home && code !== ANCHOR[r.id] ? `<text class="lb-abbr" x="${x}" y="${(y + 14 / s).toFixed(1)}" font-size="${fs}" ${up}>${code}</text>` : '';
      const k = on ? 2.6 / s : 1.3;
      const star = home ? `<g class="lb-star" transform="translate(${x} ${y}) scale(${k.toFixed(3)} ${(k / TILT).toFixed(3)})"><polygon points="${STAR}"/>${on ? '<text class="lb-you" x="-20" y="5">Your Kingdom</text>' : ''}</g>` : '';
      return `<g class="lb-st${code === st.kingdom ? ' pick' : ''}" data-action="lb-map" data-v="${code}" style="${nudge(code)}"><title>${esc(KG.kingdomName(code))}</title><use class="top" href="#lbp-${code}"/>${label}${star}</g>`;
    }).join('');
    return `<g class="${cls}" style="--c:${COLOR[r.id]};--rx:${rx.toFixed(1)}px;--ry:${ry.toFixed(1)}px;--lift:${on ? LIFT : 0}px"><g fill="${side}" stroke="${side}">${sides}</g>${tops}</g>`;
  }).join('');
  // Each Realm's castle stands upright on top of the tilted board.
  const marks = order.map((r) => {
    const on = r.id === st.realm;
    const [x, y] = MAP.LABEL[ANCHOR[r.id]];
    const [rx, ry] = on ? pull(r) : [0, 0];
    const k = castleK(on, s);
    const code = ANCHOR[r.id];
    // In an open Realm the castle stands for the Kingdom under it: a plaque on its base, and tapping it picks that Kingdom.
    const plaque = on ? `<text class="lb-abbr lb-plaque${st.kingdom === code ? ' pick' : ''}" x="0" y="10" font-size="${(36 / s / k).toFixed(1)}">${code}</text>` : '';
    return `<g class="lb-mark${st.realm && !on ? ' dim' : ''}" data-action="lb-map" data-v="${on ? code : `realm:${r.id}`}" style="--c:${COLOR[r.id]}" transform="translate(${(x + rx).toFixed(1)} ${((y + ry - (on ? LIFT : 0)) * TILT).toFixed(1)}) scale(${k.toFixed(3)})"><title>${esc(on ? KG.kingdomName(code) : r.name)}</title>${CASTLES[r.id]}${plaque}</g>`;
  }).join('');
  const defs = Object.keys(MAP.PATHS).map((c) => `<path id="lbp-${c}" d="${MAP.PATHS[c]}" vector-effect="non-scaling-stroke"/>`).join('');
  return `<svg class="lb-svg" viewBox="${VB.join(' ')}" role="img" aria-label="Map of the six Realms. Tap a Realm to see its Kingdoms.">
    <defs>${defs}${CASTLE_DEFS}<radialGradient id="lb-sea" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#2b86b5"/><stop offset="1" stop-color="#0c3550"/></radialGradient></defs>
    <rect x="${VB[0]}" y="${VB[1]}" width="${VB[2]}" height="${VB[3]}" fill="url(#lb-sea)" data-action="lb-map" data-v="empire"/>
    <g class="lb-zoom${open && st.anim === open.id ? ' anim' : ''}"${zoom}>
      <g transform="scale(1 ${TILT})">${realms}</g>
      ${marks}
    </g>
  </svg>`;
}

export function leaderboardsHtml(st) {
  const tab = st.tab || 'players';
  const realm = st.realm ? KG.realmById(st.realm) : null;
  const kingdom = st.kingdom || null;
  const homeRealm = KG.realmOf(HOME);
  const world = st.world;
  const empire = KG.EMPIRES.US;
  const enter = st.enter;
  st.anim = null; // the next redraw shouldn't replay the break-off
  st.enter = false;

  // What's picked on the map
  const head = world
    ? '<b>The World</b><span>Spin the globe · tap an Empire to zoom in</span>'
    : kingdom
    ? `<b>${esc(KG.kingdomName(kingdom))}</b><span>${esc(realm.name)}${kingdom === HOME ? ' · <em>Your Kingdom</em>' : ''}</span>`
    : realm
      ? `<b style="color:${COLOR[realm.id]}">${esc(realm.name)}</b><span>${realm.region} · ${realm.states.length} Kingdoms${realm.id === homeRealm.id ? ' · <em>Your Realm</em>' : ''} · tap a Kingdom</span>`
      : `<b>${empire.name}</b><span>${empire.country} · six Realms, 50 Kingdoms · <em>Your Empire</em> · tap a Realm</span>`;
  const quick = (v, label, on) => `<button class="chip ${on ? 'on' : ''}" data-action="lb-map" data-v="${v}">${label}</button>`;
  const mapCard = `<section class="card lb-mapcard">
      <div class="lb-maphead">${head}</div>
      ${world
    ? '<div class="lb-map lb-globe-wrap"><canvas class="lb-globe" aria-label="Globe of the world. Drag to spin it; tap the American Empire to zoom in."></canvas><p class="lb-globe-tip">Drag to spin the globe. Tap the American Empire.</p></div>'
    : `<div class="lb-map${enter ? ' enter' : ''}">${mapHtml(st)}</div>`}
      <div class="chips lb-chips">${quick('my-kingdom', 'My Kingdom', !world && kingdom === HOME)}${quick('my-realm', 'My Realm', !world && realm?.id === homeRealm.id && !kingdom)}${quick('my-empire', 'My Empire', !world && !realm)}${quick('world', 'World', world)}</div>
    </section>`;

  const seg = (v, label) => `<button class="seg-opt" data-action="lb-tab" data-v="${v}" aria-pressed="${tab === v}">${label}</button>`;
  const where = kingdom ? KG.kingdomName(kingdom) : realm ? realm.name : world ? 'the world' : `the ${empire.name}`;
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
  } else if (tab === 'empires') {
    // Only the American Empire is live; the next ones are on the way.
    const soon = ['United Kingdom', 'Ireland', 'Canada', 'Australia', 'Japan'];
    const total = REALM_ROWS.reduce((n, r) => n + r.players, 0);
    const avg = Math.round(REALM_ROWS.reduce((n, r) => n + r.avg * r.players, 0) / total);
    body = `<ol class="lb-table">
      <li class="me" data-action="lb-map" data-v="my-empire"><span class="lb-pos">1</span>
        <span class="lb-name"><b>${empire.name}</b><small>${empire.country} · 6 Realms · 50 Kingdoms</small></span>
        <span class="lb-num"><b>${avg}</b><small>avg Elo</small></span>
        <span class="lb-num"><b>${total.toLocaleString()}</b><small>players</small></span></li>
      ${soon.map((c) => `<li class="soon"><span class="lb-pos">·</span><span class="lb-name"><b>${c}</b><small>Empire coming soon</small></span></li>`).join('')}
    </ol>`;
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
    <div class="seg-wide lb-tabs" role="group" aria-label="Leaderboard">${seg('players', 'Players')}${seg('kingdoms', 'Kingdoms')}${seg('realms', 'Realms')}${seg('empires', 'Empires')}</div>
    ${body}
    <p class="muted small lf-example">Your Kingdom is the state you sign up in. Kingdoms band together into Realms, and the Realms of a country make up its Empire. Example players and numbers until ranked play goes live.</p>`;
}
