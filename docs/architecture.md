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
| Git hooks            | Husky + lint-staged                                                       | Corre ESLint + Prettier antes de cada commit                                                                               |

## Estructura actual

```
apps/
  api/                  # NestJS 12 — ver detalle abajo
packages/
  config/               # eslint-config, tsconfig, tailwind-config compartidos
  shared-types/          # IUser, ITenant, UserRole, AuthProvider
  shared-validations/     # Esquemas Zod de auth/tenant
  database/              # Prisma schema + migración inicial (Tenant, User, AuthIdentity)
docker/
  docker-compose.yml     # Postgres, Redis, Elasticsearch
specs/
  01-arquitectura-scaffolding-monorepo.md
```

Aún no existen `apps/web`, `apps/mobile`, `apps/backoffice`, `packages/ui` (pasos 8–14 de la spec).

## `apps/api` — detalle

- **Runtime:** ESM (`"type": "module"`), TypeScript 6, `nest build`/`nest start`.
- **Testing:** Vitest (`npm run test`, `npm run test:e2e`).
- **Lint:** `eslint.config.cjs` extiende `packages/config/eslint-config/base.js` + globals de Vitest para specs.
- **Módulos de dominio (placeholder, devuelven 501):** `identity`, `directory`, `booking`, `finance`, `search`, `chat`, `admin` en `src/modules/<nombre>/`.
- **`src/common/`:** `filters/http-exception.filter.ts` (normaliza errores), `interceptors/logging.interceptor.ts` (log de requests), `guards/placeholder.guard.ts` (permite todo, se reemplaza cuando `identity` tenga guards reales).
- **`src/health/`:** `GET /health` corre `SELECT 1` vía Prisma (`common/prisma/prisma.service.ts`) y responde `200`/`503` según conectividad a la DB.
- **Dependencia:** `@vibe-planners/database` (workspace) para el cliente Prisma.

## Pendiente de validación local (requiere Docker, no disponible en este entorno)

- `docker compose -f docker/docker-compose.yml up -d` — levantar Postgres/Redis/Elasticsearch.
- `npm run migrate:dev --workspace=@vibe-planners/database` — aplicar la migración inicial contra una DB real.
- `GET /health` debe responder `200` con la DB arriba.

## Vulnerabilidades conocidas (aceptadas)

- `deepmerge-ts <8.0.0` vía `@prisma/config` (dependencia de la CLI de Prisma, solo dev, sin parche estable disponible aún). Severidad alta pero bajo riesgo real: no corre en producción ni procesa input externo.
