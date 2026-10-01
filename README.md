# Vibe Planners

Vibe Planners is a modular monorepo for event planning and management. The repository currently contains the base architecture and application scaffolding; domain business logic and production integrations are defined in future specifications.

## Stack

- Node.js `24.14.0` via `.nvmrc`
- npm workspaces and Turborepo
- NestJS 12 with ESM and Vitest for the API
- Next.js 15 with App Router for the web app
- Vite 8 and React for the backoffice
- Expo SDK 57 and React Native for mobile
- Prisma 6 and PostgreSQL
- Shared TypeScript types, Zod validations, UI components, ESLint, Prettier, Husky and lint-staged

## Repository layout

```text
apps/
  api/          NestJS API and domain module placeholders
  web/          Next.js web application
  backoffice/   Vite and React administration panel
  mobile/       Expo and React Native application
packages/
  config/             Shared ESLint, TypeScript and Tailwind configuration
  database/           Prisma schema and migrations
  shared-types/       Shared TypeScript contracts
  shared-validations/ Shared Zod schemas
  ui/                 Shared web UI components
docker/               PostgreSQL, Redis and Elasticsearch services
docs/                 Architecture documentation
specs/                Approved implementation specifications
```

## Getting started

Use Node.js `24.14.0` and install the workspace dependencies from the repository root:

```bash
nvm use
npm install
```

Copy the relevant `.env.example` file for each application and provide environment-specific values. Never commit real credentials. Docker is used for the local PostgreSQL, Redis and Elasticsearch services:

```bash
docker compose -f docker/docker-compose.yml up -d
```

## Common commands

Run commands from the repository root:

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run format
```

Run an individual workspace command with npm:

```bash
npm run test --workspace=apps/api
npm run test --workspace=apps/backoffice
npm run test:e2e --workspace=apps/web
npm run typecheck --workspace=apps/mobile
```

## Current validation status

The root Turborepo build and lint pipelines pass in the local development environment. API Vitest tests, backoffice Jest tests and the web Playwright smoke test also pass. Docker-dependent checks, including the API health check against a live PostgreSQL instance, must be validated in an environment with Docker available.

See [docs/architecture.md](docs/architecture.md) for the current architecture and [specs/01-arquitectura-scaffolding-monorepo.md](specs/01-arquitectura-scaffolding-monorepo.md) for the approved scaffolding scope.

## Generated files

TypeScript incremental build metadata (`*.tsbuildinfo`) is generated locally and ignored by Git. Build output, coverage, framework caches and local environment files are also excluded from version control.
