# Photography Admin Portal

A practical full-stack MVP for a photography business. It tracks clients, event schedules, payments, deliverables, outsourced editors, editing tasks, and reports in a single Next.js App Router repo.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and Postgres
- Deployable to Vercel

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project.

3. In Supabase SQL Editor, run:

```sql
-- Paste the contents of supabase/schema.sql
```

4. Create the default super user by running:

```sql
-- Paste the contents of supabase/seed-superuser.sql
```

Default login:

```text
Username: praveen
Password: Admin123
```

5. To add another admin manually, create a Supabase Auth user and add that auth user to `public.admin_users`:

```sql
insert into public.admin_users (user_id, email)
values ('AUTH_USER_ID_FROM_SUPABASE', 'admin@example.com');
```

6. Copy the environment example:

```bash
cp .env.local.example .env.local
```

7. Fill in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ADMIN_EMAIL=praveen@fuzzycrm.local
NEXT_PUBLIC_SUPER_USER_EMAIL=praveen@fuzzycrm.local
```

8. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- Admin login via Supabase email/password auth
- Default super-user username `praveen`
- Email/password signup with Supabase email confirmation
- Protected dashboard routes with unauthenticated redirect to `/login`
- Optional `ADMIN_EMAIL` middleware check
- Dashboard summary cards, recent events, and overdue payments/deliverables
- CRUD modules for clients, events, payments, deliverables, editors, and editing tasks
- Search, status filters, validation, status badges, delete confirmation, and empty states
- Reports for monthly revenue, pending balance, editor payments due, completed events, and pending deliverables
- Google Drive or delivery links are stored as URLs; no large media upload flow is included

## Vercel Deployment

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add these environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_EMAIL`
   - `NEXT_PUBLIC_SUPER_USER_EMAIL`
4. Deploy.

## Notes

RLS is enforced by `public.admin_users`. The app also supports a belt-and-suspenders `ADMIN_EMAIL` check in middleware. For multiple admins, leave `ADMIN_EMAIL` blank and add each Supabase auth user to `public.admin_users`.
