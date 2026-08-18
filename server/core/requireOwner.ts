import type { NextFunction, Request, Response } from "express";
import { OwnerContextError, ownerContextFromRequest } from "./OwnerContext.js";

export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  try {
    ownerContextFromRequest(req);
    next();
  } catch (error) {
    if (error instanceof OwnerContextError) {
      res.status(401).json({ error: error.message });
      return;
    }
    next(error);
  }
}
