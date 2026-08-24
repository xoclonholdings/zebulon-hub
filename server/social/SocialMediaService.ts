import type {
  JsonObject,
  ProviderPublishResult,
  SocialApprovalPolicyRecord,
  SocialCampaignRecord,
  SocialConnectionRecord,
  SocialContentRecord,
  SocialPublisherAdapter,
  SocialRepository,
  SocialVariantRecord,
  StrategyAlternative,
} from "./contracts.js";

function serviceError(message: string, statusCode = 400): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

function requiredText(value: unknown, field: string, max = 10_000): string {
  if (typeof value !== "string" || !value.trim()) throw serviceError(`${field} is required`);
  return value.trim().slice(0, max);
}

function uniqueStrings(values: unknown, max = 50): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.map(String).map((value) => value.trim()).filter(Boolean))).slice(0, max);
}

function normalizePlatform(platform: unknown): string {
  return requiredText(platform, "platform", 80).toLowerCase();
}

function assertNoCredentialMaterial(value: unknown, path = "metadata"): void {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (/(password|passphrase|access.?token|refresh.?token|api.?key|cookie|session.?state|client.?secret|credential)/i.test(key)) {
      throw serviceError(`${path}.${key} cannot contain credential material`);
    }
    assertNoCredentialMaterial(nested, `${path}.${key}`);
  }
}

function validateAlternatives(input: unknown): StrategyAlternative[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw serviceError("At least one strategy alternative is required");
  }
  const alternatives = input.slice(0, 8).map((entry, index) => {
    const value = (entry || {}) as Partial<StrategyAlternative>;
    return {
      id: requiredText(value.id || `strategy-${index + 1}`, "strategy id", 100),
      name: requiredText(value.name, "strategy name", 160),
      approach: requiredText(value.approach, "strategy approach", 4_000),
      expectedOutcome: requiredText(value.expectedOutcome, "expected outcome", 2_000),
      tradeoffs: uniqueStrings(value.tradeoffs, 12),
    };
  });
  if (new Set(alternatives.map((entry) => entry.id)).size !== alternatives.length) {
    throw serviceError("Strategy alternative ids must be unique");
  }
  if (alternatives.length > 1) {
    const distinct = new Set(
      alternatives.map((entry) => `${entry.approach.toLowerCase()}\0${entry.expectedOutcome.toLowerCase()}`),
    );
    if (distinct.size !== alternatives.length) {
      throw serviceError("Strategy alternatives must describe materially distinct approaches or outcomes");
    }
  }
  return alternatives;
}

function policySpecificity(policy: SocialApprovalPolicyRecord): number {
  return Number(Boolean(policy.connectionId)) * 4 + Number(Boolean(policy.campaignId)) * 2 + Number(Boolean(policy.platform));
}

function policyMatches(
  policy: SocialApprovalPolicyRecord,
  operation: string,
  campaignId: string,
  platform: string,
  connectionId: string,
): boolean {
  return (
    policy.operations.includes(operation) &&
    (!policy.campaignId || policy.campaignId === campaignId) &&
    (!policy.platform || policy.platform === platform) &&
    (!policy.connectionId || policy.connectionId === connectionId)
  );
}

export class SocialPublisherRegistry {
  private readonly adapters = new Map<string, SocialPublisherAdapter>();

  constructor(adapters: SocialPublisherAdapter[] = []) {
    for (const adapter of adapters) this.register(adapter);
  }

  register(adapter: SocialPublisherAdapter): void {
    this.adapters.set(adapter.provider.trim().toLowerCase(), adapter);
  }

  get(provider: string): SocialPublisherAdapter | null {
    return this.adapters.get(provider.trim().toLowerCase()) || null;
  }
}

export class SocialMediaService {
  constructor(
    private readonly repository: SocialRepository,
    private readonly publishers: SocialPublisherRegistry,
  ) {}

