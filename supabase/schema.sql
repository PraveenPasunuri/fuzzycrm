create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Drop old tables if you want fresh schema
drop table if exists public.editing_tasks cascade;
drop table if exists public.deliverables cascade;
drop table if exists public.events cascade;
drop table if exists public.team_members cascade;
drop table if exists public.clients cascade;

drop sequence if exists public.clients_client_number_seq;
create sequence public.clients_client_number_seq start 1001;

-- =========================
-- CLIENTS
-- =========================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  client_number integer unique not null default nextval('public.clients_client_number_seq'),

  host_name text,
  contact_no text,
  email text,

  event_type text,
  event_date date,
  quoted_hours numeric(10,2),
  quoted_price numeric(12,2),
  no_of_events integer,

  city text,
  total_price numeric(12,2),
  advance_paid numeric(12,2),
  balance_due numeric(12,2),

  deliverables_summary text,
  data_backup text,

  status text check (
    status is null or status in (
      'Inquiry',
      'Pending',
      'Waiting For Event Date',
      'Confirmed',
      'Completed',
      'Cancelled'
    )
  ),

  address text,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- TEAM MEMBERS
-- =========================
create table public.team_members (
  id uuid primary key default gen_random_uuid(),

  name text,
  role text check (
    role is null or role in (
      'Photo',
      'Video',
      'Reel Maker',
      'Photo Editor',
      'Video Editor',
      'Reel Editor',
      'Shooter',
      'Editor',
      'Both'
    )
  ),

  designation text,
  contact_no text,
  alternate_contact_no text,
  email text,
  specialty text,

  total_hours_worked numeric(10,2),
  google_calendar_link text,
  payment_terms text,
  last_amount_paid numeric(12,2),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- EVENTS
-- =========================
create table public.events (
  id uuid primary key default gen_random_uuid(),

  client_id uuid references public.clients(id) on delete cascade,

  event_name text,
  event_type text,
  event_date date,

  start_time text,
  end_time text,
  location text,

  photo_shooter_id uuid references public.team_members(id) on delete set null,
  video_shooter_id uuid references public.team_members(id) on delete set null,

  requirement text,
  photo_data_uploaded text,
  video_data_uploaded text,

  total_initial_hours numeric(10,2),
  extra_hours numeric(10,2),
  total_hours numeric(10,2),

  status text check (
    status is null or status in (
      'Booked',
      'Shoot Completed',
      'Editing',
      'Delivered',
      'Closed',
      'Cancelled'
    )
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- DELIVERABLES
-- =========================
create table public.deliverables (
  id uuid primary key default gen_random_uuid(),

  client_id uuid references public.clients(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,

  deliverable_type text check (
    deliverable_type is null or deliverable_type in (
      'Raw Photos',
      'Edited Photos',
      'Highlight Video',
      'Full Video',
      'Reel',
      'Album',
      'YouTube Thumbnail',
      'Other'
    )
  ),

  description text,
  due_date date,
  delivery_link text,

  status text check (
    status is null or status in (
      'Pending',
      'In Progress',
      'Delivered'
    )
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- EDITING TASKS
-- =========================
create table public.editing_tasks (
  id uuid primary key default gen_random_uuid(),

  client_id uuid references public.clients(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,

  task_type text check (
    task_type is null or task_type in (
      'Photo Editing',
      'Video Editing',
      'Reel Editing',
      'Album Design'
    )
  ),

  photo_editor_id uuid references public.team_members(id) on delete set null,
  video_editor_id uuid references public.team_members(id) on delete set null,

  assigned_date date,
  submitted_date date,
  expected_delivery_date date,
  delivery_date date,

  editor_payment numeric(12,2),

  source_file_link text,
  output_file_link text,

  status text check (
    status is null or status in (
      'Not Assigned',
      'Assigned',
      'In Progress',
      'Submitted For Editing',
      'Sent For Review',
      'Changes Requested',
      'Completed'
    )
  ),

  review_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- INDEXES
-- =========================
create index idx_clients_status on public.clients(status);
create index idx_clients_event_date on public.clients(event_date);
create index idx_clients_host_name on public.clients(host_name);

create index idx_team_members_role on public.team_members(role);
create index idx_team_members_name on public.team_members(name);

create index idx_events_client_id on public.events(client_id);
create index idx_events_event_date on public.events(event_date);
create index idx_events_status on public.events(status);
create index idx_events_photo_shooter_id on public.events(photo_shooter_id);
create index idx_events_video_shooter_id on public.events(video_shooter_id);

create index idx_deliverables_client_id on public.deliverables(client_id);
create index idx_deliverables_event_id on public.deliverables(event_id);
create index idx_deliverables_status on public.deliverables(status);

create index idx_editing_tasks_client_id on public.editing_tasks(client_id);
create index idx_editing_tasks_event_id on public.editing_tasks(event_id);
create index idx_editing_tasks_photo_editor_id on public.editing_tasks(photo_editor_id);
create index idx_editing_tasks_video_editor_id on public.editing_tasks(video_editor_id);
create index idx_editing_tasks_status on public.editing_tasks(status);

-- =========================
-- UPDATED_AT TRIGGERS
-- =========================
create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create trigger set_team_members_updated_at
before update on public.team_members
for each row execute function public.set_updated_at();

create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger set_deliverables_updated_at
before update on public.deliverables
for each row execute function public.set_updated_at();

create trigger set_editing_tasks_updated_at
before update on public.editing_tasks
for each row execute function public.set_updated_at();

-- =========================
-- RLS FOR PUBLIC MVP
-- =========================
alter table public.clients enable row level security;
alter table public.team_members enable row level security;
alter table public.events enable row level security;
alter table public.deliverables enable row level security;
alter table public.editing_tasks enable row level security;

create policy "Public portal manages clients"
on public.clients for all to anon, authenticated
using (true) with check (true);

create policy "Public portal manages team members"
on public.team_members for all to anon, authenticated
using (true) with check (true);

create policy "Public portal manages events"
on public.events for all to anon, authenticated
using (true) with check (true);

create policy "Public portal manages deliverables"
on public.deliverables for all to anon, authenticated
using (true) with check (true);

create policy "Public portal manages editing tasks"
on public.editing_tasks for all to anon, authenticated
using (true) with check (true);