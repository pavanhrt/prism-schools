-- Seed data: permission catalog, the 7 roles from the blueprint's RBAC
-- matrix (§10), and their default grants. Safe to re-run (upserts).

insert into public.permissions (key, module, description) values
  ('academics.view',   'academics', 'View academic years, classes, sections, subjects'),
  ('academics.create', 'academics', 'Create academic years, classes, sections, subjects'),
  ('academics.edit',   'academics', 'Edit academic years, classes, sections, subjects'),
  ('academics.delete', 'academics', 'Delete academic years, classes, sections, subjects'),
  ('roles.view',        'rbac', 'View roles and permissions'),
  ('roles.manage',      'rbac', 'Create/edit roles, assign permissions and roles to users'),
  ('users.view',        'rbac', 'View any user profile'),
  ('users.manage',      'rbac', 'Edit any user profile, activate/suspend accounts'),
  ('security.view_logs','rbac', 'View login attempts and audit logs'),
  ('settings.manage',   'rbac', 'Edit school_settings'),
  ('admissions.view',   'admissions', 'View inquiries, followups, applications'),
  ('admissions.create', 'admissions', 'Create inquiries, log followups, submit applications'),
  ('admissions.edit',   'admissions', 'Update inquiry/application status, record decisions'),
  ('admissions.admit',  'admissions', 'Convert an approved application into a student record'),
  ('students.view',     'students', 'View student records and enrollment history'),
  ('students.create',   'students', 'Create student records directly (walk-in admission)'),
  ('students.edit',     'students', 'Edit student records and enrollments'),
  ('teachers.assign',   'academics', 'Assign teachers to class/section/subject'),
  ('lesson_plans.view',   'academics', 'View lesson plans'),
  ('lesson_plans.create', 'academics', 'Create lesson plans for assigned classes'),
  ('lesson_plans.edit',   'academics', 'Edit lesson plans for assigned classes'),
  ('homework.view',   'academics', 'View homework'),
  ('homework.create', 'academics', 'Assign homework for assigned classes'),
  ('homework.edit',   'academics', 'Edit homework for assigned classes'),
  ('attendance.view', 'academics', 'View student attendance'),
  ('attendance.mark', 'academics', 'Mark daily attendance for assigned (class-teacher) sections'),
  ('attendance.edit', 'academics', 'Correct attendance for assigned (class-teacher) sections'),
  ('exams.view',   'exams', 'View terms, exams, schedules, and results'),
  ('exams.create', 'exams', 'Create exam terms, exams, and exam schedules'),
  ('exams.edit',   'exams', 'Edit exam terms, exams, and exam schedules'),
  ('exams.delete', 'exams', 'Delete exam terms, exams, and exam schedules'),
  ('exams.enter_marks', 'exams', 'Enter/edit marks for assigned class-subject exam schedules'),
  ('exams.publish',     'exams', 'Advance a result''s status: submitted -> approved -> published -> locked'),
  ('grades.manage', 'exams', 'Edit the grade scale'),
  ('fees.view',   'fees', 'View fee structures, invoices, and payments'),
  ('fees.manage_structure', 'fees', 'Edit fee types and fee structures'),
  ('fees.create', 'fees', 'Generate invoices'),
  ('fees.collect', 'fees', 'Record a payment against an invoice'),
  ('fees.refund',  'fees', 'Void a payment'),
  ('expenses.view',   'finance', 'View expenses and expense categories'),
  ('expenses.create', 'finance', 'Record an expense'),
  ('expenses.edit',   'finance', 'Edit expenses and expense categories'),
  ('staff.view',   'staff', 'View staff records'),
  ('staff.create', 'staff', 'Create staff records'),
  ('staff.edit',   'staff', 'Edit staff records'),
  ('leave.view',    'staff', 'View leave requests'),
  ('leave.create',  'staff', 'Log a leave request for a staff member'),
  ('leave.approve', 'staff', 'Approve or reject a leave request'),
  ('staff_attendance.view', 'staff', 'View staff attendance'),
  ('staff_attendance.mark', 'staff', 'Mark staff attendance'),
  ('payroll.view',    'payroll', 'View payroll runs, items, and adjustments'),
  ('payroll.process', 'payroll', 'Create a payroll run, calculate it, and edit items before review'),
  ('payroll.approve', 'payroll', 'Review, approve, process a payroll run, and record adjustments'),
  ('communication.create',          'communication', 'Post notices, send email/SMS via templates'),
  ('communication.manage_templates','communication', 'Edit email and SMS templates'),
  ('communication.view_logs',       'communication', 'View email and SMS send logs'),
  ('library.view',    'library', 'View books and issue history'),
  ('library.manage',  'library', 'Add/edit books'),
  ('library.issue',   'library', 'Issue and return books'),
  ('hostel.view',   'hostel', 'View hostels, rooms, and allocations'),
  ('hostel.manage', 'hostel', 'Manage hostels, rooms, and student allocations'),
  ('transport.view',   'transport', 'View routes, stops, and allocations'),
  ('transport.manage', 'transport', 'Manage vehicles, routes, stops, and student allocations'),
  ('inventory.view',            'inventory', 'View inventory items and stock movements'),
  ('inventory.manage',          'inventory', 'Add/edit inventory items and categories'),
  ('inventory.record_movement', 'inventory', 'Record stock in/out movements')
on conflict (key) do nothing;

insert into public.roles (key, name, description, portal_access, is_system) values
  ('super_admin',  'Super Admin',  'Full platform access, bypasses ordinary scoping', false, true),
  ('school_admin', 'School Admin', 'Full school-level access',                        false, true),
  ('teacher',      'Teacher',      'Assigned classes and subjects',                   false, true),
  ('accountant',   'Accountant',   'Fees, payments, expenses, finance',               false, true),
  ('receptionist', 'Receptionist', 'Admissions front desk',                           false, true),
  ('student',      'Student',      'Student portal access',                          true,  true),
  ('parent',       'Parent',       'Parent portal access',                           true,  true)
