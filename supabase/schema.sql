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

-- Canonical Fuzzy CRM schema based on the spreadsheet workflow:
-- Clients -> Events -> Team Members -> Editing Tasks -> Deliverables.
-- This MVP is public/no-login, so RLS policies allow anon access.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  client_number integer unique,
  host_name text not null,
  contact_no text,
  email text,
  event_type text,
  event_date date,
  quoted_hours numeric(10,2) default 0,
  quoted_price numeric(12,2) default 0,
  no_of_events integer default 0,
  city text,
  total_price numeric(12,2) default 0,
  advance_paid numeric(12,2) default 0,
  balance_due numeric(12,2) default 0,
  deliverables_summary text,
  data_backup text,
  status text not null default 'Inquiry' check (status in ('Inquiry', 'Pending', 'Waiting For Event Date', 'Confirmed', 'Completed', 'Cancelled')),
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration compatibility from older MVP column names.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'name')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'host_name') then
    alter table public.clients rename column name to host_name;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'phone')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'contact_no') then
    alter table public.clients rename column phone to contact_no;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'deliverables')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'deliverables_summary') then
    alter table public.clients rename column deliverables to deliverables_summary;
  end if;
end $$;
alter table public.clients add column if not exists client_number integer;
alter table public.clients add column if not exists contact_no text;
alter table public.clients add column if not exists email text;
alter table public.clients add column if not exists event_type text;
alter table public.clients add column if not exists event_date date;
alter table public.clients add column if not exists quoted_hours numeric(10,2) default 0;
alter table public.clients add column if not exists quoted_price numeric(12,2) default 0;
alter table public.clients add column if not exists no_of_events integer default 0;
alter table public.clients add column if not exists city text;
alter table public.clients add column if not exists total_price numeric(12,2) default 0;
alter table public.clients add column if not exists advance_paid numeric(12,2) default 0;
alter table public.clients add column if not exists balance_due numeric(12,2) default 0;
alter table public.clients add column if not exists deliverables_summary text;
alter table public.clients add column if not exists data_backup text;
alter table public.clients add column if not exists status text default 'Inquiry';
alter table public.clients add column if not exists address text;
alter table public.clients add column if not exists notes text;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'Shooter' check (role in ('Shooter', 'Editor', 'Both')),
  designation text,
  contact_no text,
  email text,
  specialty text,
  total_hours_worked numeric(10,2) default 0,
  payment_terms text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If the older MVP table exists, migrate its data/name to team_members.
do $$
begin
  if to_regclass('public.editors') is not null and to_regclass('public.team_members') is null then
    alter table public.editors rename to team_members;
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'team_members' and column_name = 'phone')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'team_members' and column_name = 'contact_no') then
    alter table public.team_members rename column phone to contact_no;
  end if;
end $$;
alter table public.team_members add column if not exists role text default 'Shooter';
alter table public.team_members add column if not exists designation text;
alter table public.team_members add column if not exists contact_no text;
alter table public.team_members add column if not exists email text;
alter table public.team_members add column if not exists specialty text;
alter table public.team_members add column if not exists total_hours_worked numeric(10,2) default 0;
alter table public.team_members add column if not exists payment_terms text;
alter table public.team_members add column if not exists notes text;

do $$
begin
  if to_regclass('public.editors') is not null then
    insert into public.team_members (name, role, designation, contact_no, email, specialty, total_hours_worked, payment_terms, notes, created_at, updated_at)
    select
      name,
      case when lower(coalesce(designation, '') || ' ' || coalesce(specialty, '')) like '%edit%' then 'Editor' else 'Shooter' end,
      designation,
      phone,
      email,
      specialty,
      total_hours_worked,
      payment_terms,
      notes,
      created_at,
      updated_at
    from public.editors
    where not exists (
      select 1 from public.team_members tm
      where lower(tm.name) = lower(public.editors.name)
    );
  end if;
