-- Friends see each other's coffees as they are logged: what was drunk and
-- how it was served, never the photo, notes, café or price. Anyone can turn
-- this off; their coffees then stay to themselves, as before.
--
-- Cheers come back too, on any coffee a friend can see.

alter table public.profiles
  add column share_logs boolean not null default true;

-- ---------------------------------------------------------------------------
-- The log: friends' coffees of the last 30 days, newest first. Pass the last
-- row's date and id to get the page after it. `album_number` is set on the
-- first coffee of its kind from the album (`catalog`, lowercased), and says
-- which number in their album it was.
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Cheers on a friend's coffee, or takes the cheers back. Resolves to whether
-- the user is cheering it afterwards.
-- ---------------------------------------------------------------------------

create or replace function public.cheer_coffee(entry uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  owner uuid;
begin
  if me is null then
    raise exception 'Not signed in';
  end if;

  select e.user_id into owner
  from public.coffee_entries e
  join public.profiles p on p.id = e.user_id
  where e.id = entry and p.share_logs;
  if owner is null or owner = me or not public.are_friends(me, owner) then
    raise exception 'Coffee not found' using errcode = 'P0002';
  end if;

  delete from public.cheers where entry_id = entry and user_id = me;
  if found then
    return false;
  end if;
  insert into public.cheers (entry_id, user_id) values (entry, me);
  return true;
end;
$$;

revoke execute on function
  public.friends_log(text[], timestamptz, uuid, integer),
  public.cheer_coffee(uuid)
from public, anon;
grant execute on function
  public.friends_log(text[], timestamptz, uuid, integer),
  public.cheer_coffee(uuid)
to authenticated;
