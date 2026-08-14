import express from "express";
import { storage } from "../storage-prisma.js";
import { ownerContextFromRequest } from "../zcos-core/OwnerContext.js";
import { requireOwner } from "../zcos-core/requireOwner.js";
import { normalizeGalaxyId } from "../zcos-core/GalaxyRegistry.js";

const router = express.Router();
const authorityKinds = new Set(["memory", "knowledge"]);
const allowedPermissions = new Set(["read", "write", "contribute", "admin"]);

function parseExpiry(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw Object.assign(new Error("expiresAt must be an ISO date string"), { status: 400 });
  const expiresAt = new Date(value);
  if (Number.isNaN(expiresAt.getTime())) throw Object.assign(new Error("expiresAt is invalid"), { status: 400 });
  if (expiresAt.getTime() <= Date.now()) throw Object.assign(new Error("expiresAt must be in the future"), { status: 400 });
  return expiresAt;
}

router.get("/grants", requireOwner, async (req, res, next) => {
  try {
    const owner = ownerContextFromRequest(req);
    const grants = await storage.listPartitionGrants(owner.ownerUserId);
    res.json({ grants });
  } catch (error) { next(error); }
});

router.post("/grants", requireOwner, async (req, res, next) => {
  try {
    const owner = ownerContextFromRequest(req);
    const sourceGalaxyId = normalizeGalaxyId(req.body?.sourceGalaxyId);
    const targetGalaxyId = normalizeGalaxyId(req.body?.targetGalaxyId);
    const authorityKind = String(req.body?.authorityKind || "");
    const permissions = Array.isArray(req.body?.permissions) ? Array.from(new Set(req.body.permissions.map(String))) : [];

    if (!sourceGalaxyId || !targetGalaxyId) return res.status(400).json({ error: "Valid sourceGalaxyId and targetGalaxyId are required" });
    if (sourceGalaxyId === targetGalaxyId) return res.status(400).json({ error: "Cross-galaxy grant requires two different galaxies" });
    if (!authorityKinds.has(authorityKind)) return res.status(400).json({ error: "authorityKind must be memory or knowledge" });
    if (permissions.length === 0 || permissions.some((permission) => !allowedPermissions.has(permission))) {
      return res.status(400).json({ error: "permissions must contain read, write, contribute, or admin" });
    }

    const grant = await storage.createPartitionGrant({
      ownerUserId: owner.ownerUserId,
      sourceGalaxyId,
      targetGalaxyId,
      authorityKind,
      permissions,
      expiresAt: parseExpiry(req.body?.expiresAt),
    });

    await storage.recordAudit({
      ownerUserId: owner.ownerUserId,
      eventType: "partition.grant_created",
      targetType: authorityKind,
      targetId: grant.id,
      details: { sourceGalaxyId, targetGalaxyId, permissions, expiresAt: grant.expiresAt?.toISOString() || null },
    });

    res.status(201).json({ grant });
  } catch (error) { next(error); }
});

router.delete("/grants/:id", requireOwner, async (req, res, next) => {
  try {
    const owner = ownerContextFromRequest(req);
    const grant = await storage.revokePartitionGrant(owner.ownerUserId, req.params.id);
    if (!grant) return res.status(404).json({ error: "Grant not found" });
    await storage.recordAudit({
      ownerUserId: owner.ownerUserId,
      eventType: "partition.grant_revoked",
      targetType: grant.authorityKind,
      targetId: grant.id,
      details: { sourceGalaxyId: grant.sourceGalaxyId, targetGalaxyId: grant.targetGalaxyId },
    });
    res.json({ grant });
  } catch (error) { next(error); }
});

router.get("/audit", requireOwner, async (req, res, next) => {
  try {
    const owner = ownerContextFromRequest(req);
    const requestedLimit = Number(req.query.limit || 100);
    const events = await storage.listAudit(owner.ownerUserId, Number.isFinite(requestedLimit) ? requestedLimit : 100);
    res.json({ events });
  } catch (error) { next(error); }
});

export default router;
