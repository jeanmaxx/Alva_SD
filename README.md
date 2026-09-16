# ALVA Soluciones Digitales

Plataforma corporativa y administrativa de **ALVA Soluciones Digitales**.

## Objetivo
Este repositorio es el núcleo web de ALVA: sitio público, catálogo de soluciones y zona administrativa para gestionar clientes, productos, licencias, suscripciones, cobranza y soporte.

## Productos iniciales
- **TTD** — producto activo y primer producto conectado a ALVA Admin.
- **CRM** — producto activo; integración posterior.
- **Producto 03** — reservado para la siguiente plataforma.

## Arquitectura prevista
- `alvasd.com` → sitio corporativo.
- `admin.alvasd.com` → administración ALVA.
- `ttd.alvasd.com` → TTD.
- `crm.alvasd.com` → CRM.
- futuros productos → subdominios independientes.

Actualmente el despliegue público está en Cloudflare Pages y `/admin/` utiliza datos reales.

## Identidad visual
- Grafito principal: `#4B4B4D`
- Grafito secundario: `#606062`
- Ámbar principal: `#F9C811`
- Ámbar secundario: `#EFAF2D`
- Fondo claro: `#F7F7F5`
- Tipografía corporativa: Manrope
- Isotipo y logotipo oficiales integrados en `assets/brand/`.
- Tema claro / oscuro compartido entre sitio público y ALVA Admin.

## Estado funcional

### Núcleo ALVA
- Supabase Auth.
- cuenta propietaria de ALVA.
- empresas/clientes.
- catálogo maestro de productos.
- usuarios, roles y permisos.
- auditoría y RLS.
- suscripciones/licencias.
- cobranza administrativa.
- soporte/tickets.
- fundamento seguro para portal de cliente.

### Primera integración de producto — TTD
TTD conserva su panel operativo y ALVA concentra el control comercial. Ya están enlazados:
- entorno de producción, panel, repositorio y proyecto Supabase;
- planes Básico, Pro, Premium y Publicidad cruzada;
- cuentas reales de Emmanuel Álvarez, Patrimonio Qro y Studio Cavalier;
- vínculo `alva_product_accounts` entre la suscripción de ALVA y la cuenta técnica de TTD;
- acceso **Administrar TTD** desde ALVA con handoff de sesión para la cuenta propietaria.

Consulta `docs/TTD_INTEGRATION.md` para el detalle.

## Supabase
Para optimizar costos en la etapa inicial, ALVA Core comparte el proyecto **CyA Asesor Digital / TTD**, manteniendo separación lógica mediante tablas `alva_*`, RLS y helpers privados.

La cuenta propietaria inicial es `jean.maxx@gmail.com` con rol **Propietario**.

Consulta `docs/PHASE2.md` para el núcleo y `docs/ROADMAP.md` para el estado general del proyecto.
