import { randomUUID } from "crypto";
import type {
  ZcosCapabilityDefinition,
  ZcosCapabilityGap,
  ZcosCapabilityInvocation,
  ZcosPermission,
} from "../../../shared/zcos-intelligence.js";
import { zyloArtifactResolver, type ZyloArtifactResolver } from "./ZyloArtifactResolver.js";

export interface CapabilityResolutionContext {
  permissions: Set<ZcosPermission>;
  configuredIntegrations: Set<string>;
  approvedCapabilityIds?: Set<string>;
}

export interface CapabilityResolution {
  invocations: ZcosCapabilityInvocation[];
  gaps: ZcosCapabilityGap[];
  parallelGroups: string[][];
  sequentialOrder: string[];
}

export class ZcosCapabilityRegistry {
  private readonly definitions = new Map<string, ZcosCapabilityDefinition>();

  constructor(definitions: ZcosCapabilityDefinition[] = [], private readonly artifacts: ZyloArtifactResolver = zyloArtifactResolver) {
    for (const definition of definitions) this.register(definition);
  }

  register(definition: ZcosCapabilityDefinition): void {
    if (!definition.id?.trim() || !definition.operations.length) throw new Error("Capability id and operation are required");
    if (!/^\d+\.\d+\.\d+$/.test(definition.version)) throw new Error(`Capability version must be exact semver: ${definition.id}@${definition.version}`);
    if (definition.dependencies.includes(definition.id)) throw new Error(`Capability cannot depend on itself: ${definition.id}`);
    if (this.definitions.has(definition.id)) throw new Error(`Capability already registered: ${definition.id}`);
    this.definitions.set(definition.id, Object.freeze({
      ...definition,
      operations: Object.freeze([...definition.operations]) as unknown as string[],
      permissions: Object.freeze([...definition.permissions]) as unknown as ZcosPermission[],
      requiredIntegrations: Object.freeze([...definition.requiredIntegrations]) as unknown as string[],
      dependencies: Object.freeze([...definition.dependencies]) as unknown as string[],
      artifacts: Object.freeze(definition.artifacts.map((artifact) => Object.freeze({ ...artifact }))) as unknown as ZcosCapabilityDefinition["artifacts"],
    }));
  }

  get(id: string): ZcosCapabilityDefinition | null { return this.definitions.get(id) || null; }
  list(): ZcosCapabilityDefinition[] { return [...this.definitions.values()]; }

