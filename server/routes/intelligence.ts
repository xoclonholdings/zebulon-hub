import express from "express";
import { ownerContextFromRequest } from "../core/OwnerContext.js";
import { requireOwner } from "../core/requireOwner.js";
import { normalizeGalaxyId } from "../core/GalaxyRegistry.js";
import { storage } from "../storage-prisma.js";
import ZcosIntelligenceRuntime from "../intelligence/ZcosIntelligenceRuntime.js";
import OutcomeLearningEngine from "../intelligence/OutcomeLearningEngine.js";
import { externalSourceGateway } from "../intelligence/ExternalSourceGateway.js";
import type { EvaluationResult, ZcosContextItem, ZcosExecutionPlan } from "../intelligence/types.js";

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

router.post("/analyze", requireOwner, async (req, res, next) => {
  try {
    const body = req.body || {};
    const { owner, galaxyId } = resolveGalaxy(req, body.galaxyId);
    if (typeof body.message !== "string" || !body.message.trim()) return res.status(400).json({ error: "message is required" });

    const context: ZcosContextItem[] = Array.isArray(body.context)
      ? body.context.filter((item: unknown) => item && typeof item === "object")
      : [];

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
        capabilities: result.plan.capabilities.map((item) => `${item.owner}:${item.capability}`),
        evaluation: result.evaluation.recommendedAction,
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
    if (typeof body.objective !== "string" || !body.objective.trim()) return res.status(400).json({ error: "objective is required" });
    if (!["completed", "partial", "failed", "blocked", "unknown"].includes(String(body.outcomeStatus))) {
      return res.status(400).json({ error: "Valid outcomeStatus is required" });
    }
    if (!body.evaluation || !body.plan) return res.status(400).json({ error: "evaluation and plan are required" });

    const proposals = OutcomeLearningEngine.observe({
      requestId: body.requestId,
      ownerUserId: owner.ownerUserId,
      galaxyId,
      objective: body.objective,
      outcomeStatus: body.outcomeStatus,
      evidence: Array.isArray(body.evidence) ? body.evidence.map(String) : [],
      evaluation: body.evaluation as EvaluationResult,
      plan: body.plan as ZcosExecutionPlan,
    });

    await storage.recordAudit({
      ownerUserId: owner.ownerUserId,
      galaxyId,
      eventType: "intelligence.outcome_observed",
      targetType: "intelligence_request",
      targetId: body.requestId,
      details: { outcomeStatus: body.outcomeStatus, proposalIds: proposals.map((proposal) => proposal.id) },
    });

    res.json({ requestId: body.requestId, proposals, canonicalMutation: false });
  } catch (error) {
    next(error);
  }
});

router.get("/external-sources", requireOwner, (_req, res) => {
  res.json({
    authority: "evidence-only",
    reasoningAuthority: "ZCOS",
    adapters: externalSourceGateway.list(),
  });
});

router.get("/capabilities", requireOwner, (_req, res) => {
  res.json({
    reasoningAuthority: "ZCOS",
    presentationAuthority: "ZAR",
    providerNeutral: true,
    migratedCapabilities: [
      "deep-thinking",
      "strategic-reasoning",
      "context-intelligence",
      "document-grounding",
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
      "assemble-context",
      "reason",
      "plan",
      "gather-external-information-when-required",
      "validate-and-synthesize",
      "assign-capabilities",
      "verify-outcome",
      "learn-from-outcome-without-silent-canonical-mutation",
      "present-through-zar",
    ],
  });
});

export default router;
