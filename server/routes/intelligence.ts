import express from "express";
import { ownerContextFromRequest } from "../core/OwnerContext.js";
import { requireOwner } from "../core/requireOwner.js";
import { normalizeGalaxyId } from "../core/GalaxyRegistry.js";
import { storage } from "../storage-prisma.js";
import ZcosIntelligenceRuntime from "../intelligence/ZcosIntelligenceRuntime.js";
import ZcosContextAssembler from "../intelligence/ZcosContextAssembler.js";
import OutcomeLearningEngine from "../intelligence/OutcomeLearningEngine.js";
import IntelligenceAuditStore from "../intelligence/IntelligenceAuditStore.js";
import { externalSourceGateway, type ExternalSourceKind } from "../intelligence/ExternalSourceGateway.js";
import ExternalEvidenceProcessor from "../intelligence/ExternalEvidenceProcessor.js";
import ExternalEvidenceStore from "../intelligence/ExternalEvidenceStore.js";
import type { EvaluationResult, ZcosExecutionPlan } from "../intelligence/types.js";

const router = express.Router();
const SOURCE_KINDS = new Set<ExternalSourceKind>(["web", "model", "database", "connector", "tool"]);

function resolveGalaxy(req: express.Request, bodyGalaxy: unknown) {
  const owner = ownerContextFromRequest(req);
  const requestedGalaxy = typeof bodyGalaxy === "string" ? normalizeGalaxyId(bodyGalaxy) : null;
  const galaxyId = owner.originGalaxyId || requestedGalaxy;
  if (!galaxyId) throw Object.assign(new Error("Active galaxy is required through x-zcos-galaxy or galaxyId"), { status: 400 });
  if (owner.originGalaxyId && requestedGalaxy && owner.originGalaxyId !== requestedGalaxy) throw Object.assign(new Error("Request galaxy does not match authenticated execution context"), { status: 403 });
  return { owner, galaxyId };
}

function jsonObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

router.post("/analyze", requireOwner, async (req, res, next) => {
  try {
    const body = req.body || {};
    const { owner, galaxyId } = resolveGalaxy(req, body.galaxyId);
    if (typeof body.message !== "string" || !body.message.trim()) return res.status(400).json({ error: "message is required" });
    const context = await ZcosContextAssembler.assemble(owner.ownerUserId, galaxyId);
    const result = ZcosIntelligenceRuntime.analyze({ ownerUserId: owner.ownerUserId, galaxyId, message: body.message, projectId: typeof body.projectId === "string" ? body.projectId : undefined, conversationId: typeof body.conversationId === "string" ? body.conversationId : undefined, channel: typeof body.channel === "string" ? body.channel : undefined, strategic: Boolean(body.strategic), hasFiles: Boolean(body.hasFiles), context });
    await storage.recordAudit({ ownerUserId: owner.ownerUserId, galaxyId, eventType: "intelligence.plan_created", targetType: "intelligence_request", targetId: result.requestId, details: { stage: "initial", contextIds: result.trace.contextIds, plan: result.plan, evaluation: result.evaluation } });
    res.json(result);
  } catch (error) { next(error); }
});

router.post("/external-sources/:adapterId/retrieve", requireOwner, async (req, res, next) => {
  try {
    const body = req.body || {};
    const { owner, galaxyId } = resolveGalaxy(req, body.galaxyId);
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
    if (!requestId) return res.status(400).json({ error: "requestId is required" });
    const planEvent = await IntelligenceAuditStore.findPlan(owner.ownerUserId, galaxyId, requestId);
    if (!planEvent) return res.status(404).json({ error: "Canonical intelligence plan not found for this owner and galaxy" });
    const plan = jsonObject(planEvent.details).plan as ZcosExecutionPlan | undefined;
    if (!plan?.externalInformationRequired) return res.status(409).json({ error: "This intelligence plan does not require external evidence" });

    const rawKinds = Array.isArray(body.sourceKinds) ? body.sourceKinds.map(String) : ["model"];
    const sourceKinds = rawKinds.filter((kind): kind is ExternalSourceKind => SOURCE_KINDS.has(kind as ExternalSourceKind));
    if (!sourceKinds.length || sourceKinds.length !== rawKinds.length) return res.status(400).json({ error: "Invalid sourceKinds" });
    const query = typeof body.query === "string" && body.query.trim() ? body.query.trim() : plan.objective;
    const raw = await externalSourceGateway.retrieve(req.params.adapterId, { requestId, objective: plan.objective, sourceKinds, query, ownerUserId: owner.ownerUserId, galaxyId });
    const processed = ExternalEvidenceProcessor.process(raw, galaxyId);
    if (!processed.evidence.length) return res.status(422).json({ error: "No valid external evidence was returned", issues: processed.issues });
    const sourceRecords = await ExternalEvidenceStore.persist(owner.ownerUserId, galaxyId, requestId, processed.evidence);
    await storage.recordAudit({ ownerUserId: owner.ownerUserId, galaxyId, eventType: "intelligence.external_evidence_validated", targetType: "intelligence_request", targetId: requestId, details: { adapterId: req.params.adapterId, sourceRecordIds: sourceRecords.map((record) => record.id), issues: processed.issues, duplicatesRemoved: processed.duplicatesRemoved } });
    res.json({ requestId, adapterId: req.params.adapterId, sourceRecordIds: sourceRecords.map((record) => record.id), evidence: processed.evidence, issues: processed.issues, duplicatesRemoved: processed.duplicatesRemoved });
  } catch (error) { next(error); }
});

