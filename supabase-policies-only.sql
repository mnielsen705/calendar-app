-- Calendar App - Policies and Trigger Only
-- Run this if tables already exist

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

alter table public.calendars enable row level security;
alter table public.events enable row level security;
alter table public.calendar_shares enable row level security;
alter table public.share_invitations enable row level security;

-- ============================================
-- POLICIES (using CREATE IF NOT EXISTS pattern)
-- ============================================

-- Calendars
do $$ begin
  create policy "Users can view own calendars" on public.calendars for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can view shared calendars" on public.calendars for select using (id in (select calendar_id from public.calendar_shares where shared_with_user_id = auth.uid()));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can insert own calendars" on public.calendars for insert with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update own calendars" on public.calendars for update using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can delete own calendars" on public.calendars for delete using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Events
do $$ begin
  create policy "Users can view events in accessible calendars" on public.events for select using (calendar_id in (select id from public.calendars where user_id = auth.uid() union select calendar_id from public.calendar_shares where shared_with_user_id = auth.uid()));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can insert events in own/editable calendars" on public.events for insert with check (calendar_id in (select id from public.calendars where user_id = auth.uid() union select calendar_id from public.calendar_shares where shared_with_user_id = auth.uid() and permission = 'edit'));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update events in own/editable calendars" on public.events for update using (calendar_id in (select id from public.calendars where user_id = auth.uid() union select calendar_id from public.calendar_shares where shared_with_user_id = auth.uid() and permission = 'edit'));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can delete events in own/editable calendars" on public.events for delete using (calendar_id in (select id from public.calendars where user_id = auth.uid() union select calendar_id from public.calendar_shares where shared_with_user_id = auth.uid() and permission = 'edit'));
exception when duplicate_object then null;
end $$;

-- Calendar shares
do $$ begin
  create policy "Calendar owners can view shares" on public.calendar_shares for select using (calendar_id in (select id from public.calendars where user_id = auth.uid()));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Calendar owners can create shares" on public.calendar_shares for insert with check (calendar_id in (select id from public.calendars where user_id = auth.uid()));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Calendar owners can update shares" on public.calendar_shares for update using (calendar_id in (select id from public.calendars where user_id = auth.uid()));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Calendar owners can delete shares" on public.calendar_shares for delete using (calendar_id in (select id from public.calendars where user_id = auth.uid()));
exception when duplicate_object then null;
end $$;

-- Share invitations
do $$ begin
  create policy "Calendar owners can view invitations" on public.share_invitations for select using (calendar_id in (select id from public.calendars where user_id = auth.uid()));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Calendar owners can create invitations" on public.share_invitations for insert with check (calendar_id in (select id from public.calendars where user_id = auth.uid()));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Calendar owners can delete invitations" on public.share_invitations for delete using (calendar_id in (select id from public.calendars where user_id = auth.uid()));
exception when duplicate_object then null;
end $$;

-- ============================================
-- TRIGGER: Auto-create calendar for new users
-- ============================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.calendars (user_id, name, is_default)
  values (new.id, 'My Calendar', true);
  return new;
end;
$$;

-- Create trigger only if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;
