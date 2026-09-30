# SPEC 01 — Arquitectura y scaffolding del monorepo

> **Estado:** Aceptado
> **Depende de:** Ninguna
> **Fecha:** 2026-09-30
> **Objetivo:** Generar por script el monorepo base de Vibe Planners (apps, paquetes compartidos, base de datos, identidad, multi-tenancy, testing, tooling y placeholders de proveedores externos) sin implementar lógica de negocio.

## Scope

**In:**

- Monorepo con Turborepo + npm workspaces (uso de `nvm` para Node).
- `apps/api` (NestJS 11): carpetas de módulos de dominio (`identity`, `directory`, `booking`, `finance`, `search`, `chat`, `admin`) con controladores placeholder, `common/` (filters, guards, interceptors), endpoint `/health`.
- `apps/web` (Next.js 15, App Router): grupos de rutas `(public)/(auth)/(dashboard)/(client)`, Tailwind, página de inicio de arranque.
- `apps/mobile` (Expo + React Native última estable): `screens/`, `navigation/`, `hooks/`, una pantalla de arranque.
- `apps/backoffice` (Vite + React última estable): estructura `src/` base, página de arranque.
- `packages/database`: Prisma con modelos base (`Tenant`, `User`, `AuthIdentity`) y migración inicial.
- `packages/shared-types`, `packages/shared-validations`: tipos e esquemas Zod para `User`/`Tenant`/DTOs de auth.
- `packages/ui`: esqueleto de design system (Tailwind + Radix) con un componente `Button` de ejemplo.
- `packages/config`: `eslint-config`, `tsconfig`, `tailwind-config` compartidos.
- Módulo `identity` propio: stubs de estrategias Google/Apple/Facebook/teléfono (OTP)/usuario-contraseña, emisión de JWT, stub de 2FA (TOTP), y vinculación de cuentas por número de teléfono para evitar duplicados.
- Multi-tenancy de schema único con columna `tenant_id` en tablas tenant-scoped, más middleware de resolución de tenant en `api`.
- Testing: Jest (unit/integration) en `api`/`web`/`backoffice`; Playwright (e2e web).
- ESLint + Prettier + Husky + lint-staged.
- `docker/docker-compose.yml` con Postgres, Redis y Elasticsearch; `docker/init-scripts/` placeholder.
- `.env.example` por entorno (dev/qa/prod), raíz y por app.
- Proveedores externos instalados con cliente placeholder (sin lógica funcional): Stripe, Twilio, Resend, `@elastic/elasticsearch`, Firebase Admin (FCM), Cloudinary.
- Workflows de CI/CD vacíos (`deploy-dev.yml`, `deploy-qa.yml`, `deploy-prod.yml`) solo con nombre y trigger.
- `.nvmrc` fijado a `24.21.0`.
- Scripts raíz (`dev`, `build`, `lint`, `test`, `format`) vía Turborepo.

**Out of scope (para specs futuras):**

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

1. Inicializar tooling raíz: `package.json`, npm workspaces, `turbo.json`, `.nvmrc` (`24.21.0`), `packages/config` (`eslint-config`, `tsconfig`, `tailwind-config`).
2. Añadir ESLint + Prettier + Husky + lint-staged conectados a los scripts raíz; verificar que `npm run lint` corre limpio.
3. Scaffold de `packages/shared-types` y `packages/shared-validations` con tipos y esquemas Zod base de `User`/`Tenant`.
4. Scaffold de `packages/database`: instalar Prisma, definir `schema.prisma` (arriba), correr la migración inicial contra Postgres local.
5. Crear `docker/docker-compose.yml` (Postgres, Redis, Elasticsearch) y `docker/init-scripts/`; verificar que `docker compose up -d` deja los tres servicios healthy.
6. Scaffold de `apps/api` (NestJS 11): carpetas de los 7 módulos de dominio con controlador placeholder, `common/`, y `/health` conectado a Prisma.
7. Añadir el esqueleto del módulo `identity`: stubs de estrategias Passport (Google/Apple/Facebook/teléfono-OTP/credenciales), emisión de JWT, stub de 2FA, middleware de resolución de tenant.
8. Instalar SDKs de terceros en `apps/api` con clientes placeholder y config por variables de entorno: Stripe, Twilio, Resend, `@elastic/elasticsearch`, Firebase Admin, Cloudinary.
9. Configurar Jest en `apps/api` con una prueba pasante para `/health`.
10. Scaffold de `apps/web` (Next.js 15): grupos de rutas, Tailwind, página de inicio usando el `Button` de `packages/ui`; configurar Playwright con un smoke test.
11. Scaffold de `apps/backoffice` (Vite + React): página de arranque, Jest configurado.
12. Scaffold de `apps/mobile` (Expo + React Native): navegación base y una pantalla de arranque.
13. Añadir `.env.example` (raíz y por app) para dev/qa/prod cubriendo DB, Redis, Elasticsearch, JWT y todas las claves de proveedores externos.
14. Añadir los workflows vacíos de CI/CD (`deploy-dev.yml`, `deploy-qa.yml`, `deploy-prod.yml`) solo con nombre/trigger.
15. Conectar los scripts raíz (`dev`, `build`, `lint`, `test`, `format`) vía pipelines de Turborepo; verificar que `npm run build` y `npm run lint` pasan en todas las apps y paquetes.