  async connectAccount(input: {
    ownerUserId: string;
    provider: string;
    accountRef: string;
    credentialRef: string;
    scopes: string[];
    platforms: string[];
    metadata?: JsonObject;
  }): Promise<SocialConnectionRecord> {
    const credentialRef = requiredText(input.credentialRef, "credentialRef", 2_000);
    if (!/^(?:zena-secret|vault|secret|kms|keyring):\/\/.+/i.test(credentialRef)) {
      throw serviceError("credentialRef must use an approved protected-secret reference scheme");
    }
    assertNoCredentialMaterial(input.metadata);
    const scopes = uniqueStrings(input.scopes, 40);
    const platforms = uniqueStrings(input.platforms, 20).map((platform) => platform.toLowerCase());
    if (platforms.length === 0) throw serviceError("At least one platform is required");

    const connection = await this.repository.createConnection({
      ownerUserId: input.ownerUserId,
      provider: requiredText(input.provider, "provider", 100).toLowerCase(),
      accountRef: requiredText(input.accountRef, "accountRef", 300),
      credentialRef,
      scopes,
      platforms,
      state: "connected",
      metadata: input.metadata || null,
    });
    await this.audit(input.ownerUserId, "integration.social_connected", "integration_connection", connection.id, {
      provider: connection.provider,
      platforms: connection.platforms,
      scopes: connection.scopes,
    });
    return connection;
  }

  async disconnectAccount(ownerUserId: string, connectionId: string, revoke = false) {
    const state = revoke ? "revoked" : "disconnected";
    const connection = await this.repository.updateConnectionState(ownerUserId, connectionId, state);
    if (!connection) throw serviceError("Social connection not found", 404);
    await this.audit(ownerUserId, revoke ? "integration.social_revoked" : "integration.social_disconnected", "integration_connection", connection.id, {
      provider: connection.provider,
    });
    return connection;
  }

  async listConnections(ownerUserId: string) {
    return this.repository.listConnections(ownerUserId);
  }

  async createCampaign(input: {
    ownerUserId: string;
    projectRef?: string;
    name: string;
    objective: string;
    brandContext: JsonObject;
    audienceContext: JsonObject;
    platformObjectives?: JsonObject;
    strategyAlternatives: StrategyAlternative[];
  }): Promise<SocialCampaignRecord> {
    const campaign = await this.repository.createCampaign({
      ownerUserId: input.ownerUserId,
      projectRef: input.projectRef ? requiredText(input.projectRef, "projectRef", 300) : null,
      name: requiredText(input.name, "name", 200),
      objective: requiredText(input.objective, "objective", 4_000),
      brandContext: input.brandContext || {},
      audienceContext: input.audienceContext || {},
      platformObjectives: input.platformObjectives || {},
      strategyAlternatives: validateAlternatives(input.strategyAlternatives),
      selectedStrategyId: null,
      state: "draft",
    });
    await this.audit(input.ownerUserId, "social.campaign_created", "social_campaign", campaign.id, {
      projectRef: campaign.projectRef,
      objective: campaign.objective,
      coordinator: "ZAR",
    });
    return campaign;
  }

  async selectStrategy(ownerUserId: string, campaignId: string, strategyId: string) {
    const campaign = await this.requireCampaign(ownerUserId, campaignId);
    if (!campaign.strategyAlternatives.some((alternative) => alternative.id === strategyId)) {
      throw serviceError("Strategy alternative not found", 404);
    }
    const updated = await this.repository.updateCampaign(ownerUserId, campaignId, {
      selectedStrategyId: strategyId,
      state: "active",
    });
    await this.audit(ownerUserId, "social.strategy_selected", "social_campaign", campaignId, { strategyId });
    return updated!;
  }

