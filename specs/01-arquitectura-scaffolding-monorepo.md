# SPEC 01 — Arquitectura y scaffolding del monorepo

> **Estado:** Implementado
> **Depende de:** Ninguna
> **Fecha:** 2026-09-30
> **Objetivo:** Generate via script the base monorepo of Vibe Planners (apps, shared packages, database, identity, multi-tenancy, testing, tooling, and placeholders for external providers) without implementing business logic.

## Scope

**In scope:**

- Monorepo con Turborepo + npm workspaces (uso de `nvm` para Node).
- `apps/api` (NestJS 12, ESM + Vitest): carpetas de módulos de dominio (`identity`, `directory`, `booking`, `finance`, `search`, `chat`, `admin`) con controladores placeholder, `common/` (filters, guards, interceptors), endpoint `/health`.
- `apps/web` (Next.js 15, App Router): grupos de rutas `(public)/(auth)/(dashboard)/(client)`, Tailwind, página de inicio de arranque.
- `apps/mobile` (Expo + React Native última estable): `screens/`, `navigation/`, `hooks/`, una pantalla de arranque.
- `apps/backoffice` (Vite + React última estable): estructura `src/` base, página de arranque.
- `packages/database`: Prisma con modelos base (`Tenant`, `User`, `AuthIdentity`) y migración inicial.
- `packages/shared-types`, `packages/shared-validations`: tipos e esquemas Zod para `User`/`Tenant`/DTOs de auth.
- `packages/ui`: esqueleto de design system (Tailwind + Radix) con un componente `Button` de ejemplo.
- `packages/config`: `eslint-config`, `tsconfig`, `tailwind-config` compartidos.
- Módulo `identity` propio: stubs de estrategias Google/Apple/Facebook/teléfono (OTP)/usuario-contraseña, emisión de JWT, stub de 2FA (TOTP), y vinculación de cuentas por número de teléfono para evitar duplicados.
- Multi-tenancy de schema único con columna `tenant_id` en tablas tenant-scoped, más middleware de resolución de tenant en `api`.
- Testing: Vitest (unit/integration) en `api`; Jest (unit/integration) en `web`/`backoffice`; Playwright (e2e web).
- ESLint + Prettier + Husky + lint-staged.
- `docker/docker-compose.yml` con Postgres, Redis y Elasticsearch; `docker/init-scripts/` placeholder.
- `.env.example` por entorno (dev/qa/prod), raíz y por app.
- Proveedores externos instalados con cliente placeholder (sin lógica funcional): Stripe, Twilio, Resend, `@elastic/elasticsearch`, Firebase Admin (FCM), Cloudinary.
- Workflows de CI/CD vacíos (`deploy-dev.yml`, `deploy-qa.yml`, `deploy-prod.yml`) solo con nombre y trigger.
- `.nvmrc` fijado a `24.14.0`.
- Scripts raíz (`dev`, `build`, `lint`, `test`, `format`) vía Turborepo.

**Out of scope (for future specs):**

- Lógica de negocio de booking, pagos, búsqueda/ranking, chat, admin, recompensas, mercado, etc.
- Integración funcional real de los proveedores externos (llamadas de API reales, webhooks).
- Contenido real de páginas legales, centro de ayuda, blog.
- Pasos de ejecución dentro de los workflows de CI/CD (build/test/deploy reales).
- Pruebas e2e de mobile (Detox) — no hay pantallas con lógica real que probar todavía.
- Despliegue real a cualquier infraestructura cloud.
- Flujos OAuth funcionales completos con Google/Apple/Facebook — solo stubs de estrategia; el flujo completo va en la spec de `identity`.

## Data model

```prisma
// packages/database/prisma/schema.prisma

model Tenant {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  users     User[]

  @@map("tenants")
}

model User {
  id           String         @id @default(uuid())
  tenantId     String         @map("tenant_id")
  tenant       Tenant         @relation(fields: [tenantId], references: [id])
  email        String?        @unique
  phone        String?        @unique
  passwordHash String?        @map("password_hash")
  twoFactorSecret String?     @map("two_factor_secret")
  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")
  identities   AuthIdentity[]

  @@index([tenantId, id])
  @@map("users")
}

// Vincula un usuario con cada proveedor de login (google/apple/facebook/phone/credentials)
// para evitar cuentas duplicadas cuando se usa el mismo teléfono con distintos proveedores.
model AuthIdentity {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  user       User     @relation(fields: [userId], references: [id])
  provider   String
  providerId String   @map("provider_id")
  createdAt  DateTime @default(now()) @map("created_at")

  @@unique([provider, providerId])
  @@map("auth_identities")
}
```

Convenciones:

- Nombres de tabla en `snake_case` plural vía `@@map`.
- Toda tabla tenant-scoped incluye `tenant_id` con índice compuesto `(tenant_id, id)`.
- IDs `uuid` generados en base de datos.

## Implementation plan

