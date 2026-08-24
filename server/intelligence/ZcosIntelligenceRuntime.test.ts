import { describe, expect, it } from "vitest";
import ZcosIntelligenceRuntime from "./ZcosIntelligenceRuntime.js";
import { ExternalSourceGateway } from "./ExternalSourceGateway.js";

describe("ZcosIntelligenceRuntime", () => {
  it("keeps reasoning authority in ZCOS and presentation in ZAR", () => {
    const result = ZcosIntelligenceRuntime.analyze({
      ownerUserId: "user_test",
      galaxyId: "zar",
      message: "Research the current evidence, compare it, then build the approved implementation.",
      context: [{ id: "k1", authority: "knowledge", content: "Current architecture evidence", lifecycle: "confirmed", currency: "current", galaxyId: "zar" }],
    });

    expect(result.plan.capabilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ capability: "reasoning-and-planning", owner: "zcos" }),
      expect.objectContaining({ capability: "build", owner: "zync" }),
      expect.objectContaining({ capability: "presentation-and-assignment", owner: "zar" }),
    ]));
    expect(result.trace.migratedFrom.length).toBeGreaterThanOrEqual(5);
  });

  it("filters lifecycle-ineligible context", () => {
    const result = ZcosIntelligenceRuntime.analyze({
      ownerUserId: "user_test",
      galaxyId: "zar",
      message: "Compare memory architecture",
      context: [
        { id: "active", authority: "knowledge", content: "memory architecture current", lifecycle: "confirmed", currency: "current", galaxyId: "zar" },
        { id: "old", authority: "knowledge", content: "memory architecture old", lifecycle: "superseded", currency: "current", galaxyId: "zar" },
      ],
    });
    expect(result.selectedContext.map((item) => item.id)).toEqual(["active"]);
  });

  it("requires authenticated ownership", () => {
    expect(() => ZcosIntelligenceRuntime.analyze({ ownerUserId: "", galaxyId: "zar", message: "hello" })).toThrow(/owner/i);
  });

  it("requires evaluation before presentation", () => {
    const result = ZcosIntelligenceRuntime.analyze({ ownerUserId: "user_test", galaxyId: "zar", message: "Plan a system migration" });
    const evaluationIndex = result.plan.steps.findIndex((step) => step.capability === "verification-and-evaluation");
    const presentationIndex = result.plan.steps.findIndex((step) => step.capability === "presentation-and-assignment");
    expect(evaluationIndex).toBeGreaterThan(-1);
    expect(presentationIndex).toBeGreaterThan(evaluationIndex);
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
      galaxyId: "zar",
    });
    expect(result.evidence[0].provenance.adapterId).toBe("test-provider");
  });
});