  async addResearchSignal(input: {
    ownerUserId: string;
    campaignId: string;
    contributorGalaxy?: "ZWAP!" | "ZAR" | "ZCOS";
    platform?: string;
    signalType: string;
    summary: string;
    sourceLocator: string;
    sourceTitle?: string;
    publishedAt?: Date;
    accessedAt?: Date;
    freshUntil?: Date;
    provenance?: JsonObject;
  }) {
    await this.requireCampaign(input.ownerUserId, input.campaignId);
    if (input.contributorGalaxy && !["ZWAP!", "ZAR", "ZCOS"].includes(input.contributorGalaxy)) {
      throw serviceError("contributorGalaxy must be ZWAP!, ZAR, or ZCOS");
    }
    const accessedAt = input.accessedAt || new Date();
    if (input.freshUntil && input.freshUntil <= accessedAt) {
      throw serviceError("freshUntil must be later than accessedAt");
    }
    const signal = await this.repository.createResearchSignal({
      ownerUserId: input.ownerUserId,
      campaignId: input.campaignId,
      contributorGalaxy: input.contributorGalaxy || "ZCOS",
      platform: input.platform ? normalizePlatform(input.platform) : null,
      signalType: requiredText(input.signalType, "signalType", 120),
      summary: requiredText(input.summary, "summary", 8_000),
      sourceLocator: requiredText(input.sourceLocator, "sourceLocator", 2_000),
      sourceTitle: input.sourceTitle ? requiredText(input.sourceTitle, "sourceTitle", 500) : null,
      publishedAt: input.publishedAt || null,
      accessedAt,
      freshUntil: input.freshUntil || null,
      provenance: input.provenance || {},
    });
    await this.audit(input.ownerUserId, "social.research_signal_added", "social_research_signal", signal.id, {
      campaignId: input.campaignId,
      platform: signal.platform,
      sourceLocator: signal.sourceLocator,
      accessedAt: signal.accessedAt.toISOString(),
    });
    return signal;
  }

  async createContent(input: {
    ownerUserId: string;
    campaignId: string;
    title: string;
    contentKind: string;
    brief: JsonObject;
    sourceBindings?: string[];
    assetRefs?: string[];
  }): Promise<SocialContentRecord> {
    await this.requireCampaign(input.ownerUserId, input.campaignId);
    const content = await this.repository.createContent({
      ownerUserId: input.ownerUserId,
      campaignId: input.campaignId,
      title: requiredText(input.title, "title", 300),
      contentKind: requiredText(input.contentKind, "contentKind", 120),
      brief: input.brief || {},
      sourceBindings: uniqueStrings(input.sourceBindings, 100),
      assetRefs: uniqueStrings(input.assetRefs, 100),
      state: "draft",
      createdByGalaxy: "ZYNC",
      version: 1,
    });
    await this.audit(input.ownerUserId, "social.content_created", "social_content", content.id, {
      campaignId: content.campaignId,
      createdByGalaxy: "ZYNC",
    });
    return content;
  }

  async createPlatformVariant(input: {
    ownerUserId: string;
    contentId: string;
    platform: string;
    connectionId?: string;
    copy: string;
    adaptationNote: string;
    assetRefs?: string[];
    metadata?: JsonObject;
  }): Promise<SocialVariantRecord> {
    const content = await this.requireContent(input.ownerUserId, input.contentId);
    const platform = normalizePlatform(input.platform);
    if (input.connectionId) {
      const connection = await this.requireConnection(input.ownerUserId, input.connectionId);
      if (!connection.platforms.includes(platform)) throw serviceError("Connection does not authorize this platform", 403);
    }
    const variant = await this.repository.createVariant({
      ownerUserId: input.ownerUserId,
      campaignId: content.campaignId,
      contentId: content.id,
      platform,
      connectionId: input.connectionId || null,
      copy: requiredText(input.copy, "copy", 50_000),
      adaptationNote: requiredText(input.adaptationNote, "adaptationNote", 2_000),
      assetRefs: uniqueStrings(input.assetRefs, 100),
      metadata: input.metadata || {},
      state: "draft",
      scheduledAt: null,
      approvedAt: null,
      approvedBy: null,
      approvalPolicyId: null,
      publishedAt: null,
      providerPostId: null,
      providerUrl: null,
      revisionOfId: null,
      version: 1,
    });
    await this.audit(input.ownerUserId, "social.platform_variant_created", "social_variant", variant.id, {
      platform,
      contentId: content.id,
      createdByGalaxy: "ZYNC",
    });
    return variant;
  }

