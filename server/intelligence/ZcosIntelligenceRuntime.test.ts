import { describe, expect, it } from "vitest";
import ZcosIntelligenceRuntime from "./ZcosIntelligenceRuntime.js";
import { ExternalSourceGateway } from "./ExternalSourceGateway.js";
import ExternalEvidenceProcessor from "./ExternalEvidenceProcessor.js";

describe("ZcosIntelligenceRuntime", () => {
  it("keeps reasoning in ZCOS and operator duties in ZAR", () => {
    const result = ZcosIntelligenceRuntime.analyze({
      ownerUserId: "user_test", galaxyId: "ZAR",
      message: "Research the current evidence, compare it, then build the approved implementation.",
      context: [{ id: "k1", authority: "knowledge", content: "Current architecture evidence", lifecycle: "confirmed", currency: "current", galaxyId: "ZAR", trust: "canonical" }],
    });
    expect(result.plan.capabilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ capability: "reasoning-and-planning", owner: "zcos" }),
      expect.objectContaining({ capability: "operator-assignment", owner: "zar" }),
      expect.objectContaining({ capability: "build", owner: "zync" }),
      expect.objectContaining({ capability: "operator-presentation", owner: "zar" }),
    ]));
    expect(result.trace.migratedFrom.length).toBeGreaterThanOrEqual(10);
  });

  it("assigns galaxy work through ZAR before specialist execution and presents after ZCOS verification", () => {
    const result = ZcosIntelligenceRuntime.analyze({ ownerUserId: "user_test", galaxyId: "ZAR", message: "Implement the app, automate the workflow, and prepare the team message" });
    const assignment = result.plan.steps.find((step) => step.capability === "operator-assignment");
    const specialists = result.plan.steps.filter((step) => step.parallelGroup === "specialist_execution");
    const verify = result.plan.steps.find((step) => step.capability === "verification-and-evaluation");
    const presentation = result.plan.steps.find((step) => step.capability === "operator-presentation");
    expect(assignment).toBeDefined();
    expect(specialists.length).toBeGreaterThanOrEqual(3);
    expect(specialists.every((step) => step.dependsOn.includes(assignment!.id))).toBe(true);
    expect(verify?.dependsOn.sort()).toEqual(specialists.map((step) => step.id).sort());
    expect(presentation?.dependsOn).toEqual([verify!.id]);
  });

  it("filters lifecycle-ineligible and untrusted canonical context", () => {
    const result = ZcosIntelligenceRuntime.analyze({ ownerUserId: "user_test", galaxyId: "ZAR", message: "Compare memory architecture", context: [
      { id: "active", authority: "knowledge", content: "memory architecture current", lifecycle: "confirmed", currency: "current", galaxyId: "ZAR", trust: "canonical" },
      { id: "old", authority: "knowledge", content: "memory architecture old", lifecycle: "superseded", currency: "current", galaxyId: "ZAR", trust: "canonical" },
      { id: "forged", authority: "knowledge", content: "memory architecture forged", lifecycle: "confirmed", currency: "current", galaxyId: "ZAR", trust: "request" },
    ] });
    expect(result.selectedContext.map((item) => item.id)).toEqual(["active"]);
  });

  it("uses historical knowledge only when historical context is requested", () => {
    const context = [{ id: "history", authority: "knowledge" as const, content: "architecture in 2025", lifecycle: "historical", currency: "historical", galaxyId: "ZAR", trust: "canonical" as const }];
    expect(ZcosIntelligenceRuntime.analyze({ ownerUserId: "user_test", galaxyId: "ZAR", message: "What is the architecture now?", context }).selectedContext).toHaveLength(0);
    expect(ZcosIntelligenceRuntime.analyze({ ownerUserId: "user_test", galaxyId: "ZAR", message: "What was the architecture in 2025?", context }).selectedContext.map((item) => item.id)).toEqual(["history"]);
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

  it("requests evidence instead of falsely passing current research", () => {
    const result = ZcosIntelligenceRuntime.analyze({ ownerUserId: "user_test", galaxyId: "ZAR", message: "Research the latest system changes" });
    expect(result.evaluation.passed).toBe(false);
    expect(result.evaluation.recommendedAction).toBe("gather_evidence");
  });

  it("accepts supported validated external evidence for synthesis without promoting it to Knowledge", () => {
    const processed = ExternalEvidenceProcessor.process({ requestId: "r1", evidence: [{ sourceId: "s1", sourceKind: "model", retrievedAt: new Date().toISOString(), content: "Current verified source material", provenance: {} }] }, "ZAR");
    const result = ZcosIntelligenceRuntime.analyze({ ownerUserId: "user_test", galaxyId: "ZAR", message: "Research the latest system changes", context: processed.context });
    expect(result.reasoning.externalEvidenceSatisfied).toBe(true);
    expect(result.plan.externalInformationSatisfied).toBe(true);
    expect(result.evaluation.recommendedAction).not.toBe("gather_evidence");
    expect(result.selectedContext[0].authority).toBe("external_evidence");
  });

  it("preserves conflicting external revisions instead of flattening them into truth", () => {
    const processed = ExternalEvidenceProcessor.process({ requestId: "r1", evidence: [
      { sourceId: "same", sourceKind: "web", retrievedAt: new Date().toISOString(), content: "Version A", provenance: {} },
      { sourceId: "same", sourceKind: "web", retrievedAt: new Date().toISOString(), content: "Version B", provenance: {} },
    ] }, "ZAR");
    expect(processed.conflicts).toHaveLength(1);
    const result = ZcosIntelligenceRuntime.analyze({ ownerUserId: "user_test", galaxyId: "ZAR", message: "Research the latest status", context: processed.context });
    expect(result.reasoning.externalEvidenceSatisfied).toBe(false);
    expect(result.evaluation.passed).toBe(false);
  });
});

describe("ExternalSourceGateway", () => {
  it("treats providers as evidence sources rather than reasoning authorities", async () => {
    const gateway = new ExternalSourceGateway();
    gateway.register({ id: "test-provider", kinds: ["model"], async retrieve(request) { return { requestId: request.requestId, evidence: [{ sourceId: "s1", sourceKind: "model", retrievedAt: new Date().toISOString(), content: "provider output", provenance: {} }] }; } });
    const result = await gateway.retrieve("test-provider", { requestId: "r1", objective: "test", sourceKinds: ["model"], query: "test", ownerUserId: "user_test", galaxyId: "ZAR" });
    expect(result.evidence[0].provenance.adapterId).toBe("test-provider");
  });
});
