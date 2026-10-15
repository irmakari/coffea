-- The coffee album, seen by friends. The album itself is the app's list of
-- coffees, which the app sends in `catalog` (lowercased), so the server and
-- the app always count the same coffees.
--
-- As with the leaderboard, a friend's coffees never leave the database: only
-- how many album coffees each person has collected, and the moments a
-- friend collected a new one. Someone who left the leaderboard is left out
-- here too.

-- How many album coffees the user and each friend have collected, ever.
create or replace function public.friends_album(catalog text[])
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_path text,
  collected integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not signed in';
  end if;

  return query
    with circle as (
      select me as member
      union
      select case when f.requester_id = me then f.addressee_id else f.requester_id end
      from public.friendships f
      where f.status = 'accepted' and (f.requester_id = me or f.addressee_id = me)
    ),
    members as (
      select p.id, p.username, p.display_name, p.avatar_path
      from public.profiles p
      join circle c on c.member = p.id
      where p.on_leaderboard or p.id = me
    )
    select
      m.id,
      m.username,
      m.display_name,
      m.avatar_path,
      coalesce((
        select count(distinct lower(btrim(e.coffee_type)))
        from public.coffee_entries e
        where e.user_id = m.id and lower(btrim(e.coffee_type)) = any (catalog)
      ), 0)::integer
    from members m;
end;
$$;

-- Friends' newest album coffees: the first time each of them had a coffee
-- from the album, over the last 30 days, newest first. `collected` is how
-- many they had collected with that one.
create or replace function public.friends_activity(catalog text[], max_items integer default 30)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_path text,
  coffee_type text,
  collected_at timestamptz,
  collected integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not signed in';
  end if;

  return query
    with friends as (
      select case when f.requester_id = me then f.addressee_id else f.requester_id end as member
      from public.friendships f
      where f.status = 'accepted' and (f.requester_id = me or f.addressee_id = me)
    ),
    firsts as (
      select distinct on (e.user_id, lower(btrim(e.coffee_type)))
        e.user_id, e.coffee_type, e.consumed_at
      from public.coffee_entries e
      join friends fr on fr.member = e.user_id
      where lower(btrim(e.coffee_type)) = any (catalog)
        and e.consumed_at <= now()
      order by e.user_id, lower(btrim(e.coffee_type)), e.consumed_at
    ),
    numbered as (
      select fi.*, row_number() over (partition by fi.user_id order by fi.consumed_at)::integer as collected
      from firsts fi
    )
    select n.user_id, p.username, p.display_name, p.avatar_path, n.coffee_type, n.consumed_at, n.collected
    from numbered n
    join public.profiles p on p.id = n.user_id
    where p.on_leaderboard
      and n.consumed_at > now() - interval '30 days'
    order by n.consumed_at desc
    limit least(greatest(coalesce(max_items, 30), 1), 100);
end;
$$;

revoke execute on function public.friends_album(text[]), public.friends_activity(text[], integer) from public, anon;
grant execute on function public.friends_album(text[]), public.friends_activity(text[], integer) to authenticated;
