-- ALVA Soluciones Digitales — Fases 3, 4 y 5
-- Canonical migration for subscriptions/licenses, billing and support.
-- Production was applied as alva_phases3_5_commercial_operations + alva_phases3_5_performance_indexes.

insert into public.alva_permissions (code,name,description) values
 ('subscriptions.read','Consultar suscripciones','Consultar productos contratados, planes, vigencias y licencias.'),
 ('subscriptions.write','Gestionar suscripciones','Crear y modificar suscripciones/licencias.'),
 ('billing.read','Consultar cobranza','Consultar cargos, facturas y pagos.'),
 ('billing.write','Gestionar cobranza','Crear y actualizar cargos, facturas y pagos.'),
 ('support.read','Consultar soporte','Consultar tickets e historial de soporte.'),
 ('support.write','Gestionar soporte','Crear y actualizar tickets y respuestas.'),
 ('integrations.read','Consultar integraciones','Consultar entornos y vínculos técnicos de productos.'),
 ('integrations.write','Gestionar integraciones','Administrar entornos y vínculos técnicos de productos.')
on conflict (code) do update set name=excluded.name,description=excluded.description;

insert into public.alva_role_permissions (role_id,permission_id)
select r.id,p.id from public.alva_roles r cross join public.alva_permissions p
where r.slug in ('owner','admin')
on conflict do nothing;

insert into public.alva_role_permissions (role_id,permission_id)
select r.id,p.id from public.alva_roles r join public.alva_permissions p on p.code in
 ('subscriptions.read','subscriptions.write','billing.read','support.read','support.write','integrations.read')
where r.slug='operator' on conflict do nothing;

insert into public.alva_role_permissions (role_id,permission_id)
select r.id,p.id from public.alva_roles r join public.alva_permissions p on p.code in
 ('subscriptions.read','billing.read','support.read','integrations.read')
where r.slug='viewer' on conflict do nothing;

create table if not exists public.alva_product_plans (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.alva_products(id) on delete cascade,
 code text not null,
 name text not null,
 description text,
 status text not null default 'active' check(status in ('active','inactive','reserved')),
 billing_frequency text not null default 'monthly' check(billing_frequency in ('one_time','monthly','quarterly','semiannual','annual','custom')),
 price numeric(12,2),currency text not null default 'MXN',included_users integer,
 features jsonb not null default '[]'::jsonb,sort_order integer not null default 0,
 created_by uuid references public.alva_profiles(id) on delete set null,
 updated_by uuid references public.alva_profiles(id) on delete set null,
 created_at timestamptz not null default timezone('utc',now()),updated_at timestamptz not null default timezone('utc',now()),
 unique(product_id,code)
);
create index if not exists alva_product_plans_product_idx on public.alva_product_plans(product_id);
create index if not exists alva_product_plans_status_idx on public.alva_product_plans(status);
create index if not exists alva_product_plans_created_by_idx on public.alva_product_plans(created_by);
create index if not exists alva_product_plans_updated_by_idx on public.alva_product_plans(updated_by);

create table if not exists public.alva_subscriptions (
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.alva_companies(id) on delete restrict,
 product_id uuid not null references public.alva_products(id) on delete restrict,plan_id uuid references public.alva_product_plans(id) on delete set null,
 status text not null default 'active' check(status in ('trial','active','paused','cancelled','expired')),
 billing_frequency text not null default 'monthly' check(billing_frequency in ('one_time','monthly','quarterly','semiannual','annual','custom')),
 contracted_price numeric(12,2),currency text not null default 'MXN',seat_limit integer,start_date date not null default current_date,
 renewal_date date,end_date date,cancelled_at timestamptz,external_tenant_id text,access_url text,notes text,metadata jsonb not null default '{}'::jsonb,
 created_by uuid references public.alva_profiles(id) on delete set null,updated_by uuid references public.alva_profiles(id) on delete set null,
 created_at timestamptz not null default timezone('utc',now()),updated_at timestamptz not null default timezone('utc',now())
);
create index if not exists alva_subscriptions_company_idx on public.alva_subscriptions(company_id);
create index if not exists alva_subscriptions_product_idx on public.alva_subscriptions(product_id);
create index if not exists alva_subscriptions_plan_idx on public.alva_subscriptions(plan_id);
create index if not exists alva_subscriptions_status_idx on public.alva_subscriptions(status);
create index if not exists alva_subscriptions_renewal_idx on public.alva_subscriptions(renewal_date) where renewal_date is not null;
create index if not exists alva_subscriptions_created_by_idx on public.alva_subscriptions(created_by);
create index if not exists alva_subscriptions_updated_by_idx on public.alva_subscriptions(updated_by);

