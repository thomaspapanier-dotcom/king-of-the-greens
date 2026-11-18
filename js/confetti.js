// "King rain": tiny putter-King cards in all four suits tumble down the screen,
// like the confetti effect in Messages.
//
// Drawn on ONE canvas with requestAnimationFrame. The first version animated 40 separate
// <img> elements in 3D, which made iPhones juggle 40 GPU layers and stall mid-shower.
// Positions come from the clock, not from frame counts, so a dropped frame never makes
// the cards pause and then "start again".
const SUITS = ['s', 'h', 'd', 'c'];
const SRC = (s) => `assets/kings/king-${s}.webp`;
const CARD_RATIO = 240 / 192; // height / width of the card pictures

const pics = []; // decoded pictures, kept in memory
export function preloadKings() {
  if (pics.length) return;
  for (const s of SUITS) {
    const img = new Image();
    img.src = SRC(s);
    if (img.decode) img.decode().catch(() => {});
    pics.push(img);
  }
}

const rand = (a, b) => a + Math.random() * (b - a);
let running = null;

export function kingRain() {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  preloadKings();
  if (running) running.stop();

  const canvas = document.createElement('canvas');
  canvas.className = 'king-rain';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let vw = 0;
  let vh = 0;
  const size = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
  };
  size();
  window.addEventListener('resize', size);

  const count = vw < 520 ? 40 : 60;
  const cards = Array.from({ length: count }, (_, i) => {
    const w = rand(20, 34);
    return {
      pic: pics[i % 4],
      w,
      h: w * CARD_RATIO,
      x: rand(-0.02, 1.02) * vw,
      start: (i / count) * 0.7 + rand(0, 0.15), // seconds
      speed: rand(300, 420), // px per second, steady like falling paper
      drift: rand(-25, 25), // px per second sideways
      sway: rand(12, 30),
      swayRate: rand(2.2, 4.2), // radians per second
      phase: rand(0, Math.PI * 2),
      tilt: rand(-0.5, 0.5),
      spin: rand(-2.4, 2.4), // radians per second
      flip: rand(4, 9) * (Math.random() < 0.5 ? -1 : 1), // flutter, radians per second
    };
  });

  const t0 = performance.now();
  let raf = 0;
  const stop = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', size);
    canvas.remove();
    running = null;
  };
  running = { stop };

  const frame = (now) => {
    const t = (now - t0) / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const c of cards) {
      const age = t - c.start;
      const y = -c.h + c.speed * Math.max(0, age);
      if (y > vh + c.h) continue; // this one has landed
      alive = true;
      if (age < 0 || !c.pic.complete || !c.pic.naturalWidth) continue;
      const x = c.x + c.drift * age + Math.sin(c.phase + age * c.swayRate) * c.sway;
      const flutter = Math.cos(age * c.flip); // squashing the width fakes a 3D flip
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(x, y);
      ctx.rotate(c.tilt + c.spin * age);
      ctx.scale(Math.abs(flutter) < 0.08 ? 0.08 : flutter, 1);
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.fillRect(-c.w / 2 + 1, -c.h / 2 + 1.5, c.w, c.h); // soft drop shadow
      ctx.drawImage(c.pic, -c.w / 2, -c.h / 2, c.w, c.h);
    }
    if (alive) raf = requestAnimationFrame(frame);
    else stop();
  };
  raf = requestAnimationFrame(frame);
}
