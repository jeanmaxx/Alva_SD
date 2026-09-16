-- ALVA Soluciones Digitales — Privacidad financiera inicial.
-- Mientras el propietario sea el único responsable de costos/cobranza,
-- ningún rol adicional recibe estos permisos por defecto.

delete from public.alva_role_permissions rp
using public.alva_roles r, public.alva_permissions p
where rp.role_id=r.id and rp.permission_id=p.id
  and r.slug<>'owner'
  and p.code in ('billing.read','billing.write');

insert into public.alva_role_permissions(role_id,permission_id)
select r.id,p.id
from public.alva_roles r
cross join public.alva_permissions p
where r.slug='owner'
  and p.code in ('billing.read','billing.write')
on conflict do nothing;