create table if not exists public.alva_product_environments (
 id uuid primary key default gen_random_uuid(),product_id uuid not null references public.alva_products(id) on delete cascade,
 environment text not null default 'production' check(environment in ('production','staging','development')),
 status text not null default 'active' check(status in ('active','planned','inactive')),app_url text,admin_url text,repository_url text,supabase_project_ref text,notes text,
 metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default timezone('utc',now()),updated_at timestamptz not null default timezone('utc',now()),
 unique(product_id,environment)
);
create index if not exists alva_product_environments_product_idx on public.alva_product_environments(product_id);

create table if not exists public.alva_invoices (
 id uuid primary key default gen_random_uuid(),folio bigint generated always as identity unique,
 company_id uuid not null references public.alva_companies(id) on delete restrict,subscription_id uuid references public.alva_subscriptions(id) on delete set null,
 product_id uuid references public.alva_products(id) on delete set null,concept text not null,issue_date date not null default current_date,due_date date,
 status text not null default 'pending' check(status in ('draft','pending','paid','overdue','cancelled','void')),
 subtotal numeric(12,2) not null default 0 check(subtotal>=0),tax numeric(12,2) not null default 0 check(tax>=0),total numeric(12,2) not null default 0 check(total>=0),
 currency text not null default 'MXN',paid_at timestamptz,notes text,created_by uuid references public.alva_profiles(id) on delete set null,
 updated_by uuid references public.alva_profiles(id) on delete set null,created_at timestamptz not null default timezone('utc',now()),updated_at timestamptz not null default timezone('utc',now())
);
create index if not exists alva_invoices_company_idx on public.alva_invoices(company_id);
create index if not exists alva_invoices_subscription_idx on public.alva_invoices(subscription_id);
create index if not exists alva_invoices_product_idx on public.alva_invoices(product_id);
create index if not exists alva_invoices_status_idx on public.alva_invoices(status);
create index if not exists alva_invoices_due_idx on public.alva_invoices(due_date) where due_date is not null;
create index if not exists alva_invoices_created_by_idx on public.alva_invoices(created_by);
create index if not exists alva_invoices_updated_by_idx on public.alva_invoices(updated_by);

create table if not exists public.alva_payments (
 id uuid primary key default gen_random_uuid(),invoice_id uuid not null references public.alva_invoices(id) on delete cascade,amount numeric(12,2) not null check(amount>0),
 currency text not null default 'MXN',paid_at timestamptz not null default timezone('utc',now()),payment_method text,reference text,notes text,
 created_by uuid references public.alva_profiles(id) on delete set null,created_at timestamptz not null default timezone('utc',now())
);
create index if not exists alva_payments_invoice_idx on public.alva_payments(invoice_id);
create index if not exists alva_payments_paid_at_idx on public.alva_payments(paid_at desc);
create index if not exists alva_payments_created_by_idx on public.alva_payments(created_by);

create or replace function alva_private.sync_invoice_payment_status()
returns trigger language plpgsql security definer set search_path=public,alva_private as $$
declare v_invoice uuid;v_total numeric;v_paid numeric;
begin
 v_invoice:=coalesce(new.invoice_id,old.invoice_id);
 select total into v_total from public.alva_invoices where id=v_invoice;
 select coalesce(sum(amount),0) into v_paid from public.alva_payments where invoice_id=v_invoice;
 if v_paid>=coalesce(v_total,0) and coalesce(v_total,0)>0 then
  update public.alva_invoices set status='paid',paid_at=coalesce(paid_at,timezone('utc',now())) where id=v_invoice and status not in ('cancelled','void');
 elsif v_paid<coalesce(v_total,0) then
  update public.alva_invoices set status=case when due_date is not null and due_date<current_date then 'overdue' else 'pending' end,paid_at=null where id=v_invoice and status not in ('draft','cancelled','void');
 end if;
 return coalesce(new,old);
