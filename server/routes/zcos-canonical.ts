import express from "express";
import { storage } from "../storage-prisma.js";
import { ownerContextFromRequest } from "../core/OwnerContext.js";
import { requireOwner } from "../core/requireOwner.js";
import { normalizeGalaxyId, ZCOS_GALAXIES, type GalaxyId } from "../core/GalaxyRegistry.js";

const router = express.Router();

const domains = ["identity", "memory", "knowledge", "apps", "desk", "settings", "portal"] as const;
const memoryTypes = new Set(["experience", "decision", "person_relationship", "event", "user_directed"]);
const knowledgeTypes = new Set(["topic", "concept", "claim", "fact", "rule", "system", "relationship", "source", "lexicon_sense"]);
const originClasses = new Set(["UGC / Uploaded", "Extracted / Compiled"]);

type AuthorityKind = "memory" | "knowledge";
type Permission = "read" | "write" | "contribute" | "admin";

function routeGalaxy(value: string | undefined): GalaxyId {
  const galaxyId = normalizeGalaxyId(value || "");
  if (!galaxyId) throw Object.assign(new Error("Unknown ZCOS galaxy"), { status: 400 });
  return galaxyId;
}

function toDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw Object.assign(new Error("Invalid date"), { status: 400 });
  return parsed;
}

async function authorizePartition(req: express.Request, authorityKind: AuthorityKind, permission: Permission) {
  const owner = ownerContextFromRequest(req);
  const targetGalaxyId = routeGalaxy(req.params.galaxy);
  const sourceGalaxyId = owner.originGalaxyId || targetGalaxyId;

  if (sourceGalaxyId === targetGalaxyId) {
    return { owner, galaxyId: targetGalaxyId, grantId: null };
  }

  const grantId = await storage.hasPartitionGrant({
    ownerUserId: owner.ownerUserId,
    sourceGalaxyId,
    targetGalaxyId,
    authorityKind,
    permission,
  });

  if (!grantId) {
    await storage.recordAudit({
      ownerUserId: owner.ownerUserId,
      galaxyId: sourceGalaxyId,
      eventType: "partition.access_denied",
      targetType: authorityKind,
      details: { sourceGalaxyId, targetGalaxyId, permission },
    });
    throw Object.assign(new Error("Cross-galaxy access is not authorized"), { status: 403 });
  }

  await storage.recordAudit({
    ownerUserId: owner.ownerUserId,
    galaxyId: sourceGalaxyId,
    eventType: "partition.grant_used",
    targetType: authorityKind,
    targetId: grantId,
    details: { sourceGalaxyId, targetGalaxyId, permission },
  });

  return { owner, galaxyId: targetGalaxyId, grantId };
}

router.get("/partitions", (_req, res) => {
  res.json({ galaxies: ZCOS_GALAXIES, domains });
});

router.get("/:galaxy/memory/settings", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = await authorizePartition(req, "memory", "read");
    const enabled = await storage.getMemoryEnabled(owner.ownerUserId);
    res.json({ galaxyId, memoryEnabled: enabled });
  } catch (error) { next(error); }
});

router.patch("/:galaxy/memory/settings", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = await authorizePartition(req, "memory", "write");
    if (typeof req.body?.memoryEnabled !== "boolean") return res.status(400).json({ error: "memoryEnabled must be boolean" });
    const setting = await storage.setMemoryEnabled(owner.ownerUserId, req.body.memoryEnabled);
    await storage.recordAudit({ ownerUserId: owner.ownerUserId, galaxyId, eventType: "memory.toggle_changed", targetType: "memory_setting", details: { memoryEnabled: setting.memoryEnabled } });
    res.json({ galaxyId, memoryEnabled: setting.memoryEnabled });
  } catch (error) { next(error); }
});

router.get("/:galaxy/memory", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = await authorizePartition(req, "memory", "read");
    const enabled = await storage.getMemoryEnabled(owner.ownerUserId);
    if (!enabled) return res.json({ galaxyId, memoryEnabled: false, records: [] });
    const includeReview = req.query.review === "true";
    const records = await storage.listMemory(owner.ownerUserId, galaxyId, includeReview);
    res.json({ galaxyId, memoryEnabled: true, records });
  } catch (error) { next(error); }
});

router.post("/:galaxy/memory", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = await authorizePartition(req, "memory", "write");
    const enabled = await storage.getMemoryEnabled(owner.ownerUserId);
    if (!enabled) return res.status(409).json({ error: "Memory is disabled" });
    const { memoryType, canonicalName, content, properties, topics, entityIds, occurredAt, sourceId } = req.body || {};
    if (!memoryTypes.has(String(memoryType)) || typeof canonicalName !== "string" || !canonicalName.trim() || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Valid memoryType, canonicalName, and content are required" });
    }
    const result = await storage.createDirectMemory({
      ownerUserId: owner.ownerUserId,
      galaxyId,
      memoryType,
      canonicalName: canonicalName.trim(),
      content: content.trim(),
      properties,
      topics: Array.isArray(topics) ? topics.map(String) : [],
      entityIds: Array.isArray(entityIds) ? entityIds.map(String) : [],
      occurredAt: toDate(occurredAt),
      sourceId: typeof sourceId === "string" ? sourceId : undefined,
    });
    res.status(201).json(result);
  } catch (error) { next(error); }
});

