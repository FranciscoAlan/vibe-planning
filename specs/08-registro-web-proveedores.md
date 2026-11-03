# SPEC 08 — Registro web de proveedores

> **Estado:** Aprobado
> **Depende de:** SPEC 04, SPEC 06, SPEC 07
> **Fecha:** 2026-11-03
> **Objetivo:** Permitir que un proveedor registre y verifique su cuenta, cree su organización e inicie una sesión web segura usando la API de identidad existente.

## Why this spec exists

La API ya soporta registro por credenciales, verificación de email y teléfono, autenticación y creación de organizaciones. La web todavía no ofrece el alta de proveedores, y `POST /identity/register/provider` es un placeholder para identidad con proveedor externo, no para el registro por credenciales definido aquí.

## Scope

**In:**

- Añadir `/register` en `apps/web` con un flujo en español para proveedores.
- Solicitar nombre de organización, email, contraseña y teléfono en formato E.164. Se requieren email y contraseña para usar el inicio de sesión web existente.
- Registrar la identidad con `POST /identity/register`; verificar email y teléfono con los endpoints existentes antes de crear una sesión normal.
- Permitir reenvío de verificación por email y SMS. Extender la respuesta de `POST /identity/email/verification/request` para devolver siempre un `challengeId` con forma uniforme, incluso cuando no se envíe correo, y conservar el mensaje genérico actual. Usar `POST /identity/phone/challenge` para reenviar SMS.
- Conservar el `challengeId` de email y dos flags de progreso no sensibles en `sessionStorage` para retomar la verificación tras recargar la misma pestaña. No guardar contraseña, códigos ni tokens. Email, teléfono y nombre de organización se vuelven a solicitar si no están disponibles en memoria.
- Después de verificar ambos canales, iniciar sesión mediante las rutas servidoras existentes, crear una organización con rol `OWNER` y activar esa organización para el dashboard.
- Si crear la organización falla después del login, mantener la sesión y permitir reintentar desde el estado sin organización del dashboard.
- Mantener las llamadas HTTP dentro de `*.api.service.ts`; los tokens solo se manejan en el servidor. El único estado de registro en almacenamiento web es el identificador de desafío y los flags de progreso indicados.
- Validar origen en rutas servidoras que cambian estado y reutilizar las cookies `HttpOnly` de sesión existentes.
- Cubrir registro, verificación, reenvíos, fallos recuperables y creación/reintento de organización con pruebas automatizadas sin credenciales reales.

**Out of scope (for future specs):**

- Registro o acceso con Google, Apple, Facebook u otros proveedores OAuth; SPEC 04 los difiere a SPEC 05.
- Registro solo con teléfono, inicio de sesión por teléfono, recuperación o cambio de contraseña.
- Alta y administración de miembros, invitaciones, roles adicionales y organizaciones múltiples durante el registro.
- KYC, perfiles fiscales, permisos granulares, pagos, publicaciones y reservas.
- Aplicación móvil, backoffice e internacionalización completa.
- Cambios a modelos persistentes o a la semántica de activación acordada en SPEC 04.

## Data model

No se introducen modelos persistentes ni migraciones. Se reutilizan `User`, `VerificationChallenge`, `Tenant` y `OrganizationMembership` de SPEC 04.

Los datos temporales de registro en `sessionStorage` son:

- `vp_registration_email_challenge_id`: ID del desafío de verificación de email.
- `vp_registration_email_verified`: flag de progreso `true` o `false`.
- `vp_registration_phone_verified`: flag de progreso `true` o `false`.

Los flags solo restauran la interfaz y nunca autorizan operaciones; login y creación de organización siguen sujetos a las verificaciones y autorización de la API. Se eliminan los tres valores al completar el alta o abandonar el flujo. Email, teléfono, nombre de organización, contraseña, códigos OTP, access tokens y refresh tokens no se almacenan.

La respuesta de `POST /identity/email/verification/request` mantiene el mensaje genérico y añade `challengeId`. Para una solicitud que no produce un desafío entregable, la API devuelve un UUID sin desafío asociado para conservar una forma de respuesta uniforme y evitar revelar si existe una cuenta.

## Implementation plan

1. Actualizar `IdentityService.requestEmailVerification` y las pruebas del módulo de identidad para devolver un `challengeId` tanto si se crea un desafío como si la solicitud no puede producirlo. Mantener el texto genérico y verificar que el UUID sin desafío no permite confirmar una cuenta.
2. Extender `apps/web/src/services/identity.api.service.ts` con registro, verificación de email/teléfono, reenvío por email/SMS y creación autenticada de organización. Añadir rutas servidoras bajo `apps/web/src/app/api/session/registration/` que validen esquemas, origen, errores y cookies existentes. El login se reutiliza sin cambiar su contrato.
3. Crear `apps/web/src/app/(auth)/register/page.tsx` y `apps/web/src/components/session/register-form.tsx`. Implementar los estados de registro, verificación, reenvío, login, alta de organización, errores y reintento; conectar los enlaces de registro de la home y del login con `/register`.
4. Actualizar `apps/web/src/components/session/provider-dashboard.tsx` para permitir crear o reintentar la organización cuando la sesión autenticada no tiene membresías proveedoras. Mantener el cierre de sesión existente.
5. Añadir `apps/web/tests/registration.spec.ts` con el API simulado existente y ampliar las pruebas API para la respuesta uniforme del reenvío. Ejecutar las pruebas enfocadas de identidad, las pruebas Playwright de registro y sesión, lint y build de web.

