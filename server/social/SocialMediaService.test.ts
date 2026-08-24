import { describe, expect, it, vi } from "vitest";
import { SocialMediaService, SocialPublisherRegistry } from "./SocialMediaService.js";
import type {
  ProviderPublishResult,
  SocialCampaignRecord,
  SocialConnectionRecord,
  SocialContentRecord,
  SocialMetricSnapshotRecord,
  SocialPublishAttemptRecord,
  SocialRepository,
  SocialVariantRecord,
} from "./contracts.js";

const now = new Date("2026-08-22T12:00:00.000Z");

const campaign: SocialCampaignRecord = {
  id: "campaign-1",
  ownerUserId: "owner-1",
  projectRef: "project://launch",
  name: "Launch",
  objective: "Qualified awareness",
  brandContext: {},
  audienceContext: {},
  platformObjectives: {},
  strategyAlternatives: [{ id: "focused", name: "Focused", approach: "Expert proof", expectedOutcome: "Qualified reach", tradeoffs: [] }],
  selectedStrategyId: "focused",
  state: "active",
  createdAt: now,
  updatedAt: now,
};

const connection: SocialConnectionRecord = {
  id: "connection-1",
  ownerUserId: "owner-1",
  provider: "example",
  accountRef: "brand-account",
  credentialRef: "vault://social/example",
  scopes: ["social:publish"],
  platforms: ["example-network"],
  state: "connected",
  metadata: null,
  connectedAt: now,
  disconnectedAt: null,
  revokedAt: null,
  createdAt: now,
  updatedAt: now,
};

const content: SocialContentRecord = {
  id: "content-1",
  ownerUserId: "owner-1",
  campaignId: campaign.id,
  title: "Proof point",
  contentKind: "post",
  brief: {},
  sourceBindings: ["source://brief/1"],
  assetRefs: [],
  state: "approved",
  createdByGalaxy: "ZYNC",
  version: 1,
  createdAt: now,
  updatedAt: now,
};

const variant: SocialVariantRecord = {
  id: "variant-1",
  ownerUserId: "owner-1",
  campaignId: campaign.id,
  contentId: content.id,
  platform: "example-network",
  connectionId: connection.id,
  copy: "Platform-specific copy",
  adaptationNote: "Adapted for the platform audience",
  assetRefs: [],
  metadata: {},
  state: "review",
  scheduledAt: null,
  approvedAt: null,
  approvedBy: null,
  approvalPolicyId: null,
  publishedAt: null,
  providerPostId: null,
  providerUrl: null,
  revisionOfId: null,
  version: 1,
  createdAt: now,
  updatedAt: now,
};

const attempt: SocialPublishAttemptRecord = {
  id: "attempt-1",
  ownerUserId: "owner-1",
  variantId: variant.id,
  connectionId: connection.id,
  idempotencyKey: "publish-1",
  state: "running",
  providerOperationId: null,
  providerPostId: null,
  providerUrl: null,
  providerResult: null,
  failureCode: null,
  failureMessage: null,
  startedAt: now,
  completedAt: null,
};

