import { createHash } from "crypto";
import type {
  CapabilityDecision,
  EvaluationResult,
  ExecutionStep,
  ReasoningAssessment,
  ZcosContextItem,
  ZcosExecutionPlan,
  ZcosIntelligenceRequest,
  ZcosIntelligenceResult,
  ZcosResponseForm,
  ZcosTaskType,
} from "./types.js";

const EXECUTION_WORDS = /\b(send|publish|post|delete|remove|create|update|change|schedule|book|buy|sell|trade|deploy|commit|push|merge|run|execute|build|implement)\b/i;
const RESEARCH_WORDS = /\b(research|find|search|look up|verify|source|latest|current|compare|audit|investigate)\b/i;
const PLAN_WORDS = /\b(plan|strategy|roadmap|steps|approach|design|architect|organize)\b/i;
const CREATE_WORDS = /\b(write|draft|create|make|design|render|generate|compose)\b/i;
const ANALYSIS_WORDS = /\b(analy[sz]e|audit|compare|evaluate|assess|diagnose|review|critic)\b/i;
const HIGH_RISK_WORDS = /\b(delete|remove|buy|sell|trade|payment|transfer|deploy|merge|publish|send)\b/i;
const UNCERTAINTY_WORDS = /\b(maybe|possibly|probably|uncertain|unknown|not sure|might|could)\b/i;
const HISTORICAL_INTENT = /\b(history|historical|previous|formerly|prior|old version|at the time|as of|in 20\d{2}|before|superseded)\b/i;
const CONFLICT_INTENT = /\b(conflict|contradiction|dispute|disputed|compare claims|competing claims|why do sources differ)\b/i;

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function taskType(message: string): ZcosTaskType {
  if (RESEARCH_WORDS.test(message)) return "research";
  if (ANALYSIS_WORDS.test(message)) return "analysis";
  if (PLAN_WORDS.test(message)) return "planning";
  if (EXECUTION_WORDS.test(message)) return "execution";
  if (CREATE_WORDS.test(message)) return "creation";
  if (/\?$/.test(message.trim()) || /^(what|why|how|when|where|who|can|does|do|is|are)\b/i.test(message.trim())) return "question";
  return "conversation";
}

function assessReasoning(request: ZcosIntelligenceRequest): ReasoningAssessment {
  const message = request.message.trim();
  const type = taskType(message);
  const wordCount = message.split(/\s+/).filter(Boolean).length;
  const complexity = wordCount > 80 || /\b(system|architecture|migration|multi|cross-galaxy|runtime|production)\b/i.test(message)
    ? "complex"
    : wordCount > 25 || ["research", "analysis", "planning", "execution"].includes(type)
      ? "moderate"
      : "simple";
  const canonicalContext = (request.context || []).filter((item) => item.trust === "canonical" || item.trust === "authorized_projection");
  const grounded = canonicalContext.filter((item) => item.content.trim()).length;
  const needsExternalInformation = RESEARCH_WORDS.test(message) || /\b(latest|today|current|recent|web|internet|external)\b/i.test(message);
  const materialUncertainty = UNCERTAINTY_WORDS.test(message) || (needsExternalInformation && grounded === 0);
  const confidence = clamp(0.9 - (materialUncertainty ? 0.25 : 0) - (complexity === "complex" ? 0.08 : 0) + Math.min(0.08, grounded * 0.01));
  const rationale: string[] = [
    `classified:${type}`,
    `complexity:${complexity}`,
    needsExternalInformation ? "external-information-required" : "canonical-context-sufficient-unless-execution-reveals-gap",
  ];
  if (materialUncertainty) rationale.push("material-uncertainty-present");
  return {
    taskType: type,
    complexity,
    confidence,
    materialUncertainty,
    needsExternalInformation,
    needsExecution: type === "execution" || EXECUTION_WORDS.test(message),
    rationale,
  };
}

function contextEligible(item: ZcosContextItem, message: string): boolean {
  if (!item.content.trim()) return false;
  if (["memory", "knowledge", "system"].includes(item.authority) && !["canonical", "authorized_projection"].includes(item.trust || "")) return false;
  const lifecycle = item.lifecycle?.toLowerCase();
  if (["rejected", "forgotten", "superseded", "deprecated", "candidate", "proposed"].includes(lifecycle || "")) return false;
  if (lifecycle === "disputed" && !CONFLICT_INTENT.test(message)) return false;
  if (item.authority === "knowledge") {
    const currency = item.currency?.toLowerCase();
    if (currency === "historical" && !HISTORICAL_INTENT.test(message)) return false;
    if (["potentially_outdated", "review_due"].includes(currency || "") && !HISTORICAL_INTENT.test(message)) return false;
  }
  return true;
}

