-- ALVA ↔ TTD — automatización de Publicidad cruzada
-- Mantiene el paquete técnico de TTD sincronizado con el plan funcional y
-- la condición comercial seleccionados en ALVA Admin.

create or replace function alva_private.sync_ttd_subscription_from_alva()
returns trigger
language plpgsql
security definer
set search_path = public, alva_private
as $$
declare
  v_product_code text;
  v_plan_code text;
  v_condition_code text;
  v_account_type text;
  v_account_id uuid;
  v_functional_package text;
  v_package_key text;
  v_ttd_status text;
begin
  select code into v_product_code from public.alva_products where id = new.product_id;
  if v_product_code is distinct from 'TTD' then return new; end if;

  v_account_type := new.metadata->>'account_type';
  begin
    v_account_id := nullif(new.metadata->>'account_id','')::uuid;
  exception when others then
    v_account_id := null;
  end;
  if v_account_type not in ('advisor','business') or v_account_id is null then return new; end if;

  select code into v_plan_code from public.alva_product_plans where id = new.plan_id;
  select code into v_condition_code from public.alva_commercial_conditions where id = new.commercial_condition_id;

  v_functional_package := case v_plan_code
    when 'TTD-BASIC' then 'basic'
    when 'TTD-PRO' then 'pro'
    when 'TTD-PREMIUM' then 'premium'
    else nullif(new.metadata->>'functional_plan','')
  end;
  if v_functional_package is null then
    v_functional_package := nullif(new.metadata->>'ttd_package_key','');
    if v_functional_package = 'cross_promo' then v_functional_package := 'premium'; end if;
  end if;
  if v_functional_package not in ('basic','pro','premium') then return new; end if;

  v_package_key := case when v_condition_code = 'CROSS_PROMO' then 'cross_promo' else v_functional_package end;
  v_ttd_status := case new.status
    when 'trial' then 'trial'
    when 'active' then 'active'
    when 'cancelled' then 'cancelled'
    else 'suspended'
  end;

  new.metadata := jsonb_set(coalesce(new.metadata,'{}'::jsonb), '{functional_plan}', to_jsonb(v_functional_package), true);
  new.metadata := jsonb_set(new.metadata, '{ttd_package_key}', to_jsonb(v_package_key), true);

  insert into public.account_subscriptions(account_type,account_id,package_key,status,starts_at,ends_at,notes,updated_at)
  values(v_account_type,v_account_id,v_package_key,v_ttd_status,
         coalesce(new.start_date::timestamptz,timezone('utc',now())),
         case when new.end_date is null then null else new.end_date::timestamptz end,
         'Sincronizada desde ALVA Admin',timezone('utc',now()))
  on conflict(account_type,account_id) do update set
    package_key=excluded.package_key,
    status=excluded.status,
    ends_at=excluded.ends_at,
    updated_at=excluded.updated_at;

  return new;
end;
$$;

revoke all on function alva_private.sync_ttd_subscription_from_alva() from public, anon, authenticated;

drop trigger if exists alva_sync_ttd_subscription on public.alva_subscriptions;
create trigger alva_sync_ttd_subscription
before insert or update of product_id,plan_id,commercial_condition_id,status,metadata,start_date,end_date
on public.alva_subscriptions
for each row execute function alva_private.sync_ttd_subscription_from_alva();

-- La analítica de TTD acepta ahora el clic de promoción cruzada.
create or replace function public.track_card_event(
  p_account_type text,
  p_slug text,
  p_event_type text,
  p_source text default null::text,
  p_session_id uuid default null::uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_account_id uuid;
  v_features jsonb;
  v_status text;
begin
  if p_event_type not in ('page_view','whatsapp_click','call_click','instagram_click','facebook_click','service_click','vcard_download','share_click','qr_download','booking_click','map_click','review_click','cross_promo_click') then return; end if;

  if p_account_type='advisor' then
    select id into v_account_id from public.advisor_profiles where slug=p_slug and is_published=true limit 1;
  elsif p_account_type='business' then
    select id into v_account_id from public.business_profiles where slug=p_slug and is_published=true limit 1;
  else return;
  end if;
  if v_account_id is null then return; end if;

  select c.features,s.status into v_features,v_status
  from public.account_subscriptions s
  join public.package_catalog c on c.package_key=s.package_key
  where s.account_type=p_account_type and s.account_id=v_account_id
  limit 1;

  if coalesce(v_status,'active') not in ('active','trial') then return; end if;
  if not (coalesce(v_features,'[]'::jsonb) @> '["analytics"]'::jsonb) then return; end if;
  if jsonb_typeof(coalesce(p_metadata,'{}'::jsonb)) <> 'object' or length(coalesce(p_metadata,'{}'::jsonb)::text)>2048 then p_metadata:='{}'::jsonb; end if;

  insert into public.card_events(account_type,account_id,event_type,source,session_id,metadata)
  values(p_account_type,v_account_id,p_event_type,left(nullif(trim(p_source),''),40),p_session_id,coalesce(p_metadata,'{}'::jsonb));
end;
$$;

alter table public.card_events drop constraint if exists card_events_event_type_check;
alter table public.card_events add constraint card_events_event_type_check check (
  event_type = any (array[
    'page_view'::text,'whatsapp_click'::text,'call_click'::text,'instagram_click'::text,
    'facebook_click'::text,'service_click'::text,'vcard_download'::text,'share_click'::text,
    'qr_download'::text,'booking_click'::text,'map_click'::text,'review_click'::text,
    'cross_promo_click'::text
  ])
);