on conflict (key) do nothing;

-- super_admin: every permission that exists.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'super_admin'
on conflict do nothing;

-- school_admin: full academics + full rbac + full admissions + full students.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'academics.view', 'academics.create', 'academics.edit', 'academics.delete',
  'roles.view', 'roles.manage', 'users.view', 'users.manage', 'security.view_logs',
  'settings.manage',
  'admissions.view', 'admissions.create', 'admissions.edit', 'admissions.admit',
  'students.view', 'students.create', 'students.edit',
  'teachers.assign',
  'lesson_plans.view', 'lesson_plans.create', 'lesson_plans.edit',
  'homework.view', 'homework.create', 'homework.edit',
  'attendance.view', 'attendance.mark', 'attendance.edit',
  'exams.view', 'exams.create', 'exams.edit', 'exams.delete',
  'exams.enter_marks', 'exams.publish', 'grades.manage',
  'fees.view', 'fees.manage_structure', 'fees.create', 'fees.collect', 'fees.refund',
  'expenses.view', 'expenses.create', 'expenses.edit',
  'staff.view', 'staff.create', 'staff.edit',
  'leave.view', 'leave.create', 'leave.approve',
  'staff_attendance.view', 'staff_attendance.mark',
  'payroll.view', 'payroll.process', 'payroll.approve',
  'communication.create', 'communication.manage_templates', 'communication.view_logs',
  'library.view', 'library.manage', 'library.issue',
  'hostel.view', 'hostel.manage',
  'transport.view', 'transport.manage',
  'inventory.view', 'inventory.manage', 'inventory.record_movement'
)
where r.key = 'school_admin'
on conflict do nothing;

-- teacher, accountant, receptionist: can post notices (staff-wide comms
-- isn't an admin-only action in most schools), but not touch templates or
-- see the raw send logs.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key = 'communication.create'
where r.key in ('teacher', 'accountant', 'receptionist')
on conflict do nothing;

-- accountant: processes payroll (§10 RBAC matrix) — draft/calculate/edit
-- pre-review, but not the approve/process/adjustment tier.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in ('payroll.view', 'payroll.process')
where r.key = 'accountant'
on conflict do nothing;

-- Every staff member (any role) can see their own staff/leave/attendance/
-- payroll rows via the user_id / staff_id linkage in RLS — no permission
-- grant needed for that, it's handled by the "or staff_id in (...)"
-- clauses in 0020-0022. HR administration itself stays school_admin-only
-- in this phase.

-- teacher, accountant, student, parent: read-only on academics for now —
-- every other module lands in later phases and adds its own grants.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key = 'academics.view'
where r.key in ('teacher', 'accountant', 'receptionist', 'student', 'parent')
on conflict do nothing;

-- receptionist: runs the admissions front desk, but cannot finalize an
-- admission (admissions.admit) or create/edit student records directly —
-- that trust boundary is deliberate (§10 RBAC matrix: receptionist is
-- "create/view" on Students, not edit/admit).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'admissions.view', 'admissions.create', 'admissions.edit', 'students.view'
)
where r.key = 'receptionist'
on conflict do nothing;

-- teacher, accountant: need to look students up (assigned-classes scoping
-- for teachers is Phase 3 territory once class/subject assignment exists).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key = 'students.view'
where r.key in ('teacher', 'accountant')
on conflict do nothing;

-- teacher: lesson plans, homework, attendance — all still scoped down to
-- their actual teacher_assignments rows by RLS (is_subject_teacher /
-- is_class_teacher), not by this grant alone. This just says "a teacher
-- is the kind of role that can do these things at all".
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'lesson_plans.view', 'lesson_plans.create', 'lesson_plans.edit',
  'homework.view', 'homework.create', 'homework.edit',
  'attendance.view', 'attendance.mark', 'attendance.edit'
)
where r.key = 'teacher'
on conflict do nothing;

-- teacher: sees exams and can enter marks — scoped by can_enter_marks()
-- (their own assignments, draft-status schedules only), never a blanket
-- grant. Only school_admin gets exams.publish.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in ('exams.view', 'exams.enter_marks')
where r.key = 'teacher'
on conflict do nothing;

-- accountant, student, parent: can see exam schedules/results read-only
-- (fees and portal views both eventually need this); no create/enter/publish.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key = 'exams.view'
where r.key in ('accountant', 'student', 'parent')
on conflict do nothing;

-- accountant: full day-to-day fee operations (§10 RBAC matrix) — but not
-- fees.manage_structure, which is config-level and stays with school_admin.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'fees.view', 'fees.create', 'fees.collect', 'fees.refund',
  'expenses.view', 'expenses.create', 'expenses.edit'
)
where r.key = 'accountant'
on conflict do nothing;

-- receptionist: "collect only" per §10 — can see and record payments
-- against an invoice, but not generate invoices, void payments, or touch
-- fee structure.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in ('fees.view', 'fees.collect')
where r.key = 'receptionist'
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Bootstrapping the first Super Admin is a manual, one-time step — there
-- is no user to grant it to until someone actually exists in auth.users.
-- user_roles.user_id is a uuid FK, not an email, but this query is only
-- safe to run here because the SQL editor talks to auth.users directly
-- with full privileges — app code can never do this join.
--
-- Environment-specific: swap the email for whoever should bootstrap each
-- environment, or remove this block once you're set up.

-- ---------------------------------------------------------------------
