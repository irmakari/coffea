-- The weekly leaderboard: how the user and their friends did this week, or
-- last week, by cups, days with a coffee and cafés visited.
--
-- It counts every coffee, shared or not, but only the totals ever leave the
-- database. To keep it a game rather than a dare, at most five cups a day
-- count, and a coffee logged more than two days after it was drunk does not
-- count at all, so a week cannot be filled in after the fact.

-- Off hides the user from their friends' leaderboards. They still see their friends.
alter table public.profiles
  add column on_leaderboard boolean not null default true;

create or replace function public.friends_leaderboard(tz text default 'UTC', week_offset integer default 0)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_path text,
  cups integer,
  days integer,
  cafes integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  zone text := coalesce(nullif(btrim(tz), ''), 'UTC');
  local_start timestamp;
  week_start timestamptz;
  week_end timestamptz;
begin
  if me is null then
    raise exception 'Not signed in';
  end if;
  if week_offset not between -1 and 0 then
    raise exception 'Only this week and last week';
  end if;
  -- Weeks are the viewer's: Monday to Sunday where they are.
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = zone) then
    zone := 'UTC';
  end if;
  local_start := date_trunc('week', now() at time zone zone) + make_interval(weeks => week_offset);
  week_start := local_start at time zone zone;
  week_end := (local_start + interval '7 days') at time zone zone;

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
      where p.on_leaderboard
    ),
    counted as (
      select e.user_id as member, (e.consumed_at at time zone zone)::date as day, e.cafe_name
      from public.coffee_entries e
      join members m on m.id = e.user_id
      where e.consumed_at >= week_start
        and e.consumed_at < week_end
        and e.consumed_at <= now()
        and e.created_at < e.consumed_at + interval '2 days'
    ),
    per_day as (
      select d.member, d.day, least(count(*), 5) as cups
      from counted d
      group by d.member, d.day
    )
    select
      m.id,
      m.username,
      m.display_name,
      m.avatar_path,
      coalesce((select sum(pd.cups) from per_day pd where pd.member = m.id), 0)::integer,
      coalesce((select count(*) from per_day pd where pd.member = m.id), 0)::integer,
      coalesce((
        select count(distinct lower(btrim(c.cafe_name)))
        from counted c
        where c.member = m.id and nullif(btrim(c.cafe_name), '') is not null
      ), 0)::integer
    from members m;
end;
$$;

revoke execute on function public.friends_leaderboard(text, integer) from public, anon;
grant execute on function public.friends_leaderboard(text, integer) to authenticated;