end;$$;
revoke all on function alva_private.sync_invoice_payment_status() from public,anon,authenticated;

create table if not exists public.alva_tickets (
 id uuid primary key default gen_random_uuid(),ticket_number bigint generated always as identity unique,company_id uuid not null references public.alva_companies(id) on delete restrict,
 product_id uuid references public.alva_products(id) on delete set null,subscription_id uuid references public.alva_subscriptions(id) on delete set null,
 subject text not null,description text not null,status text not null default 'open' check(status in ('open','in_progress','waiting_customer','resolved','closed')),
 priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),requester_name text,requester_email text,
 assigned_to uuid references public.alva_profiles(id) on delete set null,resolved_at timestamptz,closed_at timestamptz,
 created_by uuid references public.alva_profiles(id) on delete set null,updated_by uuid references public.alva_profiles(id) on delete set null,
 created_at timestamptz not null default timezone('utc',now()),updated_at timestamptz not null default timezone('utc',now())
);
create index if not exists alva_tickets_company_idx on public.alva_tickets(company_id);
create index if not exists alva_tickets_product_idx on public.alva_tickets(product_id);
create index if not exists alva_tickets_subscription_idx on public.alva_tickets(subscription_id);
create index if not exists alva_tickets_status_idx on public.alva_tickets(status);
create index if not exists alva_tickets_priority_idx on public.alva_tickets(priority);
create index if not exists alva_tickets_assigned_idx on public.alva_tickets(assigned_to) where assigned_to is not null;
create index if not exists alva_tickets_created_by_idx on public.alva_tickets(created_by);
create index if not exists alva_tickets_updated_by_idx on public.alva_tickets(updated_by);

create table if not exists public.alva_ticket_messages (
 id uuid primary key default gen_random_uuid(),ticket_id uuid not null references public.alva_tickets(id) on delete cascade,
 author_user_id uuid references auth.users(id) on delete set null,body text not null,is_internal boolean not null default false,
 created_at timestamptz not null default timezone('utc',now())
);
create index if not exists alva_ticket_messages_ticket_idx on public.alva_ticket_messages(ticket_id,created_at);
create index if not exists alva_ticket_messages_author_idx on public.alva_ticket_messages(author_user_id);

-- Updated-at triggers. Use DROP to keep this file rerunnable on a clean replay.
drop trigger if exists alva_product_plans_updated_at on public.alva_product_plans;
create trigger alva_product_plans_updated_at before update on public.alva_product_plans for each row execute function public.alva_set_updated_at();
drop trigger if exists alva_subscriptions_updated_at on public.alva_subscriptions;
create trigger alva_subscriptions_updated_at before update on public.alva_subscriptions for each row execute function public.alva_set_updated_at();
drop trigger if exists alva_product_environments_updated_at on public.alva_product_environments;
create trigger alva_product_environments_updated_at before update on public.alva_product_environments for each row execute function public.alva_set_updated_at();
drop trigger if exists alva_invoices_updated_at on public.alva_invoices;
create trigger alva_invoices_updated_at before update on public.alva_invoices for each row execute function public.alva_set_updated_at();
drop trigger if exists alva_tickets_updated_at on public.alva_tickets;
create trigger alva_tickets_updated_at before update on public.alva_tickets for each row execute function public.alva_set_updated_at();
drop trigger if exists alva_payments_sync_invoice on public.alva_payments;
create trigger alva_payments_sync_invoice after insert or update or delete on public.alva_payments for each row execute function alva_private.sync_invoice_payment_status();

-- Audit triggers.
do $$ declare t text; begin foreach t in array array['alva_product_plans','alva_subscriptions','alva_product_environments','alva_invoices','alva_payments','alva_tickets','alva_ticket_messages'] loop execute format('drop trigger if exists audit_%I on public.%I',t,t); execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function alva_private.audit_row_change()',t,t); end loop; end $$;

alter table public.alva_product_plans enable row level security;
alter table public.alva_subscriptions enable row level security;
alter table public.alva_product_environments enable row level security;
alter table public.alva_invoices enable row level security;
alter table public.alva_payments enable row level security;
alter table public.alva_tickets enable row level security;
alter table public.alva_ticket_messages enable row level security;

