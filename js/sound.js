// The eagle call: the recording in assets/eagle.wav (a hawk scream, as heard in films).
// WAV so every phone can play it. If it can't load, a synthesized scream stands in.

let ctx = null;
let call = null; // decoded recording
let loading = null;

const CALL_URL = new URL('../assets/eagle.wav', import.meta.url);

function loadCall() {
  if (!ctx) return Promise.resolve(null);
  if (!loading) {
    loading = fetch(CALL_URL)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))))
      .then((bytes) => new Promise((resolve, reject) => ctx.decodeAudioData(bytes, resolve, reject)))
      .then((buf) => (call = buf))
      .catch(() => null);
  }
  return loading;
}

/** Phones only allow sound after a tap, so unlock audio on the first tap anywhere. */
export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      loadCall();
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
}

export async function playHawk() {
  unlockAudio();
  if (!ctx) return;
  await loadCall();
  if (call) {
    const src = ctx.createBufferSource();
    src.buffer = call;
    src.connect(ctx.destination);
    src.start();
    return;
  }
  synthHawk();
}

/** Backup: a high, raspy scream that rises sharply then falls away. */
function synthHawk() {
  const t0 = ctx.currentTime + 0.03;
  const dur = 1.7;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.exponentialRampToValueAtTime(0.32, t0 + 0.07);
  master.gain.setValueAtTime(0.32, t0 + 0.75);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  master.connect(ctx.destination);

  // Shape the tone like a beak and throat: a moving resonance.
  const throat = ctx.createBiquadFilter();
  throat.type = 'bandpass';
  throat.Q.value = 3.5;
  throat.frequency.setValueAtTime(3300, t0);
  throat.frequency.exponentialRampToValueAtTime(2100, t0 + dur);
  throat.connect(master);

  // Two slightly detuned voices: "kee" rising, then "eeee-arr" falling.
  for (const detune of [0, 23]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(2500 + detune, t0);
    o.frequency.exponentialRampToValueAtTime(3200 + detune, t0 + 0.16);
    o.frequency.exponentialRampToValueAtTime(2600 + detune, t0 + 0.7);
    o.frequency.exponentialRampToValueAtTime(1750 + detune, t0 + dur);
    // Fast wobble gives the scream its rasp.
    const wobble = ctx.createOscillator();
    wobble.frequency.value = 42 + detune / 4;
    const depth = ctx.createGain();
    depth.gain.value = 110;
    wobble.connect(depth);
    depth.connect(o.frequency);
    o.connect(throat);
    o.start(t0);
    o.stop(t0 + dur);
    wobble.start(t0);
    wobble.stop(t0 + dur);
  }

  // A breath of noise on top.
  const frames = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const air = ctx.createGain();
  air.gain.value = 0.22;
  noise.connect(air);
  air.connect(throat);
  noise.start(t0);
  noise.stop(t0 + dur);
}
