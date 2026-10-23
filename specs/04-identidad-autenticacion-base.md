# SPEC 04 — Identidad global y autenticación base

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02, SPEC 03
> **Fecha:** 2026-10-22
> **Objetivo:** Implementar en la API identidad global, membresías de organizaciones proveedoras, autenticación por credenciales y teléfono, sesiones revocables y verificación de segundo factor.

## Why this spec exists

El esquema actual vincula cada usuario a un solo tenant y rol, y los endpoints de identidad aún son placeholders. El producto requiere que una persona use una identidad única como cliente o planeador y pueda pertenecer a organizaciones proveedoras sin duplicar su cuenta.

## Scope

**In:**

- Convertir `User` en identidad global; `Tenant` representa una organización proveedora.
- Teléfono normalizado en formato E.164 y único globalmente. Una cuenta no se activa hasta verificar su teléfono.
- Email opcional y único globalmente. Si se registra o vincula email para autenticación por contraseña, debe verificarse.
- Perfiles globales `CLIENT` y `EVENT_PLANNER`; membresías organizacionales con roles `OWNER`, `PROVIDER` y `ADMIN`.
- Registro e inicio de sesión con email/contraseña y teléfono OTP. Las contraseñas se almacenan con Argon2id.
- Verificación y recuperación de email; creación de desafíos de verificación para SMS y email con valores de expiración, intentos y reenvío configurables.
- Entrega real y configurable de SMS mediante Twilio y de correo mediante Resend. Las pruebas usan adaptadores simulados y no requieren secretos.
- JWT de acceso con duración predeterminada de 15 minutos y refresh token opaco rotativo con duración predeterminada de 30 días. Persistir solo el hash del refresh token; revocar al cerrar sesión y detectar reutilización de un token rotado.
- Alta de organización proveedora por un usuario activo. Crear `Tenant` y membresía `OWNER` en una transacción.
- Validar que el usuario pertenece al tenant solicitado para operaciones de organización. No confiar en roles o tenant recibidos sin validar desde el cliente.
- TOTP opcional para cuentas ordinarias y obligatorio para cuentas con rol organizacional `ADMIN`. Cifrar el secreto TOTP en reposo.
- Conservar los endpoints existentes de credenciales y reemplazar los placeholders que pertenecen a esta entrega. Añadir contratos Zod, pruebas unitarias y e2e de API.
- Migrar los roles actuales: `CLIENT` y `EVENT_PLANNER` a perfiles globales; `PROVIDER` y `ADMIN` a membresías en el tenant actual. Usuarios existentes sin teléfono verificado quedan pendientes de activación.

**Out of scope (for future specs):**

- Inicio de sesión o vinculación con Google, Apple y Facebook; se especificará en SPEC 05.
- Interfaces web y móvil de registro, inicio de sesión, recuperación, configuración de organización o 2FA.
- Invitaciones a organizaciones, administración completa de equipos, permisos granulares y cambio de roles por un owner.
- Asignación de `ADMIN` desde endpoints públicos. El rol solo lo concede un operador confiable fuera de los flujos de auto-registro.
- Cambios de reglas de reservas, pagos, contribuciones, comisiones o facturación.
- Gestión de sesiones administrativas para la plataforma, políticas de moderación y procesos de KYC.

## Data model

Cambios en `packages/database/prisma/schema.prisma`. Los nombres y campos siguientes describen las estructuras que debe persistir la entrega; los modelos existentes de publicaciones y reservaciones conservan sus referencias a `User` y `Tenant`.

