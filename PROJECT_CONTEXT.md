# School OS — Project Context

> **Purpose of this file**: a single document that lets any AI assistant (or
> new human contributor) load complete context on this project in one read —
> what it is, what state it's in, how it's built, and why it's built that
> way. If you are an AI being handed this file cold, read it fully before
> touching code; the "why" sections encode decisions that aren't visible
> from the code alone.

## 1. What this is

**School OS** is a modular-monolith School Management System for a single
school — admissions through graduation, covering academics, attendance,
exams, fees, HR/payroll, communication, a student/parent portal, a public
marketing site, and back-office modules (library, hostel, transport,
inventory).

It is a **from-scratch rebuild** of a legacy PHP/MySQL system called
`School_V1.0` — not a line-for-line port. The rebuild was done against an
approved architecture blueprint that redesigned the data model around a set
of integrity rules the legacy system violated (see §5). Where this doc says
"fixes the legacy bug," it means a specific, identified defect in
`School_V1.0`, not a hypothetical.

## 2. Current state (as of 2026-08-23)

- **Status**: Feature-complete for Phases 1–10 of the blueprint (see §5).
  Builds, type-checks, and passes its test suite. **Not deployed anywhere.**
- **Commit history**: 3 commits total — `Initial commit from Create Next
  App`, then one large commit (`School OS: full build, Phases 1-10`) that
  built the entire system in one session, then a README commit. There is no
  granular history to `git blame` for "why did module X change" — the
  architecture decisions live in this doc, the README, and comments in the
  SQL migrations themselves.
- **Scale**: 29 ordered Postgres migrations, 19 feature modules, 28 admin
  routes, ~13,800 lines of TypeScript/TSX across `app/` and `features/`, 53
  unit tests (14 test files) covering integrity-critical logic only — not
  UI, not CRUD happy-paths.
- **Known gaps** — deliberately deferred, each needing its own scoped pass:
  - **PDF generation**: report cards, admit cards, receipts, payslips, ID
    cards, transfer certificates. Data is correct; nothing renders to paper.
  - **File uploads**: `photo_url` / `attachment_url` columns exist in the
    schema, but no Supabase Storage buckets are created or wired up.
  - **Live SMS/WhatsApp**: template + logging infrastructure exists for SMS;
    no provider (e.g. Twilio) is connected. WhatsApp hasn't been started.
  - **Bulk class promotion**: the schema supports it (`student_enrollments`
    is designed for exactly this), but there's no "promote this whole class
    to next year" UI action yet — promotion currently happens per-student.
  - **Deployment**: nothing is deployed. Target is Supabase Cloud (managed
    Postgres/Auth) + Next.js self-hosted via Docker + Nginx + HTTPS. No
    Docker/Nginx config, CI/CD, or monitoring exists yet.

