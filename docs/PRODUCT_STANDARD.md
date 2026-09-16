# Estándar ALVA para productos SaaS

Este documento define la estructura base que deberán seguir TTD, CRM y las próximas aplicaciones de ALVA Soluciones Digitales.

## Estructura pública y operativa

Cada producto deberá separar claramente sus superficies:

- `/` — Landing comercial oficial del producto.
- `/demo/` — Demostración controlada con información ficticia o de muestra.
- `/admin/` — Administración específica del producto.
- `/app/` — Aplicación operativa del cliente cuando el producto requiera un entorno de trabajo separado.

En productos cuya experiencia principal sea una publicación pública (como TTD), las URLs de clientes pueden conservar rutas específicas por tipo de tarjeta o negocio sin forzar `/app/`.

## Relación con ALVA Admin

ALVA Admin es el centro de control del negocio y no debe duplicar la lógica operativa de cada producto.

**ALVA Admin sabe qué tiene contratado cada cliente; cada producto sabe cómo ejecutar su propia función.**

ALVA Admin administra, entre otros:

- Empresas/clientes.
- Producto contratado.
- Plan funcional.
- Condición comercial.
- Suscripción/licencia.
- Estado del servicio.
- Renovaciones y cobranza.
- Accesos directos al producto y a su panel administrativo.

El panel administrativo de cada producto administra sus funciones internas, usuarios operativos, configuración y capacidades particulares.

## Plan funcional y condición comercial

No se deben mezclar capacidades del producto con excepciones comerciales.

Ejemplo:

- Plan funcional: Básico / Pro / Premium.
- Condición comercial: Normal / Prueba / Publicidad cruzada / Cortesía / Convenio / Descuento especial.

Una cortesía o convenio puede otorgar cualquier plan funcional sin crear un plan técnico adicional.

## Integración progresiva

La integración recomendada entre ALVA y cada producto es incremental:

1. Registrar producto, planes y entornos.
2. Enlazar cuentas existentes.
3. Permitir abrir administración específica desde ALVA.
4. Incorporar SSO cuando sea conveniente.
5. Automatizar aprovisionamiento, suspensión y reactivación.
6. Sincronizar métricas resumidas sin duplicar operación.

## CRM

La estructura objetivo del CRM será:

- `/` — Landing comercial.
- `/demo/` — CRM demostrativo con datos ficticios y capacidad de restauración.
- `/admin/` — Administración SaaS del producto.
- `/app/` — CRM operativo real.

## TTD

La estructura objetivo de TTD será:

- `/` — Landing comercial oficial.
- `/demo/` — Demostración de tarjeta.
- `/admin/` — Administración específica TTD.
- Rutas públicas de tarjetas — Experiencias de clientes.

La antigua URL comercial basada en `/otros/?negocio=tu-tarjeta-digital` puede mantenerse temporalmente por compatibilidad, pero la raíz del dominio es la URL comercial principal.
