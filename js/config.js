// Supabase project for accounts and live games.
// The URL and publishable (anon) key are meant to ship inside the app. What they can do is
// limited by the database rules in supabase/setup.sql and supabase/accounts.sql: game
// functions that need a join code, and profiles that only their owner can change.
// Leave both empty to turn accounts and live games off.
export const SUPABASE_URL = '';
export const SUPABASE_KEY = '';