```prisma
enum UserProfileType {
  CLIENT
  EVENT_PLANNER

  @@map("user_profile_type")
}

enum OrganizationRole {
  OWNER
  PROVIDER
  ADMIN

  @@map("organization_role")
}

enum AccountStatus {
  PENDING_VERIFICATION
  ACTIVE

  @@map("account_status")
}

enum ChallengeChannel {
  SMS
  EMAIL

  @@map("challenge_channel")
}

enum ChallengePurpose {
  PHONE_VERIFICATION
  PHONE_LOGIN
  EMAIL_VERIFICATION
  PASSWORD_RESET

  @@map("challenge_purpose")
}

model User {
  id                String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email             String?       @unique
  emailVerifiedAt   DateTime?     @map("email_verified_at") @db.Timestamptz(6)
  phone             String?       @unique
  phoneVerifiedAt   DateTime?     @map("phone_verified_at") @db.Timestamptz(6)
  passwordHash      String?       @map("password_hash")
  status            AccountStatus @default(PENDING_VERIFICATION)
  twoFactorSecret   String?       @map("two_factor_secret")
  twoFactorEnabled  Boolean       @default(false) @map("two_factor_enabled")
  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")
  profiles          UserProfile[]
  memberships       OrganizationMembership[]
  identities        AuthIdentity[]
  sessions          AuthSession[]
  challenges        VerificationChallenge[]

  @@map("users")
}

model UserProfile {
  id        String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String          @map("user_id") @db.Uuid
  role      UserProfileType
  createdAt DateTime        @default(now()) @map("created_at")
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, role])
  @@map("user_profiles")
}

model OrganizationMembership {
  id        String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId  String           @map("tenant_id") @db.Uuid
  userId    String           @map("user_id") @db.Uuid
  role      OrganizationRole
  createdAt DateTime         @default(now()) @map("created_at")
  tenant    Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([tenantId, userId])
  @@index([userId, role])
  @@map("organization_memberships")
}

model AuthSession {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String    @map("user_id") @db.Uuid
  familyId   String    @map("family_id") @db.Uuid
  tokenHash  String    @unique @map("token_hash")
  expiresAt  DateTime  @map("expires_at") @db.Timestamptz(6)
  revokedAt  DateTime? @map("revoked_at") @db.Timestamptz(6)
  lastUsedAt DateTime? @map("last_used_at") @db.Timestamptz(6)
  createdAt  DateTime  @default(now()) @map("created_at")
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, expiresAt])
  @@index([familyId, revokedAt])
  @@map("auth_sessions")
}

model VerificationChallenge {
  id         String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String           @map("user_id") @db.Uuid
  channel    ChallengeChannel
  purpose    ChallengePurpose
  target     String
  secretHash String           @map("secret_hash")
  attempts   Int              @default(0)
  expiresAt  DateTime         @map("expires_at") @db.Timestamptz(6)
  consumedAt DateTime?        @map("consumed_at") @db.Timestamptz(6)
  createdAt  DateTime         @default(now()) @map("created_at")
  user       User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, purpose, expiresAt])
  @@map("verification_challenges")
}
```

`Tenant` reemplaza su relación directa `users` por `memberships`. `AuthIdentity` conserva la unicidad global por proveedor e identificador para permitir que SPEC 05 agregue OAuth sin duplicar usuarios. Email y teléfono se normalizan antes de persistir; secretos de desafío y refresh tokens nunca se almacenan en texto plano.

## Implementation plan

1. Actualizar el esquema Prisma para identidad global, perfiles, membresías, sesiones y desafíos. Crear una migración que conserve usuarios, publicaciones y reservaciones existentes con el mapeo de roles definido arriba. Generar el cliente y validar la migración con datos de prueba representativos.
2. Actualizar tipos compartidos y esquemas Zod de autenticación. Mantener compatibilidad explícita de los contratos consumidos por `apps/api` y validar build de `shared-types` y `shared-validations`.
3. Implementar registro, verificación de email, login por email/contraseña, recuperación y cambio de contraseña. Usar Argon2id, respuestas que no revelen si un email existe y pruebas unitarias de estados inválidos.
4. Implementar registro y login por teléfono OTP, desafíos de un solo uso, límites configurables de reenvío/intentos y adaptadores reales Twilio/Resend. Probar servicios con adaptadores simulados y verificar el fallo explícito cuando falte configuración requerida.
5. Implementar access/refresh, rotación, revocación de sesión, logout y detección de reutilización. Actualizar estrategia JWT, guards y resolución de tenant para validar membresías antes de operaciones organizacionales.
6. Implementar creación transaccional de organización y owner, perfiles globales, enrolamiento TOTP y requisito de TOTP para `ADMIN`. Añadir pruebas para escalamiento no autorizado y acceso entre tenants.
7. Añadir pruebas e2e de registro pendiente/activo, login, recuperación, refresh/logout, TOTP, alta de organización y aislamiento. Verificar `npm run test --workspace=apps/api`, las pruebas e2e de API, build y lint de los workspaces afectados.

## Acceptance criteria

