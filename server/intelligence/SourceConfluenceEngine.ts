import type { ZcosConfluenceReport, ZcosSourceEnvelope, ZcosUncertaintyEnvelope } from "../../shared/zcos-intelligence.js";

export class SourceConfluenceEngine {
  static evaluate(sources: ZcosSourceEnvelope[]): { report: ZcosConfluenceReport; uncertainties: ZcosUncertaintyEnvelope[] } {
    const independenceKeys = new Set(sources.map((source) => source.provenance.independenceKey));
    const claimValues = new Map<string, Map<string, Set<string>>>();
    for (const source of sources) for (const claim of source.claims || []) {
      const key = `${claim.key.trim().toLowerCase()}::${claim.scope || "default"}`;
      const value = claim.value.trim();
      if (!claim.key.trim() || !value) continue;
      const byValue = claimValues.get(key) || new Map<string, Set<string>>();
      const ids = byValue.get(value) || new Set<string>();
      ids.add(source.sourceId); byValue.set(value, ids); claimValues.set(key, byValue);
    }
    const conflicts = [...claimValues.entries()].filter(([, values]) => values.size > 1).map(([claimKey, values]) => ({
      claimKey, values: [...values.entries()].map(([value, sourceIds]) => ({ value, sourceIds: [...sourceIds] })),
    }));
    const uncertainties = conflicts.map((conflict) => ({
      code: "source_conflict", statement: `Sources preserve conflicting values for ${conflict.claimKey}.`, material: true,
      confidence: 1, sourceIds: conflict.values.flatMap((value) => value.sourceIds), resolution: "preserve" as const,
    }));
    const avg = sources.length ? sources.reduce((sum, source) => sum + Math.max(0, Math.min(1, source.confidence)), 0) / sources.length : 0;
    const independence = sources.length ? independenceKeys.size / sources.length : 0;
    return { report: { independentSourceCount: independenceKeys.size, duplicateLineageCount: Math.max(0, sources.length - independenceKeys.size), conflicts,
      confidence: Number(Math.max(0, Math.min(1, avg * (0.7 + 0.3 * independence) - (conflicts.length ? 0.25 : 0))).toFixed(2)) }, uncertainties };
  }
}