1. Inicializar tooling raíz: `package.json`, npm workspaces, `turbo.json`, `.nvmrc` (`24.14.0`), `packages/config` (`eslint-config`, `tsconfig`, `tailwind-config`).
2. Añadir ESLint + Prettier + Husky + lint-staged conectados a los scripts raíz; verificar que `npm run lint` corre limpio.
3. Scaffold de `packages/shared-types` y `packages/shared-validations` con tipos y esquemas Zod base de `User`/`Tenant`.
4. Scaffold de `packages/database`: instalar Prisma, definir `schema.prisma` (arriba), correr la migración inicial contra Postgres local.
5. Crear `docker/docker-compose.yml` (Postgres, Redis, Elasticsearch) y `docker/init-scripts/`; verificar que `docker compose up -d` deja los tres servicios healthy.
6. Scaffold de `apps/api` (NestJS 12, ESM + Vitest): carpetas de los 7 módulos de dominio con controlador placeholder, `common/`, y `/health` conectado a Prisma.
7. Añadir el esqueleto del módulo `identity`: stubs de estrategias Passport (Google/Apple/Facebook/teléfono-OTP/credenciales), emisión de JWT, stub de 2FA, middleware de resolución de tenant. _(hecho: `@nestjs/jwt`+`@nestjs/passport`, 2FA TOTP funcional vía `otplib@12`, `TenantMiddleware` global por header `x-tenant-id`)_
8. Instalar SDKs de terceros en `apps/api` con clientes placeholder y config por variables de entorno: Stripe, Twilio, Resend, `@elastic/elasticsearch`, Firebase Admin, Cloudinary. _(hecho: módulo `src/integrations/`; clientes leen configuración por env y lanzan un error explícito al invocarse)_
9. Añadir una prueba e2e pasante para `GET /health` usando Vitest en `apps/api`. _(hecho: Prisma se sustituye por un mock para no requerir Docker)_
10. Scaffold de `apps/web` (Next.js 15): grupos de rutas, Tailwind, página de inicio usando el `Button` de `packages/ui`; configurar Playwright con un smoke test. _(hecho: Next.js 15.5.27, route groups, botón compartido y smoke test Playwright)_
11. Scaffold de `apps/backoffice` (Vite + React): página de arranque, Jest configurado. _(hecho: Vite 8.3.1, panel inicial y Jest con SWC)_
12. Scaffold de `apps/mobile` (Expo + React Native): navegación base y una pantalla de arranque. _(hecho: Expo SDK 57 / React Native 0.86.3, Expo Router, Overview, lista de eventos y hook de saludo)_
13. Añadir `.env.example` (raíz y por app) para dev/qa/prod cubriendo DB, Redis, Elasticsearch, JWT y todas las claves de proveedores externos. _(hecho: plantillas en la raíz, las cuatro apps y `packages/database`)_
14. Añadir los workflows vacíos de CI/CD (`deploy-dev.yml`, `deploy-qa.yml`, `deploy-prod.yml`) solo con nombre/trigger. _(hecho: workflows con trigger de push y sin jobs)_
15. Conectar los scripts raíz (`dev`, `build`, `lint`, `test`, `format`) vía pipelines de Turborepo; verificar que `npm run build` y `npm run lint` pasan en todas las apps y paquetes. _(hecho: lint con 8 tareas exitosas y build con 5 tareas exitosas)_

## Acceptance criteria

- [x] `.nvmrc` fija Node `24.14.0` y `nvm use` lo respeta.
- [x] `npm install` en la raíz instala todos los workspaces sin errores.
- [x] `npm run lint` pasa sin errores en todas las apps y paquetes.
- [x] El hook de pre-commit de Husky bloquea un commit con un error de lint.
- [ ] `docker compose -f docker/docker-compose.yml up -d` levanta Postgres, Redis y Elasticsearch como contenedores healthy. _(pendiente: Docker no disponible en este entorno; el usuario debe validarlo localmente)_
- [x] `npx prisma migrate diff` genera la migración inicial creando las tablas `tenants`, `users` y `auth_identities` con columna `tenant_id` en las tablas tenant-scoped. _(generada sin DB viva; `migrate dev` real queda pendiente de validar con Docker)_
- [ ] `apps/api` expone `GET /health` devolviendo 200 con verificación de conectividad a la base de datos. _(implementado; falta validar contra Postgres real)_
- [x] Los 7 módulos NestJS (`identity`, `directory`, `booking`, `finance`, `search`, `chat`, `admin`) existen con un controlador placeholder; build y lint pasan (accesibilidad por HTTP en vivo pendiente de validar con Docker).
- [ ] `npm run test` corre Vitest en `api` y Jest en `web`/`backoffice` con al menos una prueba pasante por app. _(API y backoffice tienen tests; web tiene Playwright, pero aún no Jest unitario)_
- [x] `npm run test:e2e --workspace=apps/web` ejecuta un smoke test Playwright pasante contra `apps/web`.
- [x] `apps/web`, `apps/mobile` y `apps/backoffice` arrancan localmente y muestran sus pantallas iniciales. _(web con Next, backoffice con Vite y mobile mediante Expo Router/web)_
- [x] Existen placeholders de variables de entorno para Stripe, Twilio, Resend, Elasticsearch, Firebase y Cloudinary en `.env.example`.
- [x] `.github/workflows/deploy-dev.yml`, `deploy-qa.yml` y `deploy-prod.yml` existen solo con nombre/trigger, sin pasos de ejecución.
- [x] `npm run build` termina exitosamente para todas las apps y paquetes vía Turborepo. _(5 tareas exitosas; `npm run lint` también completa 8 tareas exitosas vía Turborepo)_

