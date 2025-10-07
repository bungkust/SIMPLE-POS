-- =========================================================
-- KOPI PENDEKAR POS — SCHEMA FINAL (Supabase/Postgres)
-- Multi-tenant hardening + performa + RLS
-- =========================================================

-- =============== EXTENSIONS ==============================
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "citext";
create extension if not exists "unaccent";

-- =============== ENUMS (idempotent) ======================
do $$
begin
  if not exists (select 1 from pg_type where typname='payment_type_enum') then
    create type payment_type_enum as enum ('TRANSFER','QRIS','COD');
  end if;
  if not exists (select 1 from pg_type where typname='order_status_enum') then
    create type order_status_enum as enum ('BELUM BAYAR','SUDAH BAYAR','DIBATALKAN');
  end if;
  if not exists (select 1 from pg_type where typname='selection_type_enum') then
    create type selection_type_enum as enum ('single_required','single_optional','multiple');
  end if;
  if not exists (select 1 from pg_type where typname='discount_type_enum') then
    create type discount_type_enum as enum ('percentage','fixed_amount');
  end if;
  if not exists (select 1 from pg_type where typname='platform_role_enum') then
    create type platform_role_enum as enum ('super_admin','manager','staff');
  end if;
  if not exists (select 1 from pg_type where typname='tenant_role_enum') then
    create type tenant_role_enum as enum ('super_admin','admin','manager','cashier');
  end if;
end$$;

-- =============== CORE TABLES =============================
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  role platform_role_enum default 'staff',
  is_active boolean default true,
  last_login timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  slug citext not null unique,
  subdomain citext not null unique,
  domain citext,
  email_domain citext,
  settings jsonb default jsonb_build_object(
    'currency','IDR','language','id','timezone','Asia/Jakarta',
    'contact_info', jsonb_build_object('phone','','address','','instagram',''),
    'business_hours', jsonb_build_object('open','08:00','close','22:00')
  ),
  is_active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists tenants_settings_gin on public.tenants using gin (settings);

create table if not exists public.tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  user_email citext not null,
  role tenant_role_enum default 'admin',
  permissions jsonb default '[]'::jsonb,
  is_active boolean default true,
  invited_by uuid references auth.users(id),
  invited_at timestamptz default now(),
  joined_at timestamptz,
  created_at timestamptz default now()
);

-- FK tenant_users.tenant_id → tenants.id (safe add)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='tenant_users'
      and constraint_name='tenant_users_tenant_id_fkey'
  ) then
    alter table public.tenant_users
      add constraint tenant_users_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id);
  end if;
end$$;

-- FK tenant_users.user_id → auth.users.id (safe add)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='tenant_users'
      and constraint_name='tenant_users_user_id_fk'
  ) then
    alter table public.tenant_users
      add constraint tenant_users_user_id_fk
      foreign key (user_id) references auth.users(id);
  end if;
end$$;

create unique index if not exists tenant_users_tenant_userid_uniq
  on public.tenant_users(tenant_id, user_id) where user_id is not null;
create unique index if not exists tenant_users_tenant_email_uniq
  on public.tenant_users(tenant_id, user_email);
create index if not exists tenant_users_permissions_gin on public.tenant_users using gin (permissions);

-- =============== DOMAIN TABLES ===========================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  name text not null,
  sort_order smallint default 0,
  created_at timestamptz default now()
);
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='categories'
      and constraint_name='categories_tenant_id_fkey'
  ) then
    alter table public.categories
      add constraint categories_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id);
  end if;
end$$;
create unique index if not exists categories_tenant_name_uniq on public.categories(tenant_id, name);
create unique index if not exists categories_id_tenant_uniq on public.categories(id, tenant_id);
create index if not exists categories_tenant_idx on public.categories(tenant_id);

create table if not exists public.menu_discounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  name varchar not null,
  description text,
  discount_type discount_type_enum,
  discount_value integer,
  is_active boolean default true,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='menu_discounts'
      and constraint_name='menu_discounts_tenant_id_fkey'
  ) then
    alter table public.menu_discounts
      add constraint menu_discounts_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id);
  end if;
