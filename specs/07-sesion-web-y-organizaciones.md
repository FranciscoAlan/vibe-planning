# SPEC 07 — Sesión web y selección de organización

> **Estado:** Implementado
> **Depende de:** SPEC 04, SPEC 06
> **Fecha:** 2026-11-02
> **Objetivo:** Integrar el inicio de sesión web de proveedores con la API de identidad mediante cookies seguras, selección de organización y acceso protegido al dashboard.

## Scope

**In:**

- Reemplazar el placeholder de `/login` con inicio de sesión por email y contraseña para cuentas existentes, activas y verificadas.
- Completar el desafío TOTP si la API lo solicita, sin incluir configuración ni administración de 2FA.
- Gestionar tokens exclusivamente en rutas servidoras de Next.js mediante cookies `HttpOnly`; el navegador no recibe ni guarda tokens en JavaScript o `localStorage`.
- Añadir `GET /identity/organizations` para listar las organizaciones del usuario con membresía `OWNER` o `PROVIDER`, incluyendo identificador, nombre y rol.
- Seleccionar automáticamente la organización si existe una sola; mostrar un selector si hay varias y permitir cambiar la organización desde el dashboard.
- Incluir `x-tenant-id` en las solicitudes organizacionales y dejar que la API valide cada membresía.
- Renovar la sesión usando la rotación de refresh tokens existente, cerrar sesión en la API y proteger `/dashboard`.
- Mostrar un estado explicativo y la opción de cerrar sesión cuando la cuenta no tenga una membresía `OWNER` o `PROVIDER`.
- Mantener esta interfaz en español.
- Mantener las llamadas HTTP dentro de servicios `*.api.service.ts`.

**Out of scope (for future specs):**

- Registro de usuarios, creación de organizaciones, invitaciones o administración de membresías.
- Inicio de sesión social, OTP por teléfono, verificación de email/teléfono, recuperación o cambio de contraseña.
- Alta o configuración de 2FA, y acceso de backoffice.
- Gestión de publicaciones, reservas, pagos y demás funcionalidades del dashboard.
- Aplicación móvil e internacionalización completa.
- Cambios al esquema de base de datos o instalación de dependencias nuevas.

## Data model

No se introducen modelos persistentes ni cambios de base de datos. La sesión usa cookies gestionadas por el servidor:

- `vp_access_token`: access token con duración alineada con la API, 15 minutos por defecto.
- `vp_refresh_token`: refresh token con duración alineada con la configuración de la API, 30 días por defecto.
- `vp_active_tenant_id`: organización activa; se elimina al cerrar sesión.
- `vp_2fa_challenge`: desafío temporal, solo cuando se requiere TOTP; expira en 5 minutos.

Las cookies usan `HttpOnly`, `SameSite=Lax`, `Path=/` y `Secure` en producción, sin atributo `Domain`. El identificador de organización se considera no confiable y la API valida la membresía en cada solicitud.

## Implementation plan

1. Añadir `GET /identity/organizations` en `apps/api/src/modules/identity/identity.controller.ts` y `identity.service.ts`. Devolver únicamente las membresías `OWNER` y `PROVIDER` del usuario autenticado. Cubrir autorización y aislamiento entre usuarios con pruebas de identidad.
2. Crear `apps/web/src/services/identity.api.service.ts` y rutas servidoras de Next.js bajo `apps/web/src/app/api/session/` para inicio de sesión, verificación TOTP, renovación, cierre de sesión y selección de organización. Aplicar cookies seguras y validar el origen de solicitudes que cambian estado.
3. Reemplazar el placeholder de `apps/web/src/app/(auth)/login/page.tsx` y actualizar `apps/web/src/app/(dashboard)/dashboard/page.tsx` para completar inicio de sesión, resolver membresías, permitir cambiar de organización y proteger el dashboard. Mantener el dashboard como espacio provisional, sin gestión de publicaciones.
4. Añadir cobertura Playwright en `apps/web/tests/session.spec.ts` para inicio de sesión, TOTP, selección y cambio de organización, renovación, cierre de sesión y acceso protegido; mantener pruebas unitarias/API con las herramientas existentes.

## Acceptance criteria

- [x] `GET /identity/organizations` exige autenticación y solo devuelve las membresías `OWNER` o `PROVIDER` del usuario autenticado.
- [x] El inicio de sesión válido establece cookies `HttpOnly`; ni el cuerpo de respuesta ni `localStorage` exponen tokens.
- [x] Si la API solicita TOTP, la web permite verificar el código y no crea una sesión antes de una verificación correcta.
- [x] Las cookies respetan las duraciones configuradas, `SameSite=Lax` y `Secure` en producción.
- [x] Una sola organización se selecciona automáticamente; varias muestran un selector y permiten cambiar la organización desde el dashboard.
- [x] Las operaciones organizacionales incluyen el tenant activo y una organización no autorizada es rechazada por la API.
- [x] Una cuenta sin membresías aptas ve un estado explicativo y puede cerrar sesión.
- [x] Una sesión expirada se renueva con rotación y se reintenta como máximo una vez; si la renovación falla, se limpia la sesión y se muestra el error.
- [x] `/dashboard` redirige a `/login` si no existe una sesión válida.
- [x] Cerrar sesión revoca la sesión en la API y elimina las cookies; los errores de revocación se notifican.
- [x] Los formularios y estados de carga, error y ausencia de organizaciones son accesibles y están redactados en español.
- [x] Las pruebas cubren los flujos anteriores sin credenciales reales ni servicios externos.

## Decisions

- **Sí:** usar rutas servidoras de Next.js y cookies `HttpOnly` para que los tokens no estén disponibles para JavaScript del navegador.
- **No:** guardar refresh tokens en `localStorage` o `sessionStorage`.
- **Sí:** reutilizar el inicio de sesión, la verificación TOTP, la rotación y el cierre de sesión de la API de identidad existente.
- **Sí:** añadir una consulta autenticada de organizaciones porque la API web actual no ofrece una forma de resolver la membresía activa.
- **No:** crear organizaciones o cuentas durante este flujo; se requieren cuentas y membresías existentes.
- **No:** añadir dependencias externas; usar Next.js, Vitest y Playwright existentes.
- **No:** implementar el administrador de publicaciones en esta entrega; tendrá una especificación independiente.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Un tenant manipulado en la cookie permite acceso a otra organización. | Tratar el valor como no confiable y validar la membresía en la API en cada solicitud. |
| Solicitudes simultáneas de renovación interfieren con la rotación de refresh tokens. | Coordinar la renovación en el servidor y reintentar cada operación como máximo una vez. |
| Solicitudes de otro origen intentan usar la sesión de cookies. | Usar `SameSite=Lax` y validar el origen en rutas servidoras que cambian estado. |

## What is **not** in this spec

- Registro, organizaciones, invitaciones y administración de roles.
- OAuth, OTP por teléfono, recuperación de cuenta y configuración de 2FA.
- Publicaciones, reservas, pagos, backoffice, móvil e internacionalización completa.

Cada elemento requiere una especificación posterior si se prioriza.
