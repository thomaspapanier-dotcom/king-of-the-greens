// Local persistence. Everything lives on this device for now; the shape is
// kept simple (players + games) so it can move to a synced backend later.

const KEY = 'kog.v1';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw);
      return { players: db.players || [], games: db.games || [], activeGameId: db.activeGameId || null, quick: db.quick || [], activeQuickId: db.activeQuickId || null, lag: db.lag || [], activeLagId: db.activeLagId || null };
    }
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return { players: [], games: [], activeGameId: null, quick: [], activeQuickId: null, lag: [], activeLagId: null };
}

export function save(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
    return true;
  } catch {
    return false;
  }
}

export function uid() {
  if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