  async submitVariantForReview(ownerUserId: string, variantId: string) {
    const variant = await this.requireVariant(ownerUserId, variantId);
    if (!['draft', 'failed', 'blocked'].includes(variant.state)) throw serviceError("Variant cannot enter review from its current state", 409);
    const updated = await this.repository.updateVariant(ownerUserId, variantId, { state: "review" });
    await this.audit(ownerUserId, "social.variant_review_requested", "social_variant", variantId);
    return updated!;
  }

  async approveVariant(ownerUserId: string, variantId: string, approvedBy: string) {
    const variant = await this.requireVariant(ownerUserId, variantId);
    if (!['draft', 'review'].includes(variant.state)) throw serviceError("Variant cannot be approved from its current state", 409);
    const updated = await this.repository.updateVariant(ownerUserId, variantId, {
      state: "approved",
      approvedAt: new Date(),
      approvedBy: requiredText(approvedBy, "approvedBy", 300),
      approvalPolicyId: null,
    });
    await this.audit(ownerUserId, "social.variant_approved", "social_variant", variantId, { approvedBy });
    return updated!;
  }

  async reviseVariant(input: { ownerUserId: string; variantId: string; copy: string; adaptationNote: string; assetRefs?: string[]; metadata?: JsonObject }) {
    const prior = await this.requireVariant(input.ownerUserId, input.variantId);
    if (["publishing", "unknown", "partial"].includes(prior.state)) {
      throw serviceError("Variant cannot be revised while its provider outcome is unresolved", 409);
    }
    const revised = await this.repository.reviseVariant({
      ownerUserId: input.ownerUserId,
      prior,
      copy: requiredText(input.copy, "copy", 50_000),
      adaptationNote: requiredText(input.adaptationNote, "adaptationNote", 2_000),
      assetRefs: input.assetRefs ? uniqueStrings(input.assetRefs, 100) : undefined,
      metadata: input.metadata,
    });
    await this.audit(input.ownerUserId, "social.variant_revised", "social_variant", revised.id, {
      revisionOfId: prior.id,
      version: revised.version,
    });
    return revised;
  }

  async createApprovalPolicy(input: {
    ownerUserId: string;
    mode: "ask" | "auto" | "never";
    operations?: string[];
    platform?: string;
    campaignId?: string;
    connectionId?: string;
    startsAt?: Date;
    expiresAt?: Date;
  }) {
    if (!["ask", "auto", "never"].includes(input.mode)) throw serviceError("mode must be ask, auto, or never");
    if (input.campaignId) await this.requireCampaign(input.ownerUserId, input.campaignId);
    if (input.connectionId) await this.requireConnection(input.ownerUserId, input.connectionId);
    const startsAt = input.startsAt || new Date();
    if (input.expiresAt && input.expiresAt <= startsAt) throw serviceError("expiresAt must be later than startsAt");
    const policy = await this.repository.createApprovalPolicy({
      ownerUserId: input.ownerUserId,
      mode: input.mode,
      operations: uniqueStrings(input.operations?.length ? input.operations : ["publish", "moderate"], 20),
      platform: input.platform ? normalizePlatform(input.platform) : null,
      campaignId: input.campaignId || null,
      connectionId: input.connectionId || null,
      startsAt,
      expiresAt: input.expiresAt || null,
    });
    await this.audit(input.ownerUserId, "social.approval_policy_created", "social_approval_policy", policy.id, {
      mode: policy.mode,
      operations: policy.operations,
      platform: policy.platform,
      campaignId: policy.campaignId,
      connectionId: policy.connectionId,
      expiresAt: policy.expiresAt?.toISOString() || null,
    });
    return policy;
  }

