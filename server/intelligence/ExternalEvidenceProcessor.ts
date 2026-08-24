import { createHash } from "crypto";
import type { ExternalSourceEvidence, ExternalSourceResult } from "./ExternalSourceGateway.js";
import type { ZcosContextItem } from "./types.js";

export interface ProcessedExternalEvidence {
  evidence: ExternalSourceEvidence[];
  context: ZcosContextItem[];
  issues: string[];
  duplicatesRemoved: number;
}

export class ExternalEvidenceProcessor {
  static process(result: ExternalSourceResult, galaxyId: string): ProcessedExternalEvidence {
    const issues: string[] = [];
    const seen = new Set<string>();
    const evidence: ExternalSourceEvidence[] = [];

    for (const item of result.evidence) {
      if (!item.sourceId?.trim() || !item.content?.trim()) {
        issues.push("External evidence item rejected because sourceId or content was missing.");
        continue;
      }
      if (Number.isNaN(Date.parse(item.retrievedAt))) {
        issues.push(`External evidence ${item.sourceId} rejected because retrievedAt was invalid.`);
        continue;
      }
      const fingerprint = createHash("sha256")
        .update(`${item.sourceId}\0${item.locator || ""}\0${item.content}`)
        .digest("hex");
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      evidence.push(item);
    }

    const context: ZcosContextItem[] = evidence.map((item) => ({
      id: `external:${item.sourceId}`,
      authority: "external_evidence",
      content: item.content,
      source: item.locator || item.title || item.sourceId,
      lifecycle: "supported",
      currency: "current",
      galaxyId,
      trust: "authorized_projection",
    }));

    return {
      evidence,
      context,
      issues,
      duplicatesRemoved: Math.max(0, result.evidence.length - evidence.length),
    };
  }
}

export default ExternalEvidenceProcessor;
