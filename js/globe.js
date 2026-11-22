// The World view of the Leaderboards: a globe you spin with your thumb (a full 360°). Tap an Empire
// (a country) to zoom into it. Uses the d3-geo map library and Natural Earth country outlines,
// both kept in the app (js/vendor, assets/world-110m.json) and loaded the first time the globe opens.

import { flagImage } from './flags.js';

// Empires that are live, keyed by their name in the outlines file. More countries join later.
// `tag` nudges the name tag (in pixels) so neighbours like Great Britain and Ireland don't overlap.
// The globe's outlines put Northern Ireland with the United Kingdom, so tapping it opens Great Britain's map.
export const LIVE = {
  'United States of America': { code: 'US', name: 'American Empire', center: [-98, 39] },
  'United Kingdom': { code: 'GB', name: 'Empire of the Isles', center: [-2.5, 54.5], tag: [46, -16] },
  Ireland: { code: 'IE', name: 'Irish Empire', center: [-8, 53.3], tag: [-54, 20] },
  Canada: { code: 'CA', name: 'Canadian Empire', center: [-100, 58] },
  Australia: { code: 'AU', name: 'Australian Empire', center: [134, -25] },
  Japan: { code: 'JP', name: 'Cherry Blossom Empire', center: [138, 37] },
  Germany: { code: 'DE', name: 'Black Eagle Empire', center: [10.4, 51.2] },
  Sweden: { code: 'SE', name: 'Three Crowns Empire', center: [15.5, 62] },
  China: { code: 'CN', name: 'Jade Dragon Empire', center: [104, 35] },
  France: { code: 'FR', name: 'Fleur-de-Lis Empire', center: [2.4, 46.6] },
  Netherlands: { code: 'NL', name: 'Tulip Empire', center: [5.5, 52.2] },
  'New Zealand': { code: 'NZ', name: 'Silver Fern Empire', center: [172.5, -41.5] },
  Spain: { code: 'ES', name: 'Golden Sun Empire', center: [-3.7, 40.2] },
  'South Korea': { code: 'KR', name: 'Morning Calm Empire', center: [127.8, 36.4] },
};
// Next up (shown a little brighter, "coming soon").
const SOON = new Set([]);

