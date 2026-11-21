// Leaderboards: players, Kingdoms, Realms and Empires. Start on a globe of the world, tap an Empire
// (a country) to zoom into its map (the American Empire's is painted; the others are drawn until their
// paintings are ready), then tap around its Realms and Kingdoms to filter the boards.
// Example numbers until ranked play is live.
import * as KG from './kingdoms.js';
import * as MAP from './usmap.js';
import * as PM from './realmpaint.js';
import { EMPIRE_MAPS } from './empiremaps.js';
import { mountGlobe } from './globe.js';
import { ME, PEOPLE, plate, rankByName, addPlayers } from './lfg.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const HOME = 'FL'; // example player's Kingdom (the state they signed up in)
const elo = (p) => p.rank.min + 20 + (p.pct - 50) * 3;

// Each Realm's color on the map: the American Empire's match its painting; the others take the same palette in order.
const COLOR = { ivy: '#2fae7a', magnolia: '#e0528a', plains: '#e6b12e', desert: '#ec7a32', peaks: '#8b7cf6', pacific: '#3a9be0' };
const PALETTE = ['#2fae7a', '#e0528a', '#e6b12e', '#ec7a32', '#8b7cf6', '#3a9be0'];
for (const e of Object.values(KG.EMPIRES)) e.realms.forEach((r, i) => { COLOR[r.id] = COLOR[r.id] || PALETTE[i % PALETTE.length]; });

// A few more example players around the Empire, so every Realm has someone on its board.
const X = (tag, sub, rank, pct, art, kingdom) => ({ id: `lb-${tag.toLowerCase().replace(/[^a-z]+/g, '-')}`, tag, sub, rank: rankByName(rank), pct, art, kingdom });
const ELSEWHERE = [
  X('Jordan K.', '', 'Platinum II', 61, 'sniper', 'CA'),
  X('Maya Chen', '', 'Gold I', 57, 'west', 'WA'),
  X('Boomer', 'Chris', 'Diamond III', 62, 'mountain-west', 'CO'),
  X('Tyler B.', '', 'Gold V', 55, 'midwest', 'IL'),
  X('Sean O’Brien', '', 'Silver III', 52, 'northeast', 'MA'),
  X('Cactus Jack', 'Jack', 'Platinum IV', 59, 'southwest', 'AZ'),
  X('Luis Ortega', '', 'Gold III', 56, 'underdog', 'TX'),
  X('Kevin L.', '', 'Silver I', 50, 'par-100', 'OH'),
  // and around the world
  X('Ollie Bennett', '', 'Gold II', 57, 'fresh-blood', 'GB-surrey'),
  X('Fraser M.', '', 'Platinum III', 60, 'royal-court', 'GB-fife'),
  X('Dai Evans', '', 'Silver II', 53, 'heater', 'GB-glamorgan'),
  X('Aoife Byrne', '', 'Gold IV', 56, 'hat-trick', 'IE-dublin'),
  X('The Kerry Kid', 'Seán', 'Diamond IV', 62, 'sharpshooter', 'IE-kerry'),
  X('Liam Tremblay', '', 'Gold I', 58, 'ice-cold', 'CA-ON'),
  X('Moose', 'Mike', 'Platinum V', 59, 'dawn-patrol', 'CA-BC'),
  X('Jack W.', '', 'Gold III', 55, 'southwest', 'AU-NSW'),
  X('Matilda Reid', '', 'Platinum II', 61, 'west', 'AU-VIC'),
  X('Kenji S.', '', 'Diamond III', 63, 'sniper', 'JP-13'),
  X('Hana Takahashi', '', 'Gold V', 54, 'smooth', 'JP-27'),
  X('Lukas Becker', '', 'Platinum I', 61, 'iron-man', 'DE-BY'),
  X('Mia Schulz', '', 'Gold II', 56, 'spotless', 'DE-HH'),
  X('Erik Lindqvist', '', 'Gold IV', 55, 'ice-cold', 'SE-AB'),
  X('Elsa N.', '', 'Silver I', 51, 'north', 'SE-M'),
  X('Wei Zhang', '', 'Diamond IV', 62, 'calculated', 'CN-SH'),
  X('Li Na', '', 'Platinum III', 60, 'dead-center', 'CN-GD'),
  X('Hugo Martin', '', 'Gold I', 57, 'smooth', 'FR-IDF'),
  X('Camille R.', '', 'Platinum V', 59, 'royal-flush', 'FR-PAC'),
  X('Daan de Vries', '', 'Gold III', 55, 'two-better', 'NL-NH'),
  X('Sanne B.', '', 'Silver II', 52, 'fresh-blood', 'NL-NB'),
  X('Kiwi', 'Tama', 'Platinum II', 60, 'king-of-skies', 'NZ-AUK'),
  X('Aroha Ngata', '', 'Gold V', 54, 'heater', 'NZ-OTA'),
  X('Pablo García', '', 'Diamond V', 61, 'sniper', 'ES-AN'),
  X('Lucía Fernández', '', 'Gold II', 56, 'hat-trick', 'ES-CT'),
  X('Min-jun Kim', '', 'Diamond II', 64, 'sharpshooter', 'KR-11'),
  X('Seo-yeon Park', '', 'Platinum IV', 59, 'dawn-patrol', 'KR-26'),
];
addPlayers(ELSEWHERE);
const PLAYERS = [...new Set([ME, ...Object.values(PEOPLE), ...ELSEWHERE])]; // PEOPLE includes you as .me

