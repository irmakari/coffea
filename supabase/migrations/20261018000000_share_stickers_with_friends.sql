-- Friends see a coffee's sticker in their log: the cup lifted out of its
-- photo, with the background gone. The photo itself, café and price still
-- stay with its owner.
--
-- Stickers are cut out on the owner's phone and uploaded beside the photo.
-- Friends may read a sticker while its owner shares their log; turning that
-- off hides the stickers with the coffees.

alter table public.coffee_entries
  add column sticker_path text;

-- For the storage policy below.
create index coffee_entries_sticker_idx
  on public.coffee_entries (sticker_path)
  where sticker_path is not null;

-- ---------------------------------------------------------------------------
-- Stickers: readable by the owner's friends while the owner shares their
-- log. Only a file in the owner's own folder counts, so a coffee cannot
-- point at someone else's picture.
-- ---------------------------------------------------------------------------

create or replace function public.can_see_friend_sticker(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.coffee_entries e
    join public.profiles p on p.id = e.user_id
    where e.sticker_path = object_name
      and split_part(object_name, '/', 1) = e.user_id::text
      and p.share_logs
      and public.are_friends((select auth.uid()), e.user_id)
  );
$$;

revoke execute on function public.can_see_friend_sticker(text) from public, anon;
grant execute on function public.can_see_friend_sticker(text) to authenticated;

create policy "Users read the stickers of friends who share their log"
  on storage.objects for select to authenticated
  using (bucket_id = 'coffee-photos' and public.can_see_friend_sticker(name));

-- ---------------------------------------------------------------------------
-- The log, with each coffee's sticker. A function's columns cannot be
-- changed in place, so it is dropped and made again.
-- ---------------------------------------------------------------------------

drop function if exists public.friends_log(text[], timestamptz, uuid, integer);

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
  sticker_path text,
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
      e.sticker_path,
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

revoke execute on function public.friends_log(text[], timestamptz, uuid, integer) from public, anon;
grant execute on function public.friends_log(text[], timestamptz, uuid, integer) to authenticated;
