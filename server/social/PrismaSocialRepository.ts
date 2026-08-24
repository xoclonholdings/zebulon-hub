import { Prisma } from "@prisma/client";
import { prisma } from "../storage-prisma.js";
import type {
  JsonObject,
  ProviderPublishResult,
  SocialApprovalPolicyRecord,
  SocialAutomationJobRecord,
  SocialCampaignRecord,
  SocialConnectionRecord,
  SocialConnectionState,
  SocialContentRecord,
  SocialMetricSnapshotRecord,
  SocialModerationItemRecord,
  SocialOutcomeInsightRecord,
  SocialPublishAttemptRecord,
  SocialRepository,
  SocialResearchSignalRecord,
  SocialVariantRecord,
  SocialVariantState,
} from "./contracts.js";

const json = (value: JsonObject | unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;
const record = <T>(value: unknown): T => value as T;

function variantStateForResult(result: ProviderPublishResult): SocialVariantState {
  switch (result.state) {
    case "succeeded": return "published";
    case "partial": return "partial";
    case "failed": return "failed";
    case "blocked": return "blocked";
    case "unknown": return "unknown";
  }
}

export class PrismaSocialRepository implements SocialRepository {
  async createConnection(input: Omit<SocialConnectionRecord, "id" | "connectedAt" | "disconnectedAt" | "revokedAt" | "createdAt" | "updatedAt">) {
    const value = await prisma.socialConnection.upsert({
      where: {
        ownerUserId_provider_accountRef: {
          ownerUserId: input.ownerUserId,
          provider: input.provider,
          accountRef: input.accountRef,
        },
      },
      update: {
        credentialRef: input.credentialRef,
        scopes: input.scopes,
        platforms: input.platforms,
        state: "connected",
        metadata: input.metadata ? json(input.metadata) : Prisma.JsonNull,
        connectedAt: new Date(),
        disconnectedAt: null,
        revokedAt: null,
      },
      create: {
        ownerUserId: input.ownerUserId,
        provider: input.provider,
        accountRef: input.accountRef,
        credentialRef: input.credentialRef,
        scopes: input.scopes,
        platforms: input.platforms,
        state: input.state,
        metadata: input.metadata ? json(input.metadata) : undefined,
      },
    });
    return record<SocialConnectionRecord>(value);
  }

  async getConnection(ownerUserId: string, id: string) {
    return record<SocialConnectionRecord | null>(await prisma.socialConnection.findFirst({ where: { id, ownerUserId } }));
  }

  async listConnections(ownerUserId: string) {
    return record<SocialConnectionRecord[]>(await prisma.socialConnection.findMany({
      where: { ownerUserId },
      orderBy: { updatedAt: "desc" },
    }));
  }

  async updateConnectionState(ownerUserId: string, id: string, state: SocialConnectionState) {
    const current = await prisma.socialConnection.findFirst({ where: { id, ownerUserId } });
    if (!current) return null;
    const now = new Date();
    const value = await prisma.socialConnection.update({
      where: { id },
      data: {
        state,
        disconnectedAt: state === "disconnected" ? now : state === "connected" ? null : current.disconnectedAt,
        revokedAt: state === "revoked" ? now : state === "connected" ? null : current.revokedAt,
        credentialRef: state === "revoked" ? null : current.credentialRef,
      },
    });
    return record<SocialConnectionRecord>(value);
  }

  async createCampaign(input: Omit<SocialCampaignRecord, "id" | "createdAt" | "updatedAt">) {
    const value = await prisma.socialCampaign.create({
      data: {
        ...input,
        brandContext: json(input.brandContext),
        audienceContext: json(input.audienceContext),
        platformObjectives: json(input.platformObjectives),
        strategyAlternatives: json(input.strategyAlternatives),
      },
    });
    return record<SocialCampaignRecord>(value);
  }

  async getCampaign(ownerUserId: string, id: string) {
    return record<SocialCampaignRecord | null>(await prisma.socialCampaign.findFirst({ where: { id, ownerUserId } }));
  }

  async updateCampaign(ownerUserId: string, id: string, patch: Partial<Pick<SocialCampaignRecord, "selectedStrategyId" | "state">>) {
    const current = await prisma.socialCampaign.findFirst({ where: { id, ownerUserId } });
    if (!current) return null;
    return record<SocialCampaignRecord>(await prisma.socialCampaign.update({ where: { id }, data: patch }));
  }

  async listCampaigns(ownerUserId: string) {
    return record<SocialCampaignRecord[]>(await prisma.socialCampaign.findMany({ where: { ownerUserId }, orderBy: { updatedAt: "desc" } }));
  }

  async createResearchSignal(input: Omit<SocialResearchSignalRecord, "id" | "createdAt">) {
    return record<SocialResearchSignalRecord>(await prisma.socialResearchSignal.create({
      data: { ...input, provenance: json(input.provenance) },
    }));
  }

  async listResearchSignals(ownerUserId: string, campaignId: string) {
    return record<SocialResearchSignalRecord[]>(await prisma.socialResearchSignal.findMany({
      where: { ownerUserId, campaignId },
      orderBy: { accessedAt: "desc" },
    }));
  }

  async createContent(input: Omit<SocialContentRecord, "id" | "createdAt" | "updatedAt">) {
    return record<SocialContentRecord>(await prisma.socialContent.create({
      data: { ...input, brief: json(input.brief) },
    }));
  }

  async getContent(ownerUserId: string, id: string) {
    return record<SocialContentRecord | null>(await prisma.socialContent.findFirst({ where: { id, ownerUserId } }));
  }

  async listContent(ownerUserId: string, campaignId: string) {
    return record<SocialContentRecord[]>(await prisma.socialContent.findMany({
      where: { ownerUserId, campaignId },
      orderBy: { updatedAt: "desc" },
    }));
  }

  async createVariant(input: Omit<SocialVariantRecord, "id" | "createdAt" | "updatedAt">) {
    return record<SocialVariantRecord>(await prisma.socialVariant.create({
      data: { ...input, metadata: json(input.metadata) },
    }));
  }

  async getVariant(ownerUserId: string, id: string) {
    return record<SocialVariantRecord | null>(await prisma.socialVariant.findFirst({ where: { id, ownerUserId } }));
  }

  async updateVariant(ownerUserId: string, id: string, patch: Partial<SocialVariantRecord>) {
    const current = await prisma.socialVariant.findFirst({ where: { id, ownerUserId } });
    if (!current) return null;
    const { id: _id, ownerUserId: _owner, createdAt: _created, updatedAt: _updated, ...data } = patch;
    return record<SocialVariantRecord>(await prisma.socialVariant.update({
      where: { id },
      data: {
        ...data,
        metadata: data.metadata ? json(data.metadata) : undefined,
      },
    }));
  }

  async listVariants(ownerUserId: string, campaignId: string) {
    return record<SocialVariantRecord[]>(await prisma.socialVariant.findMany({
      where: { ownerUserId, campaignId },
      orderBy: { updatedAt: "desc" },
    }));
  }

  async reviseVariant(input: { ownerUserId: string; prior: SocialVariantRecord; copy: string; adaptationNote: string; assetRefs?: string[]; metadata?: JsonObject }) {
    return prisma.$transaction(async (tx) => {
      await tx.socialVariant.update({ where: { id: input.prior.id }, data: { state: "superseded" } });
      await tx.automationJob.updateMany({
        where: { ownerUserId: input.ownerUserId, targetType: "variant", targetId: input.prior.id, state: "scheduled" },
        data: { state: "cancelled", cancelledAt: new Date() },
      });
      const revised = await tx.socialVariant.create({
        data: {
          ownerUserId: input.ownerUserId,
          campaignId: input.prior.campaignId,
          contentId: input.prior.contentId,
          platform: input.prior.platform,
          connectionId: input.prior.connectionId,
          copy: input.copy,
          adaptationNote: input.adaptationNote,
          assetRefs: input.assetRefs || input.prior.assetRefs,
          metadata: json(input.metadata || input.prior.metadata),
          state: "draft",
          revisionOfId: input.prior.id,
          version: input.prior.version + 1,
        },
      });
      return record<SocialVariantRecord>(revised);
    });
  }

  async createApprovalPolicy(input: Omit<SocialApprovalPolicyRecord, "id" | "revokedAt" | "createdAt" | "updatedAt">) {
    return record<SocialApprovalPolicyRecord>(await prisma.socialApprovalPolicy.create({ data: input }));
  }

  async listApprovalPolicies(ownerUserId: string) {
    return record<SocialApprovalPolicyRecord[]>(await prisma.socialApprovalPolicy.findMany({
      where: { ownerUserId },
      orderBy: { updatedAt: "desc" },
    }));
  }

  async listActiveApprovalPolicies(ownerUserId: string, at: Date) {
    return record<SocialApprovalPolicyRecord[]>(await prisma.socialApprovalPolicy.findMany({
      where: {
        ownerUserId,
        revokedAt: null,
        startsAt: { lte: at },
        OR: [{ expiresAt: null }, { expiresAt: { gt: at } }],
      },
      orderBy: { createdAt: "desc" },
    }));
  }

  async revokeApprovalPolicy(ownerUserId: string, id: string) {
    const current = await prisma.socialApprovalPolicy.findFirst({ where: { id, ownerUserId } });
    if (!current) return null;
    return record<SocialApprovalPolicyRecord>(await prisma.socialApprovalPolicy.update({
      where: { id }, data: { revokedAt: current.revokedAt || new Date() },
    }));
  }

  async scheduleVariant(input: { ownerUserId: string; variantId: string; connectionId: string; scheduledFor: Date; idempotencyKey: string; approvalPolicyId?: string | null }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.automationJob.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (existing) {
        const variant = await tx.socialVariant.findFirst({ where: { id: input.variantId, ownerUserId: input.ownerUserId } });
        if (!variant || existing.ownerUserId !== input.ownerUserId || existing.targetId !== input.variantId) {
          throw Object.assign(new Error("Idempotency key belongs to another operation"), { statusCode: 409 });
        }
        return { variant: record<SocialVariantRecord>(variant), job: record<SocialAutomationJobRecord>(existing) };
      }
      const variant = await tx.socialVariant.findFirst({ where: { id: input.variantId, ownerUserId: input.ownerUserId } });
      if (!variant) throw Object.assign(new Error("Social variant not found"), { statusCode: 404 });
      const updatedVariant = await tx.socialVariant.update({
        where: { id: input.variantId },
        data: {
          state: "scheduled",
          connectionId: input.connectionId,
          scheduledAt: input.scheduledFor,
          approvalPolicyId: input.approvalPolicyId ?? variant.approvalPolicyId,
        },
      });
      const job = await tx.automationJob.create({
        data: {
          ownerUserId: input.ownerUserId,
          owningGalaxy: "ZYLO",
          jobType: "social.publish",
          targetType: "variant",
          targetId: input.variantId,
          scheduledFor: input.scheduledFor,
          state: "scheduled",
          idempotencyKey: input.idempotencyKey,
          metadata: json({ campaignId: variant.campaignId, platform: variant.platform }),
        },
      });
      return { variant: record<SocialVariantRecord>(updatedVariant), job: record<SocialAutomationJobRecord>(job) };
    });
  }

  async getAutomationJob(ownerUserId: string, id: string) {
    return record<SocialAutomationJobRecord | null>(await prisma.automationJob.findFirst({ where: { id, ownerUserId } }));
  }

  async rescheduleVariant(input: { ownerUserId: string; jobId: string; variantId: string; scheduledFor: Date }) {
    return prisma.$transaction(async (tx) => {
      const job = await tx.automationJob.findFirst({
        where: { id: input.jobId, ownerUserId: input.ownerUserId, targetType: "variant", targetId: input.variantId },
      });
      const variant = await tx.socialVariant.findFirst({ where: { id: input.variantId, ownerUserId: input.ownerUserId } });
      if (!job || !variant || job.state !== "scheduled") return null;
      const updatedJob = await tx.automationJob.update({
        where: { id: job.id }, data: { scheduledFor: input.scheduledFor, state: "scheduled", cancelledAt: null },
      });
      const updatedVariant = await tx.socialVariant.update({
        where: { id: variant.id }, data: { scheduledAt: input.scheduledFor, state: "scheduled" },
      });
      return { variant: record<SocialVariantRecord>(updatedVariant), job: record<SocialAutomationJobRecord>(updatedJob) };
    });
  }

  async cancelVariant(input: { ownerUserId: string; variantId: string; jobId?: string }) {
    return prisma.$transaction(async (tx) => {
      const variant = await tx.socialVariant.findFirst({ where: { id: input.variantId, ownerUserId: input.ownerUserId } });
      if (!variant) return null;
      let updatedJob: unknown;
      if (input.jobId) {
        const job = await tx.automationJob.findFirst({ where: { id: input.jobId, ownerUserId: input.ownerUserId, targetId: input.variantId } });
        if (job && !["completed", "cancelled"].includes(job.state)) {
          updatedJob = await tx.automationJob.update({ where: { id: job.id }, data: { state: "cancelled", cancelledAt: new Date() } });
        }
      } else {
        await tx.automationJob.updateMany({
          where: { ownerUserId: input.ownerUserId, targetType: "variant", targetId: input.variantId, state: "scheduled" },
          data: { state: "cancelled", cancelledAt: new Date() },
        });
      }
      const updatedVariant = await tx.socialVariant.update({
        where: { id: variant.id }, data: { state: "cancelled", scheduledAt: null },
      });
      return {
        variant: record<SocialVariantRecord>(updatedVariant),
        ...(updatedJob ? { job: record<SocialAutomationJobRecord>(updatedJob) } : {}),
      };
    });
  }

  async beginPublishAttempt(input: { ownerUserId: string; variantId: string; connectionId: string; idempotencyKey: string }) {
    const existing = await prisma.socialPublishAttempt.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) {
      if (existing.ownerUserId !== input.ownerUserId || existing.variantId !== input.variantId || existing.connectionId !== input.connectionId) {
        throw Object.assign(new Error("Idempotency key belongs to another operation"), { statusCode: 409 });
      }
      return { attempt: record<SocialPublishAttemptRecord>(existing), replayed: true };
    }
    try {
      return await prisma.$transaction(async (tx) => {
        const variant = await tx.socialVariant.findFirst({ where: { id: input.variantId, ownerUserId: input.ownerUserId } });
        if (!variant) throw Object.assign(new Error("Social variant not found"), { statusCode: 404 });
        await tx.socialVariant.update({ where: { id: variant.id }, data: { state: "publishing", connectionId: input.connectionId } });
        const attempt = await tx.socialPublishAttempt.create({ data: { ...input, state: "running" } });
        return { attempt: record<SocialPublishAttemptRecord>(attempt), replayed: false };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const replay = await prisma.socialPublishAttempt.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
        if (replay && replay.ownerUserId === input.ownerUserId && replay.variantId === input.variantId && replay.connectionId === input.connectionId) {
          return { attempt: record<SocialPublishAttemptRecord>(replay), replayed: true };
        }
      }
      throw error;
    }
  }

  async finishPublishAttempt(input: { ownerUserId: string; variantId: string; attemptId: string; result: ProviderPublishResult }) {
    return prisma.$transaction(async (tx) => {
      const attempt = await tx.socialPublishAttempt.findFirst({
        where: { id: input.attemptId, ownerUserId: input.ownerUserId, variantId: input.variantId },
      });
      if (!attempt) throw Object.assign(new Error("Publish attempt not found"), { statusCode: 404 });
      const completedAt = new Date();
      const updatedAttempt = await tx.socialPublishAttempt.update({
        where: { id: attempt.id },
        data: {
          state: input.result.state,
          providerOperationId: input.result.providerOperationId || null,
          providerPostId: input.result.providerPostId || null,
          providerUrl: input.result.providerUrl || null,
          providerResult: input.result.details ? json(input.result.details) : Prisma.JsonNull,
          failureCode: input.result.failureCode || null,
          failureMessage: input.result.failureMessage || null,
          completedAt,
        },
      });
      const updatedVariant = await tx.socialVariant.update({
        where: { id: input.variantId },
        data: {
          state: variantStateForResult(input.result),
          providerPostId: input.result.providerPostId || null,
          providerUrl: input.result.providerUrl || null,
          publishedAt: input.result.state === "succeeded" ? completedAt : null,
        },
      });
      await tx.automationJob.updateMany({
        where: { ownerUserId: input.ownerUserId, targetType: "variant", targetId: input.variantId, state: { in: ["scheduled", "running"] } },
        data: {
          state: input.result.state === "succeeded" ? "completed" : input.result.state === "blocked" ? "cancelled" : "failed",
          attemptCount: { increment: 1 },
          ...(input.result.state === "blocked" ? { cancelledAt: completedAt } : {}),
        },
      });
      return { attempt: record<SocialPublishAttemptRecord>(updatedAttempt), variant: record<SocialVariantRecord>(updatedVariant) };
    });
  }

  async createMetricSnapshot(input: Omit<SocialMetricSnapshotRecord, "id" | "capturedAt">) {
    return record<SocialMetricSnapshotRecord>(await prisma.socialMetricSnapshot.create({
      data: { ...input, metrics: json(input.metrics) },
    }));
  }

  async listMetricSnapshots(ownerUserId: string, campaignId: string) {
    return record<SocialMetricSnapshotRecord[]>(await prisma.socialMetricSnapshot.findMany({
      where: { ownerUserId, campaignId }, orderBy: { capturedAt: "desc" },
    }));
  }

  async createOutcomeInsight(input: Omit<SocialOutcomeInsightRecord, "id" | "createdAt" | "updatedAt">) {
    return record<SocialOutcomeInsightRecord>(await prisma.socialOutcomeInsight.create({
      data: { ...input, recommendations: json(input.recommendations) },
    }));
  }

  async createModerationItem(input: Omit<SocialModerationItemRecord, "id" | "providerActionId" | "providerResult" | "failureMessage" | "createdAt" | "updatedAt">) {
    return record<SocialModerationItemRecord>(await prisma.socialModerationItem.create({ data: input }));
  }

  async getModerationItem(ownerUserId: string, id: string) {
    return record<SocialModerationItemRecord | null>(await prisma.socialModerationItem.findFirst({ where: { id, ownerUserId } }));
  }

  async updateModerationItem(ownerUserId: string, id: string, patch: Partial<SocialModerationItemRecord>) {
    const current = await prisma.socialModerationItem.findFirst({ where: { id, ownerUserId } });
    if (!current) return null;
    const { id: _id, ownerUserId: _owner, createdAt: _created, updatedAt: _updated, ...data } = patch;
    return record<SocialModerationItemRecord>(await prisma.socialModerationItem.update({
      where: { id },
      data: { ...data, providerResult: data.providerResult ? json(data.providerResult) : data.providerResult === null ? Prisma.JsonNull : undefined },
    }));
  }

  async recordAudit(input: { ownerUserId: string; galaxyId?: string; eventType: string; targetType?: string; targetId?: string; details?: JsonObject }) {
    await prisma.auditEvent.create({
      data: {
        ...input,
        details: input.details ? json(input.details) : undefined,
      },
    });
  }
}
