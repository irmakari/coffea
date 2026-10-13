-- Coffea initial schema: profiles, coffee entries, bucket list, photo storage.
-- Every table is private to its owner through Row Level Security.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles: one row per account, created automatically on sign-up.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  avatar_path text,
  preferred_currency text not null default 'USD' check (preferred_currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(btrim(new.raw_user_meta_data ->> 'display_name'), 60), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Coffee entries: the journal. Only the name is required.
-- ---------------------------------------------------------------------------

create table public.coffee_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  coffee_name text not null check (char_length(btrim(coffee_name)) between 1 and 80),
  coffee_type text check (char_length(coffee_type) <= 40),
  cafe_name text check (char_length(cafe_name) <= 80),
  -- Object path inside the private "coffee-photos" bucket, not a public URL.
  photo_path text,
  consumed_at timestamptz not null default now(),
  price numeric(10, 2) check (price >= 0),
  currency text check (currency ~ '^[A-Z]{3}$'),
  rating smallint check (rating between 1 and 5),
  notes text check (char_length(notes) <= 1000),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A price without a currency cannot be totalled correctly.
  constraint coffee_entries_price_has_currency check (price is null or currency is not null)
);

create index coffee_entries_user_consumed_idx
  on public.coffee_entries (user_id, consumed_at desc);

create index coffee_entries_user_favorites_idx
  on public.coffee_entries (user_id, consumed_at desc)
  where is_favorite;

create trigger coffee_entries_set_updated_at
  before update on public.coffee_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Bucket list: coffees the user wants to try.
-- ---------------------------------------------------------------------------

create table public.bucket_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  coffee_name text not null check (char_length(btrim(coffee_name)) between 1 and 80),
  cafe_name text check (char_length(cafe_name) <= 80),
  notes text check (char_length(notes) <= 1000),
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bucket_list_items_user_idx
  on public.bucket_list_items (user_id, is_completed, created_at desc);

create trigger bucket_list_items_set_updated_at
  before update on public.bucket_list_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: signed-in users reach only their own rows.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.coffee_entries enable row level security;
alter table public.bucket_list_items enable row level security;

revoke all on public.profiles, public.coffee_entries, public.bucket_list_items from anon;

-- Profiles are created by the sign-up trigger and removed with the account,
-- so clients may only read and update their own.
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.coffee_entries to authenticated;
grant select, insert, update, delete on public.bucket_list_items to authenticated;

create policy "Users read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users read their own entries"
  on public.coffee_entries for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users add their own entries"
  on public.coffee_entries for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own entries"
  on public.coffee_entries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own entries"
  on public.coffee_entries for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read their own bucket list"
  on public.bucket_list_items for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users add to their own bucket list"
  on public.bucket_list_items for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own bucket list"
  on public.bucket_list_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete from their own bucket list"
  on public.bucket_list_items for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Photo storage: a private bucket where each user owns the folder named
-- after their user id, e.g. "<user id>/<entry id>.jpg".
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'coffee-photos',
  'coffee-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "Users read their own photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'coffee-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users upload their own photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'coffee-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users replace their own photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'coffee-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'coffee-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete their own photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'coffee-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
