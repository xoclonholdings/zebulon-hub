import express from "express";
import { ownerContextFromRequest } from "../core/OwnerContext.js";
import { requireOwner } from "../core/requireOwner.js";
import { PrismaSocialRepository } from "../social/PrismaSocialRepository.js";
import { SocialMediaService, SocialPublisherRegistry } from "../social/SocialMediaService.js";
import type { JsonObject, StrategyAlternative } from "../social/contracts.js";

const router = express.Router();
const service = new SocialMediaService(
  new PrismaSocialRepository(),
  // Provider adapters are registered only after their credentials, scopes, and
  // verification behavior have been reviewed. An empty registry fails closed.
  new SocialPublisherRegistry(),
);

function ownerUserId(req: express.Request): string {
  return ownerContextFromRequest(req).ownerUserId;
}

function dateValue(value: unknown, field: string, required = true): Date | undefined {
  if ((value === undefined || value === null || value === "") && !required) return undefined;
  if (typeof value !== "string") throw Object.assign(new Error(`${field} must be an ISO date`), { statusCode: 400 });
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw Object.assign(new Error(`${field} must be an ISO date`), { statusCode: 400 });
  return parsed;
}

function objectValue(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonObject;
}

router.use(requireOwner);

router.get("/campaigns", async (req, res, next) => {
  try {
    res.json({ campaigns: await service.listCampaigns(ownerUserId(req)) });
  } catch (error) { next(error); }
});

router.get("/integrations", async (req, res, next) => {
  try { res.json({ connections: await service.listConnections(ownerUserId(req)) }); }
  catch (error) { next(error); }
});

router.post("/integrations", async (req, res, next) => {
  try {
    res.status(201).json(await service.connectAccount({
      ownerUserId: ownerUserId(req),
      provider: req.body?.provider,
      accountRef: req.body?.accountRef,
      credentialRef: req.body?.credentialRef,
      scopes: req.body?.scopes,
      platforms: req.body?.platforms,
      metadata: objectValue(req.body?.metadata),
    }));
  } catch (error) { next(error); }
});

router.post("/integrations/:id/disconnect", async (req, res, next) => {
  try { res.json(await service.disconnectAccount(ownerUserId(req), req.params.id)); }
  catch (error) { next(error); }
});

router.post("/integrations/:id/revoke", async (req, res, next) => {
  try { res.json(await service.disconnectAccount(ownerUserId(req), req.params.id, true)); }
  catch (error) { next(error); }
});

router.post("/approval-policies", async (req, res, next) => {
  try {
    res.status(201).json(await service.createApprovalPolicy({
      ownerUserId: ownerUserId(req),
      mode: req.body?.mode,
      operations: req.body?.operations,
      platform: req.body?.platform,
      campaignId: req.body?.campaignId,
      connectionId: req.body?.connectionId,
      startsAt: dateValue(req.body?.startsAt, "startsAt", false),
      expiresAt: dateValue(req.body?.expiresAt, "expiresAt", false),
    }));
  } catch (error) { next(error); }
});

router.get("/approval-policies", async (req, res, next) => {
  try { res.json({ policies: await service.listApprovalPolicies(ownerUserId(req)) }); }
  catch (error) { next(error); }
});

router.post("/approval-policies/:id/revoke", async (req, res, next) => {
  try { res.json(await service.revokeApprovalPolicy(ownerUserId(req), req.params.id)); }
  catch (error) { next(error); }
});

router.post("/campaigns", async (req, res, next) => {
  try {
    res.status(201).json(await service.createCampaign({
      ownerUserId: ownerUserId(req),
      projectRef: req.body?.projectRef,
      name: req.body?.name,
      objective: req.body?.objective,
      brandContext: objectValue(req.body?.brandContext),
      audienceContext: objectValue(req.body?.audienceContext),
      platformObjectives: objectValue(req.body?.platformObjectives),
      strategyAlternatives: req.body?.strategyAlternatives as StrategyAlternative[],
    }));
  } catch (error) { next(error); }
});

router.get("/campaigns/:id", async (req, res, next) => {
  try { res.json(await service.campaignSnapshot(ownerUserId(req), req.params.id)); }
  catch (error) { next(error); }
});

router.post("/campaigns/:id/select-strategy", async (req, res, next) => {
  try { res.json(await service.selectStrategy(ownerUserId(req), req.params.id, req.body?.strategyId)); }
  catch (error) { next(error); }
});

router.post("/campaigns/:id/research-signals", async (req, res, next) => {
  try {
    res.status(201).json(await service.addResearchSignal({
      ownerUserId: ownerUserId(req),
      campaignId: req.params.id,
      contributorGalaxy: req.body?.contributorGalaxy,
      platform: req.body?.platform,
      signalType: req.body?.signalType,
      summary: req.body?.summary,
      sourceLocator: req.body?.sourceLocator,
      sourceTitle: req.body?.sourceTitle,
      publishedAt: dateValue(req.body?.publishedAt, "publishedAt", false),
      accessedAt: dateValue(req.body?.accessedAt, "accessedAt", false),
      freshUntil: dateValue(req.body?.freshUntil, "freshUntil", false),
      provenance: objectValue(req.body?.provenance),
    }));
  } catch (error) { next(error); }
});

router.post("/campaigns/:id/content", async (req, res, next) => {
  try {
    res.status(201).json(await service.createContent({
      ownerUserId: ownerUserId(req),
      campaignId: req.params.id,
      title: req.body?.title,
      contentKind: req.body?.contentKind,
      brief: objectValue(req.body?.brief),
      sourceBindings: req.body?.sourceBindings,
      assetRefs: req.body?.assetRefs,
    }));
  } catch (error) { next(error); }
});

