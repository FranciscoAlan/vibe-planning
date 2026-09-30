-- Runs automatically on first container start (docker-entrypoint-initdb.d).
-- Placeholder: per-domain seed/extension scripts land here as specs are implemented.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
