-- Fix: Update trigger function to bypass RLS

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Insert with explicit schema and bypass RLS via security definer
  insert into public.calendars (user_id, name, is_default, color)
  values (new.id, 'My Calendar', true, '#3b82f6');
  return new;
exception
  when others then
    -- Log error but don't fail user creation
    raise warning 'Failed to create default calendar: %', sqlerrm;
    return new;
end;
$$;

-- Grant execute permission
grant execute on function public.handle_new_user() to postgres, service_role;
