import express from "express";
import { storage } from "../storage-prisma.js";
import { ownerContextFromRequest } from "../zcos-core/OwnerContext.js";
import { requireOwner } from "../zcos-core/requireOwner.js";
import { normalizeGalaxyId, ZCOS_GALAXIES } from "../zcos-core/GalaxyRegistry.js";

const router = express.Router();

const domains = ["identity", "memory", "knowledge", "apps", "desk", "settings", "portal"] as const;
const memoryTypes = new Set(["experience", "decision", "person_relationship", "event", "user_directed"]);

function routeGalaxy(value: string | undefined) {
  return normalizeGalaxyId(value || "");
}

function ownerAndGalaxy(req: express.Request) {
  const owner = ownerContextFromRequest(req);
  const galaxyId = routeGalaxy(req.params.galaxy);
  if (!galaxyId) throw Object.assign(new Error("Unknown ZCOS galaxy"), { status: 400 });
  if (owner.originGalaxyId && owner.originGalaxyId !== galaxyId) {
    throw Object.assign(new Error("Galaxy partition mismatch"), { status: 403 });
  }
  return { owner, galaxyId };
}

router.get("/partitions", (_req, res) => {
  res.json({ galaxies: ZCOS_GALAXIES, domains });
});

router.get("/:galaxy/memory", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = ownerAndGalaxy(req);
    const records = await storage.listMemory(owner.ownerUserId, galaxyId);
    res.json({ galaxyId, records });
  } catch (error) { next(error); }
});

router.post("/:galaxy/memory", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = ownerAndGalaxy(req);
    const { memoryType, canonicalName, content } = req.body || {};
    if (!memoryTypes.has(String(memoryType)) || !canonicalName || !content) {
      return res.status(400).json({ error: "memoryType, canonicalName, and content are required" });
    }
    const record = await storage.createMemory({ ownerUserId: owner.ownerUserId, galaxyId, memoryType, canonicalName, content, lifecycleState: "confirmed" });
    await storage.recordAudit({ ownerUserId: owner.ownerUserId, galaxyId, eventType: "memory.created", targetType: "memory", targetId: record.id });
    res.status(201).json({ record });
  } catch (error) { next(error); }
});

router.get("/:galaxy/knowledge", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = ownerAndGalaxy(req);
    const records = await storage.listKnowledge(owner.ownerUserId, galaxyId);
    res.json({ galaxyId, records });
  } catch (error) { next(error); }
});

router.post("/:galaxy/knowledge", requireOwner, async (req, res, next) => {
  try {
    const { owner, galaxyId } = ownerAndGalaxy(req);
    const { objectType, canonicalName, summary, originClass = "UGC / Uploaded" } = req.body || {};
    if (!objectType || !canonicalName) return res.status(400).json({ error: "objectType and canonicalName are required" });
    const record = await storage.createKnowledge({ ownerUserId: owner.ownerUserId, galaxyId, objectType, canonicalName, summary, originClass, lifecycleState: "candidate" });
    await storage.recordAudit({ ownerUserId: owner.ownerUserId, galaxyId, eventType: "knowledge.created", targetType: "knowledge", targetId: record.id });
    res.status(201).json({ record });
  } catch (error) { next(error); }
});

export default router;