// Steady made-up numbers per Kingdom, so the example board doesn't reshuffle on every visit.
function seeded(code) {
  let h = 0;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return h;
}
const KINGDOMS = KG.ALL_KINGDOMS.map((code) => {
  const h = seeded(code);
  const scale = KG.empireOf(code) === 'US' ? 1 : 0.35; // the newer Empires have fewer players so far
  return { code, name: KG.kingdomName(code), realm: KG.realmOf(code), avg: 1380 + (h % 190), players: Math.round((40 + (h % 900)) * scale), matches: Math.round((120 + ((h * 7) % 4200)) * scale) };
});
const REALM_ROWS = KG.ALL_REALMS.map((r) => {
  const ks = KINGDOMS.filter((k) => k.realm.id === r.id);
  const players = ks.reduce((n, k) => n + k.players, 0);
  return { ...r, players, matches: ks.reduce((n, k) => n + k.matches, 0), avg: Math.round(ks.reduce((n, k) => n + k.avg * k.players, 0) / players), top: [...ks].sort((a, b) => b.avg - a.avg)[0] };
});
const EMPIRE_ROWS = Object.values(KG.EMPIRES).map((e) => {
  const rs = REALM_ROWS.filter((r) => r.empire === e.code);
  const players = rs.reduce((n, r) => n + r.players, 0);
  return { ...e, players, avg: Math.round(rs.reduce((n, r) => n + r.avg * r.players, 0) / players), kingdoms: rs.reduce((n, r) => n + r.states.length, 0) };
});

/**
 * Tapping around: 'world' shows the globe; 'empire:GB' an Empire's whole map; 'empire' the current Empire again;
 * 'my-…' your own Kingdom, Realm or Empire; a Realm breaks off; tap one of its Kingdoms to pick it (again to let go).
 */
export function lbMapTap(st, v) {
  const wasWorld = st.world;
  st.world = false;
  st.empire = st.empire || 'US';
  if (v === 'world') {
    st.world = true;
    st.realm = null;
    st.kingdom = null;
    st.zoomOut = !wasWorld && st.empire === 'US'; // pull back out from the American Empire to the globe
  } else if (v && v.startsWith('empire:')) {
    st.empire = v.slice(7);
    st.realm = null;
    st.kingdom = null;
  } else if (!v || v === 'empire') {
    st.realm = null;
    st.kingdom = null;
  } else if (v === 'my-empire') {
    st.empire = KG.empireOf(HOME);
    st.realm = null;
    st.kingdom = null;
  } else if (v === 'my-realm') {
    st.empire = KG.empireOf(HOME);
    st.realm = KG.realmOf(HOME).id;
    st.kingdom = null;
  } else if (v.startsWith('realm:')) {
    st.realm = v.slice(6);
    st.empire = KG.realmById(st.realm).empire;
    st.kingdom = null;
  } else if (v === 'my-kingdom') {
    st.empire = KG.empireOf(HOME);
    st.realm = KG.realmOf(HOME).id;
    st.kingdom = HOME;
  } else {
    st.empire = KG.empireOf(v);
    const realm = KG.realmOf(v).id;
    if (st.realm !== realm) {
      st.realm = realm;
      st.kingdom = null;
    } else {
      st.kingdom = st.kingdom === v ? null : v;
    }
  }
  if (wasWorld && !st.world) st.enter = true; // the Empire map grows in as the globe zooms
}

