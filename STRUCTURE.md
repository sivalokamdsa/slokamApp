# Project Structure

This is a guide to how the FDE Prep Tracker is organised. The tech choices and feature plan are in `CLAUDE.md`.

## The big picture

The app is one Next.js project with two halves:

- **Frontend (what you see):** React pages under `app/` that run in the browser. They fetch and change data through the API.
- **Backend (API routes):** files under `app/api/` that run on the server. They read and write the SQLite database through Prisma.

```
Browser page (app/todos/page.tsx)
      │  fetch("/api/todos")  via lib/api-client.ts
      ▼
API route (app/api/todos/route.ts)
      │  validate input with lib/validation.ts
      ▼
Prisma client (lib/db.ts)
      │
      ▼
SQLite file (dev.db), schema in prisma/schema.prisma
```

## Folder tree

```
SlokamApp/
├── CLAUDE.md              # Tech stack and feature plan (the requirements)
├── STRUCTURE.md           # This file
├── AGENTS.md              # Notes written by Next.js for AI tools (leave as is)
├── README.md              # Default Next.js readme
├── package.json           # Dependencies and npm scripts
├── tsconfig.json          # TypeScript settings; "@/..." maps to the project root
├── eslint.config.mjs      # Linting rules
├── next.config.ts         # Next.js settings (empty for now)
├── .env                   # DATABASE_URL="file:./dev.db" (not committed to git)
├── prisma/
│   ├── schema.prisma      # Database tables and their fields
│   └── dev.db             # The SQLite database file (created by `prisma db push`)
├── app/                   # Pages and API routes (App Router)
│   ├── layout.tsx         # Wraps every page: HTML shell, providers, nav
│   ├── globals.css        # Global styles, colour tokens, light/dark themes
│   ├── page.tsx           # "/" Dashboard with statistics and charts
│   ├── todos/page.tsx     # "/todos" To-do lists and tasks
│   ├── archive/page.tsx   # "/archive" Archived lists
│   ├── plan/page.tsx      # "/plan" FDE preparation topics
│   ├── logs/page.tsx      # "/logs" Daily study logs and calendar
│   └── api/               # Backend endpoints (no UI)
│       ├── lists/route.ts            # GET all lists, POST new list
│       ├── lists/[id]/route.ts       # GET / PATCH / DELETE one list
│       ├── todos/route.ts            # POST new to-do
│       ├── todos/[id]/route.ts       # PATCH / DELETE one to-do
│       ├── plan-topics/route.ts      # GET all topics, POST new topic
│       ├── plan-topics/[id]/route.ts # PATCH / DELETE one topic
│       ├── logs/route.ts             # GET logs (filter by date), POST new log
│       ├── logs/[id]/route.ts        # PATCH / DELETE one log
│       └── stats/route.ts            # GET computed statistics
├── components/            # Reusable React pieces
│   ├── providers.tsx      # Sets up TanStack Query (data caching)
│   ├── nav.tsx            # Top navigation bar
│   ├── ui.tsx             # Small building blocks: Card, Button, Input, ProgressBar, Stat…
│   └── dashboard-charts.tsx # Recharts charts used on the dashboard
├── lib/                   # Shared logic, not tied to one page
│   ├── db.ts              # Single Prisma client instance
│   ├── dates.ts           # Date helpers and streak calculation
│   ├── validation.ts      # Zod schemas that check request bodies
│   ├── api-response.ts    # Helpers for error and JSON responses on the server
│   ├── api-client.ts      # fetch wrapper used by the browser
│   ├── stats.ts           # Builds all statistics from the database
│   └── types.ts           # TypeScript types shared by frontend code
└── public/                # Static files (default Next.js icons; not used)
```

## What each layer does

### 1. Database (`prisma/schema.prisma`)

Defines five data models. A "model" is a table.

| Model       | Holds                                                                     |
| ----------- | ------------------------------------------------------------------------- |
| `TodoList`  | A list of tasks, with an `archived` flag and `archivedAt` date            |
| `Todo`      | One task: title, `status` (open/done), `dueDate`, `completedAt`, `listId` |
| `PlanTopic` | One FDE topic: topic, category, target date, status                       |
| `DailyLog`  | One study day: date, hours, notes, mood, energy, linked topics            |

`DailyLog` and `PlanTopic` form a many-to-many link (one log can cover several topics, and a topic can appear in many logs). Prisma creates the join table for you.

Dates are stored as text like `"2026-10-30"` on purpose. This avoids timezone shifts that can move a date by a day.

Status fields are plain strings, not enums, because SQLite handles them simply. Allowed values are checked in `lib/validation.ts`.

### 2. Shared library (`lib/`)

