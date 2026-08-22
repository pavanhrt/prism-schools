-- Phase 10 — Inventory
-- quantity_on_hand is deliberately NOT a stored column — same rule as fee
-- balances (§06) and attendance percentages: it's a sum over history
-- (stock movements in and out), computed at read time, so it can never
-- drift from what was actually recorded.

create table public.inventory_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create trigger inventory_categories_touch
  before update on public.inventory_categories
  for each row execute function public.touch_updated_at();


create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.inventory_categories(id),
  name text not null,
  unit text not null default 'pcs',
  reorder_level integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  updated_by uuid references auth.users(id)
);

create index inventory_items_category_idx on public.inventory_items (category_id);

create trigger inventory_items_touch
  before update on public.inventory_items
  for each row execute function public.touch_updated_at();


create table public.inventory_stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id),
  movement_type text not null check (movement_type in ('in', 'out')),
  quantity integer not null check (quantity > 0),
  reason text,
  movement_date date not null default current_date,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid()
);

create index inventory_stock_movements_item_idx on public.inventory_stock_movements (item_id);


alter table public.inventory_categories      enable row level security;
alter table public.inventory_items           enable row level security;
alter table public.inventory_stock_movements enable row level security;

create policy inventory_categories_select on public.inventory_categories
  for select using (public.has_permission('inventory.view'));
create policy inventory_categories_write on public.inventory_categories
  for all using (public.has_permission('inventory.manage'))
  with check (public.has_permission('inventory.manage'));

create policy inventory_items_select on public.inventory_items
  for select using (public.has_permission('inventory.view'));
create policy inventory_items_write on public.inventory_items
  for all using (public.has_permission('inventory.manage'))
  with check (public.has_permission('inventory.manage'));

create policy inventory_stock_movements_select on public.inventory_stock_movements
  for select using (public.has_permission('inventory.view'));
create policy inventory_stock_movements_insert on public.inventory_stock_movements
  for insert with check (public.has_permission('inventory.record_movement'));
-- No update/delete on movements — a mis-recorded movement is corrected
-- with a new opposite-direction entry, same append-only-ledger reasoning
-- as fee_payments and payroll_items.
