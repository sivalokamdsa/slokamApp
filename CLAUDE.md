# Tech Stack for the FDE Preparation Tracker App

## Recommended Tech Stack

| Layer               | Recommendation                                                    | Why it fits                                                                  |
| ------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Language            | TypeScript                                                        | Catches data-shape bugs in to-dos, logs, and stats early                     |
| Framework           | Next.js (React)                                                   | Frontend and backend API routes in one project, which keeps things simple    |
| Styling             | Tailwind CSS + shadcn/ui                                          | Fast, clean UI without much custom CSS                                       |
| Charts (statistics) | Recharts                                                          | Simple React charts for completion rates, streaks, and daily progress        |
| State management    | React state + TanStack Query                                      | Handles server data, caching, and optimistic updates for to-dos              |
| Backend / API       | Next.js Route Handlers (or Node + Express if you want separation) | Enough for CRUD, archiving, and stats endpoints                              |
| Database            | PostgreSQL (via Supabase or Neon)                                 | Relational data suits lists, tasks, logs, and archives; free tiers available |
| ORM                 | Prisma                                                            | Type-safe queries and easy migrations                                        |
| Authentication      | Supabase Auth or Clerk                                            | Only needed if you want login; can be skipped for a personal local app       |
| Hosting             | Vercel (app) + Supabase/Neon (DB)                                 | Free tier, zero-config deployment                                            |
| Version control     | GitHub                                                            | You already use it for your MERN project                                     |
| Testing (optional)  | Vitest + Playwright                                               | Unit tests for stats logic and end-to-end tests for the UI                   |

## How the Features Map to the Stack

| Feature               | Implementation approach                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| To-do list            | `todos` table (id, title, status, due date, list_id) with CRUD API routes                                              |
| Archive previous list | `lists` table with an `archived` flag or a `list_archive` snapshot table; archiving copies and closes the current list |
| Statistics            | SQL aggregations (completion %, tasks per day, streaks) computed on the server and charted with Recharts               |
| FDE preparation plan  | `plan_topics` table (topic, category, target date, status) linked to `daily_logs`                                      |
| Daily logs            | `daily_logs` table (date, topics studied, hours, notes, mood/energy if wanted) with a calendar view                    |
| Progress tracking     | Derived from plan topics and logs; shown as progress bars and a timeline                                               |

**Simpler alternative:** If you want the fastest start, use SQLite with Prisma and skip hosting and auth entirely. You can migrate to PostgreSQL later by changing one connection string.

## Cost Breakdown

| Component                        | Cost              | Notes                                                                                                                    |
| -------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| TypeScript, Next.js, React       | Free              | Open source                                                                                                              |
| Tailwind CSS, shadcn/ui          | Free              | Open source                                                                                                              |
| Recharts, TanStack Query         | Free              | Open source                                                                                                              |
| Prisma                           | Free              | Open source ORM; the paid Prisma Postgres/Accelerate tiers are optional                                                  |
| PostgreSQL via Supabase or Neon  | Free tier         | Enough for a personal app; limits apply on storage, compute, and inactivity pausing (Supabase pauses idle free projects) |
| Vercel hosting                   | Free (Hobby) tier | Hobby plan is for personal, non-commercial use; fine for your project                                                    |
| Clerk or Supabase Auth           | Free tier         | Only needed if you add login                                                                                             |
| GitHub                           | Free              | You already use it                                                                                                       |
| Vitest, Playwright               | Free              | Open source                                                                                                              |
| SQLite (the simpler alternative) | Free              | Runs locally, no account needed                                                                                          |

### Things That Could Cost Money

- **Custom domain:** roughly a few dollars to about ₹800–1,000 per year, depending on the registrar. Vercel gives you a free `*.vercel.app` URL instead.
- **Scaling beyond free tiers:** only relevant if many users or large data volumes appear, which is unlikely for a personal planner.
- **Commercial use of Vercel's Hobby plan:** if you later use the app for paid work or a company, you'd need the Pro plan (about $20/month per member).

**The cheapest path:** Next.js + SQLite + Prisma running locally, with GitHub for code. That costs nothing at all, and you can deploy later if you want access from your phone or other devices.