| File              | Purpose                                                                                                      | Used by                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------- |
| `db.ts`           | Creates one `PrismaClient`. Reuses it during dev hot reloads so you don't open many connections.             | All API routes, `stats.ts` |
| `validation.ts`   | Zod schemas for every create/update body, plus `parseBody` and `parseId`.                                    | API routes                 |
| `api-response.ts` | `badRequest`, `notFound`, `serverError` and `readJson` helpers.                                              | API routes                 |
| `dates.ts`        | `todayString`, `addDays`, `lastNDays`, `currentStreak`.                                                      | `stats.ts`, pages          |
| `stats.ts`        | `computeStats()` does all the maths: completion %, per-day counts, per-category progress, hours, and streak. | `app/api/stats/route.ts`   |
| `api-client.ts`   | `api`, `post`, `patch`, `del`. Thin wrappers around `fetch` that throw readable errors.                      | Client pages               |
| `types.ts`        | Shapes of the data coming back from the API (e.g. `TodoList`, `Stats`).                                      | Client pages and charts    |

### 3. API routes (`app/api/`)

Each `route.ts` file exports functions named after HTTP methods (`GET`, `POST`, `PATCH`, `DELETE`). Every handler follows the same pattern:

1. Read the id from the URL (`parseId`) or the body (`readJson`).
2. Validate the body with a zod schema (`parseBody`). Return 400 if invalid.
3. Run the Prisma query.
4. Return JSON, or 404 if the record doesn't exist.

Some business rules live here:

- Marking a to-do or plan topic **done** sets `completedAt`. Reopening clears it. The statistics depend on this timestamp.
- Archiving a list sets `archivedAt`. You can't add to-dos to an archived list.
- Routes that return live data export `dynamic = "force-dynamic"`, so Next.js never serves a cached response.

In Next.js 16, the `params` argument is a Promise, so handlers write `const { id } = await ctx.params`.

### 4. Pages (`app/*/page.tsx`)

Each page is a client component (`"use client"` at the top) that:

- Loads data with `useQuery` (TanStack Query), which caches results and handles loading and error states.
- Changes data with `useMutation`, then calls `qc.invalidateQueries()` to refetch. This keeps the UI in sync with the database.

The to-do page sends all its requests through `api-client.ts`. The dashboard calls `fetch("/api/stats")` directly.

### 5. Components (`components/`)

- `providers.tsx` wraps the whole app in `QueryClientProvider`. It is mounted in `app/layout.tsx`.
- `nav.tsx` highlights the current page using `usePathname`.
- `ui.tsx` contains styled primitives (`Card`, `Button`, `Input`, `Select`, `ProgressBar`, `Stat`, `ErrorText`). Restyle the app here and every page changes.
- `dashboard-charts.tsx` holds the three Recharts components. The dashboard loads them with `dynamic(..., { ssr: false })`, because Recharts needs the browser.

### 6. Styling (`app/globals.css`)

Colours are CSS variables such as `--background`, `--card`, `--accent`. They switch automatically for dark mode (based on the operating system setting or `data-theme="dark"`). Tailwind classes like `bg-card` and `text-muted` read these variables.

## How data flows: example "tick off a to-do"

1. You tick a checkbox in `app/todos/page.tsx`. It calls `toggle.mutate({ id, status: "done" })`.
2. `api-client.ts` sends `PATCH /api/todos/12` with `{"status":"done"}`.
3. `app/api/todos/[id]/route.ts` validates the body and sets `status` and `completedAt`.
4. Prisma updates the row in `dev.db`.
5. The mutation succeeds, and `invalidateQueries()` refetches `/api/lists` and `/api/stats`.
6. The list progress bar and the dashboard chart update.

## Where to change things

| I want to...                | Edit                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------- |
| Add a field to a table      | `prisma/schema.prisma`, then run `npx prisma db push`                                   |
| Change what the API accepts | `lib/validation.ts` and the matching route                                              |
| Add a new statistic         | `lib/stats.ts` (add it to the returned object), then `lib/types.ts`, then the dashboard |
| Add a new page              | New folder under `app/` with a `page.tsx`, then a link in `components/nav.tsx`          |
| Add a new endpoint          | New `route.ts` under `app/api/` using the same pattern as the others                    |
| Change colours or the look  | `app/globals.css` and `components/ui.tsx`                                               |
| Switch to PostgreSQL later  | `provider` and `url` in `prisma/schema.prisma`, plus `DATABASE_URL` in `.env`           |

## Commands

```bash
npm install            # install dependencies
npx prisma db push     # create or update dev.db from schema.prisma
npx prisma generate    # regenerate the typed Prisma client after schema changes
npm run dev            # start the dev server at http://localhost:3000
npm run build          # production build (checks types and pages)
npm run lint           # lint the code
```

## Things not built yet..

- Login. The app assumes one local user.
- Per-plan-topic history in the calendar (the calendar shows hours only).
- Automated tests.
- Git initialisation and a GitHub remote.
