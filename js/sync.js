// Talks to the live-game backend (Supabase database functions from supabase/setup.sql).
// Plain fetch calls, no SDK, so the app still loads with no signal.
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

function settings() {
  // Local testing only: point at tools/fake_backend.py by setting localStorage 'kog.devSync'.
  try {
    const dev = localStorage.getItem('kog.devSync');
    if (dev && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return { url: dev, key: 'dev' };
  } catch {
    /* storage blocked */
  }
  return { url: SUPABASE_URL, key: SUPABASE_KEY };
}

export function syncAvailable() {
  const s = settings();
  return Boolean(s.url && s.key);
}

async function rpc(fn, args) {
  const { url, key } = settings();
  const headers = { 'Content-Type': 'application/json', apikey: key };
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`; // legacy anon key is a JWT
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(args),
      signal: ctrl.signal,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`${fn} failed (${res.status})`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export const normalizeCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

/** Upload a new game; resolves its 6-character join code. */
export const createRemote = (state) => rpc('kog_create_game', { p_state: state });

/** Latest {state, version}, or null if there's nothing newer than `since` (or no such game). */
export async function fetchRemote(code, since = 0) {
  const rows = await rpc('kog_get_game', { p_code: code, p_since: since });
  return rows[0] || null;
}

/** Save only if nobody else saved since `version`. Resolves the new {state, version}, or null on a clash. */
export async function pushRemote(code, version, state) {
  const rows = await rpc('kog_update_game', { p_code: code, p_version: version, p_state: state });
  return rows[0] || null;
}
