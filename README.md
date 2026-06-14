# Photography Admin Portal

A professional, Trello-style admin portal for running a photography studio. It manages the full lifecycle of a job — from a client inquiry, through the shoot, data handoff, cataloging, editing, and final delivery to the client — in a single Next.js App Router repo.

This is an **admin-only portal**: there is no client-facing login. One workspace, used by the studio owner/admin to run the business.

## Stack

- Next.js 14 (App Router) + React 18
- TypeScript
- Tailwind CSS (custom design system)
- Supabase Postgres (with a zero-config local JSON fallback for development)
- `lucide-react` icons, `zod` validation
- Deployable to Vercel

## Who uses it & why

The portal is built around how a photography studio actually operates:

1. A **client** inquires and books one or more **events** (e.g. Haldi, Wedding, Reception).
2. **Shooters** (photo/video) are assigned and the events are shot.
3. After the shoot, raw **data** is handed off, **catalogs** are created, and **editors** are assigned.
4. Once editing is done, **deliverables** (edited photos, highlight video, reel, album) are delivered to the client.
5. Money (quotes, advances, balances, editor payments) and **team** workload are tracked throughout.

## Application flow

```
 Client Inquiry / Booking
          │
          ▼
   ┌──────────────┐     assign shooters,      ┌──────────────────┐
   │   CLIENTS    │────▶ schedule, shoot ─────▶│      EVENTS      │
   │  (quotes,    │                            │  (kanban board:  │
   │  payments)   │                            │  Booked → Shoot  │
   └──────────────┘                            │  Completed → …)  │
                                               └────────┬─────────┘
                          status = "Shoot Completed"    │
                                                         ▼
                                          ┌──────────────────────────┐
                                          │     DATA MANAGEMENT       │
                                          │  Per-event tracking bar:  │
                                          │                           │
                                          │  PHOTO: Data ▸ Catalog ▸  │
                                          │         Editor ▸ Editing  │
                                          │  VIDEO: Data ▸ Catalog ▸  │
                                          │         Editor ▸ Editing  │
                                          │  SHARED: Delivered ▸      │
                                          │          Changes ▸ Closed │
                                          └────────────┬──────────────┘
                                                        │ feeds
                            ┌───────────────────────────┼───────────────────────────┐
                            ▼                            ▼                           ▼
                   ┌────────────────┐         ┌────────────────────┐       ┌────────────────┐
                   │ EDITING TASKS  │         │   DELIVERABLES     │       │     TEAM       │
                   │ (kanban board) │         │  (kanban board)    │       │ shooters/editors│
                   └────────────────┘         └────────────────────┘       └────────────────┘
                            └───────────────────────────┬───────────────────────────┘
                                                        ▼
                                               ┌────────────────┐
                                               │    REPORTS     │
                                               │  revenue, dues │
                                               └────────────────┘
```

## Modules

| Module | Purpose |
| --- | --- |
| **Dashboard** | At-a-glance KPI tiles (total clients, pending clients, upcoming events, unassigned editing, pending & delivered deliverables) with quick links into each board. |
| **Clients** | Client records with contact details, celebration/event type, quoted hours & price, auto-computed total and balance due, advance paid, deliverables summary, backup notes, and status. |
| **Events** | Each booking's events. Trello-style **kanban board** (Booked → Shoot Completed → Editing → Delivered → Closed) with drag-and-drop status changes, plus a grouped-by-host card view and WhatsApp confirmation links to shooters. |
| **Data Management** | The post-shoot pipeline. See below. |
| **Deliverables** | Files & final delivery links per event (Raw Photos, Edited Photos, Highlight/Full Video, Reel, Album, etc.) on a kanban board (Pending → In Progress → Delivered). |
| **Editing Tasks** | Editing assignments with editors, dates, payments, source/output links, and review notes on a kanban board through the editing lifecycle. |
| **Team** | Shooters and editors, their roles/specialties, contact info, payment terms, hours worked, and the projects currently assigned to each. |
| **Reports** | Monthly revenue, pending balance, editor payments due, completed events, and pending deliverables. |

## Data Management pipeline

Once an event is marked **Shoot Completed** on the Events board, it automatically appears in **Data Management**. Each event tile carries a colorful, Domino's-style **tracking bar** so the admin can see exactly where the job is at a glance.

There are two parallel tracks plus a shared delivery tail:

- **Photo track:** Data received → Catalog created (paste link/location) → Editor assigned → Editing done
- **Video track:** Data received → Catalog created (paste link/location) → Editor assigned → Editing done
- **Shared tail:** Delivered to client → Changes requested → Closed

Each stage is an interactive dot on the tracking bar:

- **Toggle stages** (data received, editing done, delivered, changes, closed) flip done/not-done with a click.
- **Catalog stages** open an inline field to paste the catalog link or storage location.
- **Editor stages** open an inline picker to assign a photo/video editor from the team.

Advancing stages keeps the event's coarse status in sync with the Events board (e.g. assigning an editor moves the event to **Editing**; marking delivered moves it to **Delivered**; closing the pipeline moves it to **Closed**), so the kanban and the pipeline never drift apart.

The tracking state is stored as dedicated columns on the `events` table (`photo_data_received`, `photo_catalog_link`, `photo_editor_id`, `photo_editing_completed`, the matching `video_*` columns, and `delivered_to_client`, `changes_requested`, `pipeline_closed`).

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. (Optional) Create a Supabase project and, in the SQL Editor, run the contents of [`supabase/schema.sql`](supabase/schema.sql).

3. For Supabase-backed data, copy the environment example and fill it in:

```bash
cp .env.local.example .env.local
```

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

If you skip `.env.local`, the app uses a **local JSON development database** at `data/local-db.json`. It is created automatically with demo records (including a couple of shoot-completed events so the Data Management pipeline has content) and is ignored by git.

4. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Schema migrations

[`supabase/schema.sql`](supabase/schema.sql) is the full schema and is safe to re-run. For databases that predate the Data Management pipeline, the bottom of the file contains idempotent `alter table ... add column if not exists ...` statements that add the new tracking columns without dropping data — paste and run just that block on an existing project.

## Vercel Deployment

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add these environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

## Notes

The app is configured as a public admin workspace. The Supabase Row Level Security policies in `supabase/schema.sql` allow anonymous users to manage the MVP tables. **Put the app behind Vercel protection (or restore auth) before using it for private business data.** Google Drive / delivery / catalog links are stored as URLs; there is no large media upload flow.