router.post("/synthesize", requireOwner, async (req, res, next) => {
  try {
    const body = req.body || {};
    const { owner, galaxyId } = resolveGalaxy(req, body.galaxyId);
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
    if (!requestId) return res.status(400).json({ error: "requestId is required" });
    const planEvent = await IntelligenceAuditStore.findPlan(owner.ownerUserId, galaxyId, requestId);
    if (!planEvent) return res.status(404).json({ error: "Canonical intelligence plan not found" });
    const priorPlan = jsonObject(planEvent.details).plan as ZcosExecutionPlan | undefined;
    if (!priorPlan?.objective) return res.status(409).json({ error: "Canonical intelligence plan is incomplete" });

    const evidenceEvent = await IntelligenceAuditStore.findValidatedEvidence(owner.ownerUserId, galaxyId, requestId);
    if (priorPlan.externalInformationRequired && !evidenceEvent) return res.status(409).json({ error: "Required external evidence has not been gathered and validated" });
    const evidenceDetails = jsonObject(evidenceEvent?.details);
    const sourceRecordIds = Array.isArray(evidenceDetails.sourceRecordIds) ? evidenceDetails.sourceRecordIds.map(String) : [];
    const [canonicalContext, externalContext] = await Promise.all([ZcosContextAssembler.assemble(owner.ownerUserId, galaxyId), ExternalEvidenceStore.loadContext(owner.ownerUserId, galaxyId, sourceRecordIds)]);
    const result = ZcosIntelligenceRuntime.analyze({ ownerUserId: owner.ownerUserId, galaxyId, message: priorPlan.objective, context: [...canonicalContext, ...externalContext] });
    await storage.recordAudit({ ownerUserId: owner.ownerUserId, galaxyId, eventType: "intelligence.plan_created", targetType: "intelligence_request", targetId: result.requestId, details: { stage: "synthesis", parentRequestId: requestId, contextIds: result.trace.contextIds, plan: result.plan, evaluation: result.evaluation } });
    res.json({ parentRequestId: requestId, result });
  } catch (error) { next(error); }
});

router.post("/outcomes", requireOwner, async (req, res, next) => {
  try {
    const body = req.body || {};
    const { owner, galaxyId } = resolveGalaxy(req, body.galaxyId);
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
    if (!requestId) return res.status(400).json({ error: "requestId is required" });
    if (!["completed", "partial", "failed", "blocked", "unknown"].includes(String(body.outcomeStatus))) return res.status(400).json({ error: "Valid outcomeStatus is required" });
    const planEvent = await IntelligenceAuditStore.findPlan(owner.ownerUserId, galaxyId, requestId);
    if (!planEvent) return res.status(404).json({ error: "Canonical intelligence plan not found for this owner and galaxy" });
    const details = jsonObject(planEvent.details);
    const plan = details.plan as ZcosExecutionPlan | undefined;
    const evaluation = details.evaluation as EvaluationResult | undefined;
    if (!plan || !evaluation || typeof plan.objective !== "string" || typeof evaluation.score !== "number") return res.status(409).json({ error: "Canonical intelligence plan is incomplete and cannot be learned from" });
    const proposals = OutcomeLearningEngine.observe({ requestId, ownerUserId: owner.ownerUserId, galaxyId, objective: plan.objective, outcomeStatus: body.outcomeStatus, evidence: Array.isArray(body.evidence) ? body.evidence.map(String).filter(Boolean) : [], evaluation, plan });
    await storage.recordAudit({ ownerUserId: owner.ownerUserId, galaxyId, eventType: "intelligence.outcome_observed", targetType: "intelligence_request", targetId: requestId, details: { outcomeStatus: body.outcomeStatus, proposals } });
    res.json({ requestId, proposals, canonicalMutation: false });
  } catch (error) { next(error); }
});

router.get("/learning-proposals", requireOwner, async (req, res, next) => {
  try {
    const owner = ownerContextFromRequest(req);
    const galaxyId = req.query.galaxyId ? normalizeGalaxyId(String(req.query.galaxyId)) : undefined;
    if (req.query.galaxyId && !galaxyId) return res.status(400).json({ error: "Unknown ZCOS galaxy" });
    const events = await IntelligenceAuditStore.listOutcomeLearning(owner.ownerUserId, galaxyId || undefined, Number(req.query.limit || 100));
    const proposals = events.flatMap((event) => {
      const details = jsonObject(event.details);
      return Array.isArray(details.proposals) ? details.proposals : [];
    });
    res.json({ proposals });
  } catch (error) { next(error); }
});

router.get("/external-sources", requireOwner, (_req, res) => res.json({ authority: "evidence-only", reasoningAuthority: "ZCOS", adapters: externalSourceGateway.list() }));
router.get("/capabilities", requireOwner, (_req, res) => res.json({ reasoningAuthority: "ZCOS", presentationAuthority: "ZAR", providerNeutral: true, canonicalContextAuthority: true, migratedCapabilities: ["deep-thinking", "strategic-reasoning", "context-intelligence", "document-grounding", "response-planning", "parallel-capability-routing", "external-source-governance", "evidence-validation", "synthesis", "evaluation", "outcome-verification", "outcome-learning-proposals"], lockedFlow: ["authenticate", "assemble-canonical-context", "reason", "plan", "gather-external-information-when-required", "validate-and-store-evidence", "synthesize-in-zcos", "assign-capabilities", "authorize-execution-separately", "verify-outcome", "learn-from-outcome-without-silent-canonical-mutation", "present-through-zar"] }));

export default router;
