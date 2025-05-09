-- Function to delete a user account and all associated data
create or replace function public.delete_user_account(user_id uuid)
returns void as $$
declare
  is_oauth boolean;
begin
  -- Log the deletion attempt for debugging
  raise notice 'Attempting to delete user: %', user_id;

  -- Check if this is an OAuth user
  select exists(
    select 1 from auth.identities
    where auth.identities.user_id = $1 and provider not in ('email')
  ) into is_oauth;

  raise notice 'User is OAuth account: %', is_oauth;

  -- Delete application data first (respecting foreign key constraints)
  -- Delete analytics data
  raise notice 'Deleting analytics for user: %', user_id;
  delete from public.analytics where public.analytics.user_id = $1;

  -- Delete supplements data
  raise notice 'Deleting supplements for user: %', user_id;
  delete from public.supplements where public.supplements.user_id = $1;

  -- Delete test results data
  raise notice 'Deleting test results for user: %', user_id;
  delete from public.test_results where public.test_results.user_id = $1;

  -- For OAuth users, we need to delete from auth.identities before auth.users
  if is_oauth then
    raise notice 'Deleting OAuth identities for user: %', user_id;
    delete from auth.identities where auth.identities.user_id = $1;
  end if;

  -- Delete user profile first
  raise notice 'Deleting user profile for user: %', user_id;
  delete from public.users where id = $1;

  -- Now explicitly delete from auth.users
  raise notice 'Deleting auth user record for user: %', user_id;
  delete from auth.users where id = $1;

  -- If we get here, all deletions were successful
  raise notice 'User deleted successfully: %', user_id;
exception
  when others then
    -- Log any errors that occur
    raise exception 'Error deleting user %: % (SQLSTATE: %)', user_id, SQLERRM, SQLSTATE;
end;
$$ language plpgsql security definer
   SET search_path = public, auth, pg_temp;

-- Create a secure API endpoint for account deletion
create or replace function public.request_account_deletion()
returns void as $$
declare
  current_user_id uuid;
begin
  -- Get the current user's ID
  current_user_id := auth.uid();

  -- Only allow authenticated users to delete their own account
  if current_user_id is null then
    raise exception 'You must be logged in to delete your account';
  end if;

  -- Log the request
  raise notice 'Account deletion requested by user: %', current_user_id;

  -- Call the delete function with the current user's ID within a transaction
  -- The function itself will be executed in a transaction context
  perform public.delete_user_account(current_user_id);
end;
$$ language plpgsql security definer
   SET search_path = public, auth, pg_temp;

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant execute on function public.request_account_deletion() to authenticated;

-- Ensure we have delete permissions on auth tables (these should be run by a superuser)
-- Uncomment and run these if you encounter permission issues
-- GRANT DELETE ON auth.identities TO postgres;
-- GRANT DELETE ON auth.users TO postgres;
