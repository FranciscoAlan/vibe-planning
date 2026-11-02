BEGIN;

CREATE TYPE "user_profile_type" AS ENUM ('CLIENT', 'EVENT_PLANNER');
CREATE TYPE "organization_role" AS ENUM ('OWNER', 'PROVIDER', 'ADMIN');
CREATE TYPE "account_status" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE');
CREATE TYPE "challenge_channel" AS ENUM ('SMS', 'EMAIL');
CREATE TYPE "challenge_purpose" AS ENUM (
    'PHONE_VERIFICATION',
    'PHONE_LOGIN',
    'EMAIL_VERIFICATION',
    'PASSWORD_RESET'
);

ALTER TABLE "users"
    ADD COLUMN "email_verified_at" TIMESTAMPTZ(6),
    ADD COLUMN "phone_verified_at" TIMESTAMPTZ(6),
    ADD COLUMN "status" "account_status" NOT NULL DEFAULT 'PENDING_VERIFICATION';

CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role" "user_profile_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "organization_role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "last_used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification_challenges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "channel" "challenge_channel" NOT NULL,
    "purpose" "challenge_purpose" NOT NULL,
    "target" TEXT NOT NULL,
    "secret_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verification_challenges_pkey" PRIMARY KEY ("id")
);

INSERT INTO "user_profiles" ("id", "user_id", "role", "created_at")
SELECT gen_random_uuid(), "id", "role"::text::"user_profile_type", "created_at"
FROM "users"
WHERE "role" IN ('CLIENT', 'EVENT_PLANNER');

INSERT INTO "organization_memberships" ("id", "tenant_id", "user_id", "role", "created_at")
SELECT gen_random_uuid(), "tenant_id", "id", "role"::text::"organization_role", "created_at"
FROM "users"
WHERE "role" IN ('PROVIDER', 'ADMIN');

CREATE UNIQUE INDEX "user_profiles_user_id_role_key" ON "user_profiles"("user_id", "role");
CREATE UNIQUE INDEX "organization_memberships_tenant_id_user_id_key" ON "organization_memberships"("tenant_id", "user_id");
CREATE INDEX "organization_memberships_user_id_role_idx" ON "organization_memberships"("user_id", "role");
CREATE UNIQUE INDEX "auth_sessions_token_hash_key" ON "auth_sessions"("token_hash");
CREATE INDEX "auth_sessions_user_id_expires_at_idx" ON "auth_sessions"("user_id", "expires_at");
CREATE INDEX "auth_sessions_family_id_revoked_at_idx" ON "auth_sessions"("family_id", "revoked_at");
CREATE INDEX "verification_challenges_user_id_purpose_expires_at_idx" ON "verification_challenges"("user_id", "purpose", "expires_at");

ALTER TABLE "user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_memberships"
    ADD CONSTRAINT "organization_memberships_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "organization_memberships_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "auth_sessions"
    ADD CONSTRAINT "auth_sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "verification_challenges"
    ADD CONSTRAINT "verification_challenges_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_fkey";
DROP INDEX "users_tenant_id_id_idx";
ALTER TABLE "users" DROP COLUMN "tenant_id", DROP COLUMN "role";
DROP TYPE "user_role";

COMMIT;
