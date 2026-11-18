// Accounts: sign-in through Supabase Auth (Google, Apple, phone code, email link),
// plus the player's profile (unique gamertag, photo). Plain fetch calls, no SDK.
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

const KEY = 'kog.session';
const base = () => SUPABASE_URL.replace(/\/$/, '');
export const accountsAvailable = () => Boolean(SUPABASE_URL && SUPABASE_KEY);
export const GAMERTAG_RULE = /^[A-Za-z0-9_]{3,16}$/;
export const validGamertag = (tag) => GAMERTAG_RULE.test(String(tag || ''));

let session = null;
try {
  session = JSON.parse(localStorage.getItem(KEY) || 'null');
} catch {
  session = null;
}
function saveSession(s) {
  session = s;
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: signed in until the app closes */
  }
}
export const currentUser = () => (session ? session.user : null);

function headers(extra = {}, auth = true) {
  const h = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', ...extra };
  if (auth && session) h.Authorization = `Bearer ${session.access_token}`;
  else if (SUPABASE_KEY.startsWith('eyJ')) h.Authorization = `Bearer ${SUPABASE_KEY}`;
  return h;
}

async function call(path, { method = 'GET', body, auth = true, extra = {}, raw = false } = {}) {
  if (auth) await freshSession();
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: headers(extra, auth),
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
    cache: 'no-store',
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && (data.msg || data.message || data.error_description || data.error)) || `Request failed (${res.status})`);
  return data;
}

function fromTokenResponse(t, user = null) {
  return {
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + Number(t.expires_in || 3600),
    user: user || t.user || null,
  };
}

/** Refresh the access token a minute before it runs out. */
async function freshSession() {
  if (!session || session.expires_at - 60 > Date.now() / 1000) return;
  try {
    const t = await fetch(`${base()}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: headers({}, false),
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('expired'))));
    saveSession(fromTokenResponse(t));
  } catch {
    saveSession(null); // signed out: refresh token no longer valid
  }
}

const returnUrl = () => `${location.origin}${location.pathname}`;

/** Google / Apple: hand off to the provider; we come back with tokens in the address. */
export function signInWithProvider(provider) {
  location.href = `${base()}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(returnUrl())}`;
}

/** After returning from Google/Apple or an email link: pick the session out of the address. */
export async function handleRedirect() {
  if (!accountsAvailable() || !location.hash.includes('access_token=')) return false;
  const params = new URLSearchParams(location.hash.slice(1));
  history.replaceState(null, '', location.pathname + location.search);
  const t = Object.fromEntries(params);
  saveSession(fromTokenResponse(t));
  try {
    const user = await call('/auth/v1/user');
    saveSession({ ...session, user });
  } catch {
    saveSession(null);
    return false;
  }
  return true;
}

/** Email: send a sign-in link. */
export const sendEmailLink = (email) =>
  call(`/auth/v1/otp?redirect_to=${encodeURIComponent(returnUrl())}`, { method: 'POST', auth: false, body: { email, create_user: true } });

/** Phone: text a 6-digit code, then verify it. */
export const sendPhoneCode = (phone) => call('/auth/v1/otp', { method: 'POST', auth: false, body: { phone, create_user: true } });
export async function verifyPhoneCode(phone, token) {
  const t = await call('/auth/v1/verify', { method: 'POST', auth: false, body: { type: 'sms', phone, token } });
  saveSession(fromTokenResponse(t));
  return currentUser();
}

export async function signOut() {
  try {
    if (session) await call('/auth/v1/logout', { method: 'POST' });
  } catch {
    /* signing out locally either way */
  }
  saveSession(null);
}

// ---------- profile ----------
export async function loadProfile() {
  const u = currentUser();
  if (!u) return null;
  const rows = await call(`/rest/v1/profiles?id=eq.${u.id}&select=*`);
  return rows[0] || null;
}

/** Is a gamertag free? (Checked again by the database when saving.) */
export async function gamertagAvailable(tag) {
  if (!validGamertag(tag)) return false;
  return call('/rest/v1/rpc/kog_gamertag_available', { method: 'POST', auth: Boolean(session), body: { p_tag: tag } });
}

export async function createProfile(gamertag) {
  if (!validGamertag(gamertag)) throw new Error('Gamertags are 3–16 letters, numbers or underscores.');
  try {
    const rows = await call('/rest/v1/profiles', { method: 'POST', body: { id: currentUser().id, gamertag }, extra: { Prefer: 'return=representation' } });
    return rows[0];
  } catch (e) {
    if (/duplicate|unique/i.test(e.message)) throw new Error(`“${gamertag}” is taken. Try another.`);
    throw e;
  }
}

/** Upload a profile photo (already resized to a small JPEG) and save its address. */
export async function uploadAvatar(blob) {
  const uid = currentUser().id;
  await call(`/storage/v1/object/avatars/${uid}/avatar.jpg`, {
    method: 'POST',
    raw: true,
    body: blob,
    extra: { 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
  });
  const url = `${base()}/storage/v1/object/public/avatars/${uid}/avatar.jpg?v=${Date.now()}`;
  const rows = await call(`/rest/v1/profiles?id=eq.${uid}`, { method: 'PATCH', body: { avatar_url: url }, extra: { Prefer: 'return=representation' } });
  return rows[0];
}
