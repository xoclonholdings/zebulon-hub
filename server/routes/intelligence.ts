import express from "express";
import { ownerContextFromRequest } from "../core/OwnerContext.js";
import { requireOwner } from "../core/requireOwner.js";
import { normalizeGalaxyId } from "../core/GalaxyRegistry.js";
import { storage } from "../storage-prisma.js";
import ZcosIntelligenceRuntime from "../intelligence/ZcosIntelligenceRuntime.js";
import ZcosContextAssembler from "../intelligence/ZcosContextAssembler.js";
import OutcomeLearningEngine from "../intelligence/OutcomeLearningEngine.js";
import { externalSourceGateway } from "../intelligence/ExternalSourceGateway.js";
import type { EvaluationResult, ZcosExecutionPlan } from "../intelligence/types.js";

const router = express.Router();

function resolveGalaxy(req: express.Request, bodyGalaxy: unknown) {
  const owner = ownerContextFromRequest(req);
  const requestedGalaxy = typeof bodyGalaxy === "string" ? normalizeGalaxyId(bodyGalaxy) : null;
  const galaxyId = owner.originGalaxyId || requestedGalaxy;
  if (!galaxyId) throw Object.assign(new Error("Active galaxy is required through x-zcos-galaxy or galaxyId"), { status: 400 });
  if (owner.originGalaxyId && requestedGalaxy && owner.originGalaxyId !== requestedGalaxy) {
    throw Object.assign(new Error("Request galaxy does not match authenticated execution context"), { status: 403 });
  }
  return { owner, galaxyId };
}

function jsonObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

router.post("/analyze", requireOwner, async (req, res, next) => {
  try {
    const body = req.body || {};
    const { owner, galaxyId } = resolveGalaxy(req, body.galaxyId);
    if (typeof body.message !== "string" || !body.message.trim()) return res.status(400).json({ error: "message is required" });

    // Memory and Knowledge are loaded server-side from canonical authorities.
    // A caller cannot manufacture canonical reasoning context in the request body.
    const context = await ZcosContextAssembler.assemble(owner.ownerUserId, galaxyId);
    const result = ZcosIntelligenceRuntime.analyze({
      ownerUserId: owner.ownerUserId,
      galaxyId,
      message: body.message,
      projectId: typeof body.projectId === "string" ? body.projectId : undefined,
      conversationId: typeof body.conversationId === "string" ? body.conversationId : undefined,
      channel: typeof body.channel === "string" ? body.channel : undefined,
      strategic: Boolean(body.strategic),
      hasFiles: Boolean(body.hasFiles),
      context,
    });

    await storage.recordAudit({
      ownerUserId: owner.ownerUserId,
      galaxyId,
      eventType: "intelligence.plan_created",
      targetType: "intelligence_request",
      targetId: result.requestId,
      details: {
        taskType: result.reasoning.taskType,
        complexity: result.reasoning.complexity,
        contextIds: result.trace.contextIds,
        plan: result.plan,
        evaluation: result.evaluation,
      },
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/outcomes", requireOwner, async (req, res, next) => {
  try {
    const body = req.body || {};
    const { owner, galaxyId } = resolveGalaxy(req, body.galaxyId);
    if (typeof body.requestId !== "string" || !body.requestId.trim()) return res.status(400).json({ error: "requestId is required" });
    if (!["completed", "partial", "failed", "blocked", "unknown"].includes(String(body.outcomeStatus))) {
      return res.status(400).json({ error: "Valid outcomeStatus is required" });
    }

    const audit = await storage.listAudit(owner.ownerUserId, 500);
    const planEvent = audit.find((event) =>
      event.eventType === "intelligence.plan_created"
      && event.targetId === body.requestId
      && event.galaxyId === galaxyId
    );
    if (!planEvent) return res.status(404).json({ error: "Canonical intelligence plan not found for this owner and galaxy" });

    const details = jsonObject(planEvent.details);
    const plan = details.plan as ZcosExecutionPlan | undefined;
    const evaluation = details.evaluation as EvaluationResult | undefined;
    if (!plan || !evaluation || typeof plan.objective !== "string" || typeof evaluation.score !== "number") {
      return res.status(409).json({ error: "Canonical intelligence plan is incomplete and cannot be learned from" });
    }

    const proposals = OutcomeLearningEngine.observe({
      requestId: body.requestId,
      ownerUserId: owner.ownerUserId,
      galaxyId,
      objective: plan.objective,
      outcomeStatus: body.outcomeStatus,
      evidence: Array.isArray(body.evidence) ? body.evidence.map(String).filter(Boolean) : [],
      evaluation,
      plan,
    });

    await storage.recordAudit({
      ownerUserId: owner.ownerUserId,
      galaxyId,
      eventType: "intelligence.outcome_observed",
      targetType: "intelligence_request",
      targetId: body.requestId,
      details: { outcomeStatus: body.outcomeStatus, proposalIds: proposals.map((proposal) => proposal.id), evidenceCount: Array.isArray(body.evidence) ? body.evidence.length : 0 },
    });

    res.json({ requestId: body.requestId, proposals, canonicalMutation: false });
  } catch (error) {
    next(error);
  }
});

router.get("/external-sources", requireOwner, (_req, res) => {
  res.json({ authority: "evidence-only", reasoningAuthority: "ZCOS", adapters: externalSourceGateway.list() });
});

router.get("/capabilities", requireOwner, (_req, res) => {
  res.json({
    reasoningAuthority: "ZCOS",
    presentationAuthority: "ZAR",
    providerNeutral: true,
    canonicalContextAuthority: true,
    migratedCapabilities: [
      "deep-thinking",
      "strategic-reasoning",
      "context-intelligence",
      "document-grounding-contract",
      "response-planning",
      "self-orchestration",
      "capability-routing",
      "external-source-governance",
      "evaluation",
      "outcome-verification",
      "outcome-learning-proposals",
    ],
    lockedFlow: [
      "authenticate",
      "assemble-canonical-context",
      "reason",
      "plan",
      "gather-external-information-when-required",
      "validate-and-synthesize",
      "assign-capabilities",
      "authorize-execution-separately",
      "verify-outcome",
      "learn-from-outcome-without-silent-canonical-mutation",
      "present-through-zar",
    ],
  });
});

export default router;
