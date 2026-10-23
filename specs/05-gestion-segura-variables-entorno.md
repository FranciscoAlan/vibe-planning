# SPEC 05 — Gestión segura de variables de entorno

> **Estado:** Aprobado
> **Depende de:** Ninguna
> **Fecha:** 2026-10-23
> **Objetivo:** Documentar y operar las variables de entorno de la API para `dev`, `qa` y `prod` mediante Doppler, con inventario reconciliado y respaldos manuales cifrados y restaurables.

## Why this spec exists

La lista de variables de `apps/api/README.md`, la plantilla `apps/api/.env.example` y las referencias del código no están sincronizadas. La API ya documenta Doppler, pero el repositorio no define una guía central para separar entornos ni un procedimiento seguro de respaldo y restauración.

## Scope

**In:**

- Crear `docs/environment-variables.md` en español como fuente central del inventario y la guía operativa de variables de la API.
- Reconciliar el inventario con las referencias de `apps/api/src`, `apps/api/.env.example` y la documentación existente; indicar propósito, sensibilidad y si cada variable es requerida, opcional o tiene un valor predeterminado según el comportamiento actual.
- Definir el proyecto Doppler `vibe-planners` y las configuraciones `dev`, `qa` y `prod`, con permisos separados y acceso a producción limitado a operadores autorizados.
- Documentar la configuración inicial del CLI y la ejecución de la API usando explícitamente cada configuración de Doppler.
- Mantener `apps/api/.env.example` como plantilla versionada sin credenciales reales ni valores exportados desde Doppler. Puede conservar valores de ejemplo no sensibles para desarrollo.
- Documentar exportaciones manuales separadas por entorno, cifradas con `age`, antes de cambiar o rotar secretos. La clave privada de `age` y los respaldos cifrados permanecen fuera del repositorio.
- Usar almacenamiento externo aprobado y controlado por la organización para los respaldos; la selección y provisión del proveedor quedan fuera de esta especificación.
- Documentar cómo verificar el descifrado y restaurar un respaldo en una configuración Doppler aislada, sin sobrescribir los entornos activos durante la validación.
- Actualizar `apps/api/README.md` para enlazar la guía central y retirar o reconciliar su inventario duplicado.

**Out of scope (for future specs):**

- Gestionar variables de entorno de web, móvil, backoffice u otros paquetes del monorepo.
- Crear o administrar el proyecto/configuraciones en una cuenta real de Doppler, almacenar secretos reales o aprovisionar permisos en servicios externos.
- Integrar Doppler con CI/CD, hosting, despliegues o infraestructura.
- Automatizar exportaciones, cifrado, programación de respaldos o restauraciones mediante scripts o servicios.
- Seleccionar o aprovisionar el almacenamiento externo de respaldos de la organización.
- Rotar credenciales de proveedores, cambiar valores por entorno o modificar el comportamiento de configuración de la API.

## Data model

Esta especificación no introduce modelos de base de datos ni estructuras persistentes nuevas en el repositorio. La configuración operativa externa a crear/documentar es:

- Proyecto Doppler: `vibe-planners`.
- Configuraciones: `dev`, `qa` y `prod`, con valores y acceso separados por entorno.
- Respaldos manuales: una exportación por configuración, cifrada con `age` para un destinatario autorizado y almacenada fuera del repositorio.

La clave privada de `age`, los secretos en texto claro y los archivos de exportación sin cifrar no se guardan ni se registran en Git.

## Implementation plan

1. Reunir las variables referenciadas por el código de la API y cotejarlas con `apps/api/.env.example` y `apps/api/README.md`; documentar su propósito, sensibilidad y requisito/default verificados.
2. Crear `docs/environment-variables.md` con el inventario reconciliado, la convención `vibe-planners` (`dev`, `qa`, `prod`), permisos por entorno y pasos para configurar Doppler y ejecutar la API seleccionando la configuración explícitamente.
3. Añadir a la guía el procedimiento manual de exportación por configuración, cifrado con `age`, almacenamiento externo aprobado, verificación del respaldo y restauración aislada. Incluir las precauciones para que valores y claves privadas no queden en el repositorio, historial de comandos ni registros.
4. Revisar `apps/api/.env.example` para que los valores sensibles sean placeholders inequívocos y no credenciales utilizables; conservar únicamente ejemplos no sensibles apropiados para desarrollo.
5. Actualizar `apps/api/README.md` para enlazar la guía central y eliminar discrepancias entre los inventarios. Seguir la guía desde una configuración `dev` de Doppler y comprobar que la API inicia; comprobar también que el procedimiento de respaldo y restauración aislada está documentado y no requiere sobrescribir configuraciones activas.

