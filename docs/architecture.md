# Arquitectura — Vibe Planners

Este documento refleja el estado real del monorepo a medida que se implementa [SPEC 01](../specs/01-arquitectura-scaffolding-monorepo.md). Se actualiza conforme avanza la implementación, no es un documento de diseño aspiracional.

## Stack y versiones reales instaladas

| Área                 | Decisión                                                                  | Nota                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Monorepo             | Turborepo + npm workspaces                                                | `npm@11.9.0`                                                                                                               |
| Node                 | `.nvmrc` → `24.14.0`                                                      |                                                                                                                            |
| Backend (`apps/api`) | NestJS **12** (ESM + Vitest)                                              | El generador cambió sus defaults; `@nestjs/testing@12` es ESM-only, por eso no se usó CJS+Jest. Ver Decisiones en la spec. |
| Linter               | ESLint 9 (flat config) compartido vía `packages/config/eslint-config`     | Reemplaza a `oxlint` (default de Nest 12) para mantener un solo linter en todo el repo                                     |
| Formateo             | Prettier + `.editorconfig` + `files.eol: "\n"` en `.vscode/settings.json` | Line endings normalizados con `.gitattributes` (`eol=lf`)                                                                  |
| ORM                  | Prisma 6                                                                  | `packages/database`                                                                                                        |
| DB local             | Postgres 17, Redis 7, Elasticsearch 8.16 vía `docker/docker-compose.yml`  | No verificado en este entorno (sin Docker disponible)                                                                      |
| Web (`apps/web`)     | Next.js 15.5.27 + React 19.2.3                                            | App Router, Tailwind 3, Playwright smoke test; Jest todavía pendiente                                                      |
| Backoffice           | Vite 8.3.1 + React 19.2.3                                                 | Jest con SWC                                                                                                               |
| Mobile               | Expo SDK 57 + React Native 0.86.3 + React 19.2.3                          | Expo Router; rutas universales para nativo y web                                                                           |
| UI compartida        | `@vibe-planners/ui`                                                       | Componente `Button`; peer de React fijado a `19.2.3` para evitar duplicados con Expo                                       |
| Git hooks            | Husky + lint-staged                                                       | Corre ESLint + Prettier antes de cada commit                                                                               |

## Estructura actual

```
apps/
  api/                  # NestJS 12 — ver detalle abajo
  web/                  # Next.js 15 — App Router, Tailwind, Playwright
  backoffice/           # Vite 8 + React — panel inicial con Jest
  mobile/               # Expo SDK 57 — Expo Router, React Native
packages/
  config/               # eslint-config, tsconfig, tailwind-config compartidos
  shared-types/          # IUser, ITenant, UserRole, AuthProvider
  shared-validations/     # Esquemas Zod de auth/tenant
  database/              # Prisma schema + migración inicial (Tenant, User, AuthIdentity)
  ui/                    # Button compartido para apps web
docker/
  docker-compose.yml     # Postgres, Redis, Elasticsearch
specs/
  01-arquitectura-scaffolding-monorepo.md
```

## `apps/api` — detalle

- **Runtime:** ESM (`"type": "module"`), TypeScript 6, `nest build`/`nest start`.
- **Testing:** Vitest (`npm run test`, `npm run test:e2e`).
- **Lint:** `eslint.config.cjs` extiende `packages/config/eslint-config/base.js` + globals de Vitest para specs.
- **Módulos de dominio (placeholder, devuelven 501):** `identity`, `directory`, `booking`, `finance`, `search`, `chat`, `admin` en `src/modules/<nombre>/`.
- **`src/common/`:** `filters/http-exception.filter.ts` (normaliza errores), `interceptors/logging.interceptor.ts` (log de requests), `guards/placeholder.guard.ts` (permite todo, se reemplaza cuando `identity` tenga guards reales).
- **`src/health/`:** `GET /health` corre `SELECT 1` vía Prisma (`common/prisma/prisma.service.ts`) y responde `200`/`503` según conectividad a la DB.
- **Dependencia:** `@vibe-planners/database` (workspace) para el cliente Prisma.

### Módulo `identity` (Paso 7)

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

### `packages/ui`

- `@vibe-planners/ui` exporta el `Button` compartido que consume la app web.

## Pendiente de validación local (requiere Docker, no disponible en este entorno)

- `docker compose -f docker/docker-compose.yml up -d` — levantar Postgres/Redis/Elasticsearch.
- `npm run migrate:dev --workspace=@vibe-planners/database` — aplicar la migración inicial contra una DB real.
- `GET /health` debe responder `200` con la DB arriba.

## Vulnerabilidades conocidas (aceptadas)

- `deepmerge-ts <8.0.0` vía `@prisma/config` (dependencia de la CLI de Prisma, solo dev, sin parche estable disponible aún). Severidad alta pero bajo riesgo real: no corre en producción ni procesa input externo.
