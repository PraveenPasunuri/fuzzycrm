# Photography Admin Portal

A practical full-stack MVP for a photography business. It tracks clients, event schedules, quote/payment totals, deliverables, shooters, editors, and editing assignments in a single Next.js App Router repo.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres
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

4. Copy the environment example:

```bash
cp .env.local.example .env.local
```

5. Fill in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

6. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- Public admin workspace without a login gate
- Dashboard tiles for total clients, pending clients, upcoming events, unassigned editing, pending deliverables, and delivered work
- CRUD modules for clients, events, deliverables, team members, and editing tasks
- Client records include quoted hours, quoted price, total price, advance paid, and balance due
- Event tiles grouped by host with photo/video shooter assignment and WhatsApp confirmation links
- Search, status filters, validation, status badges, delete confirmation, and empty states
- Reports for monthly revenue, pending balance, editor payments due, completed events, and pending deliverables
- Google Drive or delivery links are stored as URLs; no large media upload flow is included

## Vercel Deployment

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add these environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

## Notes

The app is currently configured as a public admin workspace. Supabase Row Level Security policies in `supabase/schema.sql` allow anonymous users to manage the MVP tables. Put the app behind Vercel protection or restore auth before using it for private business data.
