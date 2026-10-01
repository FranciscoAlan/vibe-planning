# Arquitectura — Vibe Planners

Este documento refleja el estado real del monorepo a medida que se implementan [SPEC 01](../specs/01-arquitectura-scaffolding-monorepo.md) y [SPEC 02](../specs/02-modelos-dominio-directorio.md). Se actualiza conforme avanza la implementación, no es un documento de diseño aspiracional.

## Stack y versiones reales instaladas

| Área                 | Decisión                                                                  | Nota                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Monorepo             | Turborepo + npm workspaces                                                | `npm@11.9.0`                                                                                                               |
| Node                 | `.nvmrc` → `24.14.0`                                                      |                                                                                                                            |
| Backend (`apps/api`) | NestJS **12** (ESM + Vitest)                                              | El generador cambió sus defaults; `@nestjs/testing@12` es ESM-only, por eso no se usó CJS+Jest. Ver Decisiones en la spec. |
| Linter               | ESLint 10 (flat config) compartido vía `packages/config/eslint-config`    | Reemplaza a `oxlint` (default de Nest 12) para mantener un solo linter en todo el repo                                     |
| Formateo             | Prettier + `.editorconfig` + `files.eol: "\n"` en `.vscode/settings.json` | Line endings normalizados con `.gitattributes` (`eol=lf`)                                                                  |
| ORM                  | Prisma 6                                                                  | `packages/database` (modelos base, directorio y promociones)                                                               |
| DB local             | Postgres 17, Redis 7, Elasticsearch 8.16 vía `docker/docker-compose.yml`  | No verificado en este entorno (sin Docker disponible)                                                                      |
| Web (`apps/web`)     | Next.js 15.5.27 + React 19.2.3                                            | App Router, Tailwind 3, Playwright smoke test; Jest todavía pendiente                                                      |
| Backoffice           | Vite 8.3.1 + React 19.2.3                                                 | Jest con SWC                                                                                                               |
| Mobile               | Expo SDK 57 + React Native 0.86.3 + React 19.2.3                          | Expo Router; rutas universales para nativo y web                                                                           |
| UI compartida        | `@vibe-planners/ui`                                                       | Componente `Button`; peer de React fijado a `19.2.3` para evitar duplicados con Expo                                       |
| Git hooks            | Husky + lint-staged                                                       | Corre ESLint + Prettier antes de cada commit                                                                               |

## Estructura actual

```
apps/
  api/                  # NestJS 12 — controladores base + módulo Directory activo
  web/                  # Next.js 15 — App Router, Tailwind, Playwright
  backoffice/           # Vite 8 + React — panel inicial con Jest
  mobile/               # Expo SDK 57 — Expo Router, React Native
packages/
  config/               # eslint-config, tsconfig, tailwind-config compartidos
  shared-types/         # Tipos compartidos: IUser, ITenant, ICategory, IListing, IListingPromotion, etc.
  shared-validations/   # Esquemas Zod de auth, tenant, publicaciones y promociones
  database/             # Prisma schema, migraciones y seeders (Tenants, Users, Categories, Listings, etc.)
  ui/                   # Button compartido para apps web
docker/
  docker-compose.yml     # Postgres, Redis, Elasticsearch
README.md               # Setup, commands and current validation status
\.env.example           # Root environment variable template
.github/workflows/      # Empty dev, QA and production workflow triggers
specs/
  01-arquitectura-scaffolding-monorepo.md
  02-modelos-dominio-directorio.md
```

## `apps/api` — detalle

- **Runtime:** ESM (`"type": "module"`), TypeScript 6, `nest build`/`nest start`.
- **Testing:** Vitest (`npm run test`, `npm run test:e2e`). 4 suites y 10 tests unitarios pasando.
- **Lint:** `eslint.config.cjs` extiende `packages/config/eslint-config/base.js` + globals de Vitest para specs.
- **Módulos de dominio:**
  - `directory`: **Activo (SPEC 02)** — conectado a Prisma, validación con Zod, soporte de filtros paginados, publicaciones, galerías y promociones.
  - `identity`, `booking`, `finance`, `search`, `chat`, `admin`: placeholders en `src/modules/<nombre>/`.
- **`src/common/`:** `filters/http-exception.filter.ts` (normaliza errores), `interceptors/logging.interceptor.ts` (log de requests), `guards/placeholder.guard.ts` (permite todo, se reemplaza cuando `identity` tenga guards reales).
- **`src/health/`:** `GET /health` corre `SELECT 1` vía Prisma (`common/prisma/prisma.service.ts`) y responde `200`/`503` según conectividad a la DB.
- **Dependencia:** `@vibe-planners/database` (workspace) para el cliente Prisma.

