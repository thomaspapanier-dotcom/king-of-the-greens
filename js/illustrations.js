// Illustrations for "How to play": a top-down practice green drawn in SVG.
// Distance rings are drawn to scale from the rules (10 px = 1 ft).
import { DISTANCES } from './rules.js';

const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- drawing helpers ----------
const CROWN = 'M2.5 7.2l5.2 4.2L12 4l4.3 7.4 5.2-4.2-2.1 10.6H4.6zM4.8 19.4h14.4V21H4.8z';
const PLAYERS = [
  { k: 'ava', name: 'Ava', color: '#4dabf7', x: 110 },
  { k: 'ben', name: 'Ben', color: '#f783ac', x: 180 },
  { k: 'cole', name: 'Cole', color: '#ffd43b', x: 250 },
];
const BAND = { S: '#74c0fc', M: '#ffd43b', L: '#ff6b5b' };

/** The marker: a small yellow X (a thin dark edge keeps it readable on the grass), so it never looks like a ball. */
function markerShape(size = 13) {
  const h = size * 0.36;
  const w = Math.max(2.2, size * 0.24);
  const x = `M${-h} ${-h} L${h} ${h} M${h} ${-h} L${-h} ${h}`;
  return `<path d="${x}" stroke="#6b4e00" stroke-width="${w + 1.6}" stroke-linecap="round" fill="none"/>
    <path d="${x}" stroke="#f4c430" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
}
const tr = (x, y) => `transform: translate(${x}px, ${y}px)`;

function defs(p) {
  return `<defs>
    <pattern id="${p}-mow" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
      <rect width="26" height="26" fill="#3f8f39"/><rect width="13" height="26" fill="#47993f"/>
    </pattern>
    <radialGradient id="${p}-cup"><stop offset="0" stop-color="#050a06"/><stop offset="1" stop-color="#1c2a1e"/></radialGradient>
  </defs>`;
}

function hole(x, y, key = '') {
  return `<g class="hole" ${key ? `data-k="${key}"` : ''} style="${tr(x, y)}">
    <circle class="hole-glow" r="11" fill="none" stroke="#ffe066" stroke-width="2.5"/>
    <circle r="4.4" fill="url(#cup)"/>
    <circle r="4.4" fill="none" stroke="#f1f8f1" stroke-opacity=".55" stroke-width="1"/>
    <line x1="0" y1="0" x2="0" y2="-27" stroke="#f8f9fa" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M0 -27 L16 -22 L0 -17 Z" fill="#e5383b"/>
    <path d="M0 -27 L16 -22 L8 -21.5 L0 -21 Z" fill="#ff6b6b" opacity=".6"/>
  </g>`;
}

function ball(color, r = 5) {
  return `<circle r="${r}" fill="${color}" stroke="rgba(0,0,0,.35)" stroke-width=".8"/><circle cx="-1.1" cy="-1.2" r="${r * 0.35}" fill="#fff" opacity=".7"/>`;
}

function pill(text, x, y, key, cls = '') {
  const w = Math.max(24, text.length * 6.4 + 14);
  return `<g class="pill-label fade ${cls}" ${key ? `data-k="${key}"` : ''} style="${tr(x, y)}">
    <rect x="${-w / 2}" y="-9" width="${w}" height="18" rx="9"/>
    <text y="4" text-anchor="middle">${text}</text>
  </g>`;
}

function crown(x, y, key) {
  return `<g class="mv crown" data-k="${key}" style="${tr(x, y)}">
    <path d="${CROWN}" transform="translate(-11.5 -12) scale(.96)" fill="#ffd43b" stroke="#8a6300" stroke-width=".9" stroke-linejoin="round"/>
  </g>`;
}

function avatars() {
  return PLAYERS.map(
    (p) => `<g class="avatar" data-k="av-${p.k}" style="${tr(p.x, 270)}">
      <circle r="13" fill="${p.color}" stroke="#fff" stroke-width="2"/>
      <text y="4.5" text-anchor="middle" class="av-initial">${p.name[0]}</text>
      <text y="25" text-anchor="middle" class="av-name">${p.name}</text>
      <g class="order-badge fade hidden" data-k="ord-${p.k}" style="${tr(-12, -11)}"><circle r="7" fill="#15211a" stroke="#fff" stroke-width="1.2"/><text y="3.4" text-anchor="middle"></text></g>
    </g>`,
  ).join('');
}

// Practice green with four holes, on a darker fringe, plus a strip for the players.
const HOLES = [
  { k: 'h1', x: 85, y: 95 },
  { k: 'h2', x: 265, y: 65 },
  { k: 'h3', x: 295, y: 165 },
  { k: 'h4', x: 135, y: 205 },
];
function practiceGreen(p, inner) {
  return `<svg viewBox="0 0 360 300" role="img" class="scene" data-prefix="${p}">
    ${defs(p)}
    <rect width="360" height="300" fill="#2d6a2a"/>
    <path d="M40 120 C30 60 110 25 190 30 C270 35 335 70 330 140 C325 205 260 240 180 238 C95 236 50 180 40 120 Z" fill="url(#${p}-mow)" stroke="#5cb052" stroke-width="2"/>
    <rect y="250" width="360" height="50" fill="#235522"/>
    ${inner}
  </svg>`.replaceAll('url(#cup)', `url(#${p}-cup)`);
}

// ---------- sequences (animated, step by step) ----------
class Sequence {
  constructor(fig, def) {
    this.fig = fig;
    this.svg = fig.querySelector('svg');
    this.def = def;
    this.i = 0;
    this.token = 0;
    this.timers = [];
    this.lastCaption = -1;
    this.go(0, false); // step 1 at rest; the viewer taps Next to move on
  }
  el(k) {
    return this.svg.querySelector(`[data-k="${k}"]`);
  }
  go(i, anim) {
    this.token++;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.i = i;
    const token = this.token;
    const ctx = {
      anim: anim && !reduced(),
      el: (k) => this.el(k),
      later: (fn, ms) => this.timers.push(setTimeout(() => token === this.token && fn(), ms)),
      alive: () => token === this.token,
    };
    if (!ctx.anim) this.svg.classList.add('instant');
    this.def.apply(i, ctx);
    if (!ctx.anim) {
      this.svg.getBoundingClientRect();
      this.svg.classList.remove('instant');
    }
    this.update();
  }
  /** Play step 1 from the start (first time the figure comes into view, or Start over). */
  play() {
    this.go(-1, false);
    this.go(0, true);
  }
  /** Replay the step on screen: jump back to where it starts, then animate it again. */
  replayStep() {
    const i = Math.max(0, this.i);
    this.go(i - 1, false);
    this.go(i, true);
  }
  step(delta) {
    const next = Math.min(this.def.steps.length - 1, Math.max(0, this.i + delta));
    if (next !== this.i) this.go(next, delta > 0);
  }
  update() {
    const n = this.def.steps.length;
    const shown = Math.max(0, this.i);
    this.fig.querySelector('.fig-step').textContent = `${shown + 1} of ${n}`;
    const text = this.fig.querySelector('.fig-text');
    if (this.lastCaption !== shown) {
      // Subtitle slides in fresh for each step.
      this.lastCaption = shown;
      text.textContent = this.def.steps[shown].text;
      text.classList.remove('subtitle-in');
      text.getBoundingClientRect();
      text.classList.add('subtitle-in');
    }
    this.fig.querySelectorAll('.fig-dot').forEach((d, j) => d.classList.toggle('on', j <= shown));
    this.fig.querySelector('[data-fig-act="prev"]').disabled = shown === 0;
    const next = this.fig.querySelector('.fig-btn.primary');
    const last = shown === n - 1;
    next.dataset.figAct = last ? 'play' : 'next';
    next.textContent = last ? 'Start over' : 'Next ›';
  }
}

const show = (el, on) => el && el.classList.toggle('hidden', !on);
const place = (el, x, y) => el && (el.style.transform = `translate(${x}px, ${y}px)`);
function placeNow(el, x, y) {
  el.classList.add('instant');
  place(el, x, y);
  el.getBoundingClientRect();
  el.classList.remove('instant');
}
/** Toss a ball along an arc (JS so the height can rise and fall). */
function arc(ctx, el, from, to, ms, height = 90) {
  const t0 = performance.now();
  const shadow = ctx.el('toss-shadow');
  el.classList.add('instant');
  const frame = (now) => {
    if (!ctx.alive()) return;
    const t = Math.min(1, (now - t0) / ms);
    const x = from[0] + (to[0] - from[0]) * t;
    const gy = from[1] + (to[1] - from[1]) * t;
    const lift = Math.sin(Math.PI * t) * height;
    el.style.transform = `translate(${x}px, ${gy - lift}px) scale(${1 + lift / 110})`;
    if (shadow) {
      shadow.style.transform = `translate(${x}px, ${gy}px) scale(${1 - lift / 160})`;
      shadow.style.opacity = String(0.35 * (1 - lift / 130));
    }
    if (t < 1) requestAnimationFrame(frame);
    else {
      el.classList.remove('instant');
      if (shadow) shadow.style.opacity = '0';
      ctx.el('land')?.classList.add('ping');
    }
  };
  requestAnimationFrame(frame);
}

// ----- Opening toss -----
const T = [245, 145];
const TOSS_FROM = [180, 300];
const STOPS = { ava: [97, 92.5], ben: [60, 94.5], cole: [128, 103] };

function tossSvg(prefix = 'toss') {
  const lines = HOLES.map((h) => `<line class="aim ${h.k === 'h1' ? 'far' : ''}" x1="${T[0]}" y1="${T[1]}" x2="${h.x}" y2="${h.y}"/>`).join('');
  const balls = PLAYERS.map((p) => `<g class="mv roll hidden" data-k="ball-${p.k}" style="${tr(...T)}">${ball(p.color)}</g>`).join('');
  return practiceGreen(
    prefix,
    `<g class="fade" data-k="lines">${lines}</g>
     ${HOLES.map((h) => hole(h.x, h.y, h.k)).join('')}
     ${pill('Furthest hole', 72, 128, 'far-label')}
     <circle class="land" data-k="land" cx="${T[0]}" cy="${T[1]}" r="6"/>
     <ellipse class="toss-shadow" data-k="toss-shadow" rx="4" ry="2" fill="#000" opacity="0" style="${tr(...T)}"/>
     <g class="mv" data-k="tossball" style="${tr(...T)}">${ball('#ffffff', 3.8)}</g>
     ${balls}
     <circle class="king-ring fade" data-k="king-ring" cx="${STOPS.ava[0]}" cy="${STOPS.ava[1]}" r="9.5"/>
     ${avatars()}
     ${crown(110, 248, 'crown')}
     ${pill('Putts first', 250, 242, 'first-label')}`,
  );
}

const TOSS = {
  steps: [
    { text: 'Someone tosses a ball onto the practice green.', ms: 4400 },
    { text: 'Find the hole furthest from where it landed.', ms: 4600 },
    { text: 'Everyone putts from that spot to that hole.', ms: 5000 },
    { text: 'Closest to the hole is the KOG and sets the markers for Round 1. Furthest away putts first.', ms: 5000 },
  ],
  apply(i, ctx) {
    const { el } = ctx;
    // 1. toss
    const tb = el('tossball');
    show(tb, i >= 0);
    el('land').classList.remove('ping');
    if (i === 0 && ctx.anim) arc(ctx, tb, TOSS_FROM, T, 1100);
    else {
      place(tb, ...(i >= 0 ? T : TOSS_FROM));
      el('toss-shadow').style.opacity = '0';
    }
    tb.classList.toggle('dim', i >= 2);
    // 2. furthest hole
    show(el('lines'), i === 1);
    show(el('far-label'), i === 1);
    el('h1').classList.toggle('glow', i >= 1);
    // 3. everyone putts
    PLAYERS.forEach((p, n) => {
      const b = el(`ball-${p.k}`);
      show(b, i >= 2);
      if (i === 2 && ctx.anim) {
        placeNow(b, ...T);
        ctx.later(() => place(b, ...STOPS[p.k]), 120 + n * 420);
      } else place(b, ...(i >= 2 ? STOPS[p.k] : T));
    });
    // 4. KOG crowned
    const c = el('crown');
    show(c, i >= 3);
    if (i === 3 && ctx.anim) {
      placeNow(c, 110, 205);
      ctx.later(() => place(c, 110, 248), 60);
    } else place(c, 110, 248);
    show(el('king-ring'), i >= 3);
    show(el('first-label'), i >= 3);
  },
};

// ----- Opening tee flip -----
const TEE_AT = [180, 140];
const DUO = [
  { k: 'ava', name: 'Ava', color: '#4dabf7', x: 115 },
  { k: 'ben', name: 'Ben', color: '#f783ac', x: 245 },
];
// The tee comes to rest with its point aimed at Ava.
const TEE_END = (Math.atan2(270 - TEE_AT[1], DUO[0].x - TEE_AT[0]) * 180) / Math.PI;

/** A golf tee lying on the grass, point to the right. */
function teeShape() {
  return `<g transform="scale(1.45)">
    <path d="M-8 -1.5 L8 -1 L13 0 L8 1 L-8 1.5 Z" fill="#fff8e7" stroke="#6b4e00" stroke-width=".7" stroke-linejoin="round"/>
    <ellipse cx="-9.5" cy="0" rx="2.4" ry="4.4" fill="#fff8e7" stroke="#6b4e00" stroke-width=".7"/>
  </g>`;
}

function teeSvg() {
  const people = DUO.map(
    (p) => `<g class="avatar" data-k="av-${p.k}" style="${tr(p.x, 270)}">
      <circle r="13" fill="${p.color}" stroke="#fff" stroke-width="2"/>
      <text y="4.5" text-anchor="middle" class="av-initial">${p.name[0]}</text>
      <text y="25" text-anchor="middle" class="av-name">${p.name}</text>
    </g>`,
  ).join('');
  const [ax, ay] = [DUO[0].x, 270];
  return practiceGreen(
    'tee',
    `${HOLES.map((h) => hole(h.x, h.y)).join('')}
     <line class="aim far fade" data-k="pointer" x1="${TEE_AT[0]}" y1="${TEE_AT[1]}" x2="${ax}" y2="${ay - 16}"/>
     <ellipse class="toss-shadow" data-k="toss-shadow" rx="7" ry="2.5" fill="#000" opacity="0" style="${tr(...TEE_AT)}"/>
     <g data-k="tee" style="transform: translate(${TEE_AT[0]}px, ${TEE_AT[1]}px) rotate(${TEE_END}deg)">${teeShape()}</g>
     <circle class="king-ring fade" data-k="king-ring" cx="${ax}" cy="${ay}" r="17"/>
     ${people}
     ${crown(ax, 248, 'crown')}
     ${pill('Putts first', DUO[1].x, 242, 'first-label')}`,
  );
}

/** Flip the tee: it flies in from the players, spinning, and spins to a stop pointing at someone. */
function flipTee(ctx, el, ms = 1900) {
  const t0 = performance.now();
  const from = [180, 300];
  const spin = 3 * 360 + TEE_END;
  const shadow = ctx.el('toss-shadow');
  const frame = (now) => {
    if (!ctx.alive()) return;
    const t = Math.min(1, (now - t0) / ms);
    const fly = Math.min(1, t / 0.45); // in the air for the first part, then spinning on the grass
    const x = from[0] + (TEE_AT[0] - from[0]) * fly;
    const gy = from[1] + (TEE_AT[1] - from[1]) * fly;
    const lift = Math.sin(Math.PI * fly) * 80;
    const rot = spin * (1 - Math.pow(1 - t, 3));
    el.style.transform = `translate(${x}px, ${gy - lift}px) rotate(${rot}deg) scale(${1 + lift / 120})`;
    if (shadow) {
      shadow.style.transform = `translate(${x}px, ${gy}px)`;
      shadow.style.opacity = String(fly < 1 ? 0.3 * (1 - lift / 110) : 0);
    }
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

const TEE = {
  steps: [
    { text: 'Someone flips a tee onto the green.', ms: 3600 },
    { text: 'It points at Ava, so Ava is the KOG for Round 1 and sets the markers.', ms: 4200 },
    { text: 'Ben, the other player (or the other duo), putts first. From Round 2 on, the leader putts first.', ms: 4600 },
  ],
  apply(i, ctx) {
    const { el } = ctx;
    const tee = el('tee');
    show(tee, i >= 0);
    if (i === 0 && ctx.anim) flipTee(ctx, tee);
    else tee.style.transform = `translate(${TEE_AT[0]}px, ${TEE_AT[1]}px) rotate(${TEE_END}deg)`;
    show(el('pointer'), i >= 1);
    const c = el('crown');
    show(c, i >= 1);
    if (i === 1 && ctx.anim) {
      placeNow(c, DUO[0].x, 205);
      ctx.later(() => place(c, DUO[0].x, 248), 60);
    } else place(c, DUO[0].x, 248);
    show(el('king-ring'), i >= 1);
    show(el('first-label'), i >= 2);
  },
};

// ----- Eagle round -----
const E = [165, 135];
const H3 = [295, 165];
const SHORT_OF_H3 = [278, 168];

function eagleSvg() {
  const lines = ['h2', 'h3'].map((k) => {
    const h = HOLES.find((x) => x.k === k);
    return `<line class="aim far" data-k="line-${k}" x1="${E[0]}" y1="${E[1]}" x2="${h.x}" y2="${h.y}"/>`;
  }).join('');
  const balls = [0, 1, 2].map((n) => `<g class="mv roll hidden" data-k="eb-${n}" style="${tr(...E)}">${ball(PLAYERS[0].color)}</g>`).join('');
  return practiceGreen(
    'eagle',
    `<g class="fade" data-k="lines">${lines}</g>
     ${HOLES.map((h) => hole(h.x, h.y, h.k)).join('')}
     ${pill('A', 240, 52, 'opt-a')}
     ${pill('B', 318, 186, 'opt-b')}
     <circle class="land" data-k="land" cx="${E[0]}" cy="${E[1]}" r="6"/>
     <ellipse class="toss-shadow" data-k="toss-shadow" rx="4" ry="2" fill="#000" opacity="0" style="${tr(...E)}"/>
     <g class="mv" data-k="tossball" style="${tr(...E)}">${ball('#ffffff', 3.8)}</g>
     ${balls}
     ${pill('−2', 262, 140, 'pop-0', 'gold')}
     ${pill('−1 next putt', 262, 188, 'pop-1')}
     ${pill('−2', 326, 140, 'pop-2', 'gold')}
     ${avatars()}
     ${crown(180, 248, 'crown')}`,
  );
}

const EAGLE = {
  steps: [
    { text: 'In the last round, the KOG tosses a ball onto the green.', ms: 4400 },
    { text: 'The two holes furthest from it are the choices.', ms: 4400 },
    { text: 'The KOG picks one of them.', ms: 4200 },
    { text: 'Leader putts first. Everyone putts 3 balls from that spot: −2 for each one that drops, −1 if the next putt drops.', ms: 6200 },
    { text: 'Eagle scores count toward the total, so the lead can change right at the end.', ms: 4600 },
  ],
  apply(i, ctx) {
    const { el } = ctx;
    const tb = el('tossball');
    show(tb, i >= 0);
    el('land').classList.remove('ping');
    if (i === 0 && ctx.anim) arc(ctx, tb, [180, 262], E, 1100, 80);
    else {
      place(tb, ...(i >= 0 ? E : [180, 262]));
      el('toss-shadow').style.opacity = '0';
    }
    tb.classList.toggle('dim', i >= 3);
    // choices
    show(el('lines'), i >= 1 && i <= 3);
    show(el('opt-a'), i === 1 || i === 2);
    show(el('opt-b'), i === 1 || i === 2);
    el('line-h2').classList.toggle('dropped', i >= 2);
    el('opt-a').classList.toggle('dropped', i >= 2);
    el('h2').classList.toggle('glow', i === 1);
    el('h3').classList.toggle('glow', i >= 1);
    // putts
    PLAYERS.forEach((p, n) => {
      const badge = el(`ord-${p.k}`);
      badge.querySelector('text').textContent = String(['1', '3', '2'][n]); // Ava leads, Cole 2nd, Ben 3rd
      show(badge, i >= 3);
    });
    const targets = [H3, SHORT_OF_H3, H3];
    [0, 1, 2].forEach((n) => {
      const b = el(`eb-${n}`);
      const pop = el(`pop-${n}`);
      b.classList.remove('sunk');
      show(b, i >= 3);
      show(pop, i >= 3);
      if (i === 3 && ctx.anim) {
        placeNow(b, ...E);
        show(pop, false);
        const start = 150 + n * 1000;
        ctx.later(() => place(b, ...targets[n]), start);
        ctx.later(() => {
          if (n !== 1) b.classList.add('sunk');
          show(pop, true);
        }, start + 1050);
      } else {
        place(b, ...(i >= 3 ? targets[n] : E));
        if (i >= 3 && n !== 1) b.classList.add('sunk');
      }
    });
    // new KOG
    place(el('crown'), i >= 4 ? 110 : 180, 248);
  },
};

function sequenceFigure(id, title, svg, steps) {
  const dots = steps.map(() => '<span class="fig-dot"></span>').join('');
  return `<figure class="fig seq" data-fig="${id}" aria-label="${title}">
    <div class="fig-art">${svg}</div>
    <figcaption>
      <div class="fig-meta"><span class="fig-step"></span><span class="fig-dots">${dots}</span></div>
      <p class="fig-text" aria-live="polite"></p>
      <div class="fig-controls">
        <button class="fig-btn" data-fig-act="prev" aria-label="Previous step">‹ Back</button>
        <button class="fig-btn" data-fig-act="replay" aria-label="Replay this step">↺ Replay</button>
        <button class="fig-btn primary" data-fig-act="next">Next ›</button>
      </div>
    </figcaption>
  </figure>`;
}

// ---------- ring diagrams (tabs) ----------
const PX_PER_FT = 10;
const C = 170;
const polar = (deg, r) => [C + r * Math.cos((deg * Math.PI) / 180), C + r * Math.sin((deg * Math.PI) / 180)];
const mid = (d) => ((DISTANCES[d].min + DISTANCES[d].max) / 2) * PX_PER_FT;

function annulus(r1, r2) {
  return `M${C - r2} ${C} a${r2} ${r2} 0 1 0 ${2 * r2} 0 a${r2} ${r2} 0 1 0 ${-2 * r2} 0 Z M${C - r1} ${C} a${r1} ${r1} 0 1 0 ${2 * r1} 0 a${r1} ${r1} 0 1 0 ${-2 * r1} 0 Z`;
}

/** Marker coin with its set of balls: two birdie balls (white) and the par ball (red). */
function markerSet(key, n) {
  return `<g class="mv marker hidden" data-k="${key}" style="${tr(C, C)}">
    <line class="putt-line" x1="0" y1="0" x2="0" y2="0"/>
    ${markerShape(13)}
    <g transform="translate(11 -4)">${ball('#ffffff', 3.2)}</g>
    <g transform="translate(11 5)">${ball('#ffffff', 3.2)}</g>
    <g transform="translate(18 0.5)">${ball('#e03131', 3.2)}</g>
    <g class="num" transform="translate(-10 -10)"><circle r="6.5" fill="#15211a" stroke="#fff" stroke-width="1.1"/><text y="3.2" text-anchor="middle">${n}</text></g>
  </g>`;
}

/** A distance name in its ring color: Short (blue), Medium (orange), Long (red). */
export const dn = (k, text = DISTANCES[k].name) => `<span class="d-${k}">${text}</span>`;

const RING_PRESETS = {
  S: { label: dn('S'), show: ['S'], markers: [['S', 125]], text: `${dn('S')} putts: 3–5 ft from the hole. The KOG puts the marker anywhere in the shaded ring.`, dims: 'S' },
  M: { label: dn('M'), show: ['M'], markers: [['M', 205]], text: `${dn('M')} putts: 6–9 ft from the hole.`, dims: 'M' },
  L: { label: dn('L'), show: ['L'], markers: [['L', 320]], text: `${dn('L')} putts: 10–15 ft from the hole.`, dims: 'L' },
  round: {
    label: 'Full round',
    show: ['S', 'M', 'L'],
    markers: [['S', 125], ['M', 205], ['L', 320]],
    text: `A normal round: one marker in each ring. Everyone putts ${dn('S')}, then ${dn('M')}, then ${dn('L')}.`,
  },
  // Special rounds: all three markers at one distance.
  xS: { label: `${dn('S')} round`, show: ['S'], markers: [['S', 100], ['S', 200], ['S', 330]], text: `${dn('S')} round: all three markers 3–5 ft. Round 2.`, short: `All three markers ${dn('S')}, 3–5 ft from the hole.` },
  xM: { label: `${dn('M')} round`, show: ['M'], markers: [['M', 20], ['M', 140], ['M', 225]], text: `${dn('M')} round: all three markers 6–9 ft. Round 4.`, short: `All three markers ${dn('M')}, 6–9 ft from the hole.` },
  xL: { label: `${dn('L')} round`, show: ['L'], markers: [['L', 35], ['L', 155], ['L', 305]], text: `${dn('L')} round: all three markers 10–15 ft. Round 6.`, short: `All three markers ${dn('L')}, 10–15 ft from the hole.` },
};

function ringsSvg(p) {
  const bands = Object.keys(DISTANCES)
    .map((d) => {
      const r1 = DISTANCES[d].min * PX_PER_FT;
      const r2 = DISTANCES[d].max * PX_PER_FT;
      return `<g class="band fade" data-k="band-${d}">
        <path d="${annulus(r1, r2)}" fill="${BAND[d]}" fill-opacity=".38" fill-rule="evenodd"/>
        <circle cx="${C}" cy="${C}" r="${r1}" fill="none" stroke="${BAND[d]}" stroke-width="2.2"/>
        <circle cx="${C}" cy="${C}" r="${r2}" fill="none" stroke="${BAND[d]}" stroke-width="2.2"/>
        <text class="band-name" x="${C}" y="${C - (r1 + r2) / 2 + 3.5}" text-anchor="middle">${DISTANCES[d].name.toUpperCase()}</text>
      </g>`;
    })
    .join('');
  const ghost = Object.values(DISTANCES)
    .flatMap((d) => [d.min, d.max])
    .map((ft) => `<circle cx="${C}" cy="${C}" r="${ft * PX_PER_FT}" class="ghost-ring"/>`)
    .join('');
  const dims = Object.keys(DISTANCES)
    .map((d) => {
      const { min, max } = DISTANCES[d];
      return `<g class="dims fade" data-k="dims-${d}">
        <line class="ruler" x1="${C}" y1="${C}" x2="${C + max * PX_PER_FT}" y2="${C}"/>
        <line class="tick" x1="${C + min * PX_PER_FT}" y1="${C - 5}" x2="${C + min * PX_PER_FT}" y2="${C + 5}"/>
        <line class="tick" x1="${C + max * PX_PER_FT}" y1="${C - 5}" x2="${C + max * PX_PER_FT}" y2="${C + 5}"/>
        ${pill(`${min} ft`, C + min * PX_PER_FT, C + 16)}
        ${pill(`${max} ft`, C + max * PX_PER_FT - (max === 15 ? 2 : 0), C - 16)}
      </g>`;
    })
    .join('');
  return `<svg viewBox="0 0 340 340" role="img" class="scene rings">
    ${defs(p)}
    <rect width="340" height="340" rx="16" fill="url(#${p}-mow)"/>
    ${ghost}
    ${bands}
    ${dims}
    ${Object.keys(DISTANCES).map((d) => `<text class="ghost-dist fade hidden" data-k="ghost-${d}" x="16" y="326">${DISTANCES[d].range}</text>`).join('')}
    ${markerSet('mk-0', 1)}${markerSet('mk-1', 2)}${markerSet('mk-2', 3)}
    ${hole(C, C).replace('url(#cup)', `url(#${p}-cup)`)}
  </svg>`;
}

const ringState = {};
function applyRings(fig) {
  const preset = RING_PRESETS[ringState[fig.dataset.fig]];
  const svg = fig.querySelector('svg');
  const el = (k) => svg.querySelector(`[data-k="${k}"]`);
  for (const d of Object.keys(DISTANCES)) {
    show(el(`band-${d}`), preset.show.includes(d));
    show(el(`dims-${d}`), preset.dims === d);
    // Faint distance watermark for single-distance views (not Full round).
    show(el(`ghost-${d}`), preset.show.length === 1 && preset.show[0] === d);
  }
  [0, 1, 2].forEach((n) => {
    const m = el(`mk-${n}`);
    const spec = preset.markers[n];
    show(m, Boolean(spec));
    m.querySelector('.num').style.display = preset.markers.length > 1 ? '' : 'none';
    if (!spec) return;
    const [x, y] = polar(spec[1], mid(spec[0]));
    place(m, x, y);
    const line = m.querySelector('.putt-line');
    line.setAttribute('x2', String(C - x));
    line.setAttribute('y2', String(C - y));
  });
  fig.querySelectorAll('[data-fig-tab]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.figTab === ringState[fig.dataset.fig])));
  const text = fig.querySelector('.fig-text');
  if (text.dataset.preset !== ringState[fig.dataset.fig]) {
    text.dataset.preset = ringState[fig.dataset.fig];
    // Without tabs (the "Up next" picture) the shorter caption fits better.
    text.innerHTML = (!fig.querySelector('.fig-tabs') && preset.short) || preset.text;
    text.classList.remove('subtitle-in');
    text.getBoundingClientRect();
    text.classList.add('subtitle-in');
  }
}

function ringsFigure(id, title, keys, { tabs: withTabs = true } = {}) {
  if (!ringState[id] || !withTabs) ringState[id] = keys[0];
  const tabs = keys.map((k) => `<button class="fig-tab" data-fig-tab="${k}" aria-pressed="false">${RING_PRESETS[k].label}</button>`).join('');
  return `<figure class="fig rings-fig" data-fig="${id}" aria-label="${title}">
    ${withTabs ? `<div class="fig-tabs" role="group" aria-label="${title}">${tabs}</div>` : ''}
    <div class="fig-art">${ringsSvg(id)}</div>
    <figcaption><p class="fig-text" aria-live="polite"></p></figcaption>
  </figure>`;
}

// ---------- one set of balls (static) ----------
function setFigure() {
  const p = 'set';
  return `<figure class="fig" aria-label="One set: two birdie balls and a par ball">
    <div class="fig-art"><svg viewBox="0 0 340 130" role="img" class="scene">
      ${defs(p)}
      <rect width="340" height="130" rx="16" fill="url(#${p}-mow)"/>
      <line class="putt-line long" x1="124" y1="62" x2="292" y2="62"/>
      <g transform="translate(36 62)">${markerShape(18)}</g>
      <text class="lbl" x="36" y="88" text-anchor="middle">Marker</text>
      <g transform="translate(72 62)">${ball('#ffffff', 5.5)}</g>
      <g transform="translate(90 62)">${ball('#ffffff', 5.5)}</g>
      <g transform="translate(116 62)">${ball('#e03131', 5.5)}</g>
      <path d="M64 46 v-5 h34 v5" fill="none" stroke="#fff" stroke-width="1.4"/>
      <text class="lbl" x="81" y="34" text-anchor="middle">2 birdie balls</text>
      <path d="M108 78 v5 h16 v-5" fill="none" stroke="#fff" stroke-width="1.4"/>
      <text class="lbl" x="116" y="99" text-anchor="middle">1 par ball</text>
      <text class="lbl small" x="116" y="113" text-anchor="middle">looks different</text>
      <text class="lbl small" x="208" y="50" text-anchor="middle">birdie balls first, par ball last</text>
      ${hole(296, 62).replace('url(#cup)', `url(#${p}-cup)`)}
    </svg></div>
  </figure>`;
}

// ---------- any hole on the green (static) ----------
function anyHoleFigure() {
  const chosen = [190, 132];
  const others = [[84, 96], [290, 84], [282, 194], [104, 196]];
  // Not to scale here: the point is that every hole can host the three rings.
  const rings = { S: [10, 17], M: [20, 29], L: [32, 46] };
  const ring = (x, y, d) => {
    const [r1, r2] = rings[d];
    return `<path d="M${x - r2} ${y} a${r2} ${r2} 0 1 0 ${2 * r2} 0 a${r2} ${r2} 0 1 0 ${-2 * r2} 0 Z M${x - r1} ${y} a${r1} ${r1} 0 1 0 ${2 * r1} 0 a${r1} ${r1} 0 1 0 ${-2 * r1} 0 Z" fill="${BAND[d]}" fill-opacity=".38" fill-rule="evenodd" stroke="${BAND[d]}" stroke-width="1.6"/>`;
  };
  const marker = (d, deg) => {
    const r = (rings[d][0] + rings[d][1]) / 2;
    const x = chosen[0] + r * Math.cos((deg * Math.PI) / 180);
    const y = chosen[1] + r * Math.sin((deg * Math.PI) / 180);
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${markerShape(9)}<g transform="translate(7.5 0)">${ball('#ffffff', 2.4)}</g><g transform="translate(12.5 0)">${ball('#e03131', 2.4)}</g></g>`;
  };
  const ghosts = others
    .map(([x, y]) => `<circle class="ghost-ring" cx="${x}" cy="${y}" r="46"/><circle class="ghost-ring" cx="${x}" cy="${y}" r="20"/>${hole(x, y)}`)
    .join('');
  const svg = practiceGreen(
    'any',
    `${ghosts}
     ${ring(...chosen, 'L')}${ring(...chosen, 'M')}${ring(...chosen, 'S')}
     ${marker('S', 125)}${marker('M', 205)}${marker('L', 330)}
     ${hole(...chosen)}
     ${pill('KOG’s pick', chosen[0], chosen[1] + 60, '', 'gold')}`,
  ).replace('viewBox="0 0 360 300"', 'viewBox="0 0 360 246"');
  return `<figure class="fig" aria-label="The KOG can set the markers around any hole">
    <div class="fig-art">${svg}</div>
    <figcaption><p class="fig-text">The KOG can set the markers around <b>any hole</b> on the practice green. The faint rings show the other holes they could have picked.</p></figcaption>
  </figure>`;
}

// ---------- Quick Play: Compass (static) ----------
const COMPASS_DIRS = [
  { name: 'N', deg: -90 },
  { name: 'E', deg: 0 },
  { name: 'S', deg: 90 },
  { name: 'W', deg: 180 },
];
/**
 * Four tees around one hole at the chosen distance. `active` highlights the tee being
 * putted from (with its 4 balls); null shows all four tees the same.
 */
export function compassFigure(dist, active = null, caption = null) {
  const p = `compass-${dist}`;
  const c = 120;
  const [r1, r2] = [58, 92]; // ring drawn the same size for every distance; the label gives the feet
  const mid = (r1 + r2) / 2;
  const ring = `<path d="M${c - r2} ${c} a${r2} ${r2} 0 1 0 ${2 * r2} 0 a${r2} ${r2} 0 1 0 ${-2 * r2} 0 Z M${c - r1} ${c} a${r1} ${r1} 0 1 0 ${2 * r1} 0 a${r1} ${r1} 0 1 0 ${-2 * r1} 0 Z" fill="${BAND[dist]}" fill-opacity=".38" fill-rule="evenodd" stroke="${BAND[dist]}" stroke-width="2"/>`;
  const tees = COMPASS_DIRS.map((t, i) => {
    const x = c + mid * Math.cos((t.deg * Math.PI) / 180);
    const y = c + mid * Math.sin((t.deg * Math.PI) / 180);
    const lx = c + (r2 + 13) * Math.cos((t.deg * Math.PI) / 180);
    const ly = c + (r2 + 13) * Math.sin((t.deg * Math.PI) / 180) + 4;
    const on = active === i;
    const balls = on ? [-6, 0, 6].map((dx) => `<g transform="translate(${dx} 11)">${ball('#ffffff', 2.6)}</g>`).join('') : '';
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
        ${on ? '<circle r="12" fill="none" stroke="#ffe066" stroke-width="2.5"/>' : ''}
        <circle r="4.6" fill="#ffffff" stroke="#2b2b2b" stroke-width="1.2"/><circle r="1.6" fill="#c9ced0"/>
        ${balls}
      </g>
      <text class="compass-dir ${on ? 'on' : ''}" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle">${t.name}</text>`;
  }).join('');
  const text = caption ?? `${dn(dist)}: tees ${DISTANCES[dist].range} from the hole, one at each compass point.`;
  return `<figure class="fig compass-fig" aria-label="Four tees around the hole">
    <div class="fig-art"><svg viewBox="0 0 240 240" role="img" class="scene">
      ${defs(p)}
      <rect width="240" height="240" rx="16" fill="url(#${p}-mow)"/>
      ${ring}
      <text class="ghost-dist" x="12" y="230" style="font-size:22px">${DISTANCES[dist].range}</text>
      ${tees}
      ${hole(c, c).replace('url(#cup)', `url(#${p}-cup)`)}
    </svg></div>
    <figcaption><p class="fig-text">${text}</p></figcaption>
  </figure>`;
}

// ---------- Lag 21 target (static) ----------
/** Hole with a putter-grip ring (2 pts) and a putter-length ring (1 pt); the start spot far away. */
export function lagFigure(caption = null) {
  const p = 'lag';
  const hx = 262;
  const hy = 104;
  const zone = (r, fill, stroke) => `<circle cx="${hx}" cy="${hy}" r="${r}" fill="${fill}" fill-opacity=".32" stroke="${stroke}" stroke-width="2"/>`;
  const pt = (x, y, txt) => `<text class="lag-pts" x="${x}" y="${y}" text-anchor="middle">${txt}</text>`;
  const text = caption ?? 'Holed = <b>3</b>. Within a putter grip = <b>2</b>. Within a putter length = <b>1</b>. Only the difference scores each frame.';
  return `<figure class="fig" aria-label="Lag target">
    <div class="fig-art"><svg viewBox="0 0 340 208" role="img" class="scene">
      ${defs(p)}
      <rect width="340" height="208" rx="16" fill="url(#${p}-mow)"/>
      <line class="putt-line long" x1="44" y1="${hy}" x2="${hx - 64}" y2="${hy}"/>
      <g transform="translate(36 ${hy})">${markerShape(14)}</g>
      <text class="lbl small" x="36" y="${hy + 26}" text-anchor="middle">Start</text>
      <text class="lbl small" x="122" y="${hy - 10}" text-anchor="middle">25–35 ft</text>
      ${zone(62, '#ffffff', '#ffffff')}
      ${zone(30, '#ffd43b', '#ffd43b')}
      ${pt(hx, hy - 40, '1 · putter length')}
      ${pt(hx, hy - 13, '2')}
      <g transform="translate(${hx + 22} ${hy + 12})">${ball('#4dabf7', 5)}</g>
      <g transform="translate(${hx - 40} ${hy + 30})">${ball('#ff922b', 5)}</g>
      <g transform="translate(${hx + 14} ${hy - 38})">${ball('#ff922b', 5)}</g>
      ${hole(hx, hy).replace('url(#cup)', `url(#${p}-cup)`)}
      ${pt(hx + 14, hy + 4, '3')}
    </svg></div>
    <figcaption><p class="fig-text">${text}</p></figcaption>
  </figure>`;
}

// ---------- public API ----------
/** The opening-toss animation, also shown on the toss screen of a new game. */
// ----- Tie-breaker: the same toss, settling a tie for the lead -----
const TIEBREAK = {
  steps: [
    { text: 'Tied for the lead? Toss a ball onto the green. Where it lands is the marker.' },
    { text: 'Find the hole furthest from it.' },
    { text: 'Each tied player putts once from the marker.' },
    { text: 'Closest to the hole wins. Too close to call? Toss again.' },
  ],
  apply(i, ctx) {
    TOSS.apply(i, ctx);
    show(ctx.el('first-label'), false); // no "putts first" in a tie-breaker
  },
};

/** The tie-breaker animation, for How to play and the tie-breaker screen. */
export function tiebreakFigure() {
  return sequenceFigure('tiebreak', 'Tie-breaker, step by step', tossSvg('tiebreak'), TIEBREAK.steps);
}

/** The opening tee flip, for How to play and the start of a new game. */
export function tossFigure() {
  return sequenceFigure('tee', 'Flip a tee, step by step', teeSvg(), TEE.steps);
}

/** The picture for the round coming up, shown under "Up next". */
export function nextRoundFigure(def) {
  if (def.kind === 'eagle') return sequenceFigure('eagle', 'Eagle round, step by step', eagleSvg(), EAGLE.steps);
  const key = def.kind === 'special' ? `x${def.sets[0]}` : 'round';
  return ringsFigure('next-round', 'Where the markers go this round', [key], { tabs: false });
}

export function figures() {
  return {
    toss: tossFigure(),
    markers: ringsFigure('markers', 'Where the KOG can put the markers', ['S', 'M', 'L', 'round']),
    set: setFigure(),
    anyHole: anyHoleFigure(),
    special: ringsFigure('special', 'Special rounds', ['xS', 'xM', 'xL']),
    eagle: sequenceFigure('eagle', 'Eagle round, step by step', eagleSvg(), EAGLE.steps),
    tiebreak: tiebreakFigure(),
  };
}

const SEQ_DEFS = { tee: TEE, toss: TOSS, eagle: EAGLE, tiebreak: TIEBREAK };
const autoplayed = new Set();
let listening = false;

/** Wire up figures after the page renders. Safe to call after every render. */
export function mountIllustrations(root) {
  root.querySelectorAll('.fig.rings-fig').forEach(applyRings);
  const seqs = [];
  root.querySelectorAll('.fig.seq').forEach((fig) => {
    const seq = new Sequence(fig, SEQ_DEFS[fig.dataset.fig]);
    fig._seq = seq;
    seqs.push(seq);
  });
  if ('IntersectionObserver' in window && !reduced()) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.dataset.fig;
          if (e.isIntersecting && !autoplayed.has(id)) {
            autoplayed.add(id);
            e.target._seq.play();
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.6 },
    );
    seqs.forEach((s) => io.observe(s.fig));
  }
  if (!listening) {
    listening = true;
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-fig-tab]');
      if (tab) {
        const fig = tab.closest('.fig');
        ringState[fig.dataset.fig] = tab.dataset.figTab;
        applyRings(fig);
        return;
      }
      const act = e.target.closest('[data-fig-act]');
      if (!act) return;
      const seq = act.closest('.fig')._seq;
      if (!seq) return;
      const what = act.dataset.figAct;
      if (what === 'play') seq.play();
      else if (what === 'replay') seq.replayStep();
      else seq.step(what === 'next' ? 1 : -1);
    });
  }
}
