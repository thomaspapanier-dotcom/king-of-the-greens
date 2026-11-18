-- King of the Greens: accounts, gamertags and profile photos.
-- Run after setup.sql: Supabase → SQL Editor → New query → paste → Run. Safe to run again.

create extension if not exists citext;

-- One profile per signed-in user. The gamertag is unique ignoring case ("Tommy" = "tommy").
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  gamertag       citext not null unique
                 check (gamertag ~ '^[A-Za-z0-9_]{3,16}$'),
  avatar_url     text,
  phone_verified boolean not null default false,
  id_verified    boolean not null default false, -- the check mark (identity check, later)
  -- Ranked: this season's rating and badge, plus lifetime totals for the win % ball (never reset).
  ranked_mmr        integer,
  ranked_rank_index integer,
  ranked_games      integer not null default 0, -- lifetime ranked matches, every season
  ranked_wins       integer not null default 0, -- lifetime ranked wins, every season
  overall_games     integer not null default 0,
  overall_wins      integer not null default 0,
  created_at     timestamptz not null default now()
);

-- Older setups: add the ranked columns if the table already existed.
alter table public.profiles add column if not exists ranked_mmr integer;
alter table public.profiles add column if not exists ranked_rank_index integer;
alter table public.profiles add column if not exists ranked_games integer not null default 0;
alter table public.profiles add column if not exists ranked_wins integer not null default 0;
alter table public.profiles add column if not exists overall_games integer not null default 0;
alter table public.profiles add column if not exists overall_wins integer not null default 0;

alter table public.profiles enable row level security;

-- Signed-in players can see everyone's profile (for friends, opponents, leaderboards).
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select to authenticated using (true);

-- You can create only your own profile …
drop policy if exists "create own profile" on public.profiles;
create policy "create own profile" on public.profiles for insert to authenticated
  with check (id = auth.uid() and phone_verified = false and id_verified = false
              and ranked_games = 0 and ranked_wins = 0 and overall_games = 0 and overall_wins = 0
              and ranked_mmr is null and ranked_rank_index is null);

-- … and update only your own (photo). Verification flags and the gamertag are locked below.
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- The gamertag and verification flags can't be changed by the player.
-- (Renames will come later as a paid feature handled on the server.)
create or replace function public.kog_lock_profile_fields() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.gamertag is distinct from old.gamertag then
      raise exception 'Gamertags can''t be changed yet';
    end if;
    new.phone_verified := old.phone_verified;
    new.id_verified := old.id_verified;
    -- Ratings and records are only ever written by the server, never by the player.
    new.ranked_mmr := old.ranked_mmr;
    new.ranked_rank_index := old.ranked_rank_index;
    new.ranked_games := old.ranked_games;
    new.ranked_wins := old.ranked_wins;
    new.overall_games := old.overall_games;
    new.overall_wins := old.overall_wins;
  end if;
  return new;
end;
$$;
drop trigger if exists kog_lock_profile_fields on public.profiles;
create trigger kog_lock_profile_fields before update on public.profiles
  for each row execute function public.kog_lock_profile_fields();

-- Mark the profile phone-verified when the account signed in with a confirmed phone number.
create or replace function public.kog_sync_phone_verified() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set phone_verified = (new.phone_confirmed_at is not null) where id = new.id;
  return new;
end;
$$;
drop trigger if exists kog_sync_phone_verified on auth.users;
create trigger kog_sync_phone_verified after update of phone_confirmed_at on auth.users
  for each row execute function public.kog_sync_phone_verified();

-- Live "is this gamertag free?" check while typing (works before signing in).
create or replace function public.kog_gamertag_available(p_tag text) returns boolean
language sql stable security definer set search_path = public as $$
  select p_tag ~ '^[A-Za-z0-9_]{3,16}$'
     and not exists (select 1 from public.profiles where gamertag = p_tag::citext);
$$;
revoke all on function public.kog_gamertag_available(text) from public;
grant execute on function public.kog_gamertag_available(text) to anon, authenticated;

-- Profile photos: public to view, each player can only write inside their own folder.
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
drop policy if exists "avatar upload own" on storage.objects;
create policy "avatar upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar update own" on storage.objects;
create policy "avatar update own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
