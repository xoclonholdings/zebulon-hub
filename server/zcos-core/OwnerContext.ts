import type { Request } from "express";

/**
 * Canonical authenticated owner context for ZCOS-protected operations.
 *
 * This intentionally does not invent fallback owners. Callers must resolve
 * an authenticated user before creating an OwnerContext.
 */
export interface OwnerContext {
  ownerUserId: string;
  originGalaxyId?: string;
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

  const originGalaxyHeader = req.header("x-zcos-galaxy")?.trim();

  return {
    ownerUserId: String(rawOwner),
    originGalaxyId: originGalaxyHeader || undefined,
    authMethod: "session",
  };
}
