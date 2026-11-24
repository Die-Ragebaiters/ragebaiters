-- Neue Arcade-Spiele in der Highscore-Datenbank freischalten.
alter table public.arcade_game_score_entries
  drop constraint if exists arcade_game_score_entries_game_key_check;

alter table public.arcade_game_score_entries
  add constraint arcade_game_score_entries_game_key_check
  check (game_key in (
    'doodle_jason', 'space_invaders', 'superjason', 'monkeykong', 'oblock',
    'pacman', 'missile_command'
  ));

create or replace function public.submit_arcade_score(p_game_key text, p_score integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_key text;
  v_score integer;
  v_best integer;
begin
  if auth.uid() is null then
    raise exception 'Du musst eingeloggt sein, um einen Highscore zu speichern.';
  end if;

  v_game_key := trim(lower(coalesce(p_game_key, '')));
  if v_game_key not in ('doodle_jason', 'space_invaders', 'superjason', 'monkeykong', 'oblock', 'pacman', 'missile_command') then
    raise exception 'Ungueltiger Arcade-Spielschluessel: %', p_game_key;
  end if;

  v_score := greatest(coalesce(p_score, 0), 0);

  select coalesce(max(score), 0)
  into v_best
  from public.arcade_game_score_entries
  where game_key = v_game_key
    and user_id = auth.uid();

  if v_score > v_best then
    insert into public.arcade_game_score_entries (game_key, user_id, score)
    values (v_game_key, auth.uid(), v_score)
    on conflict (game_key, user_id, score) do nothing;
    v_best := v_score;
  end if;

  return coalesce(v_best, 0);
end;
$$;

grant execute on function public.submit_arcade_score(text, integer) to authenticated;