  resolve(capabilityIds: string[], context: CapabilityResolutionContext): CapabilityResolution {
    const requested = [...new Set(capabilityIds)];
    const expanded = new Set<string>();
    const expand = (id: string, stack = new Set<string>()) => {
      if (expanded.has(id)) return;
      if (stack.has(id)) return;
      stack.add(id);
      const definition = this.get(id);
      for (const dependency of definition?.dependencies || []) expand(dependency, new Set(stack));
      expanded.add(id);
    };
    for (const id of requested) expand(id);

    const invocations: ZcosCapabilityInvocation[] = [];
    const gaps: ZcosCapabilityGap[] = [];
    const invocationByCapability = new Map<string, ZcosCapabilityInvocation>();

    for (const capabilityId of expanded) {
      const definition = this.get(capabilityId);
      if (!definition) {
        gaps.push(this.gap(capabilityId, "not_registered", [], "Capability is not registered in ZCOS."));
        continue;
      }
      if (["blocked", "planned", "retired"].includes(definition.certificationState)) {
        gaps.push(this.gap(capabilityId, "not_certified", [], `Capability state is ${definition.certificationState}.`));
        continue;
      }
      const missingPermissions = definition.permissions.filter((permission) => !context.permissions.has(permission));
      if (missingPermissions.length) {
        gaps.push(this.gap(capabilityId, "permission_missing", [], `Missing permission: ${missingPermissions.join(", ")}.`));
        continue;
      }
      const missingIntegrations = definition.requiredIntegrations.filter((integration) => !context.configuredIntegrations.has(integration));
      if (missingIntegrations.length) {
        gaps.push(this.gap(capabilityId, "integration_missing", missingIntegrations, "Required integration is not connected."));
        continue;
      }
      const unresolvedArtifact = definition.artifacts.find((artifact) => !this.artifacts.resolve(artifact));
      if (unresolvedArtifact) {
        gaps.push(this.gap(capabilityId, "artifact_unresolved", [], `ZYLO could not resolve ${unresolvedArtifact.id}@${unresolvedArtifact.version}.`));
        continue;
      }
      const approvalRequired = definition.approvalRequired && !context.approvedCapabilityIds?.has(definition.id);
      const invocation: ZcosCapabilityInvocation = {
        invocationId: randomUUID(), capabilityId: definition.id, ownerGalaxy: definition.ownerGalaxy,
        operation: definition.operations[0] || "execute", dependencyIds: [...definition.dependencies],
        approvalRequired, sideEffect: definition.sideEffect, artifacts: definition.artifacts.map((artifact) => ({ ...artifact })),
        status: approvalRequired ? "blocked" : "planned",
      };
      invocations.push(invocation);
      invocationByCapability.set(definition.id, invocation);
    }

    const runnable = invocations.filter((invocation) => invocation.status === "planned");
    for (const invocation of runnable) {
      for (const dependencyId of invocation.dependencyIds) {
        if (!invocationByCapability.has(dependencyId)) {
          invocation.status = "blocked";
          gaps.push(this.gap(invocation.capabilityId, "dependency_unresolved", [], `Dependency ${dependencyId} was not resolved.`));
        }
      }
    }

    const parallelGroups: string[][] = [];
    const sequentialOrder: string[] = [];
    const pending = new Map(runnable.filter((invocation) => invocation.status === "planned").map((invocation) => [invocation.capabilityId, invocation]));
    const completed = new Set<string>();
    while (pending.size) {
      const ready = [...pending.values()].filter((invocation) => invocation.dependencyIds.every((dependency) => completed.has(dependency)));
      if (!ready.length) {
        for (const invocation of pending.values()) {
          invocation.status = "blocked";
          gaps.push(this.gap(invocation.capabilityId, "dependency_unresolved", [], "Capability dependency cycle or blocked dependency detected."));
        }
        break;
      }
      const parallelReady = ready.filter((invocation) => {
        const definition = this.get(invocation.capabilityId);
        return definition?.parallelSafe && definition.sideEffect === "none";
      });
      if (parallelReady.length > 1) parallelGroups.push(parallelReady.map((invocation) => invocation.invocationId));
      for (const invocation of ready) {
        sequentialOrder.push(invocation.invocationId);
        completed.add(invocation.capabilityId);
        pending.delete(invocation.capabilityId);
      }
    }
    return { invocations, gaps, parallelGroups, sequentialOrder };
  }

  private gap(capabilityId: string, reason: ZcosCapabilityGap["reason"], missingIntegrations: string[], message: string): ZcosCapabilityGap {
    return { capabilityId, reason, missingIntegrations, settingsPath: "/settings/integrations", message };
  }
}

const reasoningArtifact = { kind: "skill", id: "reasoning.plan", version: "1.0.0", ownerGalaxy: "ZYLO" } as const;
const specialistArtifact = { kind: "workflow", id: "galaxy.specialist-assignment", version: "1.0.0", ownerGalaxy: "ZYLO" } as const;

const specialist = (id: string, label: string, ownerGalaxy: ZcosCapabilityDefinition["ownerGalaxy"], integration: string[] = []): ZcosCapabilityDefinition => ({
  id, label, ownerGalaxy, operations: ["delegate"], permissions: ["action:prepare"], requiredIntegrations: integration,
  certificationState: "provisional", sideEffect: "none", approvalRequired: false, parallelSafe: true,
  dependencies: ["zar.operator.assign"], artifacts: [specialistArtifact], version: "1.0.0",
});

