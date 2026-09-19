# Roadmap maestro — ALVA Soluciones Digitales

## Fase 1 — Identidad + presencia digital ✅
- Identidad visual corporativa.
- Sitio público responsive.
- Catálogo inicial: TTD, CRM y Producto 03.
- Shell visual del panel administrativo.
- Tema claro / oscuro.
- Publicación continua en Cloudflare Pages.

## Fase 2 — Núcleo administrativo ✅ OPERATIVA / EN REFINAMIENTO
- ✅ Autenticación de administradores con Supabase Auth.
- ✅ Base central de empresas/clientes.
- ✅ Catálogo maestro de productos y servicios.
- ✅ Usuario propietario y modelo de roles/permisos.
- ✅ Auditoría automática.
- ✅ Row Level Security.
- ✅ Integración real del panel `/admin/` con Supabase.
- 🔄 Refinamiento visual, validaciones y flujos de administración.

### Infraestructura actual
ALVA Core comparte temporalmente el proyecto Supabase **CyA Asesor Digital / TTD**. Toda la información administrativa de ALVA está aislada mediante tablas `alva_*`, RLS y helpers privados.

Esta arquitectura es deliberadamente económica para la etapa inicial y queda preparada para migrarse a un proyecto independiente cuando el volumen de clientes o ingresos lo justifique.

## Fase 3 — Suscripciones y licencias ✅ PRIMERA VERSIÓN OPERATIVA
- ✅ Relación cliente-producto.
- ✅ Planes por producto.
- ✅ Precio contratado y periodicidad.
- ✅ Vigencia, renovación y fecha final.
- ✅ Límite de usuarios/licencias como dato comercial central.
- ✅ Estados: prueba, activo, pausado, cancelado y vencido.
- ✅ Vínculo con cuenta/tenant externo y URL de acceso.
- ✅ **TTD es el primer producto conectado:** cuentas reales enlazadas mediante `alva_product_accounts`.
- ✅ Planes TTD reflejados: Básico, Pro, Premium y Publicidad cruzada.
- 🔄 Automatización futura de altas/bajas dentro de cada producto.

### Primera integración real — TTD
- ✅ Página comercial, panel administrativo, repositorio y Supabase registrados en ALVA.
- ✅ Emmanuel Álvarez enlazado como cliente interno/laboratorio.
- ✅ Patrimonio Qro enlazado como cuenta TTD en prueba.
- ✅ Studio Cavalier enlazado como cliente activo de cortesía.
- ✅ Studio Cavalier asignado al paquete técnico/comercial `cross_promo`.
- ✅ Acceso **Administrar TTD** desde ALVA con handoff de sesión entre ambos paneles y validación de administrador principal en TTD.
- 🔄 Sincronización automática bidireccional de estados/planes queda para una iteración posterior.

## Fase 4 — Comercial y cobranza ✅ PRIMERA VERSIÓN OPERATIVA
- ✅ Cargos/facturas administrativas con folio ALVA.
- ✅ Fechas de emisión y vencimiento.
- ✅ Subtotal, impuestos y total.
- ✅ Pagos, método y referencia.
- ✅ Actualización automática del estado al cubrir el total.
- ✅ Indicadores de saldo pendiente, vencido y cobrado en el mes.
- ✅ Privacidad financiera: por defecto solo **Propietario** tiene permisos de cobranza.
- ⏸ CFDI/facturación fiscal no se implementa todavía.

## Fase 5 — Soporte y operación ✅ PRIMERA VERSIÓN OPERATIVA
- ✅ Tickets por cliente, producto y suscripción.
- ✅ Prioridades y estados de atención.
- ✅ Responsable interno.
- ✅ Historial de mensajes/notas.
- ✅ Notas internas diferenciadas.
- ✅ Indicadores de tickets abiertos, urgentes y en espera.

## Fase 6 — Portal de cliente 🧱 FUNDAMENTO SEGURO PREPARADO
- ✅ Tabla de membresías por empresa.
- ✅ Roles futuros de portal.
- ✅ RLS de la membresía propia.
- ✅ Gestión reservada a roles administrativos autorizados.
- 🔒 **No se han abierto políticas de lectura sobre empresas, suscripciones, facturas o tickets a clientes.**
- ⏸ La interfaz del portal y las invitaciones se activarán cuando exista el primer caso real de cliente que necesite acceso.

## Fase 7 — Expansión multiproducto 🧱 FUNDAMENTO PREPARADO
- ✅ Registro de entornos por producto: producción, staging y desarrollo.
- ✅ URLs de aplicación/administración, repositorio y referencia de Supabase.
- ✅ Modelo central preparado para incorporar nuevos productos sin rediseñar ALVA Admin.
- ✅ Patrón de integración validado con TTD: ALVA administra negocio; el producto conserva su operación.\n- ✅ CRM registrado en ALVA Core con repositorio, Supabase independiente y URLs canónicas objetivo.\n- ✅ Fase F: panel de integración CRM preparado sin consultar datos operativos del producto.\n- ⏸ CRM permanece `planned`; la activación de producción y actualización final de accesos se ejecutan en Fase G.
- ⏸ Incorporación funcional del Producto 03 cuando queden definidos nombre, propósito e integración.
- 🔄 Métricas consolidadas crecerán conforme exista información real.

## Pendientes no bloqueantes
- Crear favicon ALVA con fondo/círculo claro para evitar pérdida de contraste.
- Revisar favicon/logo blanco del CRM cuando retomemos ese producto.
- TTD Publicidad cruzada: renderizar CTA flotante **¿Quieres una tarjeta digital?** con logo TTD.
- TTD Publicidad cruzada: añadir parámetro/referral de origen y medición de clic para atribución comercial.

## Principio arquitectónico

**ALVA Admin sabe qué tiene contratado cada cliente; cada producto sabe cómo ejecutar su propia función.**

Esto evita duplicar lógica operativa y permite que cada aplicación evolucione de manera independiente.