  async revokeApprovalPolicy(ownerUserId: string, policyId: string) {
    const policy = await this.repository.revokeApprovalPolicy(ownerUserId, policyId);
    if (!policy) throw serviceError("Approval policy not found", 404);
    await this.audit(ownerUserId, "social.approval_policy_revoked", "social_approval_policy", policy.id);
    return policy;
  }

  async listApprovalPolicies(ownerUserId: string) {
    return this.repository.listApprovalPolicies(ownerUserId);
  }

  async getAutomationJob(ownerUserId: string, jobId: string) {
    const job = await this.repository.getAutomationJob(ownerUserId, jobId);
    if (!job) throw serviceError("Automation job not found", 404);
    return job;
  }

  async scheduleVariant(input: { ownerUserId: string; variantId: string; connectionId?: string; scheduledFor: Date; idempotencyKey: string }) {
    if (input.scheduledFor.getTime() <= Date.now()) throw serviceError("scheduledFor must be in the future");
    const variant = await this.requireVariant(input.ownerUserId, input.variantId);
    if (["publishing", "published", "partial", "unknown", "superseded", "cancelled"].includes(variant.state)) {
      throw serviceError("Variant cannot be scheduled from its current state", 409);
    }
    const connectionId = input.connectionId || variant.connectionId;
    if (!connectionId) throw serviceError("A connected platform account is required");
    const connection = await this.requireConnection(input.ownerUserId, connectionId);
    this.assertConnectionCan(connection, variant.platform, "publish");
    const policy = await this.requireApproval(input.ownerUserId, variant, connection, "publish");
    const scheduled = await this.repository.scheduleVariant({
      ownerUserId: input.ownerUserId,
      variantId: variant.id,
      connectionId: connection.id,
      scheduledFor: input.scheduledFor,
      idempotencyKey: requiredText(input.idempotencyKey, "idempotencyKey", 300),
      approvalPolicyId: policy?.id || null,
    });
    await this.audit(input.ownerUserId, "social.variant_scheduled", "social_variant", variant.id, {
      jobId: scheduled.job.id,
      scheduledFor: input.scheduledFor.toISOString(),
      owningGalaxy: "ZYLO",
      approvalPolicyId: policy?.id || null,
    });
    return scheduled;
  }

  async rescheduleVariant(input: { ownerUserId: string; variantId: string; jobId: string; scheduledFor: Date }) {
    if (input.scheduledFor.getTime() <= Date.now()) throw serviceError("scheduledFor must be in the future");
    await this.requireVariant(input.ownerUserId, input.variantId);
    const result = await this.repository.rescheduleVariant(input);
    if (!result) throw serviceError("Scheduled social job not found", 404);
    await this.audit(input.ownerUserId, "social.variant_rescheduled", "social_variant", input.variantId, {
      jobId: input.jobId,
      scheduledFor: input.scheduledFor.toISOString(),
      owningGalaxy: "ZYLO",
    });
    return result;
  }

  async cancelVariant(input: { ownerUserId: string; variantId: string; jobId?: string }) {
    const variant = await this.requireVariant(input.ownerUserId, input.variantId);
    if (["publishing", "published", "partial", "unknown", "superseded"].includes(variant.state)) {
      throw serviceError("Variant cannot be cancelled from its current state", 409);
    }
    const result = await this.repository.cancelVariant(input);
    if (!result) throw serviceError("Social variant not found", 404);
    await this.audit(input.ownerUserId, "social.variant_cancelled", "social_variant", input.variantId, {
      jobId: input.jobId || null,
    });
    return result;
  }

