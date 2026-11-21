// The World view of the Leaderboards: a globe you spin with your thumb (a full 360°). Tap an Empire
// (a country) to zoom into it. Uses the d3-geo map library and Natural Earth country outlines,
// both kept in the app (js/vendor, assets/world-110m.json) and loaded the first time the globe opens.

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
  let scale = R;
  let spin = 0; // inertia, degrees per frame
  let dragging = null;
  let busy = false; // zooming in or out
  let lastTouch = zoomOut ? performance.now() : 0;
  let tags = []; // where each Empire's name tag was drawn, so tapping the tag works too

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
      ctx.fillStyle = LIVE[name] ? '#f2c84b' : SOON.has(name) ? '#86ad8f' : '#55765f';
      ctx.fill();
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
    for (const [, e] of Object.entries(LIVE)) {
      if (d3.geoDistance(e.center, [-rot[0], -rot[1]]) > Math.PI / 2 - 0.55) continue; // only Empires turned well into view
      const [px, py] = proj(e.center);
      ctx.font = '800 13px system-ui, sans-serif';
      const tw = ctx.measureText(e.name).width;
      const bw = tw + 30;
      // keep the whole tag inside the frame
      const x = Math.min(Math.max(px + (e.tag ? e.tag[0] : 0), bw / 2 + 4), W - bw / 2 - 4);
      const y = Math.min(Math.max(py + (e.tag ? e.tag[1] : 0), 16), H - 16);
      ctx.fillStyle = 'rgba(12,24,17,0.86)';
      ctx.strokeStyle = '#f5d76e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      tags.push({ e, x0: x - bw / 2 - 6, x1: x + bw / 2 + 6, y0: y - 19, y1: y + 19 });
      ctx.roundRect(x - bw / 2, y - 13, bw, 26, 13);
      ctx.fill();
      ctx.stroke();
      // crown
      const cx = x - bw / 2 + 13;
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

  // ---------- thumb controls ----------
  canvas.addEventListener('pointerdown', (e) => {
    if (busy) return;
    canvas.setPointerCapture(e.pointerId);
    dragging = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() };
    spin = 0;
    lastTouch = performance.now();
  });
  canvas.addEventListener('pointermove', (e) => {
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
      fly([-live.center[0], -live.center[1], 0], R * 3.2, 850, () => onEmpire(live.code));
    } else {
      onInfo(`${f.properties.name}: ${SOON.has(f.properties.name) ? 'Empire coming soon.' : 'not an Empire yet.'} Tap a gold Empire.`);
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', () => { dragging = null; });

  requestAnimationFrame(frame);
}