function repository(overrides: Partial<SocialRepository>): SocialRepository {
  return {
    recordAudit: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as SocialRepository;
}

describe("SocialMediaService governance", () => {
  it("requires human approval before scheduling when no scoped Auto policy exists", async () => {
    const scheduleVariant = vi.fn();
    const repo = repository({
      getVariant: vi.fn().mockResolvedValue(variant),
      getConnection: vi.fn().mockResolvedValue(connection),
      listActiveApprovalPolicies: vi.fn().mockResolvedValue([]),
      scheduleVariant,
    });
    const service = new SocialMediaService(repo, new SocialPublisherRegistry());

    await expect(service.scheduleVariant({
      ownerUserId: "owner-1",
      variantId: variant.id,
      scheduledFor: new Date(Date.now() + 60_000),
      idempotencyKey: "schedule-1",
    })).rejects.toMatchObject({ statusCode: 409 });
    expect(scheduleVariant).not.toHaveBeenCalled();
  });

  it("fails closed when no certified provider adapter is registered", async () => {
    const approved = { ...variant, state: "approved" as const, approvedAt: now, approvedBy: "owner-1" };
    const finishPublishAttempt = vi.fn(async ({ result }: { result: ProviderPublishResult }) => ({
      attempt: { ...attempt, state: result.state, failureCode: result.failureCode || null },
      variant: { ...approved, state: result.state === "blocked" ? "blocked" as const : approved.state },
    }));
    const repo = repository({
      getVariant: vi.fn().mockResolvedValue(approved),
      getConnection: vi.fn().mockResolvedValue(connection),
      listActiveApprovalPolicies: vi.fn().mockResolvedValue([]),
      getCampaign: vi.fn().mockResolvedValue(campaign),
      getContent: vi.fn().mockResolvedValue(content),
      beginPublishAttempt: vi.fn().mockResolvedValue({ attempt, replayed: false }),
      finishPublishAttempt,
    });
    const service = new SocialMediaService(repo, new SocialPublisherRegistry());

    await service.publishVariant({ ownerUserId: "owner-1", variantId: variant.id, idempotencyKey: "publish-1" });

    expect(finishPublishAttempt).toHaveBeenCalledWith(expect.objectContaining({
      result: expect.objectContaining({ state: "blocked", failureCode: "provider_adapter_unavailable" }),
    }));
  });

  it("does not call a provider again when the idempotency key replays", async () => {
    const approved = { ...variant, state: "approved" as const, approvedAt: now, approvedBy: "owner-1" };
    const publish = vi.fn();
    const repo = repository({
      getVariant: vi.fn().mockResolvedValue(approved),
      getConnection: vi.fn().mockResolvedValue(connection),
      listActiveApprovalPolicies: vi.fn().mockResolvedValue([]),
      getCampaign: vi.fn().mockResolvedValue(campaign),
      getContent: vi.fn().mockResolvedValue(content),
      beginPublishAttempt: vi.fn().mockResolvedValue({ attempt: { ...attempt, state: "succeeded", providerPostId: "provider-post-1" }, replayed: true }),
    });
    const service = new SocialMediaService(repo, new SocialPublisherRegistry([{ provider: "example", publish }]));

    const result = await service.publishVariant({ ownerUserId: "owner-1", variantId: variant.id, idempotencyKey: "publish-1" });

    expect(result.replayed).toBe(true);
    expect(publish).not.toHaveBeenCalled();
  });

  it("downgrades provider success without a post identifier to unknown", async () => {
    const approved = { ...variant, state: "approved" as const, approvedAt: now, approvedBy: "owner-1" };
    const finishPublishAttempt = vi.fn(async ({ result }: { result: ProviderPublishResult }) => ({
      attempt: { ...attempt, state: result.state, failureCode: result.failureCode || null },
      variant: { ...approved, state: "unknown" as const },
    }));
    const repo = repository({
      getVariant: vi.fn().mockResolvedValue(approved),
      getConnection: vi.fn().mockResolvedValue(connection),
      listActiveApprovalPolicies: vi.fn().mockResolvedValue([]),
      getCampaign: vi.fn().mockResolvedValue(campaign),
      getContent: vi.fn().mockResolvedValue(content),
      beginPublishAttempt: vi.fn().mockResolvedValue({ attempt, replayed: false }),
      finishPublishAttempt,
    });
    const service = new SocialMediaService(repo, new SocialPublisherRegistry([{
      provider: "example",
      publish: vi.fn().mockResolvedValue({ state: "succeeded", providerOperationId: "operation-1" }),
    }]));

    await service.publishVariant({ ownerUserId: "owner-1", variantId: variant.id, idempotencyKey: "publish-1" });

    expect(finishPublishAttempt).toHaveBeenCalledWith(expect.objectContaining({
      result: expect.objectContaining({ state: "unknown", failureCode: "provider_post_id_missing" }),
    }));
  });

  it("records outcome learning as a candidate without Memory or Knowledge promotion", async () => {
    const snapshot: SocialMetricSnapshotRecord = {
      id: "snapshot-1",
      ownerUserId: "owner-1",
      campaignId: campaign.id,
      contentId: content.id,
      variantId: variant.id,
      platform: variant.platform,
      objective: campaign.objective,
      windowStart: new Date("2026-08-01T00:00:00.000Z"),
      windowEnd: new Date("2026-08-15T00:00:00.000Z"),
      metrics: { qualifiedVisits: 42 },
      providerSourceId: "provider-report-1",
      sourceBindings: ["provider://report/1"],
      capturedAt: now,
    };
    const recordAudit = vi.fn().mockResolvedValue(undefined);
    const createOutcomeInsight = vi.fn(async (input) => ({ id: "insight-1", ...input, createdAt: now, updatedAt: now }));
    const repo = repository({
      getCampaign: vi.fn().mockResolvedValue(campaign),
      listMetricSnapshots: vi.fn().mockResolvedValue([snapshot]),
      createOutcomeInsight,
      recordAudit,
    });
    const service = new SocialMediaService(repo, new SocialPublisherRegistry());

    await service.createOutcomeInsight({
      ownerUserId: "owner-1",
      campaignId: campaign.id,
      objective: campaign.objective,
      windowStart: snapshot.windowStart,
      windowEnd: snapshot.windowEnd,
      snapshotIds: [snapshot.id],
      summary: "The proof-point variant drove qualified visits.",
      recommendations: { nextTest: "Repeat with a narrower segment" },
    });

    expect(createOutcomeInsight).toHaveBeenCalledWith(expect.objectContaining({ state: "candidate", snapshotIds: [snapshot.id] }));
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.objectContaining({ memoryPromotion: "not_performed", knowledgePromotion: "not_performed" }),
    }));
  });
});
