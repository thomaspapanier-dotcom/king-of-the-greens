-- King of the Greens: live games.
-- Paste this whole file into Supabase → SQL Editor → New query, then press Run.
-- Safe to run again.
--
-- Security model: the games table is locked (row level security on, no policies),
-- so the app's public key cannot list, read or change games directly. The only
-- way in is the three functions below, and every one of them needs a game's
-- 6-character join code (about a billion possible codes).

create table if not exists public.kog_games (
  code       text primary key,
  state      jsonb not null,
  version    integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kog_games enable row level security;
revoke all on public.kog_games from anon, authenticated;

-- Start a live game. Returns its join code.
create or replace function public.kog_create_game(p_state jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0/O or 1/I mix-ups
  v_code text;
begin
  if octet_length(p_state::text) > 300000 then
    raise exception 'game too large';
  end if;
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    begin
      insert into public.kog_games (code, state) values (v_code, p_state);
      return v_code;
    exception when unique_violation then
      -- code taken: try another
    end;
  end loop;
end;
$$;

-- Latest copy of a game, only if it's newer than p_since (keeps polling cheap).
create or replace function public.kog_get_game(p_code text, p_since integer default 0)
returns table (state jsonb, version integer)
language sql
stable
security definer
set search_path = public
as $$
  select g.state, g.version
  from public.kog_games g
  where g.code = upper(p_code) and g.version > p_since;
$$;

-- Save a game only if nobody else saved since p_version. Returns nothing on a clash.
create or replace function public.kog_update_game(p_code text, p_version integer, p_state jsonb)
returns table (state jsonb, version integer)
language sql
security definer
set search_path = public
as $$
  update public.kog_games g
  set state = p_state, version = g.version + 1, updated_at = now()
  where g.code = upper(p_code)
    and g.version = p_version
    and octet_length(p_state::text) <= 300000
  returning g.state, g.version;
$$;

revoke all on function public.kog_create_game(jsonb) from public;
revoke all on function public.kog_get_game(text, integer) from public;
revoke all on function public.kog_update_game(text, integer, jsonb) from public;
grant execute on function public.kog_create_game(jsonb) to anon, authenticated;
grant execute on function public.kog_get_game(text, integer) to anon, authenticated;
grant execute on function public.kog_update_game(text, integer, jsonb) to anon, authenticated;
