-- Friends: a username to be found by, friendships that one person asks for
-- and the other accepts, and blocks.
--
-- Clients never write these tables directly. Every change goes through the
-- functions below, which keep the rules in one place: no requests to or
-- from someone blocked, one friendship per pair, and a request back to
-- someone who already asked simply accepts theirs.

-- ---------------------------------------------------------------------------
-- Usernames: lowercase letters, digits and underscores. Optional, so
-- accounts made before this keep working; the app asks for one before the
-- friends pages.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column username text
    constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$');

-- Pattern ops, so the same index serves both uniqueness and prefix search.
create unique index profiles_username_key
  on public.profiles (username text_pattern_ops);

-- For the storage policy that lets people see each other's avatars.
create index profiles_avatar_path_idx
  on public.profiles (avatar_path)
  where avatar_path is not null;

-- ---------------------------------------------------------------------------
-- Friendships: one row per pair, whichever way round it was asked.
-- ---------------------------------------------------------------------------

create table public.friendships (
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (requester_id, addressee_id),
  constraint friendships_not_self check (requester_id <> addressee_id)
);

create unique index friendships_pair_key
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index friendships_addressee_idx
  on public.friendships (addressee_id);

-- ---------------------------------------------------------------------------
-- Blocks: the blocked person is never told, and the two can no longer find
-- or ask each other.
-- ---------------------------------------------------------------------------

create table public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

create index blocks_blocked_idx
  on public.blocks (blocked_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: each side may read its own friendships, and a blocker
-- their own blocks. Who blocked you is never readable.
-- ---------------------------------------------------------------------------

alter table public.friendships enable row level security;
alter table public.blocks enable row level security;

revoke all on public.friendships, public.blocks from anon, authenticated;
grant select on public.friendships, public.blocks to authenticated;

create policy "Users read their own friendships"
  on public.friendships for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

create policy "Users read who they blocked"
  on public.blocks for select to authenticated
  using ((select auth.uid()) = blocker_id);

-- ---------------------------------------------------------------------------
-- Internal helpers. Not callable from the app: they answer for any two
-- users, which would reveal who blocked whom.
-- ---------------------------------------------------------------------------

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

-- 'friend', 'outgoing' (me asked), 'incoming' (they asked) or 'none'.
create or replace function public.relation_between(me uuid, other uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select case
        when f.status = 'accepted' then 'friend'
        when f.requester_id = me then 'outgoing'
        else 'incoming'
      end
      from public.friendships f
      where least(f.requester_id, f.addressee_id) = least(me, other)
        and greatest(f.requester_id, f.addressee_id) = greatest(me, other)
    ),
    'none'
  );
$$;