// The painted Realm map of the American Empire (assets/realm-map.webp). Tapping it opens the Realm
// under your finger: this 80 x 45 grid (run-length coded) says which Realm each patch of the
// painting belongs to (b Pacific, p High Peaks, y Golden Plains, o Desert Sun, m Magnolia, g Ivy; . sea).
const PAINT_GRID = [80, 45];
const PAINT_REALM = { b: 'pacific', p: 'peaks', y: 'plains', o: 'desert', m: 'magnolia', g: 'ivy' };
const PAINT_MASK = '252.3b74.2b1.9b51.2g15.12b9p4y4.1y2.2y29.3g14.11b10p16y25.4g14.10b12p17y2.1y13.1g2.1g2.7g11.11b12p24y6.1g1.5g1.8g10.11b13p26y4.1g1.2g1.10g11.10b15p8y1.16y2.1y9g2.3g13.10b15p8y1.11y1.4y2.1y9g2.3g12.11b15p8y1.17y1.2y14g11.11b2p1.5p1.1p1.4p19y1.6y1.2y14g10.11b1.9p2.3p15y1.5y1.7y14g11.11b3p1.7p2.2p29y13g11.12b2p1.3p1.3p3.2p29y11g13.11b3p3.7p1.3p28y11g12.12b11p1.5p26y6m6g13.12b18p23y10m4g14.12b17p21y14m1g14.15b15p19y17m14.10b2.3b10o4p2o16y19m15.3b1.10b22o8y21m14.4b1.9b25o1y26m15.4b3.6b25o26m17.8b2.1b26o25m20.9b26o24m23.6b27o23m27.3b27o22m31.27o21m23.5b6.25o21m23.5b9.2o2.18o21m21.8b13.17o21m22.7b6.1o7.16o8m5.9m20.8b9.2b4.3o1.10o3.6m9.6m19.5b2.2b8.1b1.1b4.1o3.7o20.6m20.2b5.2b5.6b7.6o22.6m18.1b15.2b1.2b8.4o24.5m34.2b12.3o25.4m77.3m77.3m254.'.replace(/(\d+)(.)/g, (_, n, c) => c.repeat(+n));

/** Called after the screen is drawn: start the globe, or listen for taps on the painted map. */
export function mountLeaderboards(root, st, rerender) {
  const paint = root.querySelector('.lb-paint');
  if (paint) {
    paint.addEventListener('click', (e) => {
      const box = paint.getBoundingClientRect();
      const gx = Math.floor(((e.clientX - box.left) / box.width) * PAINT_GRID[0]);
      const gy = Math.floor(((e.clientY - box.top) / box.height) * PAINT_GRID[1]);
      const realm = PAINT_REALM[PAINT_MASK[gy * PAINT_GRID[0] + gx]];
      if (!realm) return;
      lbMapTap(st, `realm:${realm}`);  // (the painting is the American Empire's)
      rerender();
    });
  }
  const canvas = root.querySelector('.lb-globe');
  if (!canvas) return;
  const tip = root.querySelector('.lb-globe-tip');
  const zoomOut = st.zoomOut;
  st.zoomOut = false;
  mountGlobe(canvas, st, {
    zoomOut,
    onInfo: (text) => { if (tip) tip.textContent = text; },
    onEmpire: (code) => {
      st.empire = code || 'US';
      st.world = false;
      st.realm = null;
      st.kingdom = null;
      st.enter = true;
      rerender();
    },
  });
}

