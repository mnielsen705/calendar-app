-- Calendar App Supabase Schema (Simplified)
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- STEP 1: CREATE TABLES
-- ============================================

create table if not exists public.calendars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#3b82f6',
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid references public.calendars(id) on delete cascade not null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  all_day boolean default false,
  location text,
  is_recurring boolean default false,
  rrule text,
  recurring_event_id uuid references public.events(id) on delete cascade,
  is_exception boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.calendar_shares (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid references public.calendars(id) on delete cascade not null,
  shared_with_user_id uuid references auth.users(id) on delete cascade not null,
  permission text not null check (permission in ('view', 'edit')),
  created_at timestamptz default now(),
  unique(calendar_id, shared_with_user_id)
);

create table if not exists public.share_invitations (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid references public.calendars(id) on delete cascade not null,
  invited_email text not null,
  permission text not null check (permission in ('view', 'edit')),
  invited_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days')
);

-- ============================================
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- ============================================

alter table public.calendars enable row level security;
alter table public.events enable row level security;
alter table public.calendar_shares enable row level security;
alter table public.share_invitations enable row level security;

-- ============================================
-- STEP 3: CREATE POLICIES
-- ============================================

-- Calendars policies
drop policy if exists "Users can view own calendars" on public.calendars;
create policy "Users can view own calendars" on public.calendars
  for select using (auth.uid() = user_id);

drop policy if exists "Users can view shared calendars" on public.calendars;
create policy "Users can view shared calendars" on public.calendars
  for select using (
    id in (select calendar_id from public.calendar_shares where shared_with_user_id = auth.uid())
  );

drop policy if exists "Users can insert own calendars" on public.calendars;
create policy "Users can insert own calendars" on public.calendars
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own calendars" on public.calendars;
create policy "Users can update own calendars" on public.calendars
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own calendars" on public.calendars;
create policy "Users can delete own calendars" on public.calendars
  for delete using (auth.uid() = user_id);

-- Events policies
drop policy if exists "Users can view events in accessible calendars" on public.events;
create policy "Users can view events in accessible calendars" on public.events
  for select using (
    calendar_id in (
      select id from public.calendars where user_id = auth.uid()
      union
      select calendar_id from public.calendar_shares where shared_with_user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert events in own/editable calendars" on public.events;
create policy "Users can insert events in own/editable calendars" on public.events
  for insert with check (
    calendar_id in (
      select id from public.calendars where user_id = auth.uid()
      union
      select calendar_id from public.calendar_shares
      where shared_with_user_id = auth.uid() and permission = 'edit'
    )
  );

drop policy if exists "Users can update events in own/editable calendars" on public.events;
create policy "Users can update events in own/editable calendars" on public.events
  for update using (
    calendar_id in (
      select id from public.calendars where user_id = auth.uid()
      union
      select calendar_id from public.calendar_shares
      where shared_with_user_id = auth.uid() and permission = 'edit'
    )
  );

drop policy if exists "Users can delete events in own/editable calendars" on public.events;
create policy "Users can delete events in own/editable calendars" on public.events
  for delete using (
    calendar_id in (
      select id from public.calendars where user_id = auth.uid()
      union
      select calendar_id from public.calendar_shares
      where shared_with_user_id = auth.uid() and permission = 'edit'
    )
  );

-- Calendar shares policies
drop policy if exists "Calendar owners can view shares" on public.calendar_shares;
create policy "Calendar owners can view shares" on public.calendar_shares
  for select using (
    calendar_id in (select id from public.calendars where user_id = auth.uid())
  );

drop policy if exists "Calendar owners can create shares" on public.calendar_shares;
create policy "Calendar owners can create shares" on public.calendar_shares
  for insert with check (
    calendar_id in (select id from public.calendars where user_id = auth.uid())
  );

drop policy if exists "Calendar owners can update shares" on public.calendar_shares;
create policy "Calendar owners can update shares" on public.calendar_shares
  for update using (
    calendar_id in (select id from public.calendars where user_id = auth.uid())
  );

drop policy if exists "Calendar owners can delete shares" on public.calendar_shares;
create policy "Calendar owners can delete shares" on public.calendar_shares
  for delete using (
    calendar_id in (select id from public.calendars where user_id = auth.uid())
  );

-- Share invitations policies
drop policy if exists "Calendar owners can view invitations" on public.share_invitations;
create policy "Calendar owners can view invitations" on public.share_invitations
  for select using (
    calendar_id in (select id from public.calendars where user_id = auth.uid())
  );

drop policy if exists "Calendar owners can create invitations" on public.share_invitations;
create policy "Calendar owners can create invitations" on public.share_invitations
  for insert with check (
    calendar_id in (select id from public.calendars where user_id = auth.uid())
  );

drop policy if exists "Calendar owners can delete invitations" on public.share_invitations;
create policy "Calendar owners can delete invitations" on public.share_invitations
  for delete using (
    calendar_id in (select id from public.calendars where user_id = auth.uid())
  );

-- ============================================
-- STEP 4: CREATE TRIGGER FOR NEW USERS
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
