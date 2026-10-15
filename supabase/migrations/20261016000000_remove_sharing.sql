-- Sharing coffees with friends is taken out of the app. Friends, the weekly
-- leaderboard and reports about people stay.
--
-- Nothing is dropped, so an older build still loads: coffees are unshared,
-- the feed and cheers can no longer be called, and friends lose access to
-- photos that had been shared.

update public.coffee_entries
set is_shared = false
where is_shared;

drop policy if exists "Users read the photos of coffees friends share" on storage.objects;

revoke execute on function
  public.friends_feed(timestamptz, uuid, integer),
  public.toggle_cheers(uuid)
from authenticated;
