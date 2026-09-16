# Fase 2 — Núcleo administrativo de ALVA

## Objetivo
Convertir `ALVA Admin` de una interfaz demostrativa a un sistema real con autenticación, persistencia, permisos y auditoría.

## Decisión de infraestructura
Durante la etapa inicial, **ALVA Core comparte el proyecto Supabase `CyA Asesor Digital`**.

Esta decisión responde a tres condiciones actuales:
- el plan gratuito permite dos proyectos activos;
- TTD / Asesor Digital tiene una carga de datos moderada;
- a corto y mediano plazo el único administrador de ALVA será el propietario.

La separación se mantiene a nivel lógico: todas las tablas y funciones administrativas de ALVA usan prefijos `alva_` y helpers privados, sin reutilizar tablas operativas de Asesor Digital.

Cuando el negocio justifique una infraestructura superior, ALVA podrá migrarse a un proyecto independiente sin rediseñar la aplicación.

## Cuenta propietaria inicial
- Correo: `jean.maxx@gmail.com`
- Rol ALVA: **Propietario**
- Estado: activo

La misma identidad podrá utilizarse como cuenta administrativa principal en los distintos productos. Los usuarios adicionales se crearán con cuentas individuales cuando exista necesidad operativa real.

## Alcance implementado
- Supabase Auth conectado a `/admin/`.
- Roles: Propietario, Administrador, Operador y Consulta.
- Permisos granulares.
- Directorio de empresas/clientes.
- Catálogo maestro de productos y servicios.
- Auditoría automática de cambios.
- Row Level Security (RLS).
- Separación lógica respecto de CyA Asesor Digital.
- Productos iniciales: TTD, CRM y Producto 03.

## Tablas ALVA
- `alva_roles`
- `alva_permissions`
- `alva_role_permissions`
- `alva_profiles`
- `alva_companies`
- `alva_products`
- `alva_audit_logs`

Los helpers de seguridad sensibles se alojan en el esquema privado `alva_private`.

## Fuera de alcance por ahora
- Suscripciones y licencias (Fase 3).
- Renovaciones y suspensiones (Fase 3).
- Cobranza e ingresos recurrentes (Fase 4).
- Tickets y soporte (Fase 5).
- Portal de cliente (Fase 6).

## Seguridad
Las tablas ALVA tienen RLS activo. El panel utiliza únicamente la URL del proyecto y una **publishable key**, que es adecuada para aplicaciones cliente; la autorización real depende de la sesión de Supabase Auth y las políticas RLS.

Después de las migraciones ALVA, el asesor de seguridad de Supabase no reporta advertencias nuevas relacionadas con las funciones de ALVA. Permanecen avisos previos correspondientes a funciones públicas de CyA Asesor Digital y la recomendación general de habilitar protección contra contraseñas filtradas.

## Estado
**Fase 2 operativa en primera versión.**

Cloudflare Pages publica automáticamente los cambios de `main` en `https://alva-sd.pages.dev`.