## 3. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript | See `AGENTS.md` — this Next.js version has breaking changes vs. training-data assumptions; consult `node_modules/next/dist/docs/` before assuming an API |
| Database | Supabase Postgres | Postgres **RLS is the real authorization layer**, not a formality — see §6 |
| Auth | Supabase Auth | Session cookie refreshed in `proxy.ts` (this project's middleware entry point, not `middleware.ts` — Next.js 16 convention) |
| Forms/validation | React Hook Form + Zod | Every form *and* every Server Action boundary is Zod-validated — client validation is UX only, never trusted |
| Styling | Tailwind CSS v4 + hand-rolled shadcn-style primitives in `components/ui` | No shadcn CLI dependency; primitives are owned code |
| Payments | Razorpay | Order creation + webhook signature verification, both server-side |
| Email | Resend | `lib/email/client.ts` |
| Testing | Vitest | `tests/unit/`, Node environment, path-aliased via `vite-tsconfig-paths` |

## 4. Architecture

### 4.1 Directory layout and what belongs where

```
app/
├── (public)/     Marketing site — home, about, academics, admissions, contact, gallery
├── admin/        Staff/admin back office — one route directory per module
├── portal/       Student/parent portal (attendance, exams, fees, homework, notices)
├── api/          Route Handlers: Razorpay webhook, public enquiry form
└── auth/         Login/logout

features/<module>/          # 19 modules — see §4.3 for the list
├── repository.ts           # raw Supabase queries, ZERO business logic
├── service.ts               # business rules: derived values, multi-step operations, cross-module orchestration
├── actions.ts                # "use server" Server Actions — permission check + Zod parse, then delegates to service
└── components/                # client components scoped to this module

lib/
├── supabase/     client.ts (browser), server.ts (RSC/Server Actions), admin.ts (service-role, bypasses RLS), middleware.ts (session refresh)
├── permissions/  index.ts — hasPermission()/requirePermission(), backed by the has_permission() Postgres function
├── razorpay/     client.ts (order creation), verify.ts (webhook signature check)
└── email/        client.ts — Resend wrapper

supabase/
├── migrations/   0001..0029, strictly ordered — each documents *why*, not just *what*, in SQL comments
└── seed.sql      permission catalog, roles, default role→permission grants; idempotent, safe to re-run

types/          hand-written, one file per domain, matching each migration's schema exactly (no codegen)
validations/    Zod schemas — the single source of truth for input shape, imported by both actions.ts and forms
tests/unit/     one test file per integrity-critical business rule (not per module, not for UI)
```

### 4.2 The mandatory layering rule

Every feature module follows **`repository → service → actions →
components`**, strictly one-directional:

- `repository.ts` never contains business logic — just typed Supabase calls.
- `service.ts` holds business rules and is the **only** legal way for one
  module to touch another module's data. Example:
  `features/fees/service.ts` imports `studentsService` from
  `features/students/service` — it never queries the `students` table
  directly. **Cross-module calls always go through another module's
  exported `service`, never a raw query against its tables.** This is the
  one architectural rule most worth enforcing in review.
- `actions.ts` is the Server Action boundary: `requirePermission(...)` check
  first, Zod `.parse()` second, then call into `service`. No business logic
  lives here.
- `components/` are client components that call the Server Actions; they
  hold no authorization or business logic either.

### 4.3 The 19 feature modules

`academics, admissions, attendance, communication, expenses, fees, hostel,
inventory, library, payroll, portal, public, rbac, settings, staff,
students, teaching, transport` — plus `features/rbac` (roles/permissions
admin) and `features/settings` (school-wide settings).

### 4.4 Routing/auth flow

- `proxy.ts` (Next.js 16's middleware entry point — not `middleware.ts`)
  calls `lib/supabase/middleware.ts#updateSession` on every request. It
  refreshes the Supabase session cookie and gate-checks `/admin` and
  `/portal` prefixes, redirecting unauthenticated requests to
  `/auth/login?next=<path>`.
- Role-based landing (which of `/admin` vs `/portal` a signed-in user sees)
  is decided in `app/auth/login`, **not** in the middleware — the
  middleware is auth-only, not role-branching.
- Roles with `portal_access` (student, parent) land in `/portal`; staff/
  admin roles land in `/admin`.

## 5. The 10 build phases and the integrity rule each one introduced

This is also the mental model for "why does this table/column exist" — each
phase was scoped around fixing one specific class of bug from the legacy
`School_V1.0` system.

| Phase | Module | Integrity rule introduced |
|---|---|---|
| 1 | Auth, RBAC, Academic Setup | Real permission keys + Postgres RLS everywhere, not role-name string checks scattered through PHP |
| 2 | Admissions, Students | `student_enrollments` — one row per student per academic year, so grade promotion can never overwrite history (**this was the legacy system's #1 bug**: promotion used to `UPDATE` the student row in place) |
| 3 | Academics, Attendance | `teacher_assignments` scopes homework/lesson-plan/attendance write access to what a teacher is *actually* assigned to teach — not "any teacher can edit any class" |
| 4 | Exams & Results | State machine `draft → submitted → approved → published → locked`, enforced by two Postgres functions (not app-layer checks alone); a trigger audits any edit made after publish and hard-blocks edits once locked |
| 5 | Fees & Finance | Invoice balance is **never stored** — always derived from summing the payment ledger at read time; payments are append-only (voided, never deleted, so there's always an audit trail); Razorpay webhook handler is signature-verified and idempotent (safe against retries/replays) |
| 6 | Staff & Payroll | An even stricter state machine than exams: once a payroll run passes `reviewed`, **nobody** — not even admins — can edit it directly. Corrections go through a `payroll_adjustments` ledger that gets folded into the *next* run, never a retroactive edit |
| 7 | Communication | Every send attempt, success or failure, is logged — nothing is a silent no-op the way legacy email sending was |
| 8 | Student/Parent Portal | Ownership-based RLS (`is_own_student()`) layered **additively** on top of every prior module's staff-permission policies — portal users get a narrower view via RLS, not a separate code path that could drift out of sync |
| 9 | Public Website | The real replacement for legacy `enquire.php` — a Route Handler with a honeypot field, writing through the service-role client because anonymous public visitors have no RLS-gated insert path of their own |
| 10 | Library, Hostel, Transport, Inventory | Same "derive, don't trust a cached number" discipline applied to stock levels and room/seat occupancy |

## 6. Security model — read this before touching permissions

- **Postgres RLS is the actual authorization boundary**, not a UI nicety.
  Every table has RLS policies; the Next.js layer's permission checks are a
  second line of defense (fail fast with a good error) but the database
  enforces it regardless.
- The single source of truth for "can this user do X" is the
  `has_permission(permission_key)` Postgres function. Both RLS policies
  *and* `lib/permissions/index.ts#hasPermission()` call the same function —
  so a Server Action's permission check and the database's enforcement can
  never disagree.
- `requirePermission(key)` throws and must be the first line of every
  Server Action that touches protected data.
- `lib/supabase/admin.ts` holds the **service-role client**, which bypasses
  RLS entirely. It is guarded by the `server-only` package and must only be
  imported where anonymous/system writes are unavoidable (e.g. the public
  enquiry form in Phase 9). Never import it to "make RLS errors go away."
- Roles, permissions, and default role→permission grants are seeded via
  `supabase/seed.sql`, which is idempotent and safe to re-run after adding
  new permissions in a later migration.

## 7. Data integrity patterns used throughout

These recur across modules and are the core design philosophy of the
rebuild — recognize them rather than re-deriving from scratch:

1. **Derive, don't cache.** Fee invoice balances, stock levels, room/seat
   occupancy — none of these are stored columns that can drift out of sync.
   They're computed from the underlying ledger/table at read time.
2. **Append-only ledgers for anything financial or corrective.** Fee
   payments are voided, never deleted. Payroll corrections go through
   `payroll_adjustments` rather than editing a finalized run.
3. **State machines enforced in the database**, not just the UI — exam
   results and payroll runs both use Postgres functions/triggers to make
   illegal transitions actually impossible, not just hidden from the admin
   UI.
4. **History-preserving structural choices** — `student_enrollments`
   (Phase 2) is the canonical example: modeling "enrollment" as an
   append-only per-year fact table instead of a mutable field on `students`
   is what makes promotion non-destructive.

## 8. Environment & setup

Required env vars (`.env.local`, copy from `.env.local.example`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required.
- `SUPABASE_SERVICE_ROLE_KEY` — required; server-only, guarded by
  `server-only` package, only ever imported in `lib/supabase/admin.ts`.
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` —
  optional; without them, invoicing/collection still works, only the
  online-payment path is affected.
- `RESEND_API_KEY` / `RESEND_FROM_ADDRESS` — optional; without them,
  notices/templates still work, only actual sending is affected.
- `NEXT_PUBLIC_SITE_URL` — used by `app/sitemap.ts` / `app/robots.ts`; safe
  to leave as `localhost:3000` for local dev.

Setup order: create Supabase project → copy env file → `npm install` → run
all files in `supabase/migrations/` **in filename order** (they depend on
functions/tables from earlier ones — `has_permission()`, `is_admin()`,
`is_own_student()`, `teacher_assignments`, etc.) → run `supabase/seed.sql`
→ create a Supabase Auth user via the Dashboard and promote them to
`super_admin` via one SQL insert into `user_roles` → `npm run dev`.

Commands: `npm run dev`, `npm run build` (also type-checks), `npm run test`
(Vitest), `npm run lint`, `npx tsc --noEmit`.

## 9. Working conventions for AI assistants on this repo

- **Read `AGENTS.md` first, every session.** It's auto-regenerated by
  `next dev` and states this Next.js version has training-data-breaking API
  changes — check `node_modules/next/dist/docs/` before assuming an API
  works the way you remember.
- **Never bypass the `repository → service → actions → components` layering**
  — especially never let one module's `actions.ts` or `components/` query
  another module's tables directly; go through that module's `service`.
- **Never treat RLS as optional or add a service-role bypass to "fix" a
  permission error** — fix the RLS policy or the caller's role/permission
  grant instead.
- **Follow the derive-don't-cache pattern** for any new balance/total/count
  — don't add a stored aggregate column where a computed one is the
  established pattern.
- **New tables/columns need a new numbered migration**, appended after
  `0029_inventory.sql`, with a comment explaining *why*, matching the style
  of the existing 29 migrations. Update `types/<domain>.ts` and
  `validations/<domain>.ts` to match by hand — there's no schema codegen.
- **Add a unit test only for integrity-critical logic** (derived values,
  state transitions, signature verification, RBAC scoping) — the existing
  `tests/unit/` suite deliberately skips UI and CRUD happy-path tests.
