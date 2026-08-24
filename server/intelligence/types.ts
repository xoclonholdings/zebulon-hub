export type ZcosTaskType =
  | "question"
  | "research"
  | "analysis"
  | "planning"
  | "creation"
  | "execution"
  | "conversation";

export type ZcosComplexity = "simple" | "moderate" | "complex";
export type ZcosRisk = "low" | "moderate" | "high";
export type ZcosResponseForm = "direct" | "brief" | "structured" | "plan";

export interface ZcosContextItem {
  id: string;
  authority: "memory" | "knowledge" | "project" | "history" | "file" | "system";
  content: string;
  source?: string;
  confidence?: number;
  lifecycle?: string;
  currency?: string;
  galaxyId?: string;
  trust?: "canonical" | "authorized_projection" | "request";
}

export interface ZcosIntelligenceRequest {
  ownerUserId: string;
  galaxyId: string;
  message: string;
  projectId?: string;
  conversationId?: string;
  channel?: string;
  strategic?: boolean;
  hasFiles?: boolean;
  context?: ZcosContextItem[];
}

export interface ReasoningAssessment {
  taskType: ZcosTaskType;
  complexity: ZcosComplexity;
  confidence: number;
  materialUncertainty: boolean;
  needsExternalInformation: boolean;
  needsExecution: boolean;
  rationale: string[];
}

export interface CapabilityDecision {
  capability: string;
  owner: "zcos" | "zar" | "zync" | "zena" | "zeon" | "zylo" | "zwap" | "zenith" | "zillion";
  reason: string;
  required: boolean;
}

export interface ExecutionStep {
  id: string;
  action: string;
  capability: string;
  owner: CapabilityDecision["owner"];
  risk: ZcosRisk;
  approvalRequired: boolean;
  dependsOn: string[];
  expectedOutput: string;
}

export interface ZcosExecutionPlan {
  objective: string;
  responseForm: ZcosResponseForm;
  capabilities: CapabilityDecision[];
  steps: ExecutionStep[];
  externalInformationRequired: boolean;
  /** Planning never grants side-effect authority. Execution must obtain it separately. */
  sideEffectsAuthorized: boolean;
}

export interface EvaluationResult {
  score: number;
  passed: boolean;
  dimensions: {
    objectiveAlignment: number;
    grounding: number;
    authoritySafety: number;
    completeness: number;
    uncertaintyDiscipline: number;
  };
  issues: string[];
  recommendedAction: "accept" | "gather_evidence" | "revise" | "block";
}

export interface ZcosIntelligenceResult {
  requestId: string;
  reasoning: ReasoningAssessment;
  selectedContext: ZcosContextItem[];
  plan: ZcosExecutionPlan;
  evaluation: EvaluationResult;
  trace: {
    ownerUserId: string;
    galaxyId: string;
    contextIds: string[];
    generatedAt: string;
    migratedFrom: string[];
  };
}
