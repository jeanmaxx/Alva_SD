# Roadmap maestro — ALVA Soluciones Digitales

## Fase 1 — Identidad + presencia digital ✅
- Identidad visual corporativa.
- Sitio público responsive.
- Catálogo inicial: TTD, CRM y Producto 03.
- Shell visual del panel administrativo.
- Tema claro / oscuro.
- Publicación continua en Cloudflare Pages.

## Fase 2 — Núcleo administrativo 🚧 OPERATIVA / EN REFINAMIENTO
- ✅ Autenticación de administradores con Supabase Auth.
- ✅ Base central de empresas/clientes.
- ✅ Catálogo maestro de productos y servicios.
- ✅ Usuario propietario y modelo de roles/permisos.
- ✅ Auditoría automática.
- ✅ Row Level Security.
- ✅ Integración real del panel `/admin/` con Supabase.
- 🔄 Refinamiento visual, validaciones y flujos de administración.

### Infraestructura actual
ALVA Core comparte temporalmente el proyecto Supabase **CyA Asesor Digital**. Toda la información administrativa de ALVA está aislada mediante tablas `alva_*` y helpers privados.

Esta arquitectura es deliberadamente económica para la etapa inicial y queda preparada para migrarse a un proyecto independiente cuando el volumen de clientes o ingresos lo justifique.

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

## Pendientes visuales no bloqueantes
- Crear favicon ALVA con fondo/círculo claro para evitar pérdida de contraste.
- Revisar favicon/logo blanco del CRM cuando retomemos ese producto.

## Principio arquitectónico

**ALVA Admin sabe qué tiene contratado cada cliente; cada producto sabe cómo ejecutar su propia función.**

Esto evita duplicar lógica operativa y permite que cada aplicación evolucione de manera independiente.
