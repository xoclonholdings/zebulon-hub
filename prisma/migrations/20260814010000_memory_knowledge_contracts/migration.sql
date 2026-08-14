CREATE TABLE IF NOT EXISTS "zcos_memory_settings" (
  "owner_user_id" TEXT PRIMARY KEY,
  "memory_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "zcos_memory_records"
  ADD COLUMN IF NOT EXISTS "properties" JSONB,
  ADD COLUMN IF NOT EXISTS "topics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "entity_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "source_refs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "confidence" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "occurred_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "confirmation_method" TEXT,
  ADD COLUMN IF NOT EXISTS "supersedes_id" TEXT,
  ADD COLUMN IF NOT EXISTS "derived_from_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "retention_policy" JSONB,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletion_cascade_id" TEXT;

CREATE INDEX IF NOT EXISTS "zcos_memory_records_owner_user_id_canonical_name_idx"
  ON "zcos_memory_records"("owner_user_id", "canonical_name");

CREATE TABLE IF NOT EXISTS "zcos_memory_relationships" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "galaxy_id" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "object_id" TEXT NOT NULL,
  "predicate" TEXT NOT NULL,
  "source_refs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "confidence" DOUBLE PRECISION,
  "lifecycle_state" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "zcos_memory_relationships_owner_user_id_galaxy_id_subject_id_idx"
  ON "zcos_memory_relationships"("owner_user_id", "galaxy_id", "subject_id");
CREATE INDEX IF NOT EXISTS "zcos_memory_relationships_owner_user_id_galaxy_id_object_id_idx"
  ON "zcos_memory_relationships"("owner_user_id", "galaxy_id", "object_id");

ALTER TABLE "zcos_knowledge_records"
  ADD COLUMN IF NOT EXISTS "properties" JSONB,
  ADD COLUMN IF NOT EXISTS "topic_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "entity_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "source_bindings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "scope" JSONB,
  ADD COLUMN IF NOT EXISTS "confidence" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "supersedes_id" TEXT;

CREATE INDEX IF NOT EXISTS "zcos_knowledge_records_owner_user_id_canonical_name_idx"
  ON "zcos_knowledge_records"("owner_user_id", "canonical_name");

CREATE TABLE IF NOT EXISTS "zcos_knowledge_relationships" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "galaxy_id" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "object_id" TEXT NOT NULL,
  "predicate" TEXT NOT NULL,
  "scope" JSONB,
  "source_bindings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "confidence" DOUBLE PRECISION,
  "lifecycle_state" TEXT NOT NULL DEFAULT 'candidate',
  "valid_from" TIMESTAMP(3),
  "valid_to" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "zcos_knowledge_relationships_owner_user_id_galaxy_id_subject_id_idx"
  ON "zcos_knowledge_relationships"("owner_user_id", "galaxy_id", "subject_id");
CREATE INDEX IF NOT EXISTS "zcos_knowledge_relationships_owner_user_id_galaxy_id_object_id_idx"
  ON "zcos_knowledge_relationships"("owner_user_id", "galaxy_id", "object_id");

CREATE TABLE IF NOT EXISTS "zcos_topics" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "galaxy_id" TEXT NOT NULL,
  "canonical_label" TEXT NOT NULL,
  "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "description" TEXT,
  "parent_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "related_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "lifecycle_state" TEXT NOT NULL DEFAULT 'active',
  "redirect_to_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "zcos_topics_owner_user_id_galaxy_id_lifecycle_state_idx"
  ON "zcos_topics"("owner_user_id", "galaxy_id", "lifecycle_state");

CREATE TABLE IF NOT EXISTS "zcos_lexicon_senses" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "galaxy_id" TEXT NOT NULL,
  "canonical_form" TEXT NOT NULL,
  "variants" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "definition" TEXT NOT NULL,
  "contexts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "domains" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "communities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "examples" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "source_bindings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "confidence" DOUBLE PRECISION,
  "lifecycle_state" TEXT NOT NULL DEFAULT 'candidate',
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "zcos_lexicon_senses_owner_user_id_galaxy_id_canonical_form_idx"
  ON "zcos_lexicon_senses"("owner_user_id", "galaxy_id", "canonical_form");

ALTER TABLE "zcos_source_records"
  ADD COLUMN IF NOT EXISTS "source_owner_user_id" TEXT,
  ADD COLUMN IF NOT EXISTS "source_galaxy_id" TEXT,
  ADD COLUMN IF NOT EXISTS "artifact_ref" TEXT,
  ADD COLUMN IF NOT EXISTS "title" TEXT,
  ADD COLUMN IF NOT EXISTS "author" TEXT,
  ADD COLUMN IF NOT EXISTS "publisher" TEXT,
  ADD COLUMN IF NOT EXISTS "evidence_excerpt" TEXT,
  ADD COLUMN IF NOT EXISTS "extraction_method" TEXT,
  ADD COLUMN IF NOT EXISTS "content_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "rights" JSONB,
  ADD COLUMN IF NOT EXISTS "retention" JSONB,
  ADD COLUMN IF NOT EXISTS "lineage" JSONB,
  ADD COLUMN IF NOT EXISTS "occurred_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "accessed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