router.post("/content/:id/variants", async (req, res, next) => {
  try {
    res.status(201).json(await service.createPlatformVariant({
      ownerUserId: ownerUserId(req),
      contentId: req.params.id,
      platform: req.body?.platform,
      connectionId: req.body?.connectionId,
      copy: req.body?.copy,
      adaptationNote: req.body?.adaptationNote,
      assetRefs: req.body?.assetRefs,
      metadata: objectValue(req.body?.metadata),
    }));
  } catch (error) { next(error); }
});

router.post("/variants/:id/review", async (req, res, next) => {
  try { res.json(await service.submitVariantForReview(ownerUserId(req), req.params.id)); }
  catch (error) { next(error); }
});

router.post("/variants/:id/approve", async (req, res, next) => {
  try { res.json(await service.approveVariant(ownerUserId(req), req.params.id, req.body?.approvedBy)); }
  catch (error) { next(error); }
});

router.post("/variants/:id/revise", async (req, res, next) => {
  try {
    res.status(201).json(await service.reviseVariant({
      ownerUserId: ownerUserId(req),
      variantId: req.params.id,
      copy: req.body?.copy,
      adaptationNote: req.body?.adaptationNote,
      assetRefs: req.body?.assetRefs,
      metadata: req.body?.metadata ? objectValue(req.body.metadata) : undefined,
    }));
  } catch (error) { next(error); }
});

router.post("/variants/:id/schedule", async (req, res, next) => {
  try {
    res.status(201).json(await service.scheduleVariant({
      ownerUserId: ownerUserId(req),
      variantId: req.params.id,
      connectionId: req.body?.connectionId,
      scheduledFor: dateValue(req.body?.scheduledFor, "scheduledFor")!,
      idempotencyKey: req.body?.idempotencyKey,
    }));
  } catch (error) { next(error); }
});

router.post("/variants/:id/reschedule", async (req, res, next) => {
  try {
    res.json(await service.rescheduleVariant({
      ownerUserId: ownerUserId(req),
      variantId: req.params.id,
      jobId: req.body?.jobId,
      scheduledFor: dateValue(req.body?.scheduledFor, "scheduledFor")!,
    }));
  } catch (error) { next(error); }
});

router.post("/variants/:id/cancel", async (req, res, next) => {
  try { res.json(await service.cancelVariant({ ownerUserId: ownerUserId(req), variantId: req.params.id, jobId: req.body?.jobId })); }
  catch (error) { next(error); }
});

router.get("/automation/:id", async (req, res, next) => {
  try { res.json(await service.getAutomationJob(ownerUserId(req), req.params.id)); }
  catch (error) { next(error); }
});

router.post("/variants/:id/publish", async (req, res, next) => {
  try {
    res.json(await service.publishVariant({
      ownerUserId: ownerUserId(req),
      variantId: req.params.id,
      connectionId: req.body?.connectionId,
      idempotencyKey: req.body?.idempotencyKey,
    }));
  } catch (error) { next(error); }
});

router.post("/analytics/snapshots", async (req, res, next) => {
  try {
    res.status(201).json(await service.recordMetricSnapshot({
      ownerUserId: ownerUserId(req),
      campaignId: req.body?.campaignId,
      contentId: req.body?.contentId,
      variantId: req.body?.variantId,
      platform: req.body?.platform,
      objective: req.body?.objective,
      windowStart: dateValue(req.body?.windowStart, "windowStart")!,
      windowEnd: dateValue(req.body?.windowEnd, "windowEnd")!,
      metrics: objectValue(req.body?.metrics),
      providerSourceId: req.body?.providerSourceId,
      sourceBindings: req.body?.sourceBindings,
    }));
  } catch (error) { next(error); }
});

router.post("/campaigns/:id/outcome-insights", async (req, res, next) => {
  try {
    res.status(201).json(await service.createOutcomeInsight({
      ownerUserId: ownerUserId(req),
      campaignId: req.params.id,
      objective: req.body?.objective,
      windowStart: dateValue(req.body?.windowStart, "windowStart")!,
      windowEnd: dateValue(req.body?.windowEnd, "windowEnd")!,
      snapshotIds: req.body?.snapshotIds,
      summary: req.body?.summary,
      recommendations: objectValue(req.body?.recommendations),
    }));
  } catch (error) { next(error); }
});

router.post("/moderation", async (req, res, next) => {
  try {
    res.status(201).json(await service.createModerationItem({
      ownerUserId: ownerUserId(req),
      campaignId: req.body?.campaignId,
      platform: req.body?.platform,
      connectionId: req.body?.connectionId,
      providerItemId: req.body?.providerItemId,
      itemType: req.body?.itemType,
      proposedAction: req.body?.proposedAction,
      riskLevel: req.body?.riskLevel,
    }));
  } catch (error) { next(error); }
});

router.post("/moderation/:id/state", async (req, res, next) => {
  try {
    res.json(await service.updateModerationState({
      ownerUserId: ownerUserId(req),
      itemId: req.params.id,
      state: req.body?.state,
      providerActionId: req.body?.providerActionId,
      providerResult: req.body?.providerResult ? objectValue(req.body.providerResult) : undefined,
      failureMessage: req.body?.failureMessage,
    }));
  } catch (error) { next(error); }
});

export default router;
