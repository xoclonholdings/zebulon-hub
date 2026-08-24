import type { ZcosGovernedExecutionPlan, ZcosRequestEnvelope, ZcosResultEnvelope, ZcosSourceEnvelope, ZcosUncertaintyEnvelope } from "../../shared/zcos-intelligence.js";
import { ZCOS_INTELLIGENCE_SCHEMA_VERSION } from "../../shared/zcos-intelligence.js";

const SOURCE_TYPES = new Set(["identity","memory","knowledge","learning","project","file","external_url","external_search","external_model","external_database","external_connector","external_tool"]);
const GALAXIES = new Set(["ZCOS","ZAR","ZYNC","ZENA","ZEON","ZYLO","ZWAP!","ZENITH","ZILLION"]);
function assertSource(source: ZcosSourceEnvelope) {
  if (!source?.sourceId?.trim() || !SOURCE_TYPES.has(source.type) || !GALAXIES.has(source.originGalaxy)) throw new Error("Invalid source ownership/type metadata.");
  if (!Number.isFinite(source.confidence) || source.confidence < 0 || source.confidence > 1) throw new Error(`Source ${source.sourceId} has invalid confidence.`);
  if (!source.provenance?.retrievedAt || !source.provenance.independenceKey?.trim() || !Array.isArray(source.provenance.lineage)) throw new Error(`Source ${source.sourceId} has incomplete provenance.`);
}
export class ZcosPolicyEngine {
  static preflight(request: ZcosRequestEnvelope, plan: ZcosGovernedExecutionPlan): ZcosUncertaintyEnvelope[] {
    const out: ZcosUncertaintyEnvelope[] = [];
    if (!request.permissions.externalRetrieval && plan.externalRetrievalRequired) out.push({ code:"external_retrieval_not_authorized", statement:"Current external sources are required but external retrieval is not authorized.", material:true, confidence:1, sourceIds:[], resolution:"block_action" });
    for (const invocation of plan.invocations) if (invocation.sideEffect === "external_write" && invocation.status !== "approved") out.push({ code:"external_action_requires_approval", statement:`${invocation.capabilityId} cannot execute without action-specific approval.`, material:true, confidence:1, sourceIds:[], resolution:"block_action" });
    return out;
  }
  static verifyExternalResult(result: ZcosResultEnvelope, sources: ZcosSourceEnvelope[], expectedRequestId?: string): void {
    if (result.schemaVersion !== ZCOS_INTELLIGENCE_SCHEMA_VERSION || !result.resultId?.trim() || !result.requestId?.trim()) throw new Error("Invalid external result envelope.");
    if (expectedRequestId && result.requestId !== expectedRequestId) throw new Error("External result requestId does not match governed request.");
    if (result.writeDisposition === "approved_mutation") throw new Error("External intelligence adapters cannot write canonical ZCOS state.");
    for (const source of sources) assertSource(source);
    const ids = new Set(sources.map((source) => source.sourceId));
    for (const id of result.sourceIds) if (!ids.has(id)) throw new Error(`External result cites unknown source: ${id}`);
  }
}