## Acceptance criteria

- [ ] `docs/environment-variables.md` existe en español y es la fuente central de las variables de la API.
- [ ] El inventario cubre las variables referenciadas en `apps/api/src`, además de las que aparecen en `apps/api/.env.example` y `apps/api/README.md`; cada entrada describe su sensibilidad y requisito/default verificados.
- [ ] La guía documenta el proyecto `vibe-planners`, las configuraciones `dev`, `qa` y `prod`, permisos separados y acceso restringido a producción.
- [ ] La guía muestra cómo seleccionar explícitamente cada configuración Doppler al ejecutar la API y no depende de cargar accidentalmente otro entorno.
- [ ] `apps/api/.env.example` no contiene secretos reales, exportaciones de Doppler ni credenciales utilizables; los valores sensibles usan placeholders no funcionales.
- [ ] `apps/api/README.md` enlaza la guía central y no mantiene una lista contradictoria de variables.
- [ ] El procedimiento de respaldo indica exportar cada configuración antes de modificar o rotar secretos, cifrar con `age` y almacenar el resultado fuera del repositorio en una ubicación aprobada por la organización.
- [ ] La guía mantiene la clave privada de `age` fuera del repositorio y evita exponer texto claro en Git, registros o historial de comandos.
- [ ] La restauración está descrita y su verificación usa una configuración aislada, sin sobrescribir `dev`, `qa` o `prod`.
- [ ] La API inicia con la configuración `dev` siguiendo los pasos documentados.

## Decisions

- **Sí:** Doppler es la fuente operativa de variables, con un proyecto y configuraciones separados por entorno. Reduce la dependencia de archivos `.env` locales y evita mezclar valores de producción con los de desarrollo.
- **No:** Automatización de CI/CD o creación de recursos Doppler desde el repositorio. Requiere decisiones de despliegue y permisos externos que no son necesarias para documentar el flujo local.
- **Sí:** respaldos manuales cifrados con `age` antes de cambios o rotaciones, con restauración de prueba aislada. Mantiene la recuperación operable sin introducir credenciales de automatización.
- **No:** exportaciones sin cifrar, claves privadas o respaldos dentro del repositorio. El historial de Git no es un almacén de secretos ni un destino de respaldo seguro.
- **Sí:** almacenamiento externo aprobado por la organización, sin fijar proveedor en esta especificación. El proveedor y sus controles dependen de la política organizacional.
- **No:** copiar secretos de `prod` a `qa` o `dev`. Cada entorno mantiene valores y permisos independientes.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Un inventario incompleto lleva a omitir una variable necesaria o a documentar una que ya no se usa. | Cotejar referencias de código, plantilla y README, y verificar cada requisito o valor predeterminado en el comportamiento actual. |
| Un respaldo cifrado no se puede recuperar si se pierde la clave privada o el acceso al almacenamiento. | Custodiar la clave privada en un mecanismo organizacional aprobado y validar periódicamente el descifrado y la restauración aislada. |
| Los secretos de producción se filtran o reutilizan en otros entornos. | Restringir accesos, mantener configuraciones separadas y prohibir la copia de valores de `prod` a `qa` o `dev`. |

## What is **not** in this spec

- Variables de entorno de aplicaciones distintas de la API.
- Automatización de respaldos o integración CI/CD.
- Aprovisionamiento de Doppler o de almacenamiento externo.
- Rotación o modificación de secretos reales.

Estos temas requieren especificaciones separadas si se incorporan al alcance futuro.