## Acceptance criteria

- [ ] `/register` está disponible desde la home y el login, y presenta un formulario accesible en español.
- [ ] El formulario valida nombre de organización, email, contraseña y teléfono E.164 antes de enviar solicitudes.
- [ ] El registro crea una cuenta pendiente y envía los desafíos usando los adaptadores configurados en la API, sin exponer códigos en la respuesta web.
- [ ] Una cuenta no obtiene sesión normal hasta verificar teléfono y email; códigos inválidos, expirados o consumidos muestran un error recuperable.
- [ ] El reenvío de email entrega un nuevo `challengeId` cuando corresponde y conserva la misma forma de respuesta y mensaje para cuentas desconocidas o no elegibles; el SMS se puede reenviar usando el endpoint existente.
- [ ] El `challengeId` y ambos flags de progreso sobreviven una recarga en la misma pestaña; los flags solo controlan la interfaz y la API sigue impidiendo verificar o crear organización sin autorización. El flujo no persiste datos personales, contraseña, código, access token ni refresh token.
- [ ] Después de ambas verificaciones, la web inicia sesión y crea una organización con membresía `OWNER`; el tenant resultante queda activo en el dashboard.
- [ ] Si falla crear la organización, la sesión permanece válida y el dashboard ofrece reintentar sin repetir el registro de identidad.
- [ ] Las rutas de registro rechazan solicitudes de origen no válido y validan todos los cuerpos con esquemas compartidos.
- [ ] Access y refresh tokens solo se manejan en el servidor y se establecen en cookies `HttpOnly` con los atributos existentes.
- [ ] Las pruebas cubren éxito, duplicados, errores de entrega, reenvío, expiración/verificación inválida, recarga, creación de organización, fallo recuperable y ausencia de tokens en el cliente.
- [ ] Pasan las pruebas unitarias de identidad, `npm run lint --workspace=@vibe-planners/web`, `npm run build --workspace=@vibe-planners/web` y `npm run test:e2e --workspace=@vibe-planners/web -- registration.spec.ts session.spec.ts`.

## Decisions

- **Sí:** usar email y contraseña más teléfono verificado. Respeta el contrato activo de SPEC 04 y el login web implementado en SPEC 07.
- **Sí:** exigir también la verificación del email antes del login por contraseña, como dispone SPEC 04.
- **Sí:** crear la organización proveedora durante el alta y asignar `OWNER` mediante el endpoint autenticado existente.
- **Sí:** permitir completar la creación de organización desde el dashboard si falla el primer intento. Evita dejar la cuenta activa sin forma de acceder a su espacio de trabajo.
- **Sí:** devolver un `challengeId` de forma uniforme en la solicitud de reenvío de email. Los identificadores ficticios para solicitudes no elegibles conservan la protección contra enumeración.
- **Sí:** guardar el identificador de desafío y flags booleanos de verificación en `sessionStorage` para restaurar el paso tras una recarga. Los flags no son evidencia de verificación; la API conserva la autoridad. No persistir datos personales, credenciales, códigos ni tokens.
- **Sí:** permitir reenvío SMS mediante el endpoint existente `POST /identity/phone/challenge`, para que la expiración o un fallo temporal de entrega sea recuperable.
- **No:** implementar `POST /identity/register/provider` en este flujo. Ese contrato representa alta con identidad de proveedor externo y OAuth está diferido a SPEC 05.
- **No:** incluir recuperación de contraseña, autenticación social, registro solo por teléfono o móvil. Son flujos y contratos independientes.
- **No:** crear nuevos modelos de datos. El esquema de identidad y organización existente cubre este recorrido.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| La respuesta de reenvío permite enumerar cuentas por email. | Mantener mensaje y forma de respuesta uniformes; usar un UUID sin desafío asociado cuando no se pueda enviar correo. |
| Twilio o Resend no están disponibles durante el alta. | Mantener la cuenta pendiente, mostrar el fallo sin crear una sesión y permitir reintentar el envío por el canal afectado cuando el servicio vuelva. |
| La sesión se establece antes de crear la organización y la creación falla. | Mantener la sesión y habilitar el reintento desde el estado sin organización del dashboard. |
| El desafío de email vence mientras el usuario completa el flujo. | Usar la expiración configurada por la API, permitir reenvío y reemplazar el identificador temporal guardado. |

## What is **not** in this spec

- OAuth con Google, Apple o Facebook.
- Recuperación de contraseña, acceso por teléfono y gestión de 2FA.
- Invitaciones, equipos, alta de miembros o administración completa de organizaciones.
- KYC, perfiles fiscales, publicaciones, reservas y pagos.
- Registro móvil, backoffice o traducciones completas.

Cada elemento requiere una especificación posterior si se prioriza.