-- Policies. These are intentionally explicit by action.
create policy alva_plans_read on public.alva_product_plans for select to authenticated using (public.alva_has_permission('subscriptions.read'));
create policy alva_plans_insert on public.alva_product_plans for insert to authenticated with check (public.alva_has_permission('subscriptions.write'));
create policy alva_plans_update on public.alva_product_plans for update to authenticated using (public.alva_has_permission('subscriptions.write')) with check (public.alva_has_permission('subscriptions.write'));
create policy alva_plans_delete on public.alva_product_plans for delete to authenticated using (public.alva_current_role_slug() in ('owner','admin'));
create policy alva_subscriptions_read on public.alva_subscriptions for select to authenticated using (public.alva_has_permission('subscriptions.read'));
create policy alva_subscriptions_insert on public.alva_subscriptions for insert to authenticated with check (public.alva_has_permission('subscriptions.write'));
create policy alva_subscriptions_update on public.alva_subscriptions for update to authenticated using (public.alva_has_permission('subscriptions.write')) with check (public.alva_has_permission('subscriptions.write'));
create policy alva_subscriptions_delete on public.alva_subscriptions for delete to authenticated using (public.alva_current_role_slug() in ('owner','admin'));
create policy alva_env_read on public.alva_product_environments for select to authenticated using (public.alva_has_permission('integrations.read'));
create policy alva_env_insert on public.alva_product_environments for insert to authenticated with check (public.alva_has_permission('integrations.write'));
create policy alva_env_update on public.alva_product_environments for update to authenticated using (public.alva_has_permission('integrations.write')) with check (public.alva_has_permission('integrations.write'));
create policy alva_env_delete on public.alva_product_environments for delete to authenticated using (public.alva_current_role_slug()='owner');
create policy alva_invoices_read on public.alva_invoices for select to authenticated using (public.alva_has_permission('billing.read'));
create policy alva_invoices_insert on public.alva_invoices for insert to authenticated with check (public.alva_has_permission('billing.write'));
create policy alva_invoices_update on public.alva_invoices for update to authenticated using (public.alva_has_permission('billing.write')) with check (public.alva_has_permission('billing.write'));
create policy alva_invoices_delete on public.alva_invoices for delete to authenticated using (public.alva_current_role_slug() in ('owner','admin'));
create policy alva_payments_read on public.alva_payments for select to authenticated using (public.alva_has_permission('billing.read'));
create policy alva_payments_insert on public.alva_payments for insert to authenticated with check (public.alva_has_permission('billing.write'));
create policy alva_payments_update on public.alva_payments for update to authenticated using (public.alva_has_permission('billing.write')) with check (public.alva_has_permission('billing.write'));
create policy alva_payments_delete on public.alva_payments for delete to authenticated using (public.alva_current_role_slug() in ('owner','admin'));
create policy alva_tickets_read on public.alva_tickets for select to authenticated using (public.alva_has_permission('support.read'));
create policy alva_tickets_insert on public.alva_tickets for insert to authenticated with check (public.alva_has_permission('support.write'));
create policy alva_tickets_update on public.alva_tickets for update to authenticated using (public.alva_has_permission('support.write')) with check (public.alva_has_permission('support.write'));
create policy alva_tickets_delete on public.alva_tickets for delete to authenticated using (public.alva_current_role_slug() in ('owner','admin'));
create policy alva_ticket_messages_read on public.alva_ticket_messages for select to authenticated using (public.alva_has_permission('support.read'));
create policy alva_ticket_messages_insert on public.alva_ticket_messages for insert to authenticated with check (public.alva_has_permission('support.write'));
create policy alva_ticket_messages_update on public.alva_ticket_messages for update to authenticated using (public.alva_has_permission('support.write')) with check (public.alva_has_permission('support.write'));
create policy alva_ticket_messages_delete on public.alva_ticket_messages for delete to authenticated using (public.alva_current_role_slug() in ('owner','admin'));

grant select,insert,update,delete on public.alva_product_plans,public.alva_subscriptions,public.alva_product_environments,public.alva_invoices,public.alva_payments,public.alva_tickets,public.alva_ticket_messages to authenticated;
