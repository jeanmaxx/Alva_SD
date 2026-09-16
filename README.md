# ALVA Soluciones Digitales

Plataforma corporativa y administrativa de **ALVA Soluciones Digitales**.

## Objetivo

Este repositorio es el núcleo web de ALVA: sitio público, catálogo de soluciones y zona administrativa para gestionar clientes, productos, licencias, suscripciones, cobranza y soporte.

## Productos iniciales

- **TTD** — producto activo.
- **CRM** — producto activo.
- **Producto 03** — reservado para la siguiente plataforma.

## Arquitectura prevista

- `alvasd.com` → sitio corporativo.
- `admin.alvasd.com` → administración ALVA.
- `ttd.alvasd.com` → TTD.
- `crm.alvasd.com` → CRM.
- futuros productos → subdominios independientes.

Actualmente el despliegue público está en Cloudflare Pages y `/admin/` ya utiliza datos reales.

## Identidad visual

- Grafito principal: `#4B4B4D`
- Grafito secundario: `#606062`
- Ámbar principal: `#F9C811`
- Ámbar secundario: `#EFAF2D`
- Fondo claro: `#F7F7F5`
- Tipografía corporativa: Manrope
- Isotipo y logotipo oficiales integrados en `assets/brand/`.
- Tema claro / oscuro compartido entre sitio público y ALVA Admin.

## Fase actual

**Fase 2 — Núcleo administrativo operativo / en refinamiento.**

Ya están conectados:
- Supabase Auth;
- cuenta propietaria de ALVA;
- empresas/clientes;
- catálogo maestro de productos;
- usuarios, roles y permisos;
- auditoría;
- Row Level Security.

### Supabase
Para optimizar costos en la etapa inicial, ALVA Core comparte el proyecto **CyA Asesor Digital**, manteniendo una separación lógica estricta mediante tablas `alva_*` y helpers privados.

La cuenta propietaria inicial es `jean.maxx@gmail.com` con rol **Propietario**.

Consulta `docs/PHASE2.md` para el detalle técnico y `docs/ROADMAP.md` para las siguientes fases.
