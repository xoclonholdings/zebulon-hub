export type JsonObject = Record<string, unknown>;

export type SocialConnectionState = "connected" | "disconnected" | "revoked";
export type SocialCampaignState = "draft" | "active" | "paused" | "completed" | "cancelled";
export type SocialContentState = "draft" | "review" | "approved" | "superseded" | "cancelled";
export type SocialVariantState =
  | "draft"
  | "review"
  | "approved"
  | "scheduled"
  | "publishing"
  | "published"
  | "partial"
  | "failed"
  | "blocked"
  | "unknown"
  | "superseded"
  | "cancelled";
export type SocialApprovalMode = "ask" | "auto" | "never";
export type SocialPublishAttemptState =
  | "running"
  | "succeeded"
  | "partial"
  | "failed"
  | "blocked"
  | "unknown";
export type SocialAutomationState = "scheduled" | "running" | "completed" | "failed" | "cancelled";
export type SocialModerationState =
  | "queued"
  | "review"
  | "approved"
  | "actioned"
  | "failed"
  | "cancelled";

export interface StrategyAlternative {
  id: string;
  name: string;
  approach: string;
  expectedOutcome: string;
  tradeoffs: string[];
}

export interface SocialConnectionRecord {
  id: string;
  ownerUserId: string;
  provider: string;
  accountRef: string;
  credentialRef: string | null;
  scopes: string[];
  platforms: string[];
  state: SocialConnectionState;
  metadata: JsonObject | null;
  connectedAt: Date;
  disconnectedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialCampaignRecord {
  id: string;
  ownerUserId: string;
  projectRef: string | null;
  name: string;
  objective: string;
  brandContext: JsonObject;
  audienceContext: JsonObject;
  platformObjectives: JsonObject;
  strategyAlternatives: StrategyAlternative[];
  selectedStrategyId: string | null;
  state: SocialCampaignState;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialResearchSignalRecord {
  id: string;
  ownerUserId: string;
  campaignId: string;
  contributorGalaxy: "ZWAP!" | "ZAR" | "ZCOS";
  platform: string | null;
  signalType: string;
  summary: string;
  sourceLocator: string;
  sourceTitle: string | null;
  publishedAt: Date | null;
  accessedAt: Date;
  freshUntil: Date | null;
  provenance: JsonObject;
  createdAt: Date;
}

export interface SocialContentRecord {
  id: string;
  ownerUserId: string;
  campaignId: string;
  title: string;
  contentKind: string;
  brief: JsonObject;
  sourceBindings: string[];
  assetRefs: string[];
  state: SocialContentState;
  createdByGalaxy: "ZYNC";
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialVariantRecord {
  id: string;
  ownerUserId: string;
  campaignId: string;
  contentId: string;
  platform: string;
  connectionId: string | null;
  copy: string;
  adaptationNote: string;
  assetRefs: string[];
  metadata: JsonObject;
  state: SocialVariantState;
  scheduledAt: Date | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  approvalPolicyId: string | null;
  publishedAt: Date | null;
  providerPostId: string | null;
  providerUrl: string | null;
  revisionOfId: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialApprovalPolicyRecord {
  id: string;
  ownerUserId: string;
  mode: SocialApprovalMode;
  operations: string[];
  platform: string | null;
  campaignId: string | null;
  connectionId: string | null;
  startsAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialAutomationJobRecord {
  id: string;
  ownerUserId: string;
  owningGalaxy: "ZYLO";
  jobType: "social.publish" | "social.analytics" | "social.monitor";
  targetType: "variant" | "campaign";
  targetId: string;
  scheduledFor: Date;
  state: SocialAutomationState;
  idempotencyKey: string;
  attemptCount: number;
  metadata: JsonObject;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialPublishAttemptRecord {
  id: string;
  ownerUserId: string;
  variantId: string;
  connectionId: string;
  idempotencyKey: string;
  state: SocialPublishAttemptState;
  providerOperationId: string | null;
  providerPostId: string | null;
  providerUrl: string | null;
  providerResult: JsonObject | null;
  failureCode: string | null;
  failureMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
}

export interface SocialMetricSnapshotRecord {
  id: string;
  ownerUserId: string;
  campaignId: string;
  contentId: string | null;
  variantId: string | null;
  platform: string;
  objective: string;
  windowStart: Date;
  windowEnd: Date;
  metrics: JsonObject;
  providerSourceId: string;
  sourceBindings: string[];
  capturedAt: Date;
}

export interface SocialOutcomeInsightRecord {
  id: string;
  ownerUserId: string;
  campaignId: string;
  objective: string;
  windowStart: Date;
  windowEnd: Date;
  snapshotIds: string[];
  summary: string;
  recommendations: JsonObject;
  state: "candidate" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialModerationItemRecord {
  id: string;
  ownerUserId: string;
  campaignId: string | null;
  platform: string;
  connectionId: string;
  providerItemId: string;
  itemType: "engagement" | "moderation";
  proposedAction: string;
  riskLevel: "low" | "medium" | "high";
  state: SocialModerationState;
  providerActionId: string | null;
  providerResult: JsonObject | null;
  failureMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderPublishInput {
  ownerUserId: string;
  connection: SocialConnectionRecord;
  campaign: SocialCampaignRecord;
  content: SocialContentRecord;
  variant: SocialVariantRecord;
  idempotencyKey: string;
}

export interface ProviderPublishResult {
  state: Exclude<SocialPublishAttemptState, "running">;
  providerOperationId?: string;
  providerPostId?: string;
  providerUrl?: string;
  details?: JsonObject;
  failureCode?: string;
  failureMessage?: string;
}

export interface SocialPublisherAdapter {
  provider: string;
  publish(input: ProviderPublishInput): Promise<ProviderPublishResult>;
}

export interface SocialRepository {
  createConnection(input: Omit<SocialConnectionRecord, "id" | "connectedAt" | "disconnectedAt" | "revokedAt" | "createdAt" | "updatedAt">): Promise<SocialConnectionRecord>;
  getConnection(ownerUserId: string, id: string): Promise<SocialConnectionRecord | null>;
  listConnections(ownerUserId: string): Promise<SocialConnectionRecord[]>;
  updateConnectionState(ownerUserId: string, id: string, state: SocialConnectionState): Promise<SocialConnectionRecord | null>;

  createCampaign(input: Omit<SocialCampaignRecord, "id" | "createdAt" | "updatedAt">): Promise<SocialCampaignRecord>;
  getCampaign(ownerUserId: string, id: string): Promise<SocialCampaignRecord | null>;
  updateCampaign(ownerUserId: string, id: string, patch: Partial<Pick<SocialCampaignRecord, "selectedStrategyId" | "state">>): Promise<SocialCampaignRecord | null>;
  listCampaigns(ownerUserId: string): Promise<SocialCampaignRecord[]>;

  createResearchSignal(input: Omit<SocialResearchSignalRecord, "id" | "createdAt">): Promise<SocialResearchSignalRecord>;
  listResearchSignals(ownerUserId: string, campaignId: string): Promise<SocialResearchSignalRecord[]>;

  createContent(input: Omit<SocialContentRecord, "id" | "createdAt" | "updatedAt">): Promise<SocialContentRecord>;
  getContent(ownerUserId: string, id: string): Promise<SocialContentRecord | null>;
  listContent(ownerUserId: string, campaignId: string): Promise<SocialContentRecord[]>;

  createVariant(input: Omit<SocialVariantRecord, "id" | "createdAt" | "updatedAt">): Promise<SocialVariantRecord>;
  getVariant(ownerUserId: string, id: string): Promise<SocialVariantRecord | null>;
  updateVariant(ownerUserId: string, id: string, patch: Partial<SocialVariantRecord>): Promise<SocialVariantRecord | null>;
  listVariants(ownerUserId: string, campaignId: string): Promise<SocialVariantRecord[]>;
  reviseVariant(input: { ownerUserId: string; prior: SocialVariantRecord; copy: string; adaptationNote: string; assetRefs?: string[]; metadata?: JsonObject }): Promise<SocialVariantRecord>;

  createApprovalPolicy(input: Omit<SocialApprovalPolicyRecord, "id" | "revokedAt" | "createdAt" | "updatedAt">): Promise<SocialApprovalPolicyRecord>;
  listApprovalPolicies(ownerUserId: string): Promise<SocialApprovalPolicyRecord[]>;
  listActiveApprovalPolicies(ownerUserId: string, at: Date): Promise<SocialApprovalPolicyRecord[]>;
  revokeApprovalPolicy(ownerUserId: string, id: string): Promise<SocialApprovalPolicyRecord | null>;

  scheduleVariant(input: { ownerUserId: string; variantId: string; connectionId: string; scheduledFor: Date; idempotencyKey: string; approvalPolicyId?: string | null }): Promise<{ variant: SocialVariantRecord; job: SocialAutomationJobRecord }>;
  getAutomationJob(ownerUserId: string, id: string): Promise<SocialAutomationJobRecord | null>;
  rescheduleVariant(input: { ownerUserId: string; jobId: string; variantId: string; scheduledFor: Date }): Promise<{ variant: SocialVariantRecord; job: SocialAutomationJobRecord } | null>;
  cancelVariant(input: { ownerUserId: string; variantId: string; jobId?: string }): Promise<{ variant: SocialVariantRecord; job?: SocialAutomationJobRecord } | null>;

  beginPublishAttempt(input: { ownerUserId: string; variantId: string; connectionId: string; idempotencyKey: string }): Promise<{ attempt: SocialPublishAttemptRecord; replayed: boolean }>;
  finishPublishAttempt(input: { ownerUserId: string; variantId: string; attemptId: string; result: ProviderPublishResult }): Promise<{ attempt: SocialPublishAttemptRecord; variant: SocialVariantRecord }>;

  createMetricSnapshot(input: Omit<SocialMetricSnapshotRecord, "id" | "capturedAt">): Promise<SocialMetricSnapshotRecord>;
  listMetricSnapshots(ownerUserId: string, campaignId: string): Promise<SocialMetricSnapshotRecord[]>;
  createOutcomeInsight(input: Omit<SocialOutcomeInsightRecord, "id" | "createdAt" | "updatedAt">): Promise<SocialOutcomeInsightRecord>;

  createModerationItem(input: Omit<SocialModerationItemRecord, "id" | "providerActionId" | "providerResult" | "failureMessage" | "createdAt" | "updatedAt">): Promise<SocialModerationItemRecord>;
  getModerationItem(ownerUserId: string, id: string): Promise<SocialModerationItemRecord | null>;
  updateModerationItem(ownerUserId: string, id: string, patch: Partial<SocialModerationItemRecord>): Promise<SocialModerationItemRecord | null>;

  recordAudit(input: { ownerUserId: string; galaxyId?: string; eventType: string; targetType?: string; targetId?: string; details?: JsonObject }): Promise<void>;
}