end $$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  event_name text not null,
  event_type text,
  event_date date not null,
  start_time text,
  end_time text,
  location text,
  photo_shooter_id uuid references public.team_members(id) on delete set null,
  video_shooter_id uuid references public.team_members(id) on delete set null,
  requirement text,
  photo_data_uploaded text,
  video_data_uploaded text,
  total_hours numeric(10,2) default 0,
  status text not null default 'Booked' check (status in ('Booked', 'Shoot Completed', 'Editing', 'Delivered', 'Closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events alter column event_type drop not null;
alter table public.events alter column start_time type text using start_time::text;
alter table public.events alter column end_time type text using end_time::text;
alter table public.events add column if not exists photo_shooter_id uuid references public.team_members(id) on delete set null;
alter table public.events add column if not exists video_shooter_id uuid references public.team_members(id) on delete set null;
alter table public.events add column if not exists requirement text;
alter table public.events add column if not exists photo_data_uploaded text;
alter table public.events add column if not exists video_data_uploaded text;
alter table public.events add column if not exists total_hours numeric(10,2) default 0;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'events' and column_name = 'photo_shooter_assigned') then
    insert into public.team_members (name, role, designation)
    select distinct trim(photo_shooter_assigned), 'Shooter', 'Photo Shooter'
    from public.events
    where nullif(trim(photo_shooter_assigned), '') is not null
      and not exists (
        select 1 from public.team_members tm
        where lower(tm.name) = lower(trim(public.events.photo_shooter_assigned))
      );

    update public.events e
    set photo_shooter_id = tm.id
    from public.team_members tm
    where e.photo_shooter_id is null
      and nullif(trim(e.photo_shooter_assigned), '') is not null
      and lower(tm.name) = lower(trim(e.photo_shooter_assigned));
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'events' and column_name = 'video_shooter_assigned') then
    insert into public.team_members (name, role, designation)
    select distinct trim(video_shooter_assigned), 'Shooter', 'Video Shooter'
    from public.events
    where nullif(trim(video_shooter_assigned), '') is not null
      and not exists (
        select 1 from public.team_members tm
        where lower(tm.name) = lower(trim(public.events.video_shooter_assigned))
      );

    update public.events e
    set video_shooter_id = tm.id
    from public.team_members tm
    where e.video_shooter_id is null
      and nullif(trim(e.video_shooter_assigned), '') is not null
      and lower(tm.name) = lower(trim(e.video_shooter_assigned));
  end if;
end $$;

create table if not exists public.editing_tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  task_type text not null check (task_type in ('Photo Editing', 'Video Editing', 'Reel Editing', 'Album Design')),
  photo_editor_id uuid references public.team_members(id) on delete set null,
  video_editor_id uuid references public.team_members(id) on delete set null,
  assigned_date date,
  submitted_date date,
  expected_delivery_date date,
  delivery_date date,
  editor_payment numeric(12,2) default 0,
  source_file_link text,
  output_file_link text,
  status text not null default 'Not Assigned' check (status in ('Not Assigned', 'Assigned', 'In Progress', 'Submitted For Editing', 'Sent For Review', 'Changes Requested', 'Completed')),
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.editing_tasks add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.editing_tasks alter column event_id drop not null;
alter table public.editing_tasks add column if not exists photo_editor_id uuid references public.team_members(id) on delete set null;
alter table public.editing_tasks add column if not exists video_editor_id uuid references public.team_members(id) on delete set null;
alter table public.editing_tasks add column if not exists submitted_date date;
alter table public.editing_tasks add column if not exists delivery_date date;
alter table public.editing_tasks drop constraint if exists editing_tasks_status_check;
alter table public.editing_tasks add constraint editing_tasks_status_check
  check (status in ('Not Assigned', 'Assigned', 'In Progress', 'Submitted For Editing', 'Sent For Review', 'Changes Requested', 'Completed'));

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'editing_tasks' and column_name = 'photo_editor_assigned') then
    insert into public.team_members (name, role, designation)
    select distinct trim(photo_editor_assigned), 'Editor', 'Photo Editor'
    from public.editing_tasks
    where nullif(trim(photo_editor_assigned), '') is not null
      and not exists (
        select 1 from public.team_members tm
        where lower(tm.name) = lower(trim(public.editing_tasks.photo_editor_assigned))
      );

    update public.editing_tasks et
    set photo_editor_id = tm.id
    from public.team_members tm
    where et.photo_editor_id is null
      and nullif(trim(et.photo_editor_assigned), '') is not null
      and lower(tm.name) = lower(trim(et.photo_editor_assigned));
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'editing_tasks' and column_name = 'video_editor_assigned') then
    insert into public.team_members (name, role, designation)
    select distinct trim(video_editor_assigned), 'Editor', 'Video Editor'
    from public.editing_tasks
    where nullif(trim(video_editor_assigned), '') is not null
      and not exists (
        select 1 from public.team_members tm
        where lower(tm.name) = lower(trim(public.editing_tasks.video_editor_assigned))
      );

    update public.editing_tasks et
    set video_editor_id = tm.id
    from public.team_members tm
    where et.video_editor_id is null
      and nullif(trim(et.video_editor_assigned), '') is not null
      and lower(tm.name) = lower(trim(et.video_editor_assigned));
  end if;
