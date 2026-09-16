-- ALVA Soluciones Digitales · Primera integración real con TTD
-- Aplicada en Supabase como: alva_ttd_first_product_integration
-- Proyecto compartido: lliedfgeegkqeopxvtze

create table if not exists public.alva_product_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.alva_companies(id) on delete restrict,
  product_id uuid not null references public.alva_products(id) on delete restrict,
  subscription_id uuid references public.alva_subscriptions(id) on delete set null,
  source_system text not null default 'ttd',
  external_account_type text not null,
  external_account_id text not null,
  external_slug text,
  label text,
  public_url text,
  admin_url text,
  status text not null default 'active' check (status in ('trial','active','inactive','suspended','archived')),
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(product_id,source_system,external_account_type,external_account_id)
);

create index if not exists alva_product_accounts_company_idx on public.alva_product_accounts(company_id);
create index if not exists alva_product_accounts_product_idx on public.alva_product_accounts(product_id);
create index if not exists alva_product_accounts_subscription_idx on public.alva_product_accounts(subscription_id);
create index if not exists alva_product_accounts_slug_idx on public.alva_product_accounts(source_system,external_slug);

alter table public.alva_product_accounts enable row level security;

drop policy if exists alva_product_accounts_read on public.alva_product_accounts;
create policy alva_product_accounts_read on public.alva_product_accounts for select to authenticated
using (public.alva_has_permission('integrations.read') or public.alva_has_permission('subscriptions.read'));

drop policy if exists alva_product_accounts_insert on public.alva_product_accounts;
create policy alva_product_accounts_insert on public.alva_product_accounts for insert to authenticated
with check (public.alva_has_permission('integrations.write'));

drop policy if exists alva_product_accounts_update on public.alva_product_accounts;
create policy alva_product_accounts_update on public.alva_product_accounts for update to authenticated
using (public.alva_has_permission('integrations.write')) with check (public.alva_has_permission('integrations.write'));

drop policy if exists alva_product_accounts_delete on public.alva_product_accounts;
create policy alva_product_accounts_delete on public.alva_product_accounts for delete to authenticated
using (public.alva_has_permission('integrations.write'));

grant select,insert,update,delete on public.alva_product_accounts to authenticated;

drop trigger if exists alva_product_accounts_set_updated_at on public.alva_product_accounts;
create trigger alva_product_accounts_set_updated_at before update on public.alva_product_accounts
for each row execute function public.alva_set_updated_at();

drop trigger if exists audit_alva_product_accounts_changes on public.alva_product_accounts;
create trigger audit_alva_product_accounts_changes after insert or update or delete on public.alva_product_accounts
for each row execute function alva_private.audit_row_change();

-- Paquete TTD de intercambio comercial. Conserva Premium y agrega la bandera del CTA pendiente.
insert into public.package_catalog(package_key,name,description,level,features,is_active)
select 'cross_promo','Publicidad cruzada',
       'Intercambio comercial: conserva las funciones Premium e incorpora la promoción permanente de TTD.',
       30,coalesce(features,'[]'::jsonb)||'["cross_promotion_cta"]'::jsonb,true
from public.package_catalog where package_key='premium'
on conflict(package_key) do update set
  name=excluded.name,description=excluded.description,level=excluded.level,
  features=excluded.features,is_active=true,updated_at=now();

-- URLs oficiales de producción TTD.
update public.alva_products set
  app_url='https://ttd-alvasd.pages.dev/otros/?negocio=tu-tarjeta-digital',
  admin_url='https://ttd-alvasd.pages.dev/admin/',
  metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
    'root_url','https://ttd-alvasd.pages.dev/',
    'repository','https://github.com/jeanmaxx/cya-asesor-digital',
    'supabase_project_ref','lliedfgeegkqeopxvtze',
    'integration_mode','shared_supabase'
  )
where code='TTD';

insert into public.alva_product_environments(product_id,environment,status,app_url,admin_url,repository_url,supabase_project_ref,notes,metadata)
select id,'production','active',
       'https://ttd-alvasd.pages.dev/otros/?negocio=tu-tarjeta-digital',
       'https://ttd-alvasd.pages.dev/admin/',
       'https://github.com/jeanmaxx/cya-asesor-digital','lliedfgeegkqeopxvtze',
       'TTD comparte Supabase con ALVA Core durante la etapa inicial.',
       jsonb_build_object('root_url','https://ttd-alvasd.pages.dev/','sso_ready',true)
from public.alva_products where code='TTD'
on conflict(product_id,environment) do update set
 status=excluded.status,app_url=excluded.app_url,admin_url=excluded.admin_url,
 repository_url=excluded.repository_url,supabase_project_ref=excluded.supabase_project_ref,
 notes=excluded.notes,metadata=excluded.metadata,updated_at=timezone('utc',now());

-- Los planes Básico, Pro y Premium se reflejan sin precio hasta aprobar la oferta comercial.
-- Publicidad cruzada se conserva como TTD-001 a $0.
-- Los clientes iniciales se enlazan por slug/correo, nunca por IDs generados por ALVA.
-- Ver docs/TTD_INTEGRATION.md para el inventario y las decisiones comerciales vigentes.