// ---------- the painted map, zoomed into a Realm or a Kingdom ----------
// The Realm and Kingdom views use the same painting as the Empire view. A Realm lifts off the
// painting as a cut-out (assets/realms/<id>.webp) while the rest of the map dims; a Kingdom lifts
// off its Realm the same way. The state outlines are lined up with the painting (js/realmpaint.js)
// so each Kingdom can be tapped and cut out.
const [PW, PH] = PM.SIZE;
const SMALL = new Set(['RI', 'DE', 'CT', 'NJ', 'MD', 'VT', 'NH', 'MA']); // too small for a label until zoomed in
const STAR = (() => {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 6.5 : 15;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    p.push(`${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`);
  }
  return p.join(' ');
})();
/** The outline-to-painting matrix for a state: one per Realm, plus Alaska and Hawaii. */
const matOf = (code) => PM.MATRIX[code === 'AK' || code === 'HI' ? code : KG.realmOf(code).id];
const onPaint = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const labelAt = (code) => onPaint(matOf(code), MAP.LABEL[code]);
function stateBox(code) {
  const [x0, y0, x1, y1] = MAP.BOX[code];
  const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map((pt) => onPaint(matOf(code), pt));
  return [Math.min(...pts.map((q) => q[0])), Math.min(...pts.map((q) => q[1])), Math.max(...pts.map((q) => q[0])), Math.max(...pts.map((q) => q[1]))];
}
const IDENT = `translate(${PW / 2}px,${PH / 2}px) scale(1) translate(${-PW / 2}px,${-PH / 2}px)`;
/** Zoom that fits a box (painting pixels) on screen, with some room around it. */
function zoomTo([x0, y0, x1, y1], pad, max, W = PW, H = PH) {
  const w = (x1 - x0) * (1 + pad * 2);
  const h = (y1 - y0) * (1 + pad * 2);
  const s = Math.min(W / w, H / h, max);
  // keep the view inside the map (no empty strip past its edge)
  const hw = W / s / 2;
  const hh = H / s / 2;
  const cx = Math.min(Math.max((x0 + x1) / 2, hw), W - hw);
  const cy = Math.min(Math.max((y0 + y1) / 2, hh), H - hh);
  return { s, css: `translate(${W / 2}px,${H / 2}px) scale(${s.toFixed(3)}) translate(${(-cx).toFixed(1)}px,${(-cy).toFixed(1)}px)` };
}
const identity = (W, H) => `translate(${W / 2}px,${H / 2}px) scale(1) translate(${-W / 2}px,${-H / 2}px)`;

// ---------- the other Empires' maps (drawn from the Kingdom outlines until their paintings are ready) ----------
function vmapHtml(st) {
  const E = KG.EMPIRES[st.empire];
  const M = EMPIRE_MAPS[st.empire];
  const [W, H] = M.view;
  const realm = st.realm ? KG.realmById(st.realm) : null;
  const kingdom = st.kingdom;
  const boxOf = (codes) => codes.reduce((a, c) => { const b = M.box[c]; return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]; }, [1e9, 1e9, -1e9, -1e9]);
  const z = kingdom ? zoomTo(M.box[kingdom], 0.6, 8, W, H) : realm ? zoomTo(boxOf(realm.states), 0.06, 5, W, H) : { s: 1, css: identity(W, H) };
  const from = st.zPrev || identity(W, H);
  const anim = from !== z.css;
  st.zPrev = z.css;
  const s = z.s;
  const shape = (c, cls = '') => `<path class="lb-vk${cls}" d="${M.paths[c]}" fill="${COLOR[KG.realmOf(c).id]}" data-action="lb-map" data-v="${c}"><title>${esc(KG.kingdomName(c))}</title></path>`;
  const realms = E.realms.map((r) => {
    const on = realm && r.id === realm.id;
    return `<g class="lb-vrealm${on ? ' on' : ''}${realm && !on ? ' dim' : ''}"${on ? ` style="transform:translateY(${(-8 / s).toFixed(2)}px)" filter="url(#lbf-vlift)"` : ''}>${r.states.map((c) => shape(c)).join('')}</g>`;
  });
  // the open Realm draws last, on top
  const order = realm ? [...realms.filter((_, i) => E.realms[i].id !== realm.id), realms[E.realms.findIndex((r) => r.id === realm.id)]] : realms;
  const fs = (26 / s + 4).toFixed(1);
  const labels = realm
    ? realm.states.filter((c) => !kingdom || c === kingdom).map((c) => {
      const [x0, , x1] = M.box[c];
      const name = KG.kingdomPlain(c);
      if (!kingdom && (x1 - x0) * s < name.length * 9) return ''; // too small to label at this zoom
      const [x, y] = M.label[c];
      return `<text class="lb-abbr lb-vname" x="${x}" y="${(y - 8 / s).toFixed(1)}" font-size="${kingdom ? (fs * 1.4).toFixed(1) : fs}">${esc(name)}</text>`;
    }).join('')
    : '';
  const lifted = kingdom ? `<rect class="lb-shade2" width="${W}" height="${H}"/><g class="lb-klift${anim ? ' anim' : ''}" style="transform:translateY(${(-14 / s).toFixed(2)}px)" filter="url(#lbf-vlift)">${shape(kingdom, ' pick')}</g>` : '';
  return `<svg class="lb-svg lb-vsvg" viewBox="0 0 ${W} ${H}" style="aspect-ratio:${W} / ${H}" role="img" aria-label="Map of the ${esc(E.name)}. Tap a Realm, then a Kingdom.">
    <defs><filter id="lbf-vlift" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="${(9 / s).toFixed(2)}" stdDeviation="${(6 / s).toFixed(2)}" flood-color="#000" flood-opacity="0.65"/></filter></defs>
    <rect width="${W}" height="${H}" fill="#0d2f42" data-action="lb-map" data-v="empire"/>
    <g class="lb-zoom${anim ? ' anim' : ''}" style="transform:${z.css};--z0:${from}">
      ${order.join('')}
      ${lifted}
      ${labels}
    </g>
  </svg>`;
}
/** Your Kingdom on the Empire painting, in % (for the star). */
const HOME_PCT = (() => {
  const [x, y] = labelAt(HOME);
  return [(x / PW) * 100, (y / PH) * 100];
})();