### Módulo `directory` (SPEC 02)

- **Servicio (`DirectoryService`):**
  - `getCategories()` / `getCategoryBySlug()`: consulta jerárquica con subcategorías activas ordenadas.
  - `getListings()`: búsqueda paginada y filtrable por `categoryId`, `subcategoryId`, `city`, `state`, rangos de `minPrice`/`maxPrice`, `status` y `hasPromotions` (vigentes con `endDate >= now()`).
  - `getListingById()`: detalle completo con relaciones a categoría, subcategoría, galería (`media`), promociones activas y datos públicos del proveedor (`owner`).
  - `createListing()` / `updateListing()`: generación automática de slug único dentro del tenant, persistencia de precios base y reglas híbridas en JSONB (`pricing_rules`), más galería de medios.
  - `createPromotion()`: alta de cupones y descuentos porcentuales o de monto fijo asociados a una publicación.
- **Controlador (`DirectoryController`):**
  - Expone `/directory/categories`, `/directory/categories/:slug`, `/directory/listings`, `/directory/listings/:id` y `/directory/listings/:id/promotions`.
  - Exige y valida el header multi-tenant `x-tenant-id` a través de `TenantRequest`.
  - Valida estrictamente todos los payloads entrantes contra los esquemas Zod de `@vibe-planners/shared-validations` (`createListingSchema`, `updateListingSchema`, `listingFilterSchema`, `createPromotionSchema`), devolviendo `BadRequestException` formateado si fallan.
- **Tests unitarios:**
  - `directory.service.spec.ts`: pruebas aisladas con mocks de Prisma para consultas, paginación, creación de publicaciones y promociones.
  - `directory.controller.spec.ts`: verificación de rechazo ante ausencia de header `x-tenant-id`, rechazo de payloads inválidos y delegación correcta hacia el servicio.

### Módulo `identity` (Paso 7 de SPEC 01)

- **JWT:** `@nestjs/jwt` registrado con `JWT_SECRET`/`JWT_EXPIRES_IN` por variable de entorno (default `dev-only-placeholder-secret` / `1h`). `IdentityService.issueToken()` firma el payload `{ sub, tenantId, role }`.
- **Estrategias Passport:** `credentials` (email/password, stub — `validate()` lanza `UnauthorizedException`), `jwt` (Bearer token real, usada por `JwtAuthGuard`), `google`/`facebook` (passport-google-oauth20/passport-facebook configuradas con client ID/secret/callback por env var, `validate()` devuelve el profile sin persistir nada).
- **`apple`/`phone-otp`:** clases simples (no Passport strategies, no hay librería madura para Sign in with Apple ni OTP por teléfono) cuyos métodos lanzan `Error('... not implemented yet')`. Flujo real queda para la spec de `identity`.
- **2FA:** `TwoFactorService` usa `otplib@^12` (TOTP) — `generateSecret()`/`verifyCode()`, sin persistencia todavía. **Nota:** `otplib@13` reescribió la API (quitó `authenticator` simple a favor de clases `TOTP`/`HOTP` con plugins de crypto); se fijó la versión en `12.x` por compatibilidad.
- **Endpoints (`/identity/*`):** `register`, `register/provider`, `login`, `2fa/verify` — todos devuelven `501` pero validan el body contra los schemas Zod de `@vibe-planners/shared-validations`.
- **`TenantMiddleware`:** aplicado global en `AppModule` (`implements NestModule`), lee el header `x-tenant-id` y lo expone en `req.tenantId`. Placeholder hasta que se diseñe la resolución real por subdominio/dominio en `directory`/`admin`.
- **Test funcional:** `two-factor.service.spec.ts` genera un secreto, produce un código TOTP válido con `otplib` y confirma que `verifyCode` lo acepta y rechaza un código inválido.

### Integraciones externas (Paso 8)

- Dependencias instaladas: Stripe, Twilio, Resend, Elasticsearch, Firebase Admin y Cloudinary.
- `src/integrations/` expone clientes inyectables con configuración por variables de entorno. Sus métodos `initialize()` fallan explícitamente con `integration is not implemented`; no realizan llamadas externas.

### Salud (Paso 9)

- `test/app.e2e-spec.ts` verifica `GET /health` con Vitest y un mock de Prisma (`200`, `{ status: 'ok', database: 'up' }`), sin depender de Docker.
- La conexión contra Postgres real sigue pendiente de validación local.