router.patch("/:galaxy/memory/:id/confirm", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = await authorizePartition(req, "memory", "write");
    const record = await storage.confirmMemory(owner.ownerUserId, galaxyId, req.params.id);
    if (!record) return res.status(404).json({ error: "Proposed memory not found" });
    await storage.recordAudit({ ownerUserId: owner.ownerUserId, galaxyId, eventType: "memory.confirmed", targetType: "memory", targetId: record.id });
    res.json({ record });
  } catch (error) { next(error); }
});

router.patch("/:galaxy/memory/:id/reject", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = await authorizePartition(req, "memory", "write");
    const record = await storage.rejectMemory(owner.ownerUserId, galaxyId, req.params.id);
    if (!record) return res.status(404).json({ error: "Memory not found" });
    await storage.recordAudit({ ownerUserId: owner.ownerUserId, galaxyId, eventType: "memory.rejected", targetType: "memory", targetId: record.id });
    res.json({ record });
  } catch (error) { next(error); }
});

router.patch("/:galaxy/memory/:id/correct", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = await authorizePartition(req, "memory", "write");
    const { content, canonicalName } = req.body || {};
    if (typeof content !== "string" || !content.trim()) return res.status(400).json({ error: "Corrected content is required" });
    const result = await storage.correctMemory({ ownerUserId: owner.ownerUserId, galaxyId, id: req.params.id, content: content.trim(), canonicalName: typeof canonicalName === "string" && canonicalName.trim() ? canonicalName.trim() : undefined });
    if (!result) return res.status(404).json({ error: "Memory not found" });
    res.json(result);
  } catch (error) { next(error); }
});

router.delete("/:galaxy/memory/:id", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = await authorizePartition(req, "memory", "write");
    const result = await storage.forgetMemory(owner.ownerUserId, galaxyId, req.params.id);
    if (!result) return res.status(404).json({ error: "Memory not found" });
    res.json({ id: req.params.id, lifecycleState: "forgotten", cascadeId: result.cascadeId, alreadyForgotten: result.alreadyForgotten });
  } catch (error) { next(error); }
});

router.get("/:galaxy/knowledge", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = await authorizePartition(req, "knowledge", "read");
    const includeReview = req.query.review === "true";
    const records = await storage.listKnowledge(owner.ownerUserId, galaxyId, includeReview);
    res.json({ galaxyId, records });
  } catch (error) { next(error); }
});

router.post("/:galaxy/knowledge", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = await authorizePartition(req, "knowledge", "write");
    const { objectType, canonicalName, summary, originClass = "UGC / Uploaded", sourceType = "direct text", sourceId, evidenceExcerpt, scope } = req.body || {};
    if (!knowledgeTypes.has(String(objectType)) || typeof canonicalName !== "string" || !canonicalName.trim()) return res.status(400).json({ error: "Valid objectType and canonicalName are required" });
    if (!originClasses.has(String(originClass))) return res.status(400).json({ error: "originClass must be UGC / Uploaded or Extracted / Compiled" });
    const result = await storage.createKnowledgeCandidate({
      ownerUserId: owner.ownerUserId,
      galaxyId,
      objectType,
      canonicalName: canonicalName.trim(),
      summary: typeof summary === "string" ? summary.trim() : undefined,
      originClass,
      sourceType: String(sourceType),
      sourceId: typeof sourceId === "string" ? sourceId : undefined,
      evidenceExcerpt: typeof evidenceExcerpt === "string" ? evidenceExcerpt : undefined,
      scope,
    });
    res.status(201).json(result);
  } catch (error) { next(error); }
});

router.get("/:galaxy/knowledge/topics", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = await authorizePartition(req, "knowledge", "read");
    res.json({ galaxyId, topics: await storage.listTopics(owner.ownerUserId, galaxyId) });
  } catch (error) { next(error); }
});

router.get("/:galaxy/knowledge/sources", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = await authorizePartition(req, "knowledge", "read");
    res.json({ galaxyId, sources: await storage.listSources(owner.ownerUserId, galaxyId) });
  } catch (error) { next(error); }
});

router.get("/:galaxy/knowledge/map", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = await authorizePartition(req, "knowledge", "read");
    const [objects, relationships] = await Promise.all([
      storage.listKnowledge(owner.ownerUserId, galaxyId, true),
      storage.listKnowledgeRelationships(owner.ownerUserId, galaxyId),
    ]);
    res.json({ galaxyId, objects, relationships });
  } catch (error) { next(error); }
});

router.get("/:galaxy/knowledge/lexicon", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = await authorizePartition(req, "knowledge", "read");
    res.json({ galaxyId, senses: await storage.listLexicon(owner.ownerUserId, galaxyId) });
  } catch (error) { next(error); }
});

router.get("/:galaxy/knowledge/curation", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = await authorizePartition(req, "knowledge", "read");
    const records = await storage.listKnowledge(owner.ownerUserId, galaxyId, true);
    const findings = records.filter((record) => ["candidate", "disputed"].includes(record.lifecycleState) || ["review_due", "potentially_outdated", "unknown"].includes(record.currency));
    res.json({ galaxyId, findings });
  } catch (error) { next(error); }
});

export default router;
