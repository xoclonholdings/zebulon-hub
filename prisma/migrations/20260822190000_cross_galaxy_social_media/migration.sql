CREATE TABLE IF NOT EXISTS "zcos_social_connections" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "account_ref" TEXT NOT NULL,
  "credential_ref" TEXT,
  "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "platforms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "state" TEXT NOT NULL DEFAULT 'connected',
  "metadata" JSONB,
  "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "disconnected_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "zcos_social_connections_owner_provider_account_key" UNIQUE ("owner_user_id", "provider", "account_ref")
);
CREATE INDEX IF NOT EXISTS "zcos_social_connections_owner_user_id_state_idx"
  ON "zcos_social_connections"("owner_user_id", "state");

CREATE TABLE IF NOT EXISTS "zcos_social_campaigns" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "project_ref" TEXT,
  "name" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "brand_context" JSONB NOT NULL,
  "audience_context" JSONB NOT NULL,
  "platform_objectives" JSONB NOT NULL,
  "strategy_alternatives" JSONB NOT NULL,
  "selected_strategy_id" TEXT,
  "state" TEXT NOT NULL DEFAULT 'draft',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "zcos_social_campaigns_owner_user_id_state_updated_at_idx"
  ON "zcos_social_campaigns"("owner_user_id", "state", "updated_at");
CREATE INDEX IF NOT EXISTS "zcos_social_campaigns_owner_user_id_project_ref_idx"
  ON "zcos_social_campaigns"("owner_user_id", "project_ref");

CREATE TABLE IF NOT EXISTS "zcos_social_research_signals" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "contributor_galaxy" TEXT NOT NULL,
  "platform" TEXT,
  "signal_type" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "source_locator" TEXT NOT NULL,
  "source_title" TEXT,
  "published_at" TIMESTAMP(3),
  "accessed_at" TIMESTAMP(3) NOT NULL,
  "fresh_until" TIMESTAMP(3),
  "provenance" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "zcos_social_research_signals_owner_campaign_accessed_idx"
  ON "zcos_social_research_signals"("owner_user_id", "campaign_id", "accessed_at");
CREATE INDEX IF NOT EXISTS "zcos_social_research_signals_owner_platform_fresh_idx"
  ON "zcos_social_research_signals"("owner_user_id", "platform", "fresh_until");

CREATE TABLE IF NOT EXISTS "zcos_social_content" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content_kind" TEXT NOT NULL,
  "brief" JSONB NOT NULL,
  "source_bindings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "asset_refs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "state" TEXT NOT NULL DEFAULT 'draft',
  "created_by_galaxy" TEXT NOT NULL DEFAULT 'ZYNC',
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "zcos_social_content_owner_campaign_state_idx"
  ON "zcos_social_content"("owner_user_id", "campaign_id", "state");

CREATE TABLE IF NOT EXISTS "zcos_social_variants" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "content_id" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "connection_id" TEXT,
  "copy" TEXT NOT NULL,
  "adaptation_note" TEXT NOT NULL,
  "asset_refs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "metadata" JSONB NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'draft',
  "scheduled_at" TIMESTAMP(3),
  "approved_at" TIMESTAMP(3),
  "approved_by" TEXT,
  "approval_policy_id" TEXT,
  "published_at" TIMESTAMP(3),
  "provider_post_id" TEXT,
  "provider_url" TEXT,
  "revision_of_id" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "zcos_social_variants_owner_campaign_platform_state_idx"
  ON "zcos_social_variants"("owner_user_id", "campaign_id", "platform", "state");
CREATE INDEX IF NOT EXISTS "zcos_social_variants_owner_content_idx"
  ON "zcos_social_variants"("owner_user_id", "content_id");
CREATE INDEX IF NOT EXISTS "zcos_social_variants_connection_post_idx"
  ON "zcos_social_variants"("connection_id", "provider_post_id");

CREATE TABLE IF NOT EXISTS "zcos_social_approval_policies" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "operations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "platform" TEXT,
  "campaign_id" TEXT,
  "connection_id" TEXT,
  "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "zcos_social_approval_policies_owner_revoked_expires_idx"
  ON "zcos_social_approval_policies"("owner_user_id", "revoked_at", "expires_at");