  async publishVariant(input: { ownerUserId: string; variantId: string; connectionId?: string; idempotencyKey: string }) {
    let variant = await this.requireVariant(input.ownerUserId, input.variantId);
    if (["publishing", "published", "partial", "unknown", "superseded", "cancelled"].includes(variant.state)) {
      throw serviceError("Variant cannot be published from its current state", 409);
    }
    const connectionId = input.connectionId || variant.connectionId;
    if (!connectionId) throw serviceError("A connected platform account is required");
    const connection = await this.requireConnection(input.ownerUserId, connectionId);
    this.assertConnectionCan(connection, variant.platform, "publish");
    const policy = await this.requireApproval(input.ownerUserId, variant, connection, "publish");
    if (policy && variant.approvalPolicyId !== policy.id) {
      variant = (await this.repository.updateVariant(input.ownerUserId, variant.id, { approvalPolicyId: policy.id })) || variant;
    }
    const campaign = await this.requireCampaign(input.ownerUserId, variant.campaignId);
    const content = await this.requireContent(input.ownerUserId, variant.contentId);
    const idempotencyKey = requiredText(input.idempotencyKey, "idempotencyKey", 300);
    const begun = await this.repository.beginPublishAttempt({
      ownerUserId: input.ownerUserId,
      variantId: variant.id,
      connectionId: connection.id,
      idempotencyKey,
    });
    if (begun.replayed) return { ...begun, variant };

    const adapter = this.publishers.get(connection.provider);
    let result: ProviderPublishResult;
    if (!adapter) {
      result = {
        state: "blocked",
        failureCode: "provider_adapter_unavailable",
        failureMessage: `No certified ${connection.provider} publishing adapter is installed`,
      };
    } else {
      try {
        result = await adapter.publish({
          ownerUserId: input.ownerUserId,
          connection,
          campaign,
          content,
          variant,
          idempotencyKey,
        });
      } catch (error) {
        result = {
          state: "unknown",
          failureCode: "provider_outcome_unknown",
          failureMessage: error instanceof Error ? error.message : "Provider result could not be verified",
        };
      }
    }

    if (result.state === "succeeded" && !result.providerPostId) {
      result = {
        ...result,
        state: "unknown",
        failureCode: "provider_post_id_missing",
        failureMessage: "Provider accepted the request but did not return a verifiable post identifier",
      };
    }
    const completed = await this.repository.finishPublishAttempt({
      ownerUserId: input.ownerUserId,
      variantId: variant.id,
      attemptId: begun.attempt.id,
      result,
    });
    await this.audit(input.ownerUserId, `social.publish_${result.state}`, "social_publish_attempt", completed.attempt.id, {
      campaignId: campaign.id,
      variantId: variant.id,
      platform: variant.platform,
      provider: connection.provider,
      providerOperationId: result.providerOperationId || null,
      providerPostId: result.providerPostId || null,
      failureCode: result.failureCode || null,
    });
    return { ...completed, replayed: false };
  }

  async recordMetricSnapshot(input: {
    ownerUserId: string;
    campaignId: string;
    contentId?: string;
    variantId?: string;
    platform: string;
    objective: string;
    windowStart: Date;
    windowEnd: Date;
    metrics: JsonObject;
    providerSourceId: string;
    sourceBindings?: string[];
  }) {
    await this.requireCampaign(input.ownerUserId, input.campaignId);
    if (input.contentId) {
      const content = await this.requireContent(input.ownerUserId, input.contentId);
      if (content.campaignId !== input.campaignId) throw serviceError("Content does not belong to campaign", 409);
    }
    if (input.variantId) {
      const variant = await this.requireVariant(input.ownerUserId, input.variantId);
      if (variant.campaignId !== input.campaignId) throw serviceError("Variant does not belong to campaign", 409);
    }
    if (input.windowEnd <= input.windowStart) throw serviceError("windowEnd must be later than windowStart");
    const snapshot = await this.repository.createMetricSnapshot({
      ownerUserId: input.ownerUserId,
      campaignId: input.campaignId,
      contentId: input.contentId || null,
      variantId: input.variantId || null,
      platform: normalizePlatform(input.platform),
      objective: requiredText(input.objective, "objective", 2_000),
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      metrics: input.metrics || {},
      providerSourceId: requiredText(input.providerSourceId, "providerSourceId", 500),
      sourceBindings: uniqueStrings(input.sourceBindings, 100),
    });
    await this.audit(input.ownerUserId, "social.analytics_recorded", "social_metric_snapshot", snapshot.id, {
      campaignId: snapshot.campaignId,
      platform: snapshot.platform,
      objective: snapshot.objective,
      windowStart: snapshot.windowStart.toISOString(),
      windowEnd: snapshot.windowEnd.toISOString(),
    });
    return snapshot;
  }

