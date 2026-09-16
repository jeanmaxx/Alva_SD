# Fase 2 — Núcleo administrativo de ALVA

## Objetivo
Convertir `ALVA Admin` de una interfaz demostrativa a un sistema real con autenticación, persistencia de datos, permisos y auditoría.

## Arquitectura
ALVA debe utilizar un proyecto Supabase independiente de los productos operativos (`CyA CRM`, `CyA Asesor Digital`, TTD y futuros productos). El panel central administra el negocio de ALVA; cada producto conserva su propia lógica operativa.

## Alcance de esta fase
- Autenticación de usuarios internos.
- Roles: Propietario, Administrador, Operador y Consulta.
- Permisos granulares.
- Empresas / clientes.
- Catálogo maestro de productos y servicios.
- Auditoría básica de cambios.
- RLS desde la primera migración.

## Fuera de alcance por ahora
Se preparan las relaciones necesarias, pero la lógica funcional de los siguientes módulos queda para fases posteriores:
- Suscripciones y licencias (Fase 3).
- Renovaciones y suspensiones (Fase 3).
- Cobranza e ingresos recurrentes (Fase 4).
- Tickets y soporte (Fase 5).
- Portal de cliente (Fase 6).

## Migración preparada
`supabase/migrations/001_phase2_core.sql`

Incluye:
- `roles`
- `permissions`
- `role_permissions`
- `profiles`
- `companies`
- `products`
- `audit_logs`
- helpers de permisos
- triggers de `updated_at`
- auditoría automática
- políticas RLS
- productos iniciales: TTD, CRM y Producto 03

## Estado de creación del proyecto Supabase
El proyecto independiente `ALVA Soluciones Digitales` fue solicitado en la misma organización de Supabase y región `us-east-1`.

Supabase confirmó costo de **$0/mes**, pero la creación fue rechazada porque el propietario de la organización ya alcanzó el límite de **2 proyectos gratuitos activos**.

Proyectos activos actuales:
- CyA CRM
- CyA Asesor Digital

Para continuar con una base independiente de ALVA se requiere una de estas acciones:
1. actualizar el plan de Supabase para permitir un proyecto activo adicional; o
2. pausar/eliminar uno de los dos proyectos gratuitos actuales.

No se reutilizará una base existente sin una decisión explícita, para evitar acoplar el núcleo de ALVA a un producto específico.
