# Integración ALVA ↔ TTD

## Objetivo
TTD es el primer producto conectado al control central de ALVA sin duplicar su panel operativo.

## División de responsabilidades
- **ALVA Admin**: cliente, plan comercial, estado, precio, vigencia, cobranza, soporte y vínculo con la cuenta externa.
- **TTD Admin**: creación y edición de tarjetas, contenido, apariencia, servicios, paquetes técnicos, respaldos y operación específica del producto.

## Infraestructura compartida
ALVA Core y TTD usan el mismo proyecto Supabase durante la etapa inicial (`lliedfgeegkqeopxvtze`). La información sigue separada por tablas y RLS.

## Acceso unificado
El propietario usa la misma identidad de Supabase en ALVA Admin y TTD Admin. El botón **Administrar TTD** abre el panel TTD y realiza un handoff de sesión entre los dos orígenes mediante `postMessage` con validación estricta de origen. La contraseña no se transmite ni se almacena en ALVA.

TTD vuelve a comprobar `is_super_admin()` antes de aceptar el acceso administrativo.

## URLs registradas
- Página comercial TTD: `https://ttd-alvasd.pages.dev/otros/?negocio=tu-tarjeta-digital`
- Administración TTD: `https://ttd-alvasd.pages.dev/admin/`
- Repositorio: `jeanmaxx/cya-asesor-digital`

## Planes reflejados en ALVA
- Básico
- Pro
- Premium
- PLAN PUBLICIDAD CRUZADA

Los precios de Básico, Pro y Premium permanecen sin definir en ALVA hasta aprobar la oferta comercial. Publicidad cruzada se registra a $0 para cuentas de cortesía/intercambio.

## Cuentas iniciales enlazadas
- Emmanuel Álvarez — Premium — activa — uso propio/laboratorio.
- Patrimonio Qro — Premium — prueba — uso propio/laboratorio.
- Studio Cavalier — Publicidad cruzada — activa — cortesía/intercambio.

La cuenta demo pública y el perfil comercial oficial de TTD no se contabilizan como clientes.

## Publicidad cruzada
TTD ya contiene el paquete técnico `cross_promo`, basado en las funciones Premium más la bandera `cross_promotion_cta`.

Pendiente de implementación visual:
- botón flotante **¿Quieres una tarjeta digital?**;
- logotipo TTD;
- enlace a la página comercial TTD con referencia de la tarjeta de origen;
- medición del clic/origen para atribución comercial.

Studio Cavalier ya quedó asignado al paquete `cross_promo`, pero el CTA no se renderiza todavía.

## Principio
**ALVA sabe qué tiene contratado cada cliente; TTD sabe cómo ejecutar y editar la tarjeta digital.**