function lexicalScore(message: string, item: ZcosContextItem): number {
  const terms = new Set(message.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 3));
  const haystack = item.content.toLowerCase();
  let score = 0;
  for (const term of terms) if (haystack.includes(term)) score += 1;
  if (item.authority === "system") score += 0.5;
  if (item.trust === "canonical") score += 0.35;
  if ((item.confidence ?? 0.75) >= 0.9) score += 0.25;
  return score;
}

function selectContext(request: ZcosIntelligenceRequest): ZcosContextItem[] {
  return (request.context || [])
    .filter((item) => contextEligible(item, request.message))
    .filter((item) => {
      if (!item.galaxyId || item.galaxyId === request.galaxyId || item.authority === "system") return true;
      return item.trust === "authorized_projection";
    })
    .map((item) => ({ item, score: lexicalScore(request.message, item) }))
    .filter(({ score }) => score > 0 || (request.context?.length || 0) <= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ item }) => item);
}

function capabilityDecisions(request: ZcosIntelligenceRequest, reasoning: ReasoningAssessment): CapabilityDecision[] {
  const message = request.message;
  const decisions: CapabilityDecision[] = [];
  const add = (capability: string, owner: CapabilityDecision["owner"], reason: string, required = true) => {
    if (!decisions.some((decision) => decision.capability === capability)) decisions.push({ capability, owner, reason, required });
  };

  add("identity-and-authorization", "zcos", "Every governed request begins with authenticated ZCOS ownership.");
  add("context-assembly", "zcos", "ZCOS owns canonical context assembly across authorized Memory, Knowledge, Projects, History and Files.");
  add("reasoning-and-planning", "zcos", "ZCOS is the reasoning and planning authority.");
  if (reasoning.needsExternalInformation) add("external-source-aggregation", "zcos", "External information may be gathered but must return to ZCOS for provenance and validation.");
  if (/\b(code|build|implement|design|publish|render|website|app)\b/i.test(message)) add("build", "zync", "ZYNC owns coding, design and publish execution.");
  if (/\b(schedule|remind|trigger|workflow|loop|automation|automate)\b/i.test(message)) add("automation", "zylo", "ZYLO owns flows, schedules, triggers, skills and templates.");
  if (/\b(email|message|thread|room|team|call|communication)\b/i.test(message)) add("communication", "zeon", "ZEON owns human communication and collaboration surfaces.");
  if (/\b(log|diagnostic|monitor|security|permission|credential|integrity|audit)\b/i.test(message)) add("integrity", "zena", "ZENA owns integrity monitoring, permissions, credentials and security evidence.");
  if (/\b(trend|culture|discover|news|social|ugc)\b/i.test(message)) add("discovery", "zwap", "ZWAP supplies discovery, trend and culture signals.");
  if (/\b(file|library|study|learning|document|artifact)\b/i.test(message)) add("scholar", "zenith", "ZENITH owns intentional Scholar organization and file/library surfaces.");
  if (/\b(budget|trade|trading|invest|portfolio|capital|finance)\b/i.test(message)) add("capital", "zillion", "ZILLION owns Capital execution and analysis.");
  if (reasoning.needsExecution) add("execution-governance", "zcos", "Side effects require typed execution, authorization and reconciliation.");
  add("verification-and-evaluation", "zcos", "Results return through ZCOS verification before ZAR presents completion.");
  add("presentation-and-assignment", "zar", "ZAR owns the user-facing relationship, communication and work assignment.");
  return decisions;
}

function responseForm(reasoning: ReasoningAssessment): ZcosResponseForm {
  if (reasoning.taskType === "planning" || reasoning.taskType === "execution") return "plan";
  if (reasoning.complexity === "complex") return "structured";
  if (reasoning.complexity === "moderate") return "brief";
  return "direct";
}

