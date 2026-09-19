# Integración ALVA Core ↔ ALVA CRM · Fase F

## Objetivo
Registrar ALVA CRM dentro del control central de ALVA sin trasladar ni duplicar su operación.

## División de responsabilidades
- **ALVA Admin**: catálogo del producto, cliente/empresa, plan comercial, suscripción, cobranza, soporte y referencias técnicas del entorno.
- **ALVA CRM**: tenants, usuarios del CRM, prospectos, clientes, agenda, contratos, colaboradores, finanzas operativas y cualquier otra información propia del CRM.

## Separación de infraestructura
- **ALVA Core** continúa en Supabase `lliedfgeegkqeopxvtze` durante esta etapa.
- **ALVA CRM** conserva su Supabase independiente `ibhgisndtaclvwznqugu`.
- ALVA Admin no consulta tablas operativas del CRM y el CRM no depende de las tablas `alva_*` para ejecutar su operación diaria.

## URLs canónicas objetivo
- Landing CRM: `https://crm-alvasd.pages.dev/`
- Demo: `https://crm-alvasd.pages.dev/demo/`
- CRM Control Center: `https://crm-alvasd.pages.dev/admin/`
- Tenant: `https://crm-alvasd.pages.dev/app/<tenant>/`
- Colaboradores: `https://crm-alvasd.pages.dev/app/<tenant>/colaboradores/`
- Alias C&A: `https://crm-alvasd.pages.dev/C&ACRM/`
- Alias colaboradores C&A: `https://crm-alvasd.pages.dev/C&ACRM/Colaboradores/`

## Estado productivo — Fase G
El corte productivo quedó completado el **19/09/2026**.

- `alva_product_environments.environment = production`
- estado: **active**
- `cutover_pending = false`
- página oficial: `https://crm-alvasd.pages.dev/`
- Control Center: `https://crm-alvasd.pages.dev/admin/`
- `platform-admin` productivo utiliza URLs canónicas multi-tenant.
- Los previews de migración se conservan únicamente como referencia técnica y respaldo del proceso.

La operación continúa separada: ALVA Core registra el producto y su relación comercial/técnica; ALVA CRM mantiene los datos y procesos de cada tenant en su propio Supabase.

## Repositorio
`https://github.com/jeanmaxx/CyA_CRM`

## Regla arquitectónica
**ALVA sabe qué producto existe, quién lo contrata y cuál es su estado comercial; ALVA CRM conserva y ejecuta toda la operación de sus tenants.**
