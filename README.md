# School OS

A modular-monolith School Management Ecosystem for a single school, built on
Next.js (App Router) and Supabase Postgres. This is a from-scratch rebuild of
a legacy PHP/MySQL system (`School_V1.0`), designed against an approved
architecture blueprint rather than a line-for-line migration — see
[Architecture](#architecture--what-each-phase-built) below for what changed
and why.

## Tech stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Supabase**: Postgres, Auth, and (eventually) Storage — Postgres RLS is
  the actual authorization layer, not just the UI
- **Tailwind CSS** + hand-rolled shadcn-style UI primitives (`components/ui`)
- **React Hook Form** + **Zod** for every form and every Server Action boundary
- **Razorpay** (webhook + order creation) for online fee payment
- **Resend** for transactional email
- **Vitest** for unit tests — focused on the integrity-critical business
  rules (derived balances, state-machine transitions, signature
  verification), not UI snapshots

## Getting started

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then from
**Settings → API** grab the Project URL, anon key, and service role key.

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in the three Supabase values. Everything else in the file (Razorpay,
Resend, site URL) is optional — the app degrades gracefully without them;
only the corresponding feature (online payment, outbound email) is affected.

### 3. Install dependencies

```bash
npm install
```

### 4. Run the migrations

Apply everything in `supabase/migrations/` **in order** — later migrations
depend on functions and tables created by earlier ones (`has_permission()`,
`is_admin()`, `is_own_student()`, `teacher_assignments`, etc.). Either:

- Paste each file's contents into the Supabase Dashboard's **SQL Editor** and
  run them in filename order, or
- Use the Supabase CLI: `supabase link` then `supabase db push`.

Then run `supabase/seed.sql` the same way (copy/paste into the SQL Editor, or
`psql <connection-string> -f supabase/seed.sql`). It's idempotent — safe to
re-run any time after adding new migrations.

### 5. Create your first user and make them Super Admin

Supabase Auth users aren't created via SQL. In the Dashboard:
**Authentication → Users → Add user** (toggle "Auto Confirm User" so you
don't need SMTP configured yet). Then in the SQL Editor:

```sql
insert into public.user_roles (user_id, role_id)
select u.id, r.id
from auth.users u, public.roles r
where u.email = 'your-email@example.com'
  and r.key = 'super_admin'
on conflict do nothing;
```

### 6. Run it

```bash
npm run dev
```

Visit `/auth/login` and sign in. Admin/staff land in `/admin`, roles with
`portal_access` (student, parent) land in `/portal`.

## Testing

```bash
npm run test    # Vitest — unit tests for business logic
npm run lint     # ESLint
npx tsc --noEmit # Type check
npm run build    # Production build (also type-checks)
```

## Project structure

```
app/
├── (public)/     marketing site — home, about, academics, admissions, ...
├── admin/        staff/admin back office, one route per module
├── portal/       student/parent portal
├── api/          webhooks and the public enquiry form (anonymous writes)
└── auth/         login/logout

features/<module>/
├── repository.ts   raw Supabase queries, no business logic
├── service.ts       business rules (derived values, multi-step operations)
├── actions.ts        "use server" Server Actions — permission checks + Zod
└── components/       client components for that module

lib/
├── supabase/     client/server/admin/middleware Supabase clients
├── permissions/  the has_permission() wrapper every Server Action calls
├── razorpay/     order creation + webhook signature verification
└── email/        Resend wrapper

supabase/
├── migrations/   numbered, ordered, each one documents *why* not just *what*
└── seed.sql      permission catalog, roles, default role grants

types/          hand-written types matching each migration's schema exactly
validations/    Zod schemas — the single source of truth for input shape
tests/unit/     one test file per integrity-critical business rule
```

Every feature module follows the same `repository → service → actions →
components` layering — cross-module calls always go through another
module's exported `service`, never a raw query against its tables.

## Architecture — what each phase built

| Phase | Module | The integrity rule it introduced |
|---|---|---|
| 1 | Auth, RBAC, Academic Setup | Real permissions + Postgres RLS, not role-name string checks |
| 2 | Admissions, Students | `student_enrollments` — one row per student per year, so promotion can never overwrite history (the legacy system's #1 bug) |
| 3 | Academics, Attendance | `teacher_assignments` scopes homework/lesson-plan/attendance rights to what a teacher is actually assigned to teach |
| 4 | Exams & Results | `draft → submitted → approved → published → locked`, enforced by two Postgres functions; a trigger audits any edit made after publish and hard-blocks edits once locked |
| 5 | Fees & Finance | Invoice balance is never stored — always derived from the payment ledger; payments are append-only (voided, never deleted); Razorpay webhook is signature-verified and idempotent |
| 6 | Staff & Payroll | A stricter state machine than exams — once a payroll run passes `reviewed`, **nobody** can edit it directly, not even admins; corrections go through a `payroll_adjustments` ledger folded into the *next* run |
| 7 | Communication | Every send attempt (success or failure) is logged — nothing is a silent no-op |
| 8 | Student/Parent Portal | Ownership-based RLS (`is_own_student()`) added *additively* on top of every prior module's staff-permission policies |
| 9 | Public Website | The real `enquire.php` replacement — a Route Handler with a honeypot, writing through the service-role client since anonymous visitors have no RLS-gated insert path |
| 10 | Library, Hostel, Transport, Inventory | Same "derive, don't trust a cached number" discipline applied to stock levels and room occupancy |

## Known gaps

These were deliberately deferred, not missed — each needs its own scoped
pass:

- **PDF generation** — report cards, admit cards, receipts, payslips, ID
  cards, transfer certificates. The underlying data is correct; nothing
  renders to paper yet.
- **File uploads** — `photo_url`/`attachment_url` columns exist, but no
  Supabase Storage buckets have been created or wired up.
- **Live SMS / WhatsApp** — template and logging infrastructure exists for
  SMS; no provider is connected. WhatsApp hasn't been started.
- **Bulk class promotion** — the schema supports it (`student_enrollments`),
  but there's no "promote this whole class to next year" UI action yet.

## Deployment

Not yet deployed anywhere. The target per the architecture decisions is:
Supabase Cloud (managed Postgres/Auth) with the Next.js app self-hosted via
Docker + Nginx + HTTPS — Docker/Nginx config, CI/CD, and monitoring don't
exist yet.
