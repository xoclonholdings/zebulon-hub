CREATE TABLE IF NOT EXISTS "zcos_galaxies" (
  "id" TEXT PRIMARY KEY,
  "console" TEXT NOT NULL,
  "desk" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "zcos_migration_batches" (
  "id" TEXT PRIMARY KEY,
  "source_repo" TEXT NOT NULL,
  "source_commit" TEXT NOT NULL,
  "schema_version" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "counts" JSONB,
  "checksum" TEXT,
  "outcome" JSONB,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "zcos_memory_records" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "galaxy_id" TEXT NOT NULL,
  "memory_type" TEXT NOT NULL,
  "canonical_name" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "lifecycle_state" TEXT NOT NULL DEFAULT 'proposed',
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "zcos_memory_records_owner_user_id_galaxy_id_lifecycle_state_idx"
  ON "zcos_memory_records"("owner_user_id", "galaxy_id", "lifecycle_state");

CREATE TABLE IF NOT EXISTS "zcos_knowledge_records" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "galaxy_id" TEXT NOT NULL,
  "object_type" TEXT NOT NULL,
  "canonical_name" TEXT NOT NULL,
  "summary" TEXT,
  "lifecycle_state" TEXT NOT NULL DEFAULT 'candidate',
  "origin_class" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'unknown',
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "zcos_knowledge_records_owner_user_id_galaxy_id_lifecycle_state_idx"
  ON "zcos_knowledge_records"("owner_user_id", "galaxy_id", "lifecycle_state");

CREATE TABLE IF NOT EXISTS "zcos_source_records" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "galaxy_id" TEXT NOT NULL,
  "source_type" TEXT NOT NULL,
  "source_id" TEXT NOT NULL,
  "origin_class" TEXT,
  "locator" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "zcos_source_records_owner_user_id_galaxy_id_idx"
  ON "zcos_source_records"("owner_user_id", "galaxy_id");
CREATE INDEX IF NOT EXISTS "zcos_source_records_source_type_source_id_idx"
  ON "zcos_source_records"("source_type", "source_id");

CREATE TABLE IF NOT EXISTS "zcos_partition_grants" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "source_galaxy_id" TEXT NOT NULL,
  "target_galaxy_id" TEXT NOT NULL,
  "authority_kind" TEXT NOT NULL,
  "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "zcos_partition_grants_owner_user_id_source_galaxy_id_target_galaxy_id_idx"
  ON "zcos_partition_grants"("owner_user_id", "source_galaxy_id", "target_galaxy_id");

CREATE TABLE IF NOT EXISTS "zcos_audit_events" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT,
  "galaxy_id" TEXT,
  "event_type" TEXT NOT NULL,
  "target_type" TEXT,
  "target_id" TEXT,
  "details" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "zcos_audit_events_owner_user_id_created_at_idx"
  ON "zcos_audit_events"("owner_user_id", "created_at");

INSERT INTO "zcos_galaxies" ("id", "console", "desk") VALUES
  ('ZAR', 'NEXYS', 'OPERATE'),
  ('ZYNC', 'CANVAS', 'BUILD'),
  ('ZETA', 'CONTROL', 'INTEGRITY'),
  ('ZENO', 'UNITE', 'FORUM'),
  ('ZYLO', 'COMPASS', 'AUTOMATE'),
  ('ZWAP!', 'DISCOVERY', 'EXPLORE'),
  ('ZENITH', 'LOGOS', 'SCHOLAR'),
  ('ZILLION', 'PROSPER', 'CAPITAL')
ON CONFLICT ("id") DO UPDATE SET
  "console" = EXCLUDED."console",
  "desk" = EXCLUDED."desk",
  "enabled" = TRUE,
  "updated_at" = CURRENT_TIMESTAMP;