  async createOutcomeInsight(input: {
    ownerUserId: string;
    campaignId: string;
    objective: string;
    windowStart: Date;
    windowEnd: Date;
    snapshotIds: string[];
    summary: string;
    recommendations: JsonObject;
  }) {
    await this.requireCampaign(input.ownerUserId, input.campaignId);
    if (input.windowEnd <= input.windowStart) throw serviceError("windowEnd must be later than windowStart");
    const snapshots = await this.repository.listMetricSnapshots(input.ownerUserId, input.campaignId);
    const snapshotIds = uniqueStrings(input.snapshotIds, 200);
    if (snapshotIds.length === 0 || snapshotIds.some((id) => !snapshots.some((snapshot) => snapshot.id === id))) {
      throw serviceError("Outcome learning requires campaign-owned metric snapshot evidence");
    }
    const insight = await this.repository.createOutcomeInsight({
      ownerUserId: input.ownerUserId,
      campaignId: input.campaignId,
      objective: requiredText(input.objective, "objective", 2_000),
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      snapshotIds,
      summary: requiredText(input.summary, "summary", 10_000),
      recommendations: input.recommendations || {},
      state: "candidate",
    });
    await this.audit(input.ownerUserId, "social.outcome_insight_created", "social_outcome_insight", insight.id, {
      campaignId: insight.campaignId,
      snapshotIds,
      memoryPromotion: "not_performed",
      knowledgePromotion: "not_performed",
    });
    return insight;
  }

  async createModerationItem(input: {
    ownerUserId: string;
    campaignId?: string;
    platform: string;
    connectionId: string;
    providerItemId: string;
    itemType: "engagement" | "moderation";
    proposedAction: string;
    riskLevel: "low" | "medium" | "high";
  }) {
    if (!["engagement", "moderation"].includes(input.itemType)) throw serviceError("itemType must be engagement or moderation");
    if (!["low", "medium", "high"].includes(input.riskLevel)) throw serviceError("riskLevel must be low, medium, or high");
    if (input.campaignId) await this.requireCampaign(input.ownerUserId, input.campaignId);
    const connection = await this.requireConnection(input.ownerUserId, input.connectionId);
    this.assertConnectionCan(connection, normalizePlatform(input.platform), "moderate");
    const item = await this.repository.createModerationItem({
      ownerUserId: input.ownerUserId,
      campaignId: input.campaignId || null,
      platform: normalizePlatform(input.platform),
      connectionId: input.connectionId,
      providerItemId: requiredText(input.providerItemId, "providerItemId", 500),
      itemType: input.itemType,
      proposedAction: requiredText(input.proposedAction, "proposedAction", 4_000),
      riskLevel: input.riskLevel,
      state: "queued",
    });
    await this.audit(input.ownerUserId, "social.moderation_queued", "social_moderation_item", item.id, {
      platform: item.platform,
      riskLevel: item.riskLevel,
    });
    return item;
  }

  async updateModerationState(input: {
    ownerUserId: string;
    itemId: string;
    state: "review" | "approved" | "actioned" | "failed" | "cancelled";
    providerActionId?: string;
    providerResult?: JsonObject;
    failureMessage?: string;
  }) {
    if (!["review", "approved", "actioned", "failed", "cancelled"].includes(input.state)) {
      throw serviceError("Invalid moderation state");
    }
    const item = await this.repository.getModerationItem(input.ownerUserId, input.itemId);
    if (!item) throw serviceError("Moderation item not found", 404);
    const allowedTransitions: Record<string, string[]> = {
      queued: ["review", "cancelled"],
      review: ["approved", "cancelled"],
      approved: ["actioned", "failed", "cancelled"],
      failed: ["review", "cancelled"],
    };
    if (!(allowedTransitions[item.state] || []).includes(input.state)) {
      throw serviceError("Moderation item cannot enter that state from its current state", 409);
    }
    if (input.state === "actioned" && !input.providerActionId) {
      throw serviceError("An actioned moderation item requires a verified providerActionId");
    }
    const updated = await this.repository.updateModerationItem(input.ownerUserId, input.itemId, {
      state: input.state,
      providerActionId: input.providerActionId || null,
      providerResult: input.providerResult || null,
      failureMessage: input.failureMessage || null,
    });
    await this.audit(input.ownerUserId, `social.moderation_${input.state}`, "social_moderation_item", input.itemId, {
      providerActionId: input.providerActionId || null,
    });
    return updated!;
  }

