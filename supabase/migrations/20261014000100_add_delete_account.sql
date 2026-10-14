-- Lets a signed-in user delete their own account from inside the app.
-- Removing the auth user takes the profile, the journal and the bucket list
-- with it through their foreign keys. Photos live in storage, which has no
-- such link, so the app empties the user's folder before calling this.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = current_user_id;
end;
$$;

-- Only ever for the caller's own account, and never for a visitor.
revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