## Acceptance criteria

- [ ] `.nvmrc` fija Node `24.14.0` y `nvm use` lo respeta.
- [ ] `npm install` en la raíz instala todos los workspaces sin errores.
- [ ] `npm run lint` pasa sin errores en todas las apps y paquetes.
- [ ] El hook de pre-commit de Husky bloquea un commit con un error de lint.
- [ ] `docker compose -f docker/docker-compose.yml up -d` levanta Postgres, Redis y Elasticsearch como contenedores healthy.
- [ ] `npx prisma migrate dev` (en `packages/database`) aplica la migración inicial creando las tablas `tenants`, `users` y `auth_identities` con columna `tenant_id` en las tablas tenant-scoped.
- [ ] `apps/api` expone `GET /health` devolviendo 200 con verificación de conectividad a la base de datos.
- [ ] Los 7 módulos NestJS (`identity`, `directory`, `booking`, `finance`, `search`, `chat`, `admin`) existen con un controlador placeholder accesible por HTTP.
- [ ] `npm run test` corre Jest en `api`/`web`/`backoffice` con al menos una prueba pasante por app.
- [ ] `npx playwright test` corre al menos un smoke test e2e pasante contra `apps/web`.
- [ ] `apps/web`, `apps/mobile` y `apps/backoffice` arrancan localmente (`npm run dev`) y renderizan una pantalla/página de arranque sin errores de consola.
- [ ] Existen placeholders de variables de entorno para Stripe, Twilio, Resend, Elasticsearch, Firebase y Cloudinary en `.env.example`.
- [ ] `.github/workflows/deploy-dev.yml`, `deploy-qa.yml` y `deploy-prod.yml` existen solo con nombre/trigger, sin pasos de ejecución.
- [ ] `npm run build` termina exitosamente para todas las apps y paquetes vía Turborepo.

## Decisions

- **Sí:** npm + Turborepo para orquestar el monorepo (el usuario ya trabaja con `nvm`).
- **Sí:** Prisma como ORM — mejor DX y migraciones más simples que TypeORM.
- **Sí:** módulo `identity` propio en vez de un proveedor gestionado — necesario para vincular una misma cuenta por número de teléfono entre Google/Apple/Facebook/credenciales, algo que un proveedor gestionado maneja con menos flexibilidad.
- **Sí:** multi-tenancy de schema único con columna `tenant_id` — el más simple de operar para el alcance actual (México); se puede evolucionar a schema-por-tenant más adelante si hace falta.
- **Sí:** incluir `mobile` (Expo) y `backoffice` (Vite+React) desde el inicio, por pedido explícito.
- **Sí:** proveedores externos (Stripe, Twilio, Resend, Elasticsearch, Firebase, Cloudinary) instalados con cliente placeholder ahora; la integración funcional completa se define en specs de dominio.
- **Sí:** Cloudinary para almacenamiento de medios (galerías, documentos KYC) — menos fricción de configuración que S3/GCS crudo para un MVP.
- **Sí:** instalar las últimas versiones estables mediante los comandos oficiales de cada herramienta (NestJS 11, Next.js 15, Expo SDK vigente, Vite+React vigente) en vez de fijar versiones exactas en la spec.
- **No:** lógica de pipelines de CI/CD (pasos de build/test/deploy) — solo archivos de workflow vacíos; los pipelines completos son una spec futura.
- **No:** e2e de mobile (Detox) — no hay pantallas con lógica real que probar todavía.
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