end$$;
-- add check constraint once
do $$
begin
  if not exists (select 1 from pg_constraint where conname='menu_discounts_value_ck') then
    alter table public.menu_discounts
      add constraint menu_discounts_value_ck check (
        (discount_type = 'percentage'   and discount_value between 1 and 100) or
        (discount_type = 'fixed_amount' and discount_value >= 0)
      );
  end if;
end$$;
create unique index if not exists menu_discounts_id_tenant_uniq on public.menu_discounts(id, tenant_id);
create index if not exists menu_discounts_tenant_idx on public.menu_discounts(tenant_id);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  category_id uuid,
  name text not null,
  short_description text,
  description text,
  price integer,
  base_price integer default 0,
  photo_url text,
  is_active boolean default true,
  featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  discount_id uuid,
  search_text tsvector
);
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='menu_items'
      and constraint_name='menu_items_tenant_id_fkey'
  ) then
    alter table public.menu_items
      add constraint menu_items_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id);
  end if;
end$$;
-- enforce cents as integer
alter table public.menu_items
  alter column price set not null,
  alter column base_price set not null;

create unique index if not exists menu_items_id_tenant_uniq on public.menu_items(id, tenant_id);
create index if not exists menu_items_tenant_idx on public.menu_items(tenant_id);
create index if not exists menu_items_active_idx on public.menu_items(tenant_id, is_active, updated_at desc);
create index if not exists menu_items_cat_active_idx on public.menu_items(tenant_id, category_id, is_active);

-- full-text search via trigger
create or replace function public.menu_items_set_search_text()
returns trigger language plpgsql as $$
begin
  new.search_text :=
    to_tsvector(
      'simple',
      unaccent(coalesce(new.name,'')) || ' ' || unaccent(coalesce(new.description,''))
    );
  return new;
end; $$;
do $$
begin
  if not exists (select 1 from pg_trigger where tgname='menu_items_search_text_trg') then
    create trigger menu_items_search_text_trg
    before insert or update of name, description
    on public.menu_items
    for each row execute procedure public.menu_items_set_search_text();
  end if;
end$$;
update public.menu_items mi
set search_text = to_tsvector('simple', unaccent(coalesce(mi.name,'')) || ' ' || unaccent(coalesce(mi.description,'')))
where mi.search_text is null;
create index if not exists menu_items_search_gin on public.menu_items using gin (search_text);
create index if not exists menu_items_name_trgm on public.menu_items using gin (name gin_trgm_ops);

create table if not exists public.menu_options (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  menu_item_id uuid not null,
  label varchar not null,
  selection_type selection_type_enum,
  max_selections smallint default 1,
  is_required boolean default false,
  sort_order smallint default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='menu_options'
      and constraint_name='menu_options_tenant_id_fkey'
  ) then
    alter table public.menu_options
      add constraint menu_options_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id);
  end if;
end$$;
create unique index if not exists menu_options_id_tenant_uniq on public.menu_options(id, tenant_id);
create index if not exists menu_options_tenant_idx on public.menu_options(tenant_id);
create unique index if not exists menu_options_unique_label_per_item
  on public.menu_options(tenant_id, menu_item_id, lower(label));

create table if not exists public.menu_option_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  menu_option_id uuid not null,
  name varchar not null,
  additional_price integer default 0,
  is_available boolean default true,
  sort_order smallint default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='menu_option_items'
      and constraint_name='menu_option_items_tenant_id_fkey'
  ) then
    alter table public.menu_option_items
      add constraint menu_option_items_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id);
  end if;
end$$;
create unique index if not exists menu_option_items_id_tenant_uniq on public.menu_option_items(id, tenant_id);
create index if not exists menu_option_items_tenant_idx on public.menu_option_items(tenant_id);
create unique index if not exists menu_option_items_unique_name_per_option
  on public.menu_option_items(tenant_id, menu_option_id, lower(name));

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  name text not null,
  description text,
  payment_type payment_type_enum default 'TRANSFER',
  bank_name text,
  account_number text,
  account_holder text,
  qris_image_url text,
  is_active boolean default true,
  sort_order smallint default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='payment_methods'
      and constraint_name='payment_methods_tenant_id_fkey'
  ) then
    alter table public.payment_methods
      add constraint payment_methods_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id);
  end if;