- [ ] La migración transforma el esquema sin perder usuarios, publicaciones ni reservaciones; los roles existentes quedan mapeados a perfiles globales o membresías según su valor anterior.
- [ ] Email y teléfono se normalizan antes de comparar o persistir; el teléfono no puede pertenecer a dos identidades.
- [ ] Una cuenta sin teléfono verificado permanece en `PENDING_VERIFICATION` y no recibe una sesión normal.
- [ ] Una cuenta sin email puede activarse con teléfono verificado; el login por contraseña y la recuperación por email requieren email verificado.
- [ ] Un desafío expirado, consumido o que excede los intentos configurados se rechaza y no puede reutilizarse.
- [ ] Contraseñas, códigos OTP, secretos de recuperación y refresh tokens no aparecen en claro en la base de datos ni en logs.
- [ ] Twilio entrega SMS OTP y Resend entrega correo de verificación/recuperación cuando están configurados; las pruebas automatizadas no requieren credenciales reales.
- [ ] El access token expira por defecto a los 15 minutos y el refresh token a los 30 días; ambos valores pueden configurarse.
- [ ] Cada refresh exitoso invalida el token anterior; reutilizar un token rotado revoca su familia de sesiones.
- [ ] Logout revoca la sesión correspondiente; una sesión revocada no puede renovarse.
- [ ] Crear una organización exige una cuenta activa y crea tenant y membresía `OWNER` de forma atómica.
- [ ] Un usuario sin membresía no puede usar `x-tenant-id` para operar como proveedor dentro de esa organización.
- [ ] Ningún payload permite asignarse `OWNER`, `PROVIDER` o `ADMIN`; `ADMIN` solo puede asignarse mediante un operador confiable fuera del registro público.
- [ ] Una cuenta `ADMIN` no recibe una sesión autenticada hasta completar TOTP; los demás usuarios pueden habilitar TOTP voluntariamente.
- [ ] Las pruebas cubren migración/mapeo de roles, validación y expiración de desafíos, rotación de sesiones, autorización por membresía y aislamiento entre tenants.
- [ ] Pasan las pruebas unitarias y e2e enfocadas, el build y el lint de los workspaces modificados.

## Decisions

- **Sí:** separar identidad global de membresías organizacionales. Razón: el teléfono único debe identificar a la persona, aunque actúe como cliente/planeador y pertenezca a varias organizaciones.
- **Sí:** tratar `Tenant` como organización proveedora; el alta crea una membresía `OWNER`.
- **Sí:** mantener `CLIENT` y `EVENT_PLANNER` como perfiles globales y `OWNER`, `PROVIDER` y `ADMIN` como roles organizacionales.
- **Sí:** exigir teléfono verificado para activar cualquier cuenta; email es opcional, pero se verifica si se usa para credenciales o recuperación.
- **Sí:** usar access JWT de 15 minutos y refresh rotativo de 30 días por defecto, con valores configurables y revocación persistida.
- **Sí:** integrar Twilio y Resend en esta entrega detrás de adaptadores sustituibles; pruebas automatizadas con mocks.
- **Sí:** exigir TOTP a cuentas `ADMIN`; no habilitar autoasignación de ese rol.
- **No:** incluir Google, Apple o Facebook en esta entrega. Sus flujos de autenticación y vinculación se definen en SPEC 05 sobre `AuthIdentity`.
- **No:** incluir invitaciones ni administración completa de equipos. Esta spec crea el owner y valida membresías existentes.
- **No:** construir pantallas web o móvil; esta entrega define y verifica la API.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| La migración cambia la relación directa de `User` con `Tenant` y puede afectar guards existentes. | Migrar datos y actualizar autorización en la misma entrega; cubrir reservas existentes y acceso entre tenants con pruebas e2e. |
| Tokens OTP o refresh filtrados permitirían tomar control de cuentas. | Persistir únicamente hashes, limitar intentos/reenvíos, consumir desafíos una sola vez y no registrar secretos. |
| Twilio o Resend no están configurados en un entorno. | Fallar de forma explícita y controlada; inyectar adaptadores simulados en pruebas y documentar variables requeridas en `.env.example`. |
| Exigir teléfono impide completar el alta si el canal SMS está degradado. | Mantener la cuenta pendiente, permitir reintento con límites y no emitir una sesión activa antes de verificar. |

## What is **not** in this spec

- OAuth de Google, Apple y Facebook; se aborda en SPEC 05.
- Pantallas de autenticación para web o móvil.
- Invitaciones, edición de miembros y permisos granulares de organización.
- Asignación pública de administradores o gestión del backoffice.
- Pagos, reservaciones, mensajes y notificaciones fuera de verificación/recuperación de cuenta.

Cada elemento se definirá en una especificación posterior si se prioriza.
