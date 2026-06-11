create extension if not exists "pgcrypto";

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  event_name text not null,
  event_type text not null,
  event_date date not null,
  start_time time,
  end_time time,
  location text,
  package_name text,
  total_amount numeric(12,2) not null default 0,
  status text not null default 'Booked' check (status in ('Booked', 'Shoot Completed', 'Editing', 'Delivered', 'Closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  total_amount numeric(12,2) not null default 0,
  advance_paid numeric(12,2) not null default 0,
  balance_amount numeric(12,2) not null default 0,
  payment_due_date date,
  payment_status text not null default 'Not Paid' check (payment_status in ('Not Paid', 'Advance Paid', 'Partially Paid', 'Fully Paid')),
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  deliverable_type text not null check (deliverable_type in ('Raw Photos', 'Edited Photos', 'Highlight Video', 'Full Video', 'Reel', 'Album', 'YouTube Thumbnail')),
  description text,
  due_date date,
  delivery_link text,
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Delivered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.editors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  specialty text,
  payment_terms text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.editing_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  editor_id uuid references public.editors(id) on delete set null,
  task_type text not null check (task_type in ('Photo Editing', 'Video Editing', 'Reel Editing', 'Album Design')),
  assigned_date date,
  expected_delivery_date date,
  editor_payment numeric(12,2) not null default 0,
  source_file_link text,
  output_file_link text,
  status text not null default 'Not Assigned' check (status in ('Not Assigned', 'Assigned', 'In Progress', 'Sent For Review', 'Changes Requested', 'Completed')),
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_events_client_id on public.events(client_id);
create index if not exists idx_events_event_date on public.events(event_date);
create index if not exists idx_payments_event_id on public.payments(event_id);
create index if not exists idx_payments_due_date on public.payments(payment_due_date);
create index if not exists idx_deliverables_event_id on public.deliverables(event_id);
create index if not exists idx_deliverables_due_date on public.deliverables(due_date);
create index if not exists idx_editing_tasks_event_id on public.editing_tasks(event_id);
create index if not exists idx_editing_tasks_editor_id on public.editing_tasks(editor_id);

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at before update on public.clients for each row execute function public.set_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at before update on public.events for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at before update on public.payments for each row execute function public.set_updated_at();

drop trigger if exists set_deliverables_updated_at on public.deliverables;
create trigger set_deliverables_updated_at before update on public.deliverables for each row execute function public.set_updated_at();

drop trigger if exists set_editors_updated_at on public.editors;
create trigger set_editors_updated_at before update on public.editors for each row execute function public.set_updated_at();

drop trigger if exists set_editing_tasks_updated_at on public.editing_tasks;
create trigger set_editing_tasks_updated_at before update on public.editing_tasks for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.clients enable row level security;
alter table public.events enable row level security;
alter table public.payments enable row level security;
alter table public.deliverables enable row level security;
alter table public.editors enable row level security;
alter table public.editing_tasks enable row level security;

drop policy if exists "Admins can read admin users" on public.admin_users;
drop policy if exists "Admins manage clients" on public.clients;
drop policy if exists "Admins manage events" on public.events;
drop policy if exists "Admins manage payments" on public.payments;
drop policy if exists "Admins manage deliverables" on public.deliverables;
drop policy if exists "Admins manage editors" on public.editors;
drop policy if exists "Admins manage editing tasks" on public.editing_tasks;

create policy "Admins can read admin users" on public.admin_users
  for select to authenticated
  using (public.is_admin());

create policy "Admins manage clients" on public.clients
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage events" on public.events
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage payments" on public.payments
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage deliverables" on public.deliverables
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage editors" on public.editors
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage editing tasks" on public.editing_tasks
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- After creating an auth user in Supabase Auth, add them as an admin:
-- insert into public.admin_users (user_id, email)
-- values ('00000000-0000-0000-0000-000000000000', 'admin@example.com');
