# Roadmap maestro — ALVA Soluciones Digitales

## Fase 1 — Identidad + presencia digital ✅
- Identidad visual corporativa.
- Sitio público responsive.
- Catálogo inicial: TTD, CRM y Producto 03.
- Shell visual del panel administrativo.
- Tema claro / oscuro.
- Publicación continua en Cloudflare Pages.

## Fase 2 — Núcleo administrativo 🚧 EN CURSO
- Autenticación de administradores.
- Base central de empresas/clientes.
- Catálogo maestro de productos y servicios.
- Usuarios internos, roles y permisos.
- Auditoría básica.
- RLS desde la primera migración.

Migración preparada: `supabase/migrations/001_phase2_core.sql`.

Estado de infraestructura: la creación del proyecto Supabase independiente `ALVA Soluciones Digitales` está pendiente por el límite de dos proyectos gratuitos activos de la organización. No se reutilizará una base de otro producto sin decisión explícita.

## Fase 3 — Suscripciones y licencias
- Relación cliente-producto.
- Plan, vigencia, usuarios permitidos y estado.
- Renovaciones y suspensiones.
- Integración progresiva con TTD y CRM.

## Fase 4 — Comercial y cobranza
- Importes contratados.
- Periodicidad y próximas fechas de pago.
- Historial de cobros.
- Estado de cuenta por cliente.
- Indicadores de ingresos recurrentes.

## Fase 5 — Soporte y operación
- Tickets/incidencias.
- Prioridad, producto, cliente y responsable.
- Historial de atención.
- Métricas de servicio.

## Fase 6 — Portal de cliente
- Inicio de sesión por empresa.
- Productos contratados.
- Usuarios/licencias.
- Estado de servicio y renovaciones.
- Solicitudes de soporte.

## Fase 7 — Expansión multiproducto
- Incorporación del Producto 03.
- Plantilla estándar para nuevos productos ALVA.
- Subdominios independientes.
- Métricas consolidadas del ecosistema.

## Principio arquitectónico

**ALVA Admin sabe qué tiene contratado cada cliente; cada producto sabe cómo ejecutar su propia función.**

Esto evita duplicar lógica operativa y permite que cada aplicación evolucione de manera independiente.
