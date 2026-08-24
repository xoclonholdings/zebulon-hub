import { prisma } from "../storage-prisma.js";

export class IntelligenceAuditStore {
  static findPlan(ownerUserId: string, galaxyId: string, requestId: string) {
    return prisma.auditEvent.findFirst({
      where: { ownerUserId, galaxyId, eventType: "intelligence.plan_created", targetType: "intelligence_request", targetId: requestId },
      orderBy: { createdAt: "desc" },
    });
  }

  static findValidatedEvidence(ownerUserId: string, galaxyId: string, requestId: string) {
    return prisma.auditEvent.findFirst({
      where: { ownerUserId, galaxyId, eventType: "intelligence.external_evidence_validated", targetType: "intelligence_request", targetId: requestId },
      orderBy: { createdAt: "desc" },
    });
  }

  static listOutcomeLearning(ownerUserId: string, galaxyId?: string, requestedTake = 100) {
    const numericTake = Number.isFinite(requestedTake) ? Math.trunc(requestedTake) : 100;
    const take = Math.min(Math.max(numericTake, 1), 500);
    return prisma.auditEvent.findMany({
      where: { ownerUserId, ...(galaxyId ? { galaxyId } : {}), eventType: "intelligence.outcome_observed" },
      orderBy: { createdAt: "desc" },
      take,
    });
  }
}

export default IntelligenceAuditStore;