end$$;
create unique index if not exists payment_methods_tenant_name_uniq on public.payment_methods(tenant_id, name);
create unique index if not exists payment_methods_id_tenant_uniq on public.payment_methods(id, tenant_id);
create index if not exists payment_methods_tenant_idx on public.payment_methods(tenant_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  order_code text,
  customer_name text not null,
  phone text not null,
  pickup_date date not null,
  notes text,
  payment_method payment_type_enum default 'TRANSFER',
  status order_status_enum default 'BELUM BAYAR',
  subtotal integer not null,
  discount integer default 0,
  service_fee integer default 0,
  total integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='orders'
      and constraint_name='orders_tenant_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id);
  end if;
end$$;
create unique index if not exists orders_id_tenant_uniq on public.orders(id, tenant_id);
create unique index if not exists orders_tenant_code_uniq on public.orders(tenant_id, order_code);
create index if not exists orders_tenant_created_idx on public.orders(tenant_id, created_at desc);
create index if not exists orders_tenant_status_pickup_idx on public.orders(tenant_id, status, pickup_date);
do $$
begin
  if not exists (select 1 from pg_constraint where conname='orders_total_ck') then
    alter table public.orders add constraint orders_total_ck
      check (total = subtotal - discount + service_fee);
  end if;
end$$;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  order_id uuid not null,
  menu_id uuid,
  name_snapshot text not null,
  price_snapshot integer not null,
  qty integer not null check (qty > 0),
  notes text,
  line_total integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='order_items'
      and constraint_name='order_items_tenant_id_fkey'
  ) then
    alter table public.order_items
      add constraint order_items_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id);
  end if;
end$$;
create unique index if not exists order_items_id_tenant_uniq on public.order_items(id, tenant_id);
create index if not exists order_items_tenant_idx on public.order_items(tenant_id);
create index if not exists order_items_order_fk_idx on public.order_items(tenant_id, order_id);
do $$
begin
  if not exists (select 1 from pg_constraint where conname='order_items_total_check') then
    alter table public.order_items add constraint order_items_total_check
      check (line_total = qty * price_snapshot);
  end if;
end$$;

create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  order_id uuid not null,
  payment_method_id uuid,
  method payment_type_enum,
  amount integer,
  proof_url text,
  created_at timestamptz default now()
);
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='payment_proofs'
      and constraint_name='payment_proofs_tenant_id_fkey'
  ) then
    alter table public.payment_proofs
      add constraint payment_proofs_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id);
  end if;
end$$;
create unique index if not exists payment_proofs_id_tenant_uniq on public.payment_proofs(id, tenant_id);
create index if not exists payment_proofs_tenant_idx on public.payment_proofs(tenant_id);

create table if not exists public.tenant_activity_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  user_email citext not null,
  action varchar not null,
  resource varchar,
  resource_id uuid,
  metadata jsonb default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='tenant_activity_logs'
      and constraint_name='tenant_activity_logs_tenant_id_fkey'
  ) then
    alter table public.tenant_activity_logs
      add constraint tenant_activity_logs_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id);
  end if;
end$$;
create index if not exists tenant_logs_tenant_idx on public.tenant_activity_logs(tenant_id);

-- =============== UNIQUE (id, tenant_id) for parents ======
create unique index if not exists categories_id_tenant_uniq      on public.categories(id, tenant_id);
create unique index if not exists menu_discounts_id_tenant_uniq  on public.menu_discounts(id, tenant_id);
create unique index if not exists menu_items_id_tenant_uniq      on public.menu_items(id, tenant_id);
create unique index if not exists menu_options_id_tenant_uniq    on public.menu_options(id, tenant_id);
create unique index if not exists orders_id_tenant_uniq          on public.orders(id, tenant_id);
create unique index if not exists payment_methods_id_tenant_uniq on public.payment_methods(id, tenant_id);

-- =============== COMPOSITE FOREIGN KEYS ==================
-- menu_items → categories, menu_discounts
do $$
begin
  if not exists (select 1 from pg_constraint where conname='menu_items_category_tenant_fk') then
    alter table public.menu_items
      add constraint menu_items_category_tenant_fk
      foreign key (category_id, tenant_id)
      references public.categories(id, tenant_id)
      on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='menu_items_discount_tenant_fk') then
    alter table public.menu_items
      add constraint menu_items_discount_tenant_fk
      foreign key (discount_id, tenant_id)
      references public.menu_discounts(id, tenant_id)
      on delete set null;
  end if;
