-- ALVA Soluciones Digitales — Fase 6, fundamento del portal de cliente.
-- Prepara membresías sin exponer aún empresas, suscripciones, facturas o tickets.

insert into public.alva_permissions (code,name,description) values
 ('portal.manage','Gestionar portal de clientes','Administrar membresías y accesos futuros al portal de cliente.')
on conflict (code) do update set name=excluded.name,description=excluded.description;

insert into public.alva_role_permissions (role_id,permission_id)
select r.id,p.id from public.alva_roles r cross join public.alva_permissions p
where r.slug in ('owner','admin') and p.code='portal.manage'
on conflict do nothing;

create table if not exists public.alva_portal_memberships (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 company_id uuid not null references public.alva_companies(id) on delete cascade,
 portal_role text not null default 'member' check(portal_role in ('owner','admin','member','billing','support')),
 is_active boolean not null default true,
 created_by uuid references public.alva_profiles(id) on delete set null,
 created_at timestamptz not null default timezone('utc',now()),
 updated_at timestamptz not null default timezone('utc',now()),
 unique(user_id,company_id)
);
create index if not exists alva_portal_memberships_user_idx on public.alva_portal_memberships(user_id);
create index if not exists alva_portal_memberships_company_idx on public.alva_portal_memberships(company_id);
create index if not exists alva_portal_memberships_created_by_idx on public.alva_portal_memberships(created_by);

drop trigger if exists alva_portal_memberships_updated_at on public.alva_portal_memberships;
create trigger alva_portal_memberships_updated_at before update on public.alva_portal_memberships for each row execute function public.alva_set_updated_at();
drop trigger if exists audit_alva_portal_memberships on public.alva_portal_memberships;
create trigger audit_alva_portal_memberships after insert or update or delete on public.alva_portal_memberships for each row execute function alva_private.audit_row_change();

alter table public.alva_portal_memberships enable row level security;
drop policy if exists alva_portal_memberships_read on public.alva_portal_memberships;
create policy alva_portal_memberships_read on public.alva_portal_memberships
for select to authenticated using (user_id=(select auth.uid()) or public.alva_has_permission('portal.manage'));
create policy alva_portal_memberships_manage_insert on public.alva_portal_memberships
for insert to authenticated with check (public.alva_has_permission('portal.manage'));
create policy alva_portal_memberships_manage_update on public.alva_portal_memberships
for update to authenticated using (public.alva_has_permission('portal.manage')) with check (public.alva_has_permission('portal.manage'));
create policy alva_portal_memberships_manage_delete on public.alva_portal_memberships
for delete to authenticated using (public.alva_has_permission('portal.manage'));

grant select,insert,update,delete on public.alva_portal_memberships to authenticated;