## Frontends

### `apps/web` (Paso 10)

- Next.js 15 App Router con grupos `(public)`, `(auth)`, `(dashboard)` y `(client)`, Tailwind y `@vibe-planners/ui`.
- Playwright ejecuta un smoke test de la vista Overview (`npm run test:e2e --workspace=apps/web`). Jest unitario para web sigue pendiente.
- `npm run build` y `npm run lint` pasan en el workspace.

### `apps/backoffice` (Paso 11)

- Vite 8 + React, pantalla de operaciones inicial y Jest configurado con SWC.
- `npm run build`, `npm run lint` y `npm test` pasan en el workspace.

### `apps/mobile` (Paso 12)

- Expo SDK 57 / React Native 0.86.3 usa Expo Router desde `src/app/`; `src/screens/`, `src/navigation/` y `src/hooks/` mantienen separadas las vistas, opciones de stack y lógica reutilizable.
- Incluye Overview, lista de eventos y `useGreeting`. React y React DOM se comparten en versión `19.2.3` para evitar copias nativas incompatibles.
- `npm run typecheck`, `npm run lint` y `npx expo export --platform web` pasan. Expo Doctor reporta 21/21 chequeos correctos.
- Expo puede iniciarse con `npm run dev --workspace=apps/mobile`; la vista web se abre con `npm run web --workspace=apps/mobile`.

### `packages/database` (SPEC 01 y SPEC 02)

- **Modelos:**
  - `Tenant`, `User`, `AuthIdentity` (Autenticación y multi-tenancy con aislamiento por `tenant_id`).
  - `Category`, `Subcategory` (Catálogo jerárquico base).
  - `Listing`, `ListingMedia`, `ListingPromotion` (Publicaciones con pricing híbrido JSONB, galería y promociones con vigencia y límite de canjes).
- **Migraciones:**
  - `20260930155937_init`: tablas de tenants, users y auth_identities.
  - `20260930190000_directory_and_listings`: tablas de categorías, subcategorías, publicaciones, promociones y medios con índices compuestos `(tenant_id, id)`.
- **Seeder:** `packages/database/prisma/seed.ts` precarga las 10 categorías principales de México y sus subcategorías. Ejecutable con `npm run db:seed --workspace=@vibe-planners/database`.

### `packages/shared-types` y `packages/shared-validations` (SPEC 02)

- **Tipos compartidos:** interfaces de `ICategory`, `ISubcategory`, `IListing`, `IListingMedia`, `IListingPromotion`, `IPricingRules`, `IPricingPackage`, y enums `ListingStatus`, `PriceUnit`, `DiscountType`.
- **Validaciones Zod:** esquemas tipados `createListingSchema`, `updateListingSchema`, `listingFilterSchema` y `createPromotionSchema`.

### `packages/ui`

- `@vibe-planners/ui` exporta el `Button` compartido que consume la app web.

## Tooling and environment configuration

- The root scripts in `package.json` run `dev`, `build`, `lint`, `test` and `format` through Turborepo.
- Environment templates exist at the root and in `apps/api`, `apps/web`, `apps/backoffice` and `apps/mobile`; the database package also has a database-specific template. They contain placeholders for development, QA and production values, including database, Redis, Elasticsearch, JWT and external providers.
- `.github/workflows/deploy-dev.yml`, `deploy-qa.yml` and `deploy-prod.yml` currently contain only a workflow name and a branch push trigger. They intentionally have no build, test or deploy jobs yet.
- TypeScript incremental metadata (`*.tsbuildinfo`), build output, caches, coverage and local environment files are excluded through `.gitignore`.

The verified root commands are:

```text
npm run lint -- --ui=stream   # 8 Turborepo tasks successful
npm run build                 # 5 Turborepo tasks successful
```

API Vitest, backoffice Jest and the web Playwright smoke test also pass. The web Jest unit test and Docker-dependent checks remain pending.

## Pendiente de validación local (requiere Docker, no disponible en este entorno)

- `docker compose -f docker/docker-compose.yml up -d` — levantar Postgres/Redis/Elasticsearch.
- `npm run migrate:dev --workspace=@vibe-planners/database` — aplicar la migración inicial contra una DB real.
- `GET /health` debe responder `200` con la DB arriba.

## Vulnerabilidades conocidas (aceptadas)

- `deepmerge-ts <8.0.0` vía `@prisma/config` (dependencia de la CLI de Prisma, solo dev, sin parche estable disponible aún). Severidad alta pero bajo riesgo real: no corre en producción ni procesa input externo.
