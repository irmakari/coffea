-- One friend's whole album, for their page: which album coffees they have
-- collected, when each was first had, and how they had it that first time.
-- Their notes, café, price and photo never leave the database, and someone
-- who left the leaderboard shares none of it.

create or replace function public.friend_album(friend uuid, catalog text[])
returns table (
  coffee_type text,
  collected_at timestamptz
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

  if not exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = me and f.addressee_id = friend)
        or (f.addressee_id = me and f.requester_id = friend))
  ) then
    return;
  end if;

  if not exists (select 1 from public.profiles p where p.id = friend and p.on_leaderboard) then
    return;
  end if;

  return query
    select distinct on (lower(btrim(e.coffee_type)))
      e.coffee_type, e.consumed_at
    from public.coffee_entries e
    where e.user_id = friend
      and lower(btrim(e.coffee_type)) = any (catalog)
      and e.consumed_at <= now()
    order by lower(btrim(e.coffee_type)), e.consumed_at;
end;
$$;

-- The first time a friend had one album coffee, as they filled it in:
-- what it was and how it was served, never where, for how much, what they
-- wrote about it or its photo.
create or replace function public.friend_first_coffee(friend uuid, coffee text)
returns table (
  coffee_name text,
  coffee_type text,
  milk text,
  size text,
  shots smallint,
  temperature text,
  venue text,
  rating smallint,
  consumed_at timestamptz
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

  if not exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = me and f.addressee_id = friend)
        or (f.addressee_id = me and f.requester_id = friend))
  ) then
    return;
  end if;

  if not exists (select 1 from public.profiles p where p.id = friend and p.on_leaderboard) then
    return;
  end if;

  return query
    select e.coffee_name, e.coffee_type, e.milk, e.size, e.shots, e.temperature, e.venue, e.rating, e.consumed_at
    from public.coffee_entries e
    where e.user_id = friend
      and lower(btrim(e.coffee_type)) = lower(btrim(coffee))
      and e.consumed_at <= now()
    order by e.consumed_at
    limit 1;
end;
$$;

revoke execute on function public.friend_album(uuid, text[]), public.friend_first_coffee(uuid, text) from public, anon;
grant execute on function public.friend_album(uuid, text[]), public.friend_first_coffee(uuid, text) to authenticated;
