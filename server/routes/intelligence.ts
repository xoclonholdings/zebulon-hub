import express from "express";
import { ownerContextFromRequest } from "../core/OwnerContext.js";
import { requireOwner } from "../core/requireOwner.js";
import { normalizeGalaxyId } from "../core/GalaxyRegistry.js";
import ZcosIntelligenceRuntime from "../intelligence/ZcosIntelligenceRuntime.js";
import type { ZcosContextItem } from "../intelligence/types.js";

const router = express.Router();

router.post("/analyze", requireOwner, (req, res, next) => {
  try {
    const owner = ownerContextFromRequest(req);
    const body = req.body || {};
    const requestedGalaxy = typeof body.galaxyId === "string" ? normalizeGalaxyId(body.galaxyId) : null;
    const galaxyId = owner.originGalaxyId || requestedGalaxy;
    if (!galaxyId) return res.status(400).json({ error: "Active galaxy is required through x-zcos-galaxy or galaxyId" });
    if (owner.originGalaxyId && requestedGalaxy && owner.originGalaxyId !== requestedGalaxy) {
      return res.status(403).json({ error: "Request galaxy does not match authenticated execution context" });
    }
    if (typeof body.message !== "string" || !body.message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

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

    res.json(result);
  } catch (error) {
    next(error);
  }
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
      "response-planning",
      "self-orchestration",
      "capability-routing",
      "evaluation",
      "outcome-verification",
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
      "present-through-zar",
    ],
  });
});

export default router;