let loading = null;
let world = null;
function script(src) {
  return new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = ok;
    s.onerror = fail;
    document.head.appendChild(s);
  });
}
function load() {
  if (!loading) {
    loading = (async () => {
      if (!(window.d3 && window.d3.geoOrthographic)) {
        await script('js/vendor/d3-array.min.js');
        await script('js/vendor/d3-geo.min.js');
      }
      world = await fetch('assets/world-110m.json').then((r) => r.json());
    })();
    loading.catch(() => { loading = null; });
  }
  return loading;
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Draw the globe into `canvas` and let it spin. `st.rot` keeps where it's turned between redraws.
 * onEmpire(code): an Empire was tapped (after the zoom-in). onInfo(text): something to say under the globe.
 * zoomOut: start zoomed in on the home Empire and pull back out to the whole world.
 */
export async function mountGlobe(canvas, st, { onEmpire, onInfo, zoomOut }) {
  try {
    await load();
  } catch {
    onInfo('The globe couldn’t load. Check your connection and try again.');
    return;
  }
  if (!canvas.isConnected) return;
  const d3 = window.d3;
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const R = Math.min(W, H) / 2 - 10;
  const proj = d3.geoOrthographic().translate([W / 2, H / 2]).clipAngle(90).precision(0.6);
  const path = d3.geoPath(proj, ctx);
  const grat = d3.geoGraticule10();
  const sphere = { type: 'Sphere' };
  const us = LIVE['United States of America'];

  let rot = st.rot || [-us.center[0] + 10, -us.center[1] + 14, 0];
  // Zoom: 1 is the whole globe; up to 6 times closer. Kept on the screen's state so it survives a redraw.
  const MIN = R;
  const MAX = R * 6;
  const clampScale = (v) => Math.min(MAX, Math.max(MIN, v));
  let scale = clampScale(R * (st.zoom || 1));
  let spin = 0; // inertia, degrees per frame
  let dragging = null;
  let busy = false; // zooming in or out
  let lastTouch = zoomOut ? performance.now() : 0;
  let tags = []; // where each Empire's name tag was drawn, so tapping the tag works too

  /** Paint an Empire's flag, faintly, inside its borders: once per piece of land (so Alaska and the
   *  lower 48 each get the whole flag), clipped to the coastline. */
  const bounds = d3.geoPath(proj);
  function flagInside(f, code) {
    const img = flagImage(code);
    if (!img) return;
    const g = f.geometry;
    const polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
    for (const coords of polys) {
      const piece = { type: 'Polygon', coordinates: coords };
      const [[x0, y0], [x1, y1]] = bounds.bounds(piece);
      if (!(x1 - x0 > 3 && y1 - y0 > 2) || !Number.isFinite(x0)) continue; // tiny islands, or turned away
      ctx.save();
      ctx.beginPath();
      path(piece);
      ctx.clip();
      ctx.globalAlpha = 0.5;
      ctx.drawImage(img, x0, y0, x1 - x0, y1 - y0);
      ctx.restore();
    }
  }

  function draw() {
    proj.rotate(rot).scale(scale);
    ctx.clearRect(0, 0, W, H);
    // glow around the globe
    const glow = ctx.createRadialGradient(W / 2, H / 2, scale * 0.9, W / 2, H / 2, scale * 1.12);
    glow.addColorStop(0, 'rgba(120,200,255,0.35)');
    glow.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    // ocean
    const sea = ctx.createRadialGradient(W / 2 - scale * 0.35, H / 2 - scale * 0.4, scale * 0.1, W / 2, H / 2, scale);
    sea.addColorStop(0, '#3a9ad0');
    sea.addColorStop(1, '#0b3452');
    ctx.beginPath();
    path(sphere);
    ctx.fillStyle = sea;
    ctx.fill();
    ctx.beginPath();
    path(grat);
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    // land
    for (const f of world.features) {
      const name = f.properties.name;
      ctx.beginPath();
      path(f);
      ctx.fillStyle = LIVE[name] ? '#7d9a7f' : SOON.has(name) ? '#86ad8f' : '#55765f';
      ctx.fill();
      if (LIVE[name]) {
        flagInside(f, LIVE[name].code);
        ctx.beginPath(); // the flag drew its own pieces: outline the whole country again
        path(f);
      }
      ctx.strokeStyle = LIVE[name] ? '#fff6cf' : 'rgba(10,25,18,0.55)';
      ctx.lineWidth = LIVE[name] ? 1.2 : 0.5;
      ctx.stroke();
    }
    // light from the top left, shade to the bottom right
    const shade = ctx.createRadialGradient(W / 2 - scale * 0.45, H / 2 - scale * 0.5, scale * 0.05, W / 2, H / 2, scale * 1.02);
    shade.addColorStop(0, 'rgba(255,255,255,0.18)');
    shade.addColorStop(0.55, 'rgba(255,255,255,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.beginPath();
    path(sphere);
    ctx.fillStyle = shade;
    ctx.fill();
    ctx.strokeStyle = 'rgba(190,230,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // a crowned tag on each live Empire facing you
    tags = [];
    // Empires facing you, the one nearest the middle first. Crowded corners (Europe) get each tag only where it
    // fits: it slides up or down a step to dodge the others, and is left off if there's no room (tapping the
    // country still opens it).
    const facing = Object.values(LIVE)
      .map((e) => ({ e, d: d3.geoDistance(e.center, [-rot[0], -rot[1]]) }))
      .filter((o) => o.d <= Math.PI / 2 - 0.55) // only Empires turned well into view
      .sort((a, b) => a.d - b.d);
    for (const { e } of facing) {
      const [px, py] = proj(e.center);
      ctx.font = '800 13px system-ui, sans-serif';
      const tw = ctx.measureText(e.name).width;
      const bw = tw + 30;
      // keep the whole tag inside the frame
      const x = Math.min(Math.max(px + (e.tag ? e.tag[0] : 0), bw / 2 + 4), W - bw / 2 - 4);
      const y0 = py + (e.tag ? e.tag[1] : 0);
      const clash = (yy) => tags.some((t) => x - bw / 2 - 6 < t.x1 && x + bw / 2 + 6 > t.x0 && yy - 15 < t.y1 && yy + 15 > t.y0);
      const fit = (yy) => Math.min(Math.max(yy, 16), H - 16);
      const y = [0, -30, 30, -60, 60].map((dy) => fit(y0 + dy)).find((yy) => !clash(yy));
      if (y === undefined) continue;
      ctx.fillStyle = 'rgba(12,24,17,0.86)';
      ctx.strokeStyle = '#f5d76e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      tags.push({ e, x0: x - bw / 2 - 6, x1: x + bw / 2 + 6, y0: y - 19, y1: y + 19 });
      ctx.roundRect(x - bw / 2, y - 13, bw, 26, 13);
      ctx.fill();
      ctx.stroke();
      // the Empire's flag (a crown until the flag has loaded)
      const cx = x - bw / 2 + 13;
      const fl = flagImage(e.code);
      if (fl) {
        ctx.drawImage(fl, cx - 7, y - 4.7, 14, 9.4);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 0.6;
        ctx.strokeRect(cx - 7, y - 4.7, 14, 9.4);
      } else {
        ctx.beginPath();
        ctx.moveTo(cx - 6, y + 4);
        ctx.lineTo(cx - 6, y - 4);
        ctx.lineTo(cx - 3, y - 1);
        ctx.lineTo(cx, y - 6);
        ctx.lineTo(cx + 3, y - 1);
        ctx.lineTo(cx + 6, y - 4);
        ctx.lineTo(cx + 6, y + 4);
        ctx.closePath();
        ctx.fillStyle = '#f5d76e';
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.name, cx + 10, y + 1);
    }
  }

  function frame(now) {
    if (!canvas.isConnected) return; // the screen moved on
    if (!busy && !dragging) {
      if (Math.abs(spin) > 0.01) {
        rot[0] += spin;
        spin *= 0.95;
      } else if (now - lastTouch > 4000) {
        rot[0] += 0.08; // a slow drift until you touch it
      }
      st.rot = rot;
    }
    draw();
    requestAnimationFrame(frame);
  }

  // Turn (and zoom) smoothly to a rotation and scale.
  function fly(toRot, toScale, ms, done) {
    busy = true;
    const from = [...rot];
    const fromScale = scale;
    const d0 = ((((toRot[0] - from[0]) % 360) + 540) % 360) - 180; // the short way round
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      const k = ease(t);
      rot = [from[0] + d0 * k, from[1] + (toRot[1] - from[1]) * k, 0];
      scale = fromScale + (toScale - fromScale) * k;
      if (t < 1 && canvas.isConnected) requestAnimationFrame(step);
      else {
        busy = false;
        st.rot = rot;
        done && done();
      }
    };
    requestAnimationFrame(step);
  }

  if (zoomOut) {
    // Coming back from an Empire's map: start close in on it and pull back.
    const back = [...rot];
    rot = [-us.center[0], -us.center[1], 0];
    scale = R * 3.2;
    fly(back, R, 900);
  }

  // ---------- zoom: pinch with two fingers, the mouse wheel, or the + and − buttons ----------
  const touches = new Map(); // pointers down right now
  let pinch = null; // { d: starting distance, s: starting scale }
  let pinched = false; // the gesture was a pinch, so lifting a finger isn't a tap
  const gap = () => { const [a, b] = [...touches.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  function setZoom(v) {
    scale = clampScale(v);
    st.zoom = scale / R;
    lastTouch = performance.now();
  }
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    spin = 0;
    setZoom(scale * Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });
  const wrap = canvas.parentElement;
  wrap && wrap.querySelectorAll('[data-globe-zoom]').forEach((btn) => btn.addEventListener('click', () => {
    if (busy) return;
    spin = 0;
    const to = clampScale(scale * (btn.dataset.globeZoom === 'in' ? 1.6 : 1 / 1.6));
    fly(rot, to, 260, () => { st.zoom = scale / R; });
  }));

  // ---------- thumb controls ----------
  canvas.addEventListener('pointerdown', (e) => {
    if (busy) return;
    canvas.setPointerCapture(e.pointerId);
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    spin = 0;
    lastTouch = performance.now();
    if (touches.size === 2) {
      // second finger down: stop spinning, start pinching
      dragging = null;
      pinch = { d: gap() || 1, s: scale };
      pinched = true;
      return;
    }
    if (touches.size === 1) pinched = false;
    dragging = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && touches.size >= 2) {
      setZoom(pinch.s * (gap() / pinch.d));
      return;
    }
    if (!dragging) return;
    const k = 72 / scale; // degrees per pixel: feels like rolling the ball under your thumb
    const dx = e.clientX - dragging.x;
    const dy = e.clientY - dragging.y;
    rot = [rot[0] + dx * k, Math.max(-85, Math.min(85, rot[1] - dy * k)), 0];
    const now = performance.now();
    spin = (dx * k) / Math.max(1, (now - dragging.t) / 16.7);
    dragging.x = e.clientX;
    dragging.y = e.clientY;
    dragging.t = now;
    lastTouch = now;
  });
  const end = (e) => {
    touches.delete(e.pointerId);
    if (touches.size < 2) pinch = null;
    if (pinched) {
      if (!touches.size) pinched = false;
      dragging = null; // after a pinch, lifting the fingers is neither a spin nor a tap
      return;
    }
    if (!dragging) return;
    const moved = Math.hypot(e.clientX - dragging.sx, e.clientY - dragging.sy);
    dragging = null;
    lastTouch = performance.now();
    if (moved > 6) return; // that was a spin, not a tap
    spin = 0;
    const box = canvas.getBoundingClientRect();
    const px = e.clientX - box.left;
    const py = e.clientY - box.top;
    const tag = tags.find((t) => px >= t.x0 && px <= t.x1 && py >= t.y0 && py <= t.y1);
    const ll = proj.invert([px, py]);
    if (!tag && (!ll || d3.geoDistance(ll, [-rot[0], -rot[1]]) > Math.PI / 2)) return;
    const f = tag ? null : world.features.find((x) => d3.geoContains(x, ll));
    if (!tag && !f) return onInfo('Spin the globe and tap an Empire.');
    const live = tag ? tag.e : LIVE[f.properties.name];
    if (live) {
      onInfo(`Entering the ${live.name}…`);
      fly([-live.center[0], -live.center[1], 0], Math.max(scale, R * 3.2), 850, () => { st.zoom = 1; onEmpire(live.code); });
    } else {
      onInfo(`${f.properties.name}: ${SOON.has(f.properties.name) ? 'Empire coming soon.' : 'not an Empire yet.'} Tap a gold Empire.`);
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', (e) => { touches.delete(e.pointerId); pinch = null; dragging = null; });

  requestAnimationFrame(frame);
}
