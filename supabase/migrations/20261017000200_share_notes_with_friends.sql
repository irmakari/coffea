-- Friends see the note written on a coffee too, as its owner wrote it. The
-- photo, café and price still stay with them.
--
-- A function's columns cannot be changed in place, so both are dropped and
-- made again with the note added.

drop function if exists public.friends_log(text[], timestamptz, uuid, integer);
drop function if exists public.friend_first_coffee(uuid, text);

create or replace function public.friends_log(
  catalog text[],
  before_at timestamptz default null,
  before_id uuid default null,
  page_size integer default 40
)
returns table (
  id uuid,
  user_id uuid,
  username text,
  display_name text,
  avatar_path text,
  coffee_name text,
  coffee_type text,
  milk text,
  size text,
  shots smallint,
  temperature text,
  venue text,
  rating smallint,
  notes text,
  consumed_at timestamptz,
  album_number integer,
  cheers bigint,
  cheered boolean
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
    sharing as (
      select p.id, p.username, p.display_name, p.avatar_path
      from public.profiles p
      join friends fr on fr.member = p.id
      where p.share_logs
    ),
    -- Each sharer's first coffee of every album kind, numbered in the order
    -- they were had. Worked out over all time, so the numbers are right.
    firsts as (
      select distinct on (e.user_id, lower(btrim(e.coffee_type)))
        e.id as entry_id, e.user_id, e.consumed_at
      from public.coffee_entries e
      join sharing s on s.id = e.user_id
      where lower(btrim(e.coffee_type)) = any (catalog)
        and e.consumed_at <= now()
      order by e.user_id, lower(btrim(e.coffee_type)), e.consumed_at, e.id
    ),
    numbered as (
      select fi.entry_id,
        row_number() over (partition by fi.user_id order by fi.consumed_at, fi.entry_id)::integer as album_no
      from firsts fi
    )
    select
      e.id,
      e.user_id,
      s.username,
      s.display_name,
      s.avatar_path,
      e.coffee_name,
      e.coffee_type,
      e.milk,
      e.size,
      e.shots,
      e.temperature,
      e.venue,
      e.rating,
      e.notes,
      e.consumed_at,
      n.album_no,
      (select count(*) from public.cheers c where c.entry_id = e.id),
      exists (select 1 from public.cheers c where c.entry_id = e.id and c.user_id = me)
    from public.coffee_entries e
    join sharing s on s.id = e.user_id
    left join numbered n on n.entry_id = e.id
    where e.consumed_at <= now()
      and e.consumed_at > now() - interval '30 days'
      and (before_at is null or (e.consumed_at, e.id) < (before_at, before_id))
    order by e.consumed_at desc, e.id desc
    limit least(greatest(coalesce(page_size, 40), 1), 100);
end;
$$;

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
  notes text,
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
    select e.coffee_name, e.coffee_type, e.milk, e.size, e.shots, e.temperature, e.venue, e.rating, e.notes, e.consumed_at
    from public.coffee_entries e
    where e.user_id = friend
      and lower(btrim(e.coffee_type)) = lower(btrim(coffee))
      and e.consumed_at <= now()
    order by e.consumed_at
    limit 1;
end;
$$;

revoke execute on function
  public.friends_log(text[], timestamptz, uuid, integer),
  public.friend_first_coffee(uuid, text)
from public, anon;
grant execute on function
  public.friends_log(text[], timestamptz, uuid, integer),
  public.friend_first_coffee(uuid, text)
to authenticated;