CREATE INDEX IF NOT EXISTS "zcos_social_approval_policies_owner_scope_idx"
  ON "zcos_social_approval_policies"("owner_user_id", "campaign_id", "platform", "connection_id");

CREATE TABLE IF NOT EXISTS "zcos_automation_jobs" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "owning_galaxy" TEXT NOT NULL DEFAULT 'ZYLO',
  "job_type" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT NOT NULL,
  "scheduled_for" TIMESTAMP(3) NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'scheduled',
  "idempotency_key" TEXT NOT NULL UNIQUE,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL,
  "cancelled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "zcos_automation_jobs_owner_galaxy_state_schedule_idx"
  ON "zcos_automation_jobs"("owner_user_id", "owning_galaxy", "state", "scheduled_for");
CREATE INDEX IF NOT EXISTS "zcos_automation_jobs_owner_target_idx"
  ON "zcos_automation_jobs"("owner_user_id", "target_type", "target_id");

CREATE TABLE IF NOT EXISTS "zcos_social_publish_attempts" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "variant_id" TEXT NOT NULL,
  "connection_id" TEXT NOT NULL,
  "idempotency_key" TEXT NOT NULL UNIQUE,
  "state" TEXT NOT NULL DEFAULT 'running',
  "provider_operation_id" TEXT,
  "provider_post_id" TEXT,
  "provider_url" TEXT,
  "provider_result" JSONB,
  "failure_code" TEXT,
  "failure_message" TEXT,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "zcos_social_publish_attempts_owner_variant_started_idx"
  ON "zcos_social_publish_attempts"("owner_user_id", "variant_id", "started_at");
CREATE INDEX IF NOT EXISTS "zcos_social_publish_attempts_connection_post_idx"
  ON "zcos_social_publish_attempts"("connection_id", "provider_post_id");

CREATE TABLE IF NOT EXISTS "zcos_social_metric_snapshots" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "content_id" TEXT,
  "variant_id" TEXT,
  "platform" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "window_start" TIMESTAMP(3) NOT NULL,
  "window_end" TIMESTAMP(3) NOT NULL,
  "metrics" JSONB NOT NULL,
  "provider_source_id" TEXT NOT NULL,
  "source_bindings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "zcos_social_metric_snapshots_owner_campaign_window_idx"
  ON "zcos_social_metric_snapshots"("owner_user_id", "campaign_id", "window_start", "window_end");
CREATE INDEX IF NOT EXISTS "zcos_social_metric_snapshots_owner_variant_platform_idx"
  ON "zcos_social_metric_snapshots"("owner_user_id", "variant_id", "platform");

CREATE TABLE IF NOT EXISTS "zcos_social_outcome_insights" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "window_start" TIMESTAMP(3) NOT NULL,
  "window_end" TIMESTAMP(3) NOT NULL,
  "snapshot_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "summary" TEXT NOT NULL,
  "recommendations" JSONB NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'candidate',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "zcos_social_outcome_insights_owner_campaign_state_idx"
  ON "zcos_social_outcome_insights"("owner_user_id", "campaign_id", "state");

CREATE TABLE IF NOT EXISTS "zcos_social_moderation_items" (
  "id" TEXT PRIMARY KEY,
  "owner_user_id" TEXT NOT NULL,
  "campaign_id" TEXT,
  "platform" TEXT NOT NULL,
  "connection_id" TEXT NOT NULL,
  "provider_item_id" TEXT NOT NULL,
  "item_type" TEXT NOT NULL,
  "proposed_action" TEXT NOT NULL,
  "risk_level" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'queued',
  "provider_action_id" TEXT,
  "provider_result" JSONB,
  "failure_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "zcos_social_moderation_items_provider_item_key" UNIQUE ("owner_user_id", "connection_id", "provider_item_id", "item_type")
);
CREATE INDEX IF NOT EXISTS "zcos_social_moderation_items_owner_campaign_platform_state_idx"
  ON "zcos_social_moderation_items"("owner_user_id", "campaign_id", "platform", "state");
