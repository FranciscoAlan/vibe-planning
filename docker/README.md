# Docker (local infrastructure)

Brings up Postgres, Redis, and Elasticsearch for local development.

## Usage

```bash
docker compose -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml ps
docker compose -f docker/docker-compose.yml down
```

## Services

| Service       | Port | Purpose                                  |
| ------------- | ---- | ---------------------------------------- |
| postgres      | 5432 | Primary relational database (Prisma)     |
| redis         | 6379 | Caching / session storage                |
| elasticsearch | 9200 | Listing search (see `search` API module) |

`init-scripts/postgres/` runs automatically on the first Postgres start. `pgcrypto` is enabled there for `gen_random_uuid()`, used by the Prisma schema in `packages/database`.

Once the containers are healthy, apply the database schema:

```bash
cp packages/database/.env.example packages/database/.env
npm run migrate:dev --workspace=@vibe-planners/database
```
