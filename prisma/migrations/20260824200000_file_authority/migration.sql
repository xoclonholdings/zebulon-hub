CREATE TABLE "zcos_file_artifacts" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "galaxy_id" TEXT NOT NULL DEFAULT 'zenith',
    "uploaded_from_galaxy_id" TEXT,
    "category" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "content_hash" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'stored',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zcos_file_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "zcos_file_artifacts_owner_user_id_created_at_idx"
ON "zcos_file_artifacts"("owner_user_id", "created_at");

CREATE INDEX "zcos_file_artifacts_owner_user_id_content_hash_idx"
ON "zcos_file_artifacts"("owner_user_id", "content_hash");