function mapHtml(st) {
  const realm = KG.realmById(st.realm);
  const kingdom = st.kingdom;
  const [cx, cy, cw, ch] = PM.CUT[realm.id];
  const z = kingdom ? zoomTo(stateBox(kingdom), 0.55, 6) : zoomTo([cx, cy, cx + cw, cy + ch], 0.04, 4);
  // Zoom smoothly from wherever the map was (the whole painting, the Realm, another Kingdom).
  const from = st.zPrev || IDENT;
  const anim = from !== z.css;
  st.zPrev = z.css;
  const s = z.s;
  const mat = (code) => `matrix(${matOf(code).join(' ')})`;
  const cut = `<image href="assets/realms/${realm.id}.webp" x="${cx}" y="${cy}" width="${cw}" height="${ch}"/>`;
  const defs = realm.states.map((c) => `<path id="lbq-${c}" d="${MAP.PATHS[c]}" vector-effect="non-scaling-stroke"/>`).join('');
  const hits = realm.states.map((c) => `<use href="#lbq-${c}" transform="${mat(c)}" class="lb-phit${c === kingdom ? ' pick' : ''}" data-action="lb-map" data-v="${c}"><title>${esc(KG.kingdomName(c))}</title></use>`).join('');
  const fs = (30 / s + 6).toFixed(1);
  const labels = realm.states
    .filter((c) => (kingdom ? c === kingdom : !(SMALL.has(c) && s < 3.5)) && c !== HOME)
    .map((c) => {
      const [x, y] = labelAt(c);
      return `<text class="lb-abbr" x="${x.toFixed(1)}" y="${(y + 5 / s).toFixed(1)}" font-size="${kingdom ? (fs * 1.6).toFixed(1) : fs}">${c}</text>`;
    }).join('');
  const homeHere = KG.realmOf(HOME).id === realm.id && (!kingdom || kingdom === HOME);
  const [hx, hy] = labelAt(HOME);
  const k = (kingdom ? 1.3 : 1.6) / s;
  const star = homeHere ? `<g class="lb-star" transform="translate(${hx.toFixed(1)} ${hy.toFixed(1)}) scale(${(k * 1.4).toFixed(3)})"><polygon points="${STAR}"/><text class="lb-you" x="-20" y="5">Your Kingdom</text></g>` : '';
  const lift = (n) => `style="transform:translateY(${(-n / s).toFixed(2)}px)"`;
  const kingdomLift = kingdom
    ? `<rect class="lb-shade2" width="${PW}" height="${PH}"/>
      <g class="lb-klift${anim ? ' anim' : ''}" ${lift(18)} filter="url(#lbf-lift)" data-action="lb-map" data-v="${kingdom}">
        <g clip-path="url(#lbc-k)">${cut}</g>
        <use href="#lbq-${kingdom}" transform="${mat(kingdom)}" class="lb-kedge"/>
      </g>`
    : '';
  return `<svg class="lb-svg lb-psvg" viewBox="0 0 ${PW} ${PH}" role="img" aria-label="${esc(realm.name)} on the painted map. Tap a Kingdom to pick it.">
    <defs>${defs}
      <filter id="lbf-lift" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="${(10 / s).toFixed(2)}" stdDeviation="${(7 / s).toFixed(2)}" flood-color="#000" flood-opacity="0.7"/></filter>
      ${kingdom ? `<clipPath id="lbc-k"><use href="#lbq-${kingdom}" transform="${mat(kingdom)}"/></clipPath>` : ''}
    </defs>
    <rect width="${PW}" height="${PH}" fill="#0d2f42" data-action="lb-map" data-v="empire"/>
    <g class="lb-zoom${anim ? ' anim' : ''}" style="transform:${z.css};--z0:${from}">
      <image href="assets/realm-map.webp" width="${PW}" height="${PH}"/>
      <rect class="lb-shade" width="${PW}" height="${PH}" data-action="lb-map" data-v="empire"/>
      <g class="lb-plift${anim && !kingdom ? ' anim' : ''}" ${lift(kingdom ? 4 : 14)} filter="url(#lbf-lift)">${cut}${hits}</g>
      ${kingdomLift}
      ${labels}${star}
    </g>
  </svg>`;
}