revoke execute on function public.is_blocked_between(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.relation_between(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reading people. Each returns only what others may see of a profile.
-- ---------------------------------------------------------------------------

-- People whose username starts with the query, exact match first. Someone
-- blocked either way does not appear.
create or replace function public.search_profiles(query text)
returns table (id uuid, username text, display_name text, avatar_path text, relation text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  needle text := ltrim(lower(btrim(query)), '@');
begin
  if me is null then
    raise exception 'Not signed in';
  end if;
  if needle !~ '^[a-z0-9_]{2,20}$' then
    return;
  end if;

  return query
    select p.id, p.username, p.display_name, p.avatar_path, public.relation_between(me, p.id)
    from public.profiles p
    -- An underscore is a wildcard in LIKE; here it means itself.
    where p.username like replace(needle, '_', '\_') || '%'
      and p.id <> me
      and not public.is_blocked_between(me, p.id)
    order by p.username = needle desc, p.username
    limit 20;
end;
$$;

-- The one person an invite link names, if they can be added.
create or replace function public.get_profile_by_username(name text)
returns table (id uuid, username text, display_name text, avatar_path text, relation text)
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
    select p.id, p.username, p.display_name, p.avatar_path, public.relation_between(me, p.id)
    from public.profiles p
    where p.username = ltrim(lower(btrim(name)), '@')
      and not public.is_blocked_between(me, p.id);
end;
$$;

-- Friends and open requests both ways, most recent first.
create or replace function public.list_connections()
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_path text,
  relation text,
  since timestamptz
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
    select
      p.id,
      p.username,
      p.display_name,
      p.avatar_path,
      case
        when f.status = 'accepted' then 'friend'
        when f.requester_id = me then 'outgoing'
        else 'incoming'
      end,
      coalesce(f.accepted_at, f.created_at)
    from public.friendships f
    join public.profiles p
      on p.id = case when f.requester_id = me then f.addressee_id else f.requester_id end
    where f.requester_id = me or f.addressee_id = me
    order by coalesce(f.accepted_at, f.created_at) desc;
end;
$$;

create or replace function public.list_blocked()
returns table (id uuid, username text, display_name text, avatar_path text, since timestamptz)
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
    select p.id, p.username, p.display_name, p.avatar_path, b.created_at
    from public.blocks b
    join public.profiles p on p.id = b.blocked_id
    where b.blocker_id = me
    order by b.created_at desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- Changing friendships. Each resolves to the relation that holds afterwards.
-- ---------------------------------------------------------------------------

create or replace function public.send_friend_request(target uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  existing public.friendships;
begin
  if me is null then
    raise exception 'Not signed in';
  end if;
  if target = me then
    raise exception 'Cannot add yourself';
  end if;
  -- A block looks the same as someone who does not exist.
  if public.is_blocked_between(me, target)
    or not exists (select 1 from public.profiles where id = target) then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  select * into existing
  from public.friendships f
  where (f.requester_id = me and f.addressee_id = target)
     or (f.requester_id = target and f.addressee_id = me)
  for update;

  if found then
    if existing.status = 'accepted' then
      return 'friend';
    end if;
    if existing.requester_id = me then
      return 'outgoing';
    end if;
    -- They asked first, so asking back is a yes.
    update public.friendships
    set status = 'accepted', accepted_at = now()
    where requester_id = target and addressee_id = me;
    return 'friend';
  end if;

  -- Keeps one account from asking the whole app.
  if (select count(*) from public.friendships where requester_id = me and status = 'pending') >= 100 then
    raise exception 'Too many open requests' using errcode = 'P0001';
  end if;

  insert into public.friendships (requester_id, addressee_id)
  values (me, target)
  on conflict do nothing;
  -- If the other person asked at the same moment, their row won.
  return public.relation_between(me, target);
end;
$$;

create or replace function public.respond_to_friend_request(from_user uuid, accept boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not signed in';
  end if;

  if accept then
    update public.friendships
    set status = 'accepted', accepted_at = now()
    where requester_id = from_user and addressee_id = me and status = 'pending';
  else
    delete from public.friendships
    where requester_id = from_user and addressee_id = me and status = 'pending';
  end if;
  return public.relation_between(me, from_user);
end;
$$;

-- Unfriends, withdraws a request or declines one: whatever is between the two.
create or replace function public.remove_friend(other uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not signed in';
  end if;

  delete from public.friendships
  where (requester_id = me and addressee_id = other)
     or (requester_id = other and addressee_id = me);
end;
$$;

-- Ends any friendship or request between the two as well.
create or replace function public.block_user(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not signed in';
  end if;
  if target = me then
    raise exception 'Cannot block yourself';
  end if;

  insert into public.blocks (blocker_id, blocked_id)
  values (me, target)
  on conflict do nothing;

  delete from public.friendships
  where (requester_id = me and addressee_id = target)
     or (requester_id = target and addressee_id = me);
end;
$$;

create or replace function public.unblock_user(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not signed in';
  end if;

  delete from public.blocks
  where blocker_id = me and blocked_id = target;
end;
$$;

revoke execute on function
  public.search_profiles(text),
  public.get_profile_by_username(text),
  public.list_connections(),
  public.list_blocked(),
  public.send_friend_request(uuid),
  public.respond_to_friend_request(uuid, boolean),
  public.remove_friend(uuid),
  public.block_user(uuid),
  public.unblock_user(uuid)
from public, anon;

grant execute on function
  public.search_profiles(text),
  public.get_profile_by_username(text),
  public.list_connections(),
  public.list_blocked(),
  public.send_friend_request(uuid),
  public.respond_to_friend_request(uuid, boolean),
  public.remove_friend(uuid),
  public.block_user(uuid),
  public.unblock_user(uuid)
to authenticated;

-- ---------------------------------------------------------------------------
-- Avatars: anyone signed in may see a profile photo, unless a block stands
-- between them. Coffee photos stay private to their owner.
-- ---------------------------------------------------------------------------

create or replace function public.can_see_avatar(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.avatar_path = object_name
      and not public.is_blocked_between((select auth.uid()), p.id)
  );
$$;

revoke execute on function public.can_see_avatar(text) from public, anon;
grant execute on function public.can_see_avatar(text) to authenticated;

create policy "Users read the avatars of other people"
  on storage.objects for select to authenticated
  using (bucket_id = 'coffee-photos' and public.can_see_avatar(name));