end$$;

-- menu_options → menu_items
do $$
begin
  if not exists (select 1 from pg_constraint where conname='menu_options_menu_item_tenant_fk') then
    alter table public.menu_options
      add constraint menu_options_menu_item_tenant_fk
      foreign key (menu_item_id, tenant_id)
      references public.menu_items(id, tenant_id)
      on delete cascade;
  end if;
end$$;

-- menu_option_items → menu_options
do $$
begin
  if not exists (select 1 from pg_constraint where conname='menu_option_items_option_tenant_fk') then
    alter table public.menu_option_items
      add constraint menu_option_items_option_tenant_fk
      foreign key (menu_option_id, tenant_id)
      references public.menu_options(id, tenant_id)
      on delete cascade;
  end if;
end$$;

-- order_items → orders, menu_items
do $$
begin
  if not exists (select 1 from pg_constraint where conname='order_items_order_tenant_fk') then
    alter table public.order_items
      add constraint order_items_order_tenant_fk
      foreign key (order_id, tenant_id)
      references public.orders(id, tenant_id)
      on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='order_items_menu_tenant_fk') then
    alter table public.order_items
      add constraint order_items_menu_tenant_fk
      foreign key (menu_id, tenant_id)
      references public.menu_items(id, tenant_id)
      on delete set null;
  end if;
end$$;

-- payment_proofs → orders, payment_methods
do $$
begin
  if not exists (select 1 from pg_constraint where conname='payment_proofs_order_tenant_fk') then
    alter table public.payment_proofs
      add constraint payment_proofs_order_tenant_fk
      foreign key (order_id, tenant_id)
      references public.orders(id, tenant_id)
      on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='payment_proofs_method_tenant_fk') then
    alter table public.payment_proofs
      add constraint payment_proofs_method_tenant_fk
      foreign key (payment_method_id, tenant_id)
      references public.payment_methods(id, tenant_id)
      on delete set null;
  end if;
end$$;

-- =============== TRIGGERS (updated_at / order_code / audit) ==
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

do $$
declare r record;
begin
  for r in
    select distinct table_name
    from information_schema.columns
    where table_schema='public' and column_name='updated_at'
  loop
    execute format($f$
      do $do$
      begin
        if not exists (select 1 from pg_trigger where tgname='set_updated_at_%1$s') then
          create trigger set_updated_at_%1$s
          before update on public.%1$s
          for each row execute procedure public.tg_set_updated_at();
        end if;
      end$do$;
    $f$, r.table_name);
  end loop;
end$$;

create or replace function public.tg_set_order_code()
returns trigger language plpgsql as $$
begin
  if new.order_code is null then
    new.order_code := 'ORD-' || to_char(coalesce(new.created_at, now()), 'YYMMDD')
                       || '-' || substr(new.id::text,1,6);
  end if;
  return new;
end; $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='set_order_code_before_insert') then
    create trigger set_order_code_before_insert
    before insert on public.orders
    for each row execute procedure public.tg_set_order_code();
  end if;
end$$;

create or replace function public.log_tenant_activity()
returns trigger language plpgsql as $$
begin
  insert into public.tenant_activity_logs(tenant_id, user_email, action, resource, resource_id, metadata)
  values (
    coalesce(new.tenant_id, old.tenant_id),
    coalesce(auth.jwt() ->> 'email','system'),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    '{}'::jsonb
  );
  return coalesce(new, old);
end; $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='log_orders_chg') then
    create trigger log_orders_chg
    after insert or update or delete on public.orders
    for each row execute procedure public.log_tenant_activity();
  end if;
end$$;

-- =============== RLS HELPERS =============================
create or replace function public.is_platform_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.admin_users a
    where a.is_active = true
      and lower(a.email::text) = lower(coalesce(auth.jwt() ->> 'email',''))
  );
$$;

