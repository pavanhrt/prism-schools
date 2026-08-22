-- Phase 10 — Library
-- available_copies is maintained by issue/return, not derived at read
-- time — unlike fee balances or attendance %, a book's shelf availability
-- genuinely is a piece of state (not a sum over history), so storing and
-- updating it directly is the right call here, guarded by a check
-- constraint so it can never go negative or exceed total_copies.

create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  isbn text,
  publisher text,
  rack_no text,
  total_copies integer not null default 1 check (total_copies >= 0),
  available_copies integer not null default 1 check (available_copies >= 0),
  price numeric(10, 2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id),
  constraint books_available_within_total check (available_copies <= total_copies)
);

create trigger books_touch
  before update on public.books
  for each row execute function public.touch_updated_at();


create table public.book_issues (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id),
  borrower_id uuid not null references auth.users(id),
  issue_date date not null default current_date,
  due_date date not null,
  return_date date,
  status text not null default 'issued' check (status in ('issued', 'returned')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid()
);

create index book_issues_book_idx on public.book_issues (book_id);
create index book_issues_borrower_idx on public.book_issues (borrower_id);
-- One open (unreturned) issue per book per borrower at a time.
create unique index book_issues_one_open_per_borrower
  on public.book_issues (book_id, borrower_id)
  where status = 'issued';


-- Issuing and returning both need to touch books.available_copies and
-- book_issues together — same "one function, not two client calls that
-- could race" reasoning as payroll's status transitions.
create or replace function public.issue_book(p_book_id uuid, p_borrower_id uuid, p_due_date date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available int;
  v_issue_id uuid;
begin
  if not public.has_permission('library.issue') then
    raise exception 'Forbidden';
  end if;

  select available_copies into v_available from public.books where id = p_book_id for update;
  if v_available is null or v_available < 1 then
    raise exception 'No copies available.';
  end if;

  insert into public.book_issues (book_id, borrower_id, due_date)
  values (p_book_id, p_borrower_id, p_due_date)
  returning id into v_issue_id;

  update public.books set available_copies = available_copies - 1 where id = p_book_id;

  return v_issue_id;
end;
$$;

create or replace function public.return_book(p_issue_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_book_id uuid;
  v_status text;
begin
  if not public.has_permission('library.issue') then
    raise exception 'Forbidden';
  end if;

  select book_id, status into v_book_id, v_status from public.book_issues where id = p_issue_id;
  if v_status is distinct from 'issued' then
    raise exception 'This copy has already been returned.';
  end if;

  update public.book_issues set status = 'returned', return_date = current_date where id = p_issue_id;
  update public.books set available_copies = available_copies + 1 where id = v_book_id;
end;
$$;


-- Same pattern as find_auth_user_id_for_linking (0024) — a narrowly
-- permission-gated lookup, not a shared one, so granting library.issue
-- never incidentally grants the ability to look up arbitrary accounts for
-- other purposes.
create or replace function public.find_auth_user_id_for_library(lookup_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  found_id uuid;
begin
  if not public.has_permission('library.issue') then
    raise exception 'Forbidden';
  end if;

  select id into found_id from auth.users where email = lookup_email limit 1;
  return found_id;
end;
$$;


alter table public.books       enable row level security;
alter table public.book_issues enable row level security;

create policy books_select on public.books
  for select using (auth.role() = 'authenticated');
create policy books_write on public.books
  for all using (public.has_permission('library.manage'))
  with check (public.has_permission('library.manage'));

create policy book_issues_select on public.book_issues
  for select using (public.has_permission('library.view') or borrower_id = auth.uid());
-- No direct insert/update policy: issue_book() / return_book() (security
-- definer) are the only paths, so available_copies can never drift from
-- the actual issue rows.
