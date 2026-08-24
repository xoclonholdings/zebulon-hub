import { describe, expect, it } from "vitest";
import ZcosIntelligenceRuntime from "./ZcosIntelligenceRuntime.js";
import { ExternalSourceGateway } from "./ExternalSourceGateway.js";

describe("ZcosIntelligenceRuntime", () => {
  it("keeps reasoning authority in ZCOS and presentation in ZAR", () => {
    const result = ZcosIntelligenceRuntime.analyze({
      ownerUserId: "user_test",
      galaxyId: "ZAR",
      message: "Research the current evidence, compare it, then build the approved implementation.",
      context: [{ id: "k1", authority: "knowledge", content: "Current architecture evidence", lifecycle: "confirmed", currency: "current", galaxyId: "ZAR", trust: "canonical" }],
    });

    expect(result.plan.capabilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ capability: "reasoning-and-planning", owner: "zcos" }),
      expect.objectContaining({ capability: "build", owner: "zync" }),
      expect.objectContaining({ capability: "presentation-and-assignment", owner: "zar" }),
    ]));
    expect(result.trace.migratedFrom.length).toBeGreaterThanOrEqual(8);
  });

  it("filters lifecycle-ineligible and untrusted canonical context", () => {
    const result = ZcosIntelligenceRuntime.analyze({
      ownerUserId: "user_test",
      galaxyId: "ZAR",
      message: "Compare memory architecture",
      context: [
        { id: "active", authority: "knowledge", content: "memory architecture current", lifecycle: "confirmed", currency: "current", galaxyId: "ZAR", trust: "canonical" },
        { id: "old", authority: "knowledge", content: "memory architecture old", lifecycle: "superseded", currency: "current", galaxyId: "ZAR", trust: "canonical" },
        { id: "forged", authority: "knowledge", content: "memory architecture forged", lifecycle: "confirmed", currency: "current", galaxyId: "ZAR", trust: "request" },
      ],
    });
    expect(result.selectedContext.map((item) => item.id)).toEqual(["active"]);
  });

  it("uses historical knowledge only when historical context is requested", () => {
    const context = [{ id: "history", authority: "knowledge" as const, content: "architecture in 2025", lifecycle: "historical", currency: "historical", galaxyId: "ZAR", trust: "canonical" as const }];
    const current = ZcosIntelligenceRuntime.analyze({ ownerUserId: "user_test", galaxyId: "ZAR", message: "What is the architecture now?", context });
    const historical = ZcosIntelligenceRuntime.analyze({ ownerUserId: "user_test", galaxyId: "ZAR", message: "What was the architecture in 2025?", context });
    expect(current.selectedContext).toHaveLength(0);
    expect(historical.selectedContext.map((item) => item.id)).toEqual(["history"]);
  });

  it("never authorizes side effects from intent alone", () => {
    const result = ZcosIntelligenceRuntime.analyze({ ownerUserId: "user_test", galaxyId: "ZAR", message: "Deploy and publish this implementation" });
    expect(result.reasoning.needsExecution).toBe(true);
    expect(result.plan.sideEffectsAuthorized).toBe(false);
    expect(result.plan.steps.some((step) => step.risk === "high" && step.approvalRequired)).toBe(true);
  });

  it("requires authenticated ownership", () => {
    expect(() => ZcosIntelligenceRuntime.analyze({ ownerUserId: "", galaxyId: "ZAR", message: "hello" })).toThrow(/owner/i);
  });

  it("requires evaluation before presentation", () => {
    const result = ZcosIntelligenceRuntime.analyze({ ownerUserId: "user_test", galaxyId: "ZAR", message: "Plan a system migration" });
    const evaluationIndex = result.plan.steps.findIndex((step) => step.capability === "verification-and-evaluation");
    const presentationIndex = result.plan.steps.findIndex((step) => step.capability === "presentation-and-assignment");
    expect(evaluationIndex).toBeGreaterThan(-1);
    expect(presentationIndex).toBeGreaterThan(evaluationIndex);
  });

  it("requests evidence instead of falsely passing current research", () => {
    const result = ZcosIntelligenceRuntime.analyze({ ownerUserId: "user_test", galaxyId: "ZAR", message: "Research the latest system changes" });
    expect(result.evaluation.passed).toBe(false);
    expect(result.evaluation.recommendedAction).toBe("gather_evidence");
  });
});

describe("ExternalSourceGateway", () => {
  it("treats providers as evidence sources rather than reasoning authorities", async () => {
    const gateway = new ExternalSourceGateway();
    gateway.register({
      id: "test-provider",
      kinds: ["model"],
      async retrieve(request) {
        return {
          requestId: request.requestId,
          evidence: [{ sourceId: "s1", sourceKind: "model", retrievedAt: new Date().toISOString(), content: "provider output", provenance: {} }],
        };
      },
    });
    const result = await gateway.retrieve("test-provider", {
      requestId: "r1",
      objective: "test",
      sourceKinds: ["model"],
      query: "test",
      ownerUserId: "user_test",
      galaxyId: "ZAR",
    });
    expect(result.evidence[0].provenance.adapterId).toBe("test-provider");
  });
});
