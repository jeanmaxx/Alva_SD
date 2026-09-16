-- ALVA SD — Modelo comercial v2
-- Separa el plan funcional de la condición comercial y permite múltiples precios por plan.

create table if not exists public.alva_commercial_conditions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active','inactive')),
  forces_zero_price boolean not null default false,
  enables_cross_promotion boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.alva_plan_prices (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.alva_product_plans(id) on delete cascade,
  billing_frequency text not null check (billing_frequency in ('one_time','monthly','quarterly','semiannual','annual','custom')),
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'MXN',
  activation_fee numeric(12,2) not null default 0 check (activation_fee >= 0),
  activation_included boolean not null default false,
  is_default boolean not null default false,
  status text not null default 'active' check (status in ('active','inactive')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(plan_id,billing_frequency)
);

create unique index if not exists alva_plan_prices_one_default_idx on public.alva_plan_prices(plan_id) where is_default and status='active';
create index if not exists alva_plan_prices_plan_idx on public.alva_plan_prices(plan_id);
create index if not exists alva_conditions_status_idx on public.alva_commercial_conditions(status,sort_order);

alter table public.alva_subscriptions add column if not exists commercial_condition_id uuid references public.alva_commercial_conditions(id) on delete set null;
create index if not exists alva_subscriptions_condition_idx on public.alva_subscriptions(commercial_condition_id);

drop trigger if exists alva_commercial_conditions_updated_at on public.alva_commercial_conditions;
create trigger alva_commercial_conditions_updated_at before update on public.alva_commercial_conditions for each row execute function public.alva_set_updated_at();
drop trigger if exists alva_plan_prices_updated_at on public.alva_plan_prices;
create trigger alva_plan_prices_updated_at before update on public.alva_plan_prices for each row execute function public.alva_set_updated_at();

drop trigger if exists audit_alva_commercial_conditions on public.alva_commercial_conditions;
create trigger audit_alva_commercial_conditions after insert or update or delete on public.alva_commercial_conditions for each row execute function alva_private.audit_row_change();
drop trigger if exists audit_alva_plan_prices on public.alva_plan_prices;
create trigger audit_alva_plan_prices after insert or update or delete on public.alva_plan_prices for each row execute function alva_private.audit_row_change();

alter table public.alva_commercial_conditions enable row level security;
alter table public.alva_plan_prices enable row level security;

create policy alva_conditions_read on public.alva_commercial_conditions for select to authenticated using (public.alva_has_permission('subscriptions.read'));
create policy alva_conditions_insert on public.alva_commercial_conditions for insert to authenticated with check (public.alva_has_permission('subscriptions.write'));
create policy alva_conditions_update on public.alva_commercial_conditions for update to authenticated using (public.alva_has_permission('subscriptions.write')) with check (public.alva_has_permission('subscriptions.write'));
create policy alva_conditions_delete on public.alva_commercial_conditions for delete to authenticated using (public.alva_current_role_slug() in ('owner','admin'));

create policy alva_plan_prices_read on public.alva_plan_prices for select to authenticated using (public.alva_has_permission('subscriptions.read'));
create policy alva_plan_prices_insert on public.alva_plan_prices for insert to authenticated with check (public.alva_has_permission('subscriptions.write'));
create policy alva_plan_prices_update on public.alva_plan_prices for update to authenticated using (public.alva_has_permission('subscriptions.write')) with check (public.alva_has_permission('subscriptions.write'));
create policy alva_plan_prices_delete on public.alva_plan_prices for delete to authenticated using (public.alva_current_role_slug() in ('owner','admin'));

insert into public.alva_commercial_conditions (code,name,description,forces_zero_price,enables_cross_promotion,sort_order,metadata) values
  ('NORMAL','Normal','Condición comercial estándar.',false,false,10,'{}'::jsonb),
  ('TRIAL','Prueba','Acceso temporal de evaluación o implementación.',true,false,20,'{}'::jsonb),
  ('CROSS_PROMO','Publicidad cruzada','Servicio sin cobro a cambio de mantener promoción de TTD en la experiencia publicada.',true,true,30,'{}'::jsonb),
  ('COURTESY','Cortesía','Servicio otorgado sin cobro por decisión comercial, colaboración o uso personal/interno.',true,false,40,'{}'::jsonb),
  ('AGREEMENT','Convenio','Condición especial derivada de un convenio comercial.',false,false,50,'{}'::jsonb),
  ('SPECIAL_DISCOUNT','Descuento especial','Precio negociado distinto al precio público sin alterar las capacidades del plan.',false,false,60,'{}'::jsonb)
on conflict (code) do update set name=excluded.name,description=excluded.description,forces_zero_price=excluded.forces_zero_price,enables_cross_promotion=excluded.enables_cross_promotion,sort_order=excluded.sort_order,status='active';

update public.alva_product_plans pp set billing_frequency='annual',price=799,currency='MXN',description='Presencia digital sencilla y profesional.',sort_order=10 where pp.product_id=(select id from public.alva_products where code='TTD') and pp.code='TTD-BASIC';
update public.alva_product_plans pp set billing_frequency='monthly',price=179,currency='MXN',description='Para quien quiere administrar y actualizar su propia tarjeta.',sort_order=20 where pp.product_id=(select id from public.alva_products where code='TTD') and pp.code='TTD-PRO';
update public.alva_product_plans pp set billing_frequency='monthly',price=279,currency='MXN',description='Convierte tu tarjeta en una herramienta comercial medible.',sort_order=30 where pp.product_id=(select id from public.alva_products where code='TTD') and pp.code='TTD-PREMIUM';

insert into public.alva_plan_prices(plan_id,billing_frequency,price,currency,activation_fee,activation_included,is_default,status,metadata)
select pp.id,'annual',799,'MXN',0,true,true,'active','{"public_label":"$799 MXN / año"}'::jsonb from public.alva_product_plans pp join public.alva_products p on p.id=pp.product_id where p.code='TTD' and pp.code='TTD-BASIC'
on conflict(plan_id,billing_frequency) do update set price=excluded.price,currency=excluded.currency,activation_fee=excluded.activation_fee,activation_included=excluded.activation_included,is_default=excluded.is_default,status='active',metadata=excluded.metadata;
insert into public.alva_plan_prices(plan_id,billing_frequency,price,currency,activation_fee,activation_included,is_default,status,metadata)
select pp.id,'monthly',179,'MXN',399,false,true,'active','{"public_label":"$179 MXN / mes"}'::jsonb from public.alva_product_plans pp join public.alva_products p on p.id=pp.product_id where p.code='TTD' and pp.code='TTD-PRO'
on conflict(plan_id,billing_frequency) do update set price=excluded.price,currency=excluded.currency,activation_fee=excluded.activation_fee,activation_included=excluded.activation_included,is_default=excluded.is_default,status='active',metadata=excluded.metadata;
insert into public.alva_plan_prices(plan_id,billing_frequency,price,currency,activation_fee,activation_included,is_default,status,metadata)
select pp.id,'annual',1790,'MXN',0,true,false,'active','{"public_label":"$1,790 MXN / año"}'::jsonb from public.alva_product_plans pp join public.alva_products p on p.id=pp.product_id where p.code='TTD' and pp.code='TTD-PRO'
on conflict(plan_id,billing_frequency) do update set price=excluded.price,currency=excluded.currency,activation_fee=excluded.activation_fee,activation_included=excluded.activation_included,status='active',metadata=excluded.metadata;
insert into public.alva_plan_prices(plan_id,billing_frequency,price,currency,activation_fee,activation_included,is_default,status,metadata)
select pp.id,'monthly',279,'MXN',599,false,true,'active','{"public_label":"$279 MXN / mes"}'::jsonb from public.alva_product_plans pp join public.alva_products p on p.id=pp.product_id where p.code='TTD' and pp.code='TTD-PREMIUM'
on conflict(plan_id,billing_frequency) do update set price=excluded.price,currency=excluded.currency,activation_fee=excluded.activation_fee,activation_included=excluded.activation_included,is_default=excluded.is_default,status='active',metadata=excluded.metadata;
insert into public.alva_plan_prices(plan_id,billing_frequency,price,currency,activation_fee,activation_included,is_default,status,metadata)
select pp.id,'annual',2790,'MXN',0,true,false,'active','{"public_label":"$2,790 MXN / año"}'::jsonb from public.alva_product_plans pp join public.alva_products p on p.id=pp.product_id where p.code='TTD' and pp.code='TTD-PREMIUM'
on conflict(plan_id,billing_frequency) do update set price=excluded.price,currency=excluded.currency,activation_fee=excluded.activation_fee,activation_included=excluded.activation_included,status='active',metadata=excluded.metadata;

update public.alva_subscriptions s set plan_id=(select pp.id from public.alva_product_plans pp join public.alva_products p on p.id=pp.product_id where p.code='TTD' and pp.code='TTD-PREMIUM'),commercial_condition_id=(select id from public.alva_commercial_conditions where code='CROSS_PROMO'),contracted_price=0,metadata=jsonb_set(jsonb_set(coalesce(s.metadata,'{}'::jsonb),'{commercial_reason}','"cross_promotion"'::jsonb,true),'{functional_plan}','"premium"'::jsonb,true) where s.product_id=(select id from public.alva_products where code='TTD') and s.company_id=(select id from public.alva_companies where trade_name='Studio Cavalier' limit 1);
update public.alva_subscriptions s set commercial_condition_id=(select id from public.alva_commercial_conditions where code='COURTESY') where s.product_id=(select id from public.alva_products where code='TTD') and s.metadata->>'slug'='emmanuel-alvarez';
update public.alva_subscriptions s set commercial_condition_id=(select id from public.alva_commercial_conditions where code='TRIAL') where s.product_id=(select id from public.alva_products where code='TTD') and s.metadata->>'slug'='patrimonio-qro';
update public.alva_subscriptions set commercial_condition_id=(select id from public.alva_commercial_conditions where code='NORMAL') where commercial_condition_id is null;

update public.alva_product_plans pp set status='inactive',description='Registro legado. Publicidad cruzada ahora se administra como condición comercial sobre un plan funcional.' where pp.product_id=(select id from public.alva_products where code='TTD') and pp.code='TTD-001';

update public.alva_products set app_url='https://ttd-alvasd.pages.dev/',admin_url='https://ttd-alvasd.pages.dev/admin/',metadata=coalesce(metadata,'{}'::jsonb)||'{"landing_url":"https://ttd-alvasd.pages.dev/","demo_url":"https://ttd-alvasd.pages.dev/demo/","architecture_standard":"landing-demo-admin-product"}'::jsonb where code='TTD';
update public.alva_product_environments e set app_url='https://ttd-alvasd.pages.dev/',admin_url='https://ttd-alvasd.pages.dev/admin/',metadata=coalesce(e.metadata,'{}'::jsonb)||'{"landing_url":"https://ttd-alvasd.pages.dev/","demo_url":"https://ttd-alvasd.pages.dev/demo/"}'::jsonb where e.product_id=(select id from public.alva_products where code='TTD') and e.environment='production';