function buildPlan(request: ZcosIntelligenceRequest, reasoning: ReasoningAssessment): ZcosExecutionPlan {
  const capabilities = capabilityDecisions(request, reasoning);
  const steps: ExecutionStep[] = [];
  let previous: string[] = [];
  for (const decision of capabilities.filter((decision) => decision.required)) {
    const id = `step_${steps.length + 1}`;
    const sideEffect = ["build", "automation", "communication", "capital", "execution-governance"].includes(decision.capability) && reasoning.needsExecution;
    const highRisk = sideEffect && HIGH_RISK_WORDS.test(request.message);
    steps.push({
      id,
      action: decision.reason,
      capability: decision.capability,
      owner: decision.owner,
      risk: highRisk ? "high" : sideEffect ? "moderate" : "low",
      approvalRequired: highRisk,
      dependsOn: previous,
      expectedOutput: decision.capability === "verification-and-evaluation" ? "Verified outcome with explicit status and evidence." : `Governed ${decision.capability} result.`,
    });
    previous = [id];
  }
  return {
    objective: request.message.trim(),
    responseForm: responseForm(reasoning),
    capabilities,
    steps,
    externalInformationRequired: reasoning.needsExternalInformation,
    sideEffectsAuthorized: false,
  };
}

function evaluate(request: ZcosIntelligenceRequest, reasoning: ReasoningAssessment, context: ZcosContextItem[], plan: ZcosExecutionPlan): EvaluationResult {
  const objectiveAlignment = request.message.trim() && plan.objective === request.message.trim() ? 1 : 0;
  const grounding = reasoning.needsExternalInformation ? (context.length > 0 ? 0.6 : 0.35) : 0.9;
  const authoritySafety = plan.steps.some((step) => step.capability === "identity-and-authorization")
    && plan.steps.some((step) => step.capability === "verification-and-evaluation")
    && plan.sideEffectsAuthorized === false ? 1 : 0.4;
  const completeness = plan.capabilities.length >= 4 ? 0.95 : 0.65;
  const uncertaintyDiscipline = reasoning.materialUncertainty && !reasoning.needsExternalInformation && context.length === 0 ? 0.55 : 0.95;
  const dimensions = { objectiveAlignment, grounding, authoritySafety, completeness, uncertaintyDiscipline };
  const score = Number((Object.values(dimensions).reduce((sum, value) => sum + value, 0) / 5).toFixed(3));
  const issues: string[] = [];
  if (reasoning.needsExternalInformation) issues.push("Fresh external evidence must be gathered and validated before factual completion.");
  if (authoritySafety < 0.8) issues.push("Authorization or verification gate is missing.");
  if (uncertaintyDiscipline < 0.8) issues.push("Material uncertainty requires additional evidence or one outcome-changing clarification.");
  const blocked = authoritySafety < 0.8;
  const needsEvidence = reasoning.needsExternalInformation;
  return {
    score,
    passed: !blocked && !needsEvidence && score >= 0.75,
    dimensions,
    issues,
    recommendedAction: blocked ? "block" : needsEvidence ? "gather_evidence" : score >= 0.85 ? "accept" : "revise",
  };
}

export class ZcosIntelligenceRuntime {
  static analyze(input: ZcosIntelligenceRequest): ZcosIntelligenceResult {
    if (!input.ownerUserId?.trim()) throw new Error("Authenticated ZCOS owner is required");
    if (!input.galaxyId?.trim()) throw new Error("Active galaxy is required");
    if (!input.message?.trim()) throw new Error("Request message is required");

    const requestId = `zreq_${createHash("sha256").update(`${input.ownerUserId}\0${input.galaxyId}\0${input.message}\0${Date.now()}`).digest("hex").slice(0, 20)}`;
    const reasoning = assessReasoning(input);
    const selectedContext = selectContext(input);
    const plan = buildPlan(input, reasoning);
    const evaluation = evaluate(input, reasoning, selectedContext, plan);

    return {
      requestId,
      reasoning,
      selectedContext,
      plan,
      evaluation,
      trace: {
        ownerUserId: input.ownerUserId,
        galaxyId: input.galaxyId,
        contextIds: selectedContext.map((item) => item.id),
        generatedAt: new Date().toISOString(),
        migratedFrom: [
          "ZedAI/server/services/intelligence-core/DeepThinkingEngine",
          "ZedAI/server/services/intelligence-core/ContextIntelligenceEngine",
          "ZedAI/server/services/intelligence-core/DocumentIntelligenceService",
          "ZedAI/server/services/intelligence-core/ResponseOrchestrationEngine",
          "ZedAI/server/services/intelligence-core/SelfOrchestrationEngine",
          "ZedAI/server/services/ZarStrategicReasoningEngine",
          "ZedAI/server/services/KnowledgeCurationEngine",
          "ZedAI/server/services/ZarReflectionEngine",
        ],
      },
    };
  }
}

export default ZcosIntelligenceRuntime;
