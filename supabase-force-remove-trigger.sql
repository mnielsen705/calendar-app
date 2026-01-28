-- Force remove the trigger causing signup to fail

-- First, check what triggers exist on auth.users
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN
        SELECT tgname
        FROM pg_trigger
        WHERE tgrelid = 'auth.users'::regclass
    LOOP
        RAISE NOTICE 'Found trigger: %', trigger_record.tgname;
    END LOOP;
END $$;

-- Drop any triggers we created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created_accept_invites ON auth.users;

-- Drop the functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.accept_pending_invitations() CASCADE;
