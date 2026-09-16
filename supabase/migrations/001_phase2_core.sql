-- ALVA Soluciones Digitales — Fase 2
-- Núcleo administrativo: RBAC, empresas, productos y auditoría.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Utilidades
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Roles y permisos
-- -----------------------------------------------------------------------------
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (role_id, permission_id)
);

insert into public.roles (slug, name, description)
values
  ('owner', 'Propietario', 'Control total del ecosistema ALVA.'),
  ('admin', 'Administrador', 'Administración operativa y de usuarios.'),
  ('operator', 'Operador', 'Gestión diaria de empresas y productos.'),
  ('viewer', 'Consulta', 'Acceso de solo lectura.')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description;

insert into public.permissions (code, name, description)
values
  ('admin.access', 'Acceso a administración', 'Permite entrar al panel ALVA Admin.'),
  ('companies.read', 'Consultar empresas', 'Permite consultar empresas/clientes.'),
  ('companies.write', 'Gestionar empresas', 'Permite crear y modificar empresas/clientes.'),
  ('products.read', 'Consultar productos', 'Permite consultar el catálogo maestro.'),
  ('products.write', 'Gestionar productos', 'Permite crear y modificar productos y servicios.'),
  ('users.read', 'Consultar usuarios', 'Permite consultar usuarios internos.'),
  ('users.manage', 'Gestionar usuarios', 'Permite administrar perfiles, roles y estados.'),
  ('audit.read', 'Consultar auditoría', 'Permite revisar el historial de cambios.'),
  ('settings.manage', 'Gestionar configuración', 'Permite modificar parámetros administrativos.')
on conflict (code) do update
set name = excluded.name,
    description = excluded.description;

-- Owner: todos los permisos.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug = 'owner'
on conflict do nothing;

-- Admin: todos excepto la reserva de control absoluto del propietario.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'admin.access','companies.read','companies.write','products.read','products.write',
  'users.read','users.manage','audit.read','settings.manage'
)
where r.slug = 'admin'
on conflict do nothing;

-- Operador.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'admin.access','companies.read','companies.write','products.read','products.write'
)
where r.slug = 'operator'
on conflict do nothing;

