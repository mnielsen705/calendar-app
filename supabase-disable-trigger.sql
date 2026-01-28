-- Disable the trigger that's causing signup errors
-- The app will now create the default calendar automatically

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