export const zcosCapabilityRegistry = new ZcosCapabilityRegistry([
  { id: "zcos.context.internal", label: "Internal context assembly", ownerGalaxy: "ZCOS", operations: ["retrieve_and_assemble"], permissions: [], requiredIntegrations: [], certificationState: "certified", sideEffect: "none", approvalRequired: false, parallelSafe: false, dependencies: [], artifacts: [], version: "1.0.0" },
  { id: "zcos.reasoning.plan", label: "ZCOS reasoning and planning", ownerGalaxy: "ZCOS", operations: ["reason_and_plan"], permissions: [], requiredIntegrations: [], certificationState: "certified", sideEffect: "none", approvalRequired: false, parallelSafe: false, dependencies: ["zcos.context.internal"], artifacts: [reasoningArtifact], version: "1.0.0" },
  { id: "zcos.external.model_evidence", label: "Provider-neutral model evidence", ownerGalaxy: "ZCOS", operations: ["retrieve"], permissions: ["external:read", "model:invoke"], requiredIntegrations: ["model_provider"], certificationState: "provisional", sideEffect: "none", approvalRequired: false, parallelSafe: true, dependencies: ["zcos.reasoning.plan"], artifacts: [{ kind: "workflow", id: "research.governed-retrieval", version: "1.0.0", ownerGalaxy: "ZYLO" }], version: "1.0.0" },
  { id: "zcos.external.web_evidence", label: "Current-source web evidence", ownerGalaxy: "ZCOS", operations: ["search"], permissions: ["external:read"], requiredIntegrations: ["web_search"], certificationState: "provisional", sideEffect: "none", approvalRequired: false, parallelSafe: true, dependencies: ["zcos.reasoning.plan"], artifacts: [{ kind: "workflow", id: "research.governed-retrieval", version: "1.0.0", ownerGalaxy: "ZYLO" }], version: "1.0.0" },
  { id: "zar.operator.assign", label: "ZAR governed assignment", ownerGalaxy: "ZAR", operations: ["assign"], permissions: ["action:prepare"], requiredIntegrations: [], certificationState: "certified", sideEffect: "none", approvalRequired: false, parallelSafe: false, dependencies: ["zcos.reasoning.plan"], artifacts: [specialistArtifact], version: "1.0.0" },
  specialist("zync.build.delegate", "ZYNC Build delegation", "ZYNC"),
  specialist("zena.integrity.delegate", "ZENA Integrity delegation", "ZENA"),
  specialist("zeon.unite.delegate", "ZEON Unite delegation", "ZEON"),
  specialist("zylo.automate.delegate", "ZYLO Automate delegation", "ZYLO"),
  specialist("zwap.discovery.delegate", "ZWAP Discovery delegation", "ZWAP!"),
  specialist("zenith.scholar.delegate", "ZENITH Scholar delegation", "ZENITH"),
  specialist("zillion.capital.delegate", "ZILLION Capital delegation", "ZILLION", ["zillion_capital"]),
  { id: "zar.external.action", label: "Consequential external action", ownerGalaxy: "ZAR", operations: ["execute"], permissions: ["action:execute"], requiredIntegrations: [], certificationState: "provisional", sideEffect: "external_write", approvalRequired: true, parallelSafe: false, dependencies: ["zar.operator.assign"], artifacts: [{ kind: "workflow", id: "tasks.approval-gated-execution", version: "1.0.0", ownerGalaxy: "ZYLO" }], version: "1.0.0" },
  { id: "zcos.verify", label: "ZCOS verification", ownerGalaxy: "ZCOS", operations: ["verify"], permissions: [], requiredIntegrations: [], certificationState: "certified", sideEffect: "none", approvalRequired: false, parallelSafe: false, dependencies: ["zcos.reasoning.plan"], artifacts: [], version: "1.0.0" },
  { id: "zar.operator.present", label: "ZAR final presentation", ownerGalaxy: "ZAR", operations: ["present"], permissions: [], requiredIntegrations: [], certificationState: "certified", sideEffect: "none", approvalRequired: false, parallelSafe: false, dependencies: ["zcos.verify"], artifacts: [], version: "1.0.0" },
]);