create or replace function public.is_tenant_member(tid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.tenant_users tu
    where tu.tenant_id = tid
      and tu.is_active = true
      and (
        tu.user_id = auth.uid()
        or lower(tu.user_email::text) = lower(coalesce(auth.jwt() ->> 'email',''))
      )
  );
$$;

create or replace function public.is_tenant_member_strict(tid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.tenant_users tu
    where tu.tenant_id = tid
      and tu.is_active = true
      and tu.user_id = auth.uid()
  );
$$;

-- =============== RLS ENABLE + POLICIES ===================
alter table public.admin_users enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_users enable row level security;
alter table public.categories enable row level security;
alter table public.menu_discounts enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_options enable row level security;
alter table public.menu_option_items enable row level security;
alter table public.payment_methods enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.tenant_activity_logs enable row level security;

-- Tenants
drop policy if exists t_select on public.tenants;
create policy t_select on public.tenants
for select to authenticated
using ( public.is_platform_admin() or public.is_tenant_member(id) );

-- Tenant users
drop policy if exists tu_select on public.tenant_users;
drop policy if exists tu_write  on public.tenant_users;
create policy tu_select on public.tenant_users
for select to authenticated
using ( public.is_platform_admin() or public.is_tenant_member(tenant_id) );
create policy tu_write on public.tenant_users
for all to authenticated
using ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) )
with check ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) );

-- Categories
drop policy if exists cat_select on public.categories;
drop policy if exists cat_write  on public.categories;
create policy cat_select on public.categories
for select to authenticated
using ( public.is_platform_admin() or public.is_tenant_member(tenant_id) );
create policy cat_write on public.categories
for all to authenticated
using ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) )
with check ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) );

-- Menu discounts
drop policy if exists md_select on public.menu_discounts;
drop policy if exists md_write  on public.menu_discounts;
create policy md_select on public.menu_discounts
for select to authenticated
using ( public.is_platform_admin() or public.is_tenant_member(tenant_id) );
create policy md_write on public.menu_discounts
for all to authenticated
using ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) )
with check ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) );

-- Menu items
drop policy if exists mi_select on public.menu_items;
drop policy if exists mi_insert on public.menu_items;
drop policy if exists mi_update on public.menu_items;
drop policy if exists mi_delete on public.menu_items;
create policy mi_select on public.menu_items
for select to authenticated
using ( public.is_platform_admin() or public.is_tenant_member(tenant_id) );
create policy mi_insert on public.menu_items
for insert to authenticated
with check ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) );
create policy mi_update on public.menu_items
for update to authenticated
using ( public.is_platform_admin() or public.is_tenant_member(tenant_id) )
with check ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) );
create policy mi_delete on public.menu_items
for delete to authenticated
using ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) );

-- Menu options
drop policy if exists mo_select on public.menu_options;
drop policy if exists mo_write  on public.menu_options;
create policy mo_select on public.menu_options
for select to authenticated
using ( public.is_platform_admin() or public.is_tenant_member(tenant_id) );
create policy mo_write on public.menu_options
for all to authenticated
using ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) )
with check ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) );

-- Menu option items
drop policy if exists moi_select on public.menu_option_items;
drop policy if exists moi_write  on public.menu_option_items;
create policy moi_select on public.menu_option_items
for select to authenticated
using ( public.is_platform_admin() or public.is_tenant_member(tenant_id) );
create policy moi_write on public.menu_option_items
for all to authenticated
using ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) )
with check ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) );

-- Payment methods
drop policy if exists pm_select on public.payment_methods;
drop policy if exists pm_write  on public.payment_methods;
create policy pm_select on public.payment_methods
for select to authenticated
using ( public.is_platform_admin() or public.is_tenant_member(tenant_id) );
create policy pm_write on public.payment_methods
for all to authenticated
using ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) )
with check ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) );

-- Orders
drop policy if exists ord_select on public.orders;
drop policy if exists ord_write  on public.orders;
create policy ord_select on public.orders
for select to authenticated
using ( public.is_platform_admin() or public.is_tenant_member(tenant_id) );
create policy ord_write on public.orders
for all to authenticated
using ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) )
with check ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) );

-- Order items
drop policy if exists oi_select on public.order_items;
drop policy if exists oi_write  on public.order_items;
create policy oi_select on public.order_items
for select to authenticated
using ( public.is_platform_admin() or public.is_tenant_member(tenant_id) );
create policy oi_write on public.order_items
for all to authenticated
using ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) )
with check ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) );

