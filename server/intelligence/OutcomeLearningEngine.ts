import { createHash } from "crypto";
import type { EvaluationResult, ZcosExecutionPlan } from "./types.js";

export type LearningProposalKind = "reasoning_adjustment" | "routing_adjustment" | "knowledge_review" | "memory_candidate" | "workflow_improvement";

export interface OutcomeObservation {
  requestId: string;
  ownerUserId: string;
  galaxyId: string;
  objective: string;
  outcomeStatus: "completed" | "partial" | "failed" | "blocked" | "unknown";
  evidence: string[];
  evaluation: EvaluationResult;
  plan: ZcosExecutionPlan;
}

export interface LearningProposal {
  id: string;
  kind: LearningProposalKind;
  status: "proposed";
  reason: string;
  evidence: string[];
  sourceRequestId: string;
  createdAt: string;
}

/**
 * Converts observed outcomes into reviewable learning proposals.
 * It never writes directly to Memory or Knowledge and never silently changes
 * policy. Canonical authorities must separately confirm/promote proposals.
 */
export class OutcomeLearningEngine {
  static observe(observation: OutcomeObservation): LearningProposal[] {
    const proposals: LearningProposal[] = [];
    const add = (kind: LearningProposalKind, reason: string) => {
      const fingerprint = `${observation.requestId}\0${kind}\0${reason}`;
      proposals.push({
        id: `learn_${createHash("sha256").update(fingerprint).digest("hex").slice(0, 20)}`,
        kind,
        status: "proposed",
        reason,
        evidence: [...observation.evidence],
        sourceRequestId: observation.requestId,
        createdAt: new Date().toISOString(),
      });
    };

    if (observation.outcomeStatus === "failed" || observation.outcomeStatus === "partial") {
      add("workflow_improvement", `Execution ended ${observation.outcomeStatus}; inspect failed or partial steps before reuse.`);
    }
    if (observation.evaluation.dimensions.grounding < 0.7) {
      add("knowledge_review", "Grounding quality was insufficient; review source coverage, freshness, and retrieval relevance.");
    }
    if (observation.evaluation.dimensions.objectiveAlignment < 0.8) {
      add("reasoning_adjustment", "Outcome drifted from the stated objective; review decomposition and objective preservation.");
    }
    if (observation.evaluation.dimensions.authoritySafety < 0.9) {
      add("routing_adjustment", "Authority or verification coverage was weak; strengthen capability routing and approval gates.");
    }
    return proposals;
  }
}

export default OutcomeLearningEngine;
