-- The friends feed: coffees shared with friends, cheers on them, and
-- reports of anything that should not be there.
--
-- A shared coffee shows friends its name, type, milk, café, rating, date and
-- photo. The price and notes are never part of it.

-- ---------------------------------------------------------------------------
-- Sharing
-- ---------------------------------------------------------------------------

alter table public.coffee_entries
  -- Coffees logged before sharing existed stay private.
  add column is_shared boolean not null default false,
  -- A smaller copy of the photo for the feed. Missing on older photos, which
  -- then show the full one.
  add column photo_thumb_path text;

-- The choice the log form starts with: whatever was picked last time.
alter table public.profiles
  add column share_by_default boolean not null default true;

create index coffee_entries_shared_idx
  on public.coffee_entries (user_id, consumed_at desc, id)
  where is_shared;

-- For the storage policy that lets friends see shared photos.
create index coffee_entries_shared_photo_idx
  on public.coffee_entries (photo_path)
  where is_shared and photo_path is not null;

create index coffee_entries_shared_thumb_idx
  on public.coffee_entries (photo_thumb_path)
  where is_shared and photo_thumb_path is not null;

-- Internal, like the other helpers: it answers for any two users.
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and least(f.requester_id, f.addressee_id) = least(a, b)
      and greatest(f.requester_id, f.addressee_id) = greatest(a, b)
  );
$$;

revoke execute on function public.are_friends(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Cheers: a friend's nod to a shared coffee. One per person per coffee.
-- ---------------------------------------------------------------------------

create table public.cheers (
  entry_id uuid not null references public.coffee_entries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, user_id)
);

create index cheers_user_idx
  on public.cheers (user_id);

-- ---------------------------------------------------------------------------
-- Reports: kept for review in the dashboard. A copy of what was reported is
-- stored with it, since the coffee itself may be deleted afterwards.
-- ---------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reported_user_id uuid references auth.users (id) on delete set null,
  entry_id uuid references public.coffee_entries (id) on delete set null,
  reason text not null check (reason in ('inappropriate', 'spam', 'other')),
  snapshot jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index reports_open_idx
  on public.reports (created_at)
  where resolved_at is null;

create index reports_reporter_idx
  on public.reports (reporter_id, created_at);

-- Neither table is read or written by the app directly.
alter table public.cheers enable row level security;
alter table public.reports enable row level security;
revoke all on public.cheers, public.reports from anon, authenticated;

-- ---------------------------------------------------------------------------
-- The feed: shared coffees from friends and from the user, newest first.
-- Pass the last row's date and id to get the page after it.
-- ---------------------------------------------------------------------------

create or replace function public.friends_feed(
  before_at timestamptz default null,
  before_id uuid default null,
  page_size integer default 20
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
  cafe_name text,
  rating smallint,
  consumed_at timestamptz,
  photo_path text,
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
    with circle as (
      select me as member
      union all
      select case when f.requester_id = me then f.addressee_id else f.requester_id end
      from public.friendships f
      where f.status = 'accepted' and (f.requester_id = me or f.addressee_id = me)
    )
    select
      e.id,
      e.user_id,
      p.username,
      p.display_name,
      p.avatar_path,
      e.coffee_name,
      e.coffee_type,
      e.milk,
      e.cafe_name,
      e.rating,
      e.consumed_at,
      coalesce(e.photo_thumb_path, e.photo_path),
      (select count(*) from public.cheers c where c.entry_id = e.id),
      exists (select 1 from public.cheers c where c.entry_id = e.id and c.user_id = me)
    from public.coffee_entries e
    join circle on circle.member = e.user_id
    join public.profiles p on p.id = e.user_id
    where e.is_shared
      and (before_at is null or (e.consumed_at, e.id) < (before_at, before_id))
    order by e.consumed_at desc, e.id desc
    limit least(greatest(page_size, 1), 50);
end;
$$;

-- Cheers a friend's shared coffee, or takes the cheers back. Resolves to
-- whether the user is cheering it afterwards.
create or replace function public.toggle_cheers(entry uuid)
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
  where e.id = entry and e.is_shared;
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

-- Reports a person, or one of their shared coffees.
create or replace function public.report_content(target_user uuid, entry uuid, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  copy jsonb;
begin
  if me is null then
    raise exception 'Not signed in';
  end if;
  if target_user is null or target_user = me then
    raise exception 'Nothing to report';
  end if;
  -- Enough for anyone acting in good faith.
  if (
    select count(*) from public.reports
    where reporter_id = me and created_at > now() - interval '1 day'
  ) >= 20 then
    raise exception 'Too many reports' using errcode = 'P0001';
  end if;

  if entry is not null then
    select jsonb_build_object(
      'coffee_name', e.coffee_name,
      'coffee_type', e.coffee_type,
      'cafe_name', e.cafe_name,
      'photo_path', e.photo_path,
      'consumed_at', e.consumed_at
    ) into copy
    from public.coffee_entries e
    where e.id = entry
      and e.user_id = target_user
      and e.is_shared
      and public.are_friends(me, target_user);
    if copy is null then
      raise exception 'Coffee not found' using errcode = 'P0002';
    end if;
  else
    select jsonb_build_object('username', p.username, 'display_name', p.display_name, 'avatar_path', p.avatar_path)
    into copy
    from public.profiles p
    where p.id = target_user;
    if copy is null then
      raise exception 'User not found' using errcode = 'P0002';
    end if;
  end if;

  insert into public.reports (reporter_id, reported_user_id, entry_id, reason, snapshot)
  values (me, target_user, entry, reason, copy);
end;
$$;

revoke execute on function
  public.friends_feed(timestamptz, uuid, integer),
  public.toggle_cheers(uuid),
  public.report_content(uuid, uuid, text)
from public, anon;

grant execute on function
  public.friends_feed(timestamptz, uuid, integer),
  public.toggle_cheers(uuid),
  public.report_content(uuid, uuid, text)
to authenticated;

-- ---------------------------------------------------------------------------
-- Photos of shared coffees: readable by the owner's friends. Everything
-- else in a user's folder stays theirs alone.
-- ---------------------------------------------------------------------------

create or replace function public.can_see_shared_photo(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.coffee_entries e
    where e.is_shared
      and e.photo_path = object_name
      and public.are_friends((select auth.uid()), e.user_id)
  ) or exists (
    select 1 from public.coffee_entries e
    where e.is_shared
      and e.photo_thumb_path = object_name
      and public.are_friends((select auth.uid()), e.user_id)
  );
$$;

revoke execute on function public.can_see_shared_photo(text) from public, anon;
grant execute on function public.can_see_shared_photo(text) to authenticated;

create policy "Users read the photos of coffees friends share"
  on storage.objects for select to authenticated
  using (bucket_id = 'coffee-photos' and public.can_see_shared_photo(name));