-- Consulta.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'admin.access','companies.read','products.read'
)
where r.slug = 'viewer'
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Perfiles internos (1:1 con auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  role_id uuid not null references public.roles(id),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_role_id_idx on public.profiles(role_id);
create index if not exists profiles_is_active_idx on public.profiles(is_active);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_role uuid;
begin
  select id into default_role from public.roles where slug = 'viewer';

  insert into public.profiles (id, full_name, display_name, role_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', ''),
    default_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- Empresas / clientes
-- -----------------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  trade_name text not null,
  legal_name text,
  tax_id text,
  contact_name text,
  email text,
  phone text,
  status text not null default 'active' check (status in ('prospect','active','inactive','suspended')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists companies_tax_id_unique_idx
on public.companies ((upper(nullif(trim(tax_id), ''))))
where tax_id is not null and trim(tax_id) <> '';

create index if not exists companies_status_idx on public.companies(status);
create index if not exists companies_trade_name_idx on public.companies(lower(trade_name));

create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Catálogo maestro de productos / servicios
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  product_type text not null default 'software' check (product_type in ('software','service','hybrid')),
  status text not null default 'active' check (status in ('active','inactive','reserved','retired')),
  billing_mode text not null default 'custom' check (billing_mode in ('one_time','monthly','annual','custom')),
  base_price numeric(12,2),
  currency text not null default 'MXN',
  app_url text,
  admin_url text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists products_status_idx on public.products(status);
create index if not exists products_sort_order_idx on public.products(sort_order);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

insert into public.products (code, name, description, product_type, status, billing_mode, sort_order)
values
  ('TTD', 'TTD', 'Producto digital especializado del ecosistema ALVA.', 'software', 'active', 'custom', 10),
  ('CRM', 'CRM', 'Plataforma de gestión comercial y operativa para empresas.', 'software', 'active', 'custom', 20),
  ('PRODUCT03', 'Nueva plataforma', 'Espacio reservado para el siguiente producto ALVA.', 'software', 'reserved', 'custom', 30)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    product_type = excluded.product_type,
    status = excluded.status,
    billing_mode = excluded.billing_mode,
    sort_order = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- Helpers de autorización
-- -----------------------------------------------------------------------------
create or replace function public.current_role_slug()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.slug
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = auth.uid()
    and p.is_active = true
  limit 1;
$$;

create or replace function public.has_permission(permission_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles pr
    join public.role_permissions rp on rp.role_id = pr.role_id
    join public.permissions pe on pe.id = rp.permission_id
    where pr.id = auth.uid()
      and pr.is_active = true
      and pe.code = permission_code
  );
$$;

revoke all on function public.current_role_slug() from public;
revoke all on function public.has_permission(text) from public;
grant execute on function public.current_role_slug() to authenticated;
grant execute on function public.has_permission(text) to authenticated;

-- -----------------------------------------------------------------------------
-- Auditoría básica
-- -----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  table_name text not null,
  record_id text,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_user_id);
create index if not exists audit_logs_table_idx on public.audit_logs(table_name);

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_id text;
begin
  if tg_op = 'DELETE' then
    row_id := coalesce(to_jsonb(old) ->> 'id', null);
    insert into public.audit_logs(actor_user_id, table_name, record_id, action, old_data)
    values (auth.uid(), tg_table_name, row_id, tg_op, to_jsonb(old));
    return old;
  elsif tg_op = 'UPDATE' then
    row_id := coalesce(to_jsonb(new) ->> 'id', null);
    insert into public.audit_logs(actor_user_id, table_name, record_id, action, old_data, new_data)
    values (auth.uid(), tg_table_name, row_id, tg_op, to_jsonb(old), to_jsonb(new));
    return new;
  else
    row_id := coalesce(to_jsonb(new) ->> 'id', null);
    insert into public.audit_logs(actor_user_id, table_name, record_id, action, new_data)
    values (auth.uid(), tg_table_name, row_id, tg_op, to_jsonb(new));
    return new;
  end if;
end;
$$;

create trigger audit_companies_changes
after insert or update or delete on public.companies
for each row execute function public.audit_row_change();

create trigger audit_products_changes
after insert or update or delete on public.products
for each row execute function public.audit_row_change();

create trigger audit_profiles_changes
after update or delete on public.profiles
for each row execute function public.audit_row_change();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.products enable row level security;
alter table public.audit_logs enable row level security;

-- Catálogo RBAC visible para usuarios autenticados del Admin.
create policy roles_read_authenticated on public.roles
for select to authenticated
using (public.has_permission('admin.access'));

create policy permissions_read_authenticated on public.permissions
for select to authenticated
using (public.has_permission('admin.access'));

create policy role_permissions_read_authenticated on public.role_permissions
for select to authenticated
using (public.has_permission('admin.access'));

-- Perfil propio y administración de perfiles.
create policy profiles_read_self on public.profiles
for select to authenticated
using (id = auth.uid());

create policy profiles_read_managers on public.profiles
for select to authenticated
using (public.has_permission('users.read') or public.has_permission('users.manage'));

create policy profiles_insert_managers on public.profiles
for insert to authenticated
with check (public.has_permission('users.manage'));

create policy profiles_update_managers on public.profiles
for update to authenticated
using (public.has_permission('users.manage'))
with check (public.has_permission('users.manage'));

-- Empresas.
create policy companies_read on public.companies
for select to authenticated
using (public.has_permission('companies.read'));

create policy companies_insert on public.companies
for insert to authenticated
with check (public.has_permission('companies.write'));

create policy companies_update on public.companies
for update to authenticated
using (public.has_permission('companies.write'))
with check (public.has_permission('companies.write'));

create policy companies_delete on public.companies
for delete to authenticated
using (public.current_role_slug() in ('owner','admin'));

-- Productos.
create policy products_read on public.products
for select to authenticated
using (public.has_permission('products.read'));

create policy products_insert on public.products
for insert to authenticated
with check (public.has_permission('products.write'));

create policy products_update on public.products
for update to authenticated
using (public.has_permission('products.write'))
with check (public.has_permission('products.write'));

create policy products_delete on public.products
for delete to authenticated
using (public.current_role_slug() = 'owner');

-- Auditoría: solo lectura para quien tenga permiso; las escrituras se hacen por trigger.
create policy audit_logs_read on public.audit_logs
for select to authenticated
using (public.has_permission('audit.read'));

-- -----------------------------------------------------------------------------
-- Grants mínimos para PostgREST
-- -----------------------------------------------------------------------------
grant select on public.roles, public.permissions, public.role_permissions to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.companies to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select on public.audit_logs to authenticated;

-- Fin de migración 001.
