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

## Estado durante Fase F
El entorno `production` del producto CRM se registra en `alva_product_environments` con estado **planned**. Las URLs canónicas objetivo quedan documentadas, pero ALVA no las considera activas todavía.

Para pruebas se usa el preview de la migración:
- `https://migration-alva-crm-phase-b.crm-alvasd.pages.dev/`
- `https://migration-alva-crm-phase-b.crm-alvasd.pages.dev/admin/`

El corte a producción pertenece a la **Fase G**, después del QA completo. En ese momento el entorno se cambia a `active` y se sincronizan los accesos de producto/administración.

## Repositorio
`https://github.com/jeanmaxx/CyA_CRM`

## Regla arquitectónica
**ALVA sabe qué producto existe, quién lo contrata y cuál es su estado comercial; ALVA CRM conserva y ejecuta toda la operación de sus tenants.**