-- Payment proofs
drop policy if exists pp_select on public.payment_proofs;
drop policy if exists pp_write  on public.payment_proofs;
create policy pp_select on public.payment_proofs
for select to authenticated
using ( public.is_platform_admin() or public.is_tenant_member(tenant_id) );
create policy pp_write on public.payment_proofs
for all to authenticated
using ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) )
with check ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) );

-- Activity logs
drop policy if exists log_select on public.tenant_activity_logs;
drop policy if exists log_insert on public.tenant_activity_logs;
create policy log_select on public.tenant_activity_logs
for select to authenticated
using ( public.is_platform_admin() or public.is_tenant_member(tenant_id) );
create policy log_insert on public.tenant_activity_logs
for insert to authenticated
with check ( public.is_platform_admin() or public.is_tenant_member_strict(tenant_id) );

-- =============== NOT NULL ENFORCEMENT (aman) =============
do $$
declare c int;
begin
  select count(*) into c from public.categories where tenant_id is null;
  if c=0 then alter table public.categories alter column tenant_id set not null; end if;

  select count(*) into c from public.menu_discounts where tenant_id is null;
  if c=0 then alter table public.menu_discounts alter column tenant_id set not null; end if;

  select count(*) into c from public.menu_items where tenant_id is null;
  if c=0 then alter table public.menu_items alter column tenant_id set not null; end if;

  select count(*) into c from public.menu_options where tenant_id is null;
  if c=0 then alter table public.menu_options alter column tenant_id set not null; end if;

  select count(*) into c from public.menu_option_items where tenant_id is null;
  if c=0 then alter table public.menu_option_items alter column tenant_id set not null; end if;

  select count(*) into c from public.payment_methods where tenant_id is null;
  if c=0 then alter table public.payment_methods alter column tenant_id set not null; end if;

  select count(*) into c from public.orders where tenant_id is null;
  if c=0 then alter table public.orders alter column tenant_id set not null; end if;

  select count(*) into c from public.order_items where tenant_id is null;
  if c=0 then alter table public.order_items alter column tenant_id set not null; end if;

  select count(*) into c from public.payment_proofs where tenant_id is null;
  if c=0 then alter table public.payment_proofs alter column tenant_id set not null; end if;

  select count(*) into c from public.tenant_activity_logs where tenant_id is null;
  if c=0 then alter table public.tenant_activity_logs alter column tenant_id set not null; end if;

  select count(*) into c from public.tenant_users where tenant_id is null;
  if c=0 then alter table public.tenant_users alter column tenant_id set not null; end if;
end$$;

-- =============== TENANT SETTINGS TABLE ===================
create table if not exists public.tenant_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  store_name text,
  store_icon text,
  store_icon_type text check (store_icon_type in ('predefined', 'uploaded')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='tenant_settings'
      and constraint_name='tenant_settings_tenant_id_fkey'
  ) then
    alter table public.tenant_settings
      add constraint tenant_settings_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id);
  end if;
end$$;
create unique index if not exists tenant_settings_tenant_uniq on public.tenant_settings(tenant_id);
create index if not exists tenant_settings_tenant_idx on public.tenant_settings(tenant_id);

-- Enable RLS for tenant_settings
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant_settings
DROP POLICY IF EXISTS ts_select ON public.tenant_settings;
CREATE POLICY ts_select ON public.tenant_settings
FOR SELECT TO authenticated
USING ( public.is_platform_admin() OR public.is_tenant_member(tenant_id) );

DROP POLICY IF EXISTS ts_write ON public.tenant_settings;
CREATE POLICY ts_write ON public.tenant_settings
FOR ALL TO authenticated
USING ( public.is_platform_admin() OR public.is_tenant_member_strict(tenant_id) )
WITH CHECK ( public.is_platform_admin() OR public.is_tenant_member_strict(tenant_id) );

-- =============== SEED ADMIN ==============================
insert into public.admin_users (email, role, is_active)
values ('kusbot114@gmail.com','super_admin',true)
on conflict (email) do update set role=excluded.role, is_active=true;