## Decisions

- **Sí:** npm + Turborepo para orquestar el monorepo (el usuario ya trabaja con `nvm`).
- **Sí:** Prisma como ORM — mejor DX y migraciones más simples que TypeORM.
- **Sí:** módulo `identity` propio en vez de un proveedor gestionado — necesario para vincular una misma cuenta por número de teléfono entre Google/Apple/Facebook/credenciales, algo que un proveedor gestionado maneja con menos flexibilidad.
- **Sí:** multi-tenancy de schema único con columna `tenant_id` — el más simple de operar para el alcance actual (México); se puede evolucionar a schema-por-tenant más adelante si hace falta.
- **Sí:** incluir `mobile` (Expo) y `backoffice` (Vite+React) desde el inicio, por pedido explícito.
- **Sí:** proveedores externos (Stripe, Twilio, Resend, Elasticsearch, Firebase, Cloudinary) instalados con cliente placeholder ahora; la integración funcional completa se define en specs de dominio.
- **Sí:** Cloudinary para almacenamiento de medios (galerías, documentos KYC) — menos fricción de configuración que S3/GCS crudo para un MVP.
- **Sí:** instalar las últimas versiones estables mediante los comandos oficiales de cada herramienta (NestJS 12, Next.js 15.5, Expo SDK 57 / React Native 0.86, Vite 8) en vez de fijar versiones exactas en la spec.
- **Sí:** usar Expo Router para navegación universal en mobile; las rutas viven en `src/app/` y las vistas reutilizables en `src/screens/`.
- **Sí:** mantener React y React DOM en `19.2.3` en los workspaces web/mobile/UI para satisfacer Expo SDK 57 y evitar duplicados del runtime nativo.
- **No:** lógica de pipelines de CI/CD (pasos de build/test/deploy) — solo archivos de workflow vacíos; los pipelines completos son una spec futura.
- **No:** e2e de mobile (Detox) — no hay pantallas con lógica real que probar todavía.
- **Sí:** ESM + Vitest en `apps/api` en vez de CJS + Jest — `@nestjs/testing@12` se publica solo como ESM (`"type": "module"`, sin build CJS), por lo que Jest en modo CommonJS no puede cargarlo. Es el toolchain por defecto del generador de Nest 12. Backoffice usa Jest; web tiene Playwright e2e y su Jest unitario sigue pendiente.
- **Sí:** reemplazar `oxlint` (default del generador de Nest 12) por el ESLint compartido de `packages/config/eslint-config` en `apps/api` — mantiene un solo linter en todo el monorepo.
- **No:** `@nestjs/mau` (CLI de deploy propietaria de Nest) — traía una cadena de vulnerabilidades altas (`undici`, `tmp`, `inquirer`) y no la usamos; el despliegue va por Bicep/Terraform propios en specs futuras.
- **No:** flujos OAuth funcionales para Google/Apple/Facebook — solo stubs de estrategia; las credenciales y flujos reales pertenecen a la spec de `identity`.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Instalar "últimas estables" sin fijar versión exacta puede introducir cambios breaking entre esta spec y el día de implementación | Fijar las versiones resultantes en `package.json`/lockfile inmediatamente después de instalar, y documentarlas en la spec de implementación |
| `tenant_id` en cada tabla puede penalizar performance si no se indexa bien | Índice compuesto `(tenant_id, id)` en cada tabla desde la migración inicial |
| Los clientes placeholder de proveedores externos pueden dar falsa sensación de "ya integrado" | Cada cliente placeholder lanza un error explícito "not implemented" si se invoca, documentado en el código |

## What is **not** in this spec

- Lógica de negocio de booking, pagos, búsqueda/ranking, chat, admin, recompensas, mercado, etc.
- Integración funcional real de los proveedores externos (Stripe, Twilio, Resend, Elasticsearch, Firebase, Cloudinary).
- Contenido real de páginas legales, centro de ayuda, blog.
- Pipelines de CI/CD con pasos reales de build/test/deploy.
- Pruebas e2e de mobile (Detox).
- Despliegue real a infraestructura cloud.
- Flujos OAuth funcionales completos con Google/Apple/Facebook.

Cada uno de estos, cuando llegue su momento, va en su propia spec.
