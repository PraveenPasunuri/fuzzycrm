-- Run this after supabase/schema.sql to create the default super user.
-- Login in the app with:
--   username: praveen
--   password: Admin123
--
-- Internally, Supabase Auth uses an email address. The login form maps
-- username "praveen" to praveen@fuzzycrm.local by default.

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
)
values (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'praveen@fuzzycrm.local',
  crypt('Admin123', gen_salt('bf')),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"praveen"}'::jsonb,
  false,
  now(),
  now()
)
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"praveen@fuzzycrm.local","email_verified":true,"phone_verified":false}'::jsonb,
  'email',
  'praveen@fuzzycrm.local',
  now(),
  now(),
  now()
)
on conflict (provider, provider_id) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.admin_users (user_id, email)
values ('11111111-1111-1111-1111-111111111111', 'praveen@fuzzycrm.local')
on conflict (user_id) do update
set email = excluded.email;
