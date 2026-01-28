-- Calendar App Supabase Schema
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

-- Calendars table
create table if not exists calendars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#3b82f6',
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Events table
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid references calendars(id) on delete cascade not null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  all_day boolean default false,
  location text,
  -- Recurring event fields
  is_recurring boolean default false,
  rrule text, -- RRULE format string
  recurring_event_id uuid references events(id) on delete cascade, -- Parent event for exceptions
  is_exception boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Calendar shares table
create table if not exists calendar_shares (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid references calendars(id) on delete cascade not null,
  shared_with_user_id uuid references auth.users(id) on delete cascade not null,
  permission text not null check (permission in ('view', 'edit')),
  created_at timestamptz default now(),
  unique(calendar_id, shared_with_user_id)
);

-- Share invitations table (for pending invites)
create table if not exists share_invitations (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid references calendars(id) on delete cascade not null,
  invited_email text not null,
  permission text not null check (permission in ('view', 'edit')),
  invited_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days')
);

-- ============================================
-- INDEXES
-- ============================================

create index if not exists idx_calendars_user_id on calendars(user_id);
create index if not exists idx_events_calendar_id on events(calendar_id);
create index if not exists idx_events_start_time on events(start_time);
create index if not exists idx_calendar_shares_calendar_id on calendar_shares(calendar_id);
create index if not exists idx_calendar_shares_user_id on calendar_shares(shared_with_user_id);
create index if not exists idx_share_invitations_email on share_invitations(invited_email);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
alter table calendars enable row level security;
alter table events enable row level security;
alter table calendar_shares enable row level security;
alter table share_invitations enable row level security;

-- Calendars policies
create policy "Users can view own calendars" on calendars
  for select using (auth.uid() = user_id);

create policy "Users can view shared calendars" on calendars
  for select using (
    id in (select calendar_id from calendar_shares where shared_with_user_id = auth.uid())
  );

create policy "Users can insert own calendars" on calendars
  for insert with check (auth.uid() = user_id);

create policy "Users can update own calendars" on calendars
  for update using (auth.uid() = user_id);

create policy "Users can delete own calendars" on calendars
  for delete using (auth.uid() = user_id);

-- Events policies
create policy "Users can view events in accessible calendars" on events
  for select using (
    calendar_id in (
      select id from calendars where user_id = auth.uid()
      union
      select calendar_id from calendar_shares where shared_with_user_id = auth.uid()
    )
  );

create policy "Users can insert events in own/editable calendars" on events
  for insert with check (
    calendar_id in (
      select id from calendars where user_id = auth.uid()
      union
      select calendar_id from calendar_shares
      where shared_with_user_id = auth.uid() and permission = 'edit'
    )
  );

create policy "Users can update events in own/editable calendars" on events
  for update using (
    calendar_id in (
      select id from calendars where user_id = auth.uid()
      union
      select calendar_id from calendar_shares
      where shared_with_user_id = auth.uid() and permission = 'edit'
    )
  );

create policy "Users can delete events in own/editable calendars" on events
  for delete using (
    calendar_id in (
      select id from calendars where user_id = auth.uid()
      union
      select calendar_id from calendar_shares
      where shared_with_user_id = auth.uid() and permission = 'edit'
    )
  );

-- Calendar shares policies
create policy "Calendar owners can view shares" on calendar_shares
  for select using (
    calendar_id in (select id from calendars where user_id = auth.uid())
  );

create policy "Calendar owners can create shares" on calendar_shares
  for insert with check (
    calendar_id in (select id from calendars where user_id = auth.uid())
  );

create policy "Calendar owners can update shares" on calendar_shares
  for update using (
    calendar_id in (select id from calendars where user_id = auth.uid())
  );

create policy "Calendar owners can delete shares" on calendar_shares
  for delete using (
    calendar_id in (select id from calendars where user_id = auth.uid())
  );

-- Share invitations policies
create policy "Calendar owners can view invitations" on share_invitations
  for select using (
    calendar_id in (select id from calendars where user_id = auth.uid())
  );

create policy "Calendar owners can create invitations" on share_invitations
  for insert with check (
    calendar_id in (select id from calendars where user_id = auth.uid())
  );

create policy "Calendar owners can delete invitations" on share_invitations
  for delete using (
    calendar_id in (select id from calendars where user_id = auth.uid())
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create default calendar on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into calendars (user_id, name, is_default)
  values (new.id, 'My Calendar', true);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Accept invitation when user signs up
create or replace function accept_pending_invitations()
returns trigger as $$
begin
  insert into calendar_shares (calendar_id, shared_with_user_id, permission)
  select calendar_id, new.id, permission
  from share_invitations
  where invited_email = new.email and expires_at > now();

  delete from share_invitations where invited_email = new.email;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_user_created_accept_invites on auth.users;
create trigger on_user_created_accept_invites
  after insert on auth.users
  for each row execute function accept_pending_invitations();

-- Update timestamp function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
drop trigger if exists update_calendars_updated_at on calendars;
create trigger update_calendars_updated_at
  before update on calendars
  for each row execute function update_updated_at();

drop trigger if exists update_events_updated_at on events;
create trigger update_events_updated_at
  before update on events
  for each row execute function update_updated_at();

-- ============================================
-- OPTIONAL: Enable Realtime
-- ============================================

-- Uncomment these lines if you want real-time updates
-- alter publication supabase_realtime add table calendars;
-- alter publication supabase_realtime add table events;
-- alter publication supabase_realtime add table calendar_shares;
