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

**Fase 2 — Núcleo administrativo.**

Objetivos inmediatos:
- autenticación de administradores;
- base central de empresas/clientes;
- catálogo maestro de productos y servicios;
- usuarios internos, roles y permisos;
- auditoría básica;
- Row Level Security desde la primera migración.

La migración inicial está preparada en:

`supabase/migrations/001_phase2_core.sql`

> Estado de infraestructura: la creación del proyecto Supabase independiente `ALVA Soluciones Digitales` está pendiente porque la organización alcanzó el límite de dos proyectos gratuitos activos. Ver `docs/PHASE2.md`.