end $$;

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  deliverable_type text not null check (deliverable_type in ('Raw Photos', 'Edited Photos', 'Highlight Video', 'Full Video', 'Reel', 'Album', 'YouTube Thumbnail', 'Other')),
  description text,
  due_date date,
  delivery_link text,
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Delivered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deliverables add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.deliverables alter column event_id drop not null;

create index if not exists idx_clients_status on public.clients(status);
create index if not exists idx_clients_event_date on public.clients(event_date);
create index if not exists idx_events_client_id on public.events(client_id);
create index if not exists idx_events_event_date on public.events(event_date);
create index if not exists idx_events_photo_shooter_id on public.events(photo_shooter_id);
create index if not exists idx_events_video_shooter_id on public.events(video_shooter_id);
create index if not exists idx_team_members_role on public.team_members(role);
create index if not exists idx_deliverables_client_id on public.deliverables(client_id);
create index if not exists idx_deliverables_event_id on public.deliverables(event_id);
create index if not exists idx_editing_tasks_client_id on public.editing_tasks(client_id);
create index if not exists idx_editing_tasks_event_id on public.editing_tasks(event_id);
create index if not exists idx_editing_tasks_photo_editor_id on public.editing_tasks(photo_editor_id);
create index if not exists idx_editing_tasks_video_editor_id on public.editing_tasks(video_editor_id);

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at before update on public.clients for each row execute function public.set_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at before update on public.events for each row execute function public.set_updated_at();

drop trigger if exists set_team_members_updated_at on public.team_members;
create trigger set_team_members_updated_at before update on public.team_members for each row execute function public.set_updated_at();

drop trigger if exists set_deliverables_updated_at on public.deliverables;
create trigger set_deliverables_updated_at before update on public.deliverables for each row execute function public.set_updated_at();

drop trigger if exists set_editing_tasks_updated_at on public.editing_tasks;
create trigger set_editing_tasks_updated_at before update on public.editing_tasks for each row execute function public.set_updated_at();

alter table public.clients enable row level security;
alter table public.events enable row level security;
alter table public.team_members enable row level security;
alter table public.deliverables enable row level security;
alter table public.editing_tasks enable row level security;

drop policy if exists "Public portal manages clients" on public.clients;
drop policy if exists "Public portal manages events" on public.events;
drop policy if exists "Public portal manages team members" on public.team_members;
drop policy if exists "Public portal manages deliverables" on public.deliverables;
drop policy if exists "Public portal manages editing tasks" on public.editing_tasks;

create policy "Public portal manages clients" on public.clients
  for all to anon, authenticated
  using (true)
  with check (true);

create policy "Public portal manages events" on public.events
  for all to anon, authenticated
  using (true)
  with check (true);

create policy "Public portal manages team members" on public.team_members
  for all to anon, authenticated
  using (true)
  with check (true);

create policy "Public portal manages deliverables" on public.deliverables
  for all to anon, authenticated
  using (true)
  with check (true);

create policy "Public portal manages editing tasks" on public.editing_tasks
  for all to anon, authenticated
  using (true)
  with check (true);