export function leaderboardsHtml(st) {
  const tab = st.tab || 'players';
  const realm = st.realm ? KG.realmById(st.realm) : null;
  const kingdom = st.kingdom || null;
  const homeRealm = KG.realmOf(HOME);
  const world = st.world;
  st.empire = st.empire || 'US';
  const empire = KG.EMPIRES[st.empire];
  const isHomeEmpire = st.empire === KG.empireOf(HOME);
  const painted = st.empire === 'US'; // the Empires with a painting so far
  const enter = st.enter;
  st.enter = false;

  // What's picked on the map
  const head = world
    ? `<b>The World</b><span>${Object.keys(KG.EMPIRES).length} Empires · spin the globe and tap one to zoom in</span>`
    : kingdom
    ? `<b>${esc(KG.kingdomName(kingdom))}</b><span>${esc(realm.name)}${kingdom === HOME ? ' · <em>Your Kingdom</em>' : ''}</span>`
    : realm
      ? `<b style="color:${COLOR[realm.id]}">${esc(realm.name)}</b><span>${realm.region} · ${realm.states.length} Kingdoms${realm.id === homeRealm.id ? ' · <em>Your Realm</em>' : ''} · tap a Kingdom</span>`
      : `<b>${empire.name}</b><span>${empire.country} · ${empire.realms.length} Realms, ${empire.realms.reduce((n, r) => n + r.states.length, 0)} Kingdoms${isHomeEmpire ? ' · <em>Your Empire</em>' : ''} · tap a Realm</span>`;
  const quick = (v, label, on) => `<button class="chip ${on ? 'on' : ''}" data-action="lb-map" data-v="${v}">${label}</button>`;
  const mapCard = `<section class="card lb-mapcard">
      <div class="lb-maphead">${head}</div>
      ${world
    ? `${(st.zPrev = null) || ''}<div class="lb-map lb-globe-wrap"><canvas class="lb-globe" aria-label="Globe of the world. Drag to spin it; tap a gold Empire to zoom in."></canvas><p class="lb-globe-tip">Drag to spin the globe. Tap a gold Empire.</p></div>`
    : !painted
      ? `<div class="lb-map lb-vmap${enter ? ' enter' : ''}">${vmapHtml(st)}</div>`
    : !realm
      ? `${(st.zPrev = null) || ''}<div class="lb-map lb-paint${enter ? ' enter' : ''}" role="img" aria-label="Painted map of the six Realms of the American Empire. Tap a Realm to open it.">
          <img src="assets/realm-map.webp" alt="" draggable="false">
          <span class="lb-paint-home" style="left:${HOME_PCT[0].toFixed(1)}%;top:${HOME_PCT[1].toFixed(1)}%" title="Your Kingdom: Florida"><i>★</i><b>Your Kingdom</b></span>
        </div>`
      : `<div class="lb-map lb-pmap${enter ? ' enter' : ''}">${mapHtml(st)}</div>`}
      <div class="chips lb-chips">${quick('my-kingdom', 'My Kingdom', !world && kingdom === HOME)}${quick('my-realm', 'My Realm', !world && realm?.id === homeRealm.id && !kingdom)}${quick('my-empire', 'My Empire', !world && !realm && isHomeEmpire)}${quick('world', 'World', world)}</div>
    </section>`;

  const seg = (v, label) => `<button class="seg-opt" data-action="lb-tab" data-v="${v}" aria-pressed="${tab === v}">${label}</button>`;
  const where = kingdom ? KG.kingdomName(kingdom) : realm ? realm.name : world ? 'the world' : `the ${empire.name}`;
  let body = '';
  const inScope = (code) => (kingdom ? code === kingdom : realm ? KG.realmOf(code).id === realm.id : world ? true : KG.empireOf(code) === st.empire);
  if (tab === 'players') {
    const list = PLAYERS
      .filter((p) => inScope(p.kingdom))
      .sort((a, b) => elo(b) - elo(a));
    body = list.length
      ? `<ol class="lb-list">${list.map((p, i) => `<li class="${p.me ? 'me' : ''}">
        <span class="lb-pos">${i + 1}</span>
        <div class="lb-card">${plate(p, { badge: 30, ball: 18 })}<div class="lb-meta">${elo(p)} Elo · ${esc(KG.kingdomName(p.kingdom))}</div></div>
      </li>`).join('')}</ol>`
      : `<p class="muted lb-empty">No example players in ${esc(where)} yet.</p>`;
  } else if (tab === 'kingdoms') {
    const list = KINGDOMS.filter((k) => (realm ? k.realm.id === realm.id : world || KG.empireOf(k.code) === st.empire)).sort((a, b) => b.avg - a.avg).slice(0, world ? 50 : 99);
    body = `${world ? '<p class="muted small lb-note">The top 50 Kingdoms in the world.</p>' : ''}<ol class="lb-table">${list.map((k, i) => `<li class="${k.code === (kingdom || HOME) ? 'me' : ''}" data-action="lb-map" data-v="${k.code}">
        <span class="lb-pos">${i + 1}</span>
        <span class="lb-name"><b>${esc(k.name)}</b><small>${esc(k.realm.name)}${world ? ` · ${esc(KG.EMPIRES[k.realm.empire].name)}` : ''}</small></span>
        <span class="lb-num"><b>${k.avg}</b><small>avg Elo</small></span>
        <span class="lb-num"><b>${k.players}</b><small>players</small></span>
      </li>`).join('')}</ol>`;
  } else if (tab === 'empires') {
    const list = [...EMPIRE_ROWS].sort((a, b) => b.avg - a.avg);
    body = `<ol class="lb-table">${list.map((e, i) => `<li class="${!world && e.code === st.empire ? 'me' : ''}" data-action="lb-map" data-v="empire:${e.code}">
        <span class="lb-pos">${i + 1}</span>
        <span class="lb-name"><b>${esc(e.name)}</b><small>${esc(e.country)} · ${e.realms.length} Realms · ${e.kingdoms} Kingdoms${e.code === KG.empireOf(HOME) ? ' · <em>Your Empire</em>' : ''}</small></span>
        <span class="lb-num"><b>${e.avg}</b><small>avg Elo</small></span>
        <span class="lb-num"><b>${e.players.toLocaleString()}</b><small>players</small></span>
      </li>`).join('')}</ol>`;
  } else {
    const list = REALM_ROWS.filter((r) => world || r.empire === st.empire).sort((a, b) => b.avg - a.avg);
    body = `<ol class="lb-table realms">${list.map((r, i) => `<li class="${r.id === (realm || homeRealm).id ? 'me' : ''}" data-action="lb-map" data-v="realm:${r.id}" style="--c:${COLOR[r.id]}">
        <span class="lb-pos">${i + 1}</span>
        <span class="lb-name"><b><i class="lb-dot"></i>${esc(r.name)}</b><small>${world ? `${esc(KG.EMPIRES[r.empire].name)} · ` : ''}${r.region} · ${r.states.length} Kingdoms · top: ${esc(r.top.name)}</small></span>
        <span class="lb-num"><b>${r.avg}</b><small>avg Elo</small></span>
        <span class="lb-num"><b>${r.players.toLocaleString()}</b><small>players</small></span>
      </li>`).join('')}</ol>`;
  }
  return `${mapCard}
    <div class="seg-wide lb-tabs" role="group" aria-label="Leaderboard">${seg('players', 'Players')}${seg('kingdoms', 'Kingdoms')}${seg('realms', 'Realms')}${seg('empires', 'Empires')}</div>
    ${body}
    <p class="muted small lf-example">Your Kingdom is the state you sign up in. Kingdoms band together into Realms, and the Realms of a country make up its Empire. Example players and numbers until ranked play goes live.</p>`;
}
