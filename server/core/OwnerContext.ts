import type { Request } from "express";
import { normalizeGalaxyId, type GalaxyId } from "./GalaxyRegistry.js";

/**
 * Canonical authenticated owner context for ZCOS-protected operations.
 *
 * This intentionally does not invent fallback owners. Callers must resolve
 * an authenticated user before creating an OwnerContext.
 */
export interface OwnerContext {
  ownerUserId: string;
  originGalaxyId?: GalaxyId;
  authMethod: "session" | "privy" | "channel" | "system";
}

export class OwnerContextError extends Error {
  readonly statusCode = 401;

  constructor(message = "Authenticated ZCOS owner is required") {
    super(message);
    this.name = "OwnerContextError";
  }
}

export function ownerContextFromRequest(req: Request): OwnerContext {
  const session = (req as Request & {
    session?: { userId?: number | string; user?: { id?: number | string } };
  }).session;

  const rawOwner = session?.userId ?? session?.user?.id;
  if (rawOwner === undefined || rawOwner === null || String(rawOwner).trim() === "") {
    throw new OwnerContextError();
  }

  const rawGalaxy = req.header("x-zcos-galaxy")?.trim();
  const originGalaxyId = rawGalaxy ? normalizeGalaxyId(rawGalaxy) : null;
  if (rawGalaxy && !originGalaxyId) {
    throw new OwnerContextError("Unknown ZCOS galaxy context");
  }

  return {
    ownerUserId: String(rawOwner),
    originGalaxyId: originGalaxyId || undefined,
    authMethod: "session",
  };
}
