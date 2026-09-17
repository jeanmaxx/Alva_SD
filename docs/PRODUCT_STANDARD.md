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

## Estándar visual administrativo ALVA

Los productos de ALVA deben sentirse parte de la misma familia aunque tengan funciones distintas. La administración de TTD, CRM y productos futuros reutilizará el mismo lenguaje visual base de ALVA Admin.

Elementos compartidos:

- Manrope como tipografía principal de administración.
- Navegación lateral o equivalente responsive.
- Header superior compacto.
- Cards, tablas, badges, inputs, modales y estados coherentes.
- Tema claro y oscuro.
- Espaciado, radios, bordes y jerarquía visual comunes.
- Estados de carga, vacío, error y éxito consistentes.
- Navegación por módulos y rutas humanas mediante `slug` cuando corresponda.

Cada producto puede conservar un color de acento propio. ALVA mantiene grafito/ámbar; TTD utiliza azul marino/cian. La identidad pública de cada cliente no se modifica por este estándar administrativo.

La fórmula de marca para productos será:

**PANEL DE ADMINISTRACIÓN DE**  
**[NOMBRE DEL PRODUCTO]**  
*Una solución de ALVA Soluciones Digitales.*

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

La administración del CRM deberá adoptar el estándar visual administrativo ALVA desde su primera versión formal.

## TTD

La estructura objetivo de TTD es:

- `/` — Landing comercial oficial.
- `/demo/` — Demostración de tarjeta.
- `/admin/` — Home administrativo central TTD.
- `/admin/personales/` — Tarjetas Digitales Personales.
- `/admin/personales/<slug>` — Administración individual de tarjeta personal.
- `/admin/barberias/` — Barberías.
- `/admin/barberias/<slug>` — Administración individual de barbería.
- `/admin/otros/` — Otros Negocios.
- Rutas públicas de tarjetas — Experiencias de clientes.

Nomenclatura vigente:

- `Tarjetas Digitales Asesores` pasa a `Tarjetas Digitales Personales`.
- `Estéticas y Barberías` pasa a `Barberías`.
- `Otros Negocios` se conserva como vertical flexible y se ubica al final de la navegación.

Las rutas heredadas pueden mantenerse temporalmente mediante redirecciones para evitar romper enlaces, QR o accesos existentes.

La antigua URL comercial basada en `/otros/?negocio=tu-tarjeta-digital` puede mantenerse temporalmente por compatibilidad, pero la raíz del dominio es la URL comercial principal.