  async campaignSnapshot(ownerUserId: string, campaignId: string) {
    const campaign = await this.requireCampaign(ownerUserId, campaignId);
    const [researchSignals, content, variants, analytics] = await Promise.all([
      this.repository.listResearchSignals(ownerUserId, campaignId),
      this.repository.listContent(ownerUserId, campaignId),
      this.repository.listVariants(ownerUserId, campaignId),
      this.repository.listMetricSnapshots(ownerUserId, campaignId),
    ]);
    return { campaign, researchSignals, content, variants, analytics };
  }

  async listCampaigns(ownerUserId: string) {
    return this.repository.listCampaigns(ownerUserId);
  }

  private async requireApproval(
    ownerUserId: string,
    variant: SocialVariantRecord,
    connection: SocialConnectionRecord,
    operation: string,
  ): Promise<SocialApprovalPolicyRecord | null> {
    const now = new Date();
    const policies = (await this.repository.listActiveApprovalPolicies(ownerUserId, now))
      .filter((policy) => policyMatches(policy, operation, variant.campaignId, variant.platform, connection.id));
    if (policies.some((policy) => policy.mode === "never")) {
      throw serviceError("Publishing is blocked by the active social approval policy", 403);
    }
    policies.sort((left, right) => policySpecificity(right) - policySpecificity(left) || right.createdAt.getTime() - left.createdAt.getTime());
    const policy = policies[0] || null;
    if (policy?.mode === "auto") return policy;
    if (variant.approvedAt && variant.approvedBy) return null;
    throw serviceError("Human approval is required before public social publishing", 409);
  }

  private assertConnectionCan(connection: SocialConnectionRecord, platform: string, scope: "publish" | "moderate" | "analytics") {
    if (connection.state !== "connected") throw serviceError("Social connection is not active", 409);
    if (!connection.platforms.includes(platform)) throw serviceError("Social connection does not authorize this platform", 403);
    const allowed = connection.scopes.includes(`social:${scope}`) || connection.scopes.includes(scope);
    if (!allowed) throw serviceError(`Social connection is missing ${scope} scope`, 403);
  }

  private async requireConnection(ownerUserId: string, connectionId: string) {
    const connection = await this.repository.getConnection(ownerUserId, connectionId);
    if (!connection) throw serviceError("Social connection not found", 404);
    return connection;
  }

  private async requireCampaign(ownerUserId: string, campaignId: string) {
    const campaign = await this.repository.getCampaign(ownerUserId, campaignId);
    if (!campaign) throw serviceError("Social campaign not found", 404);
    return campaign;
  }

  private async requireContent(ownerUserId: string, contentId: string) {
    const content = await this.repository.getContent(ownerUserId, contentId);
    if (!content) throw serviceError("Social content not found", 404);
    return content;
  }

  private async requireVariant(ownerUserId: string, variantId: string) {
    const variant = await this.repository.getVariant(ownerUserId, variantId);
    if (!variant) throw serviceError("Social variant not found", 404);
    return variant;
  }

  private async audit(ownerUserId: string, eventType: string, targetType?: string, targetId?: string, details?: JsonObject) {
    await this.repository.recordAudit({ ownerUserId, galaxyId: "ZENA", eventType, targetType, targetId, details });
  }
}
