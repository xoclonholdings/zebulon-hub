# ZAR → ZCOS Intelligence Migration

**Status:** Implementation complete on `main`; production certification remains a separate release verdict  
**Date:** August 24, 2026  
**Source repository:** `xoclonholdings/ZedAI`  
**Target repository:** `xoclonholdings/zebulon-hub`

## Authority correction

The migrated runtime follows the locked request flow. ZAR remains the user-facing relational operator and presentation/assignment authority. ZCOS owns authenticated context assembly, reasoning, planning, capability routing, external-source governance, evidence validation, synthesis, evaluation, verification, and outcome-learning proposals. External models/providers are evidence sources, never ZCOS reasoning authority.

## Source-to-target map

| ZedAI source capability | ZCOS destination | Disposition |
| --- | --- | --- |
| `server/services/intelligence-core/DeepThinkingEngine.ts` | `server/intelligence/ZcosIntelligenceRuntime.ts` | Adapted into ZCOS task, complexity, confidence and uncertainty assessment |
| `server/services/ZarStrategicReasoningEngine.ts` | `server/intelligence/ZcosIntelligenceRuntime.ts` | Adapted; strategic reasoning ownership moved from ZAR to ZCOS |
| `server/services/intelligence-core/ContextIntelligenceEngine.ts` | `ZcosContextAssembler.ts` + runtime retrieval gates | Adapted to canonical, lifecycle-safe, galaxy-aware context selection |
| `server/services/intelligence-core/DocumentIntelligenceService.ts` | canonical Files/Knowledge boundaries + context/evidence contracts | Split; original artifacts remain with their canonical file owner, derived evidence is not silently promoted to Knowledge |
| `server/services/intelligence-core/ResponseOrchestrationEngine.ts` | `ZcosIntelligenceRuntime.ts` | Adapted to typed response-form planning; ZAR remains presentation authority |
| `server/services/intelligence-core/SelfOrchestrationEngine.ts` | `ZcosIntelligenceRuntime.ts` | Adapted to ZCOS capability routing across galaxies |
| `server/orchestrator/ManagerAgent.ts` + `manager-agent/*` | typed capability decisions and execution plan | Agent-centric routing retired as authority; ZCOS owns routing |
| `server/orchestrator/subagents/*` | parallel specialist execution groups + verification dependency | Parallel-routing semantics preserved without creating competing reasoning personalities |
| `server/core/providers/*` | `ExternalSourceGateway.ts` + `LightningExternalSourceAdapter.ts` | Provider execution adapted into evidence-only sourcing; provider/model selection cannot become the planner |
| Lightning provider configuration | `LightningExternalSourceAdapter.ts` | Existing environment aliases, timeout and model fallback semantics preserved where compatible |
| `server/services/KnowledgeCurationEngine.ts` | canonical Knowledge Curation + request evaluation | Split; Knowledge truth remains with the Knowledge Engine, request quality with intelligence evaluation |
| `server/services/ZarReflectionEngine.ts` | `OutcomeLearningEngine.ts` | Adapted; direct Memory writes retired in favor of reviewable proposals |
| legacy approval/external-action intent | typed risk/approval metadata + separate execution authorization | Planning may identify a side effect but never authorizes it |
| `server/zcos/runtime/SourceConfluenceEngine.ts` | `server/intelligence/SourceConfluenceEngine.ts` | Migrated claim-level independence/conflict preservation |
| `server/zcos/runtime/ZcosPolicyEngine.ts` | `server/intelligence/ZcosPolicyEngine.ts` | Migrated external-result validation and canonical-write prohibition; corrected ZENO to ZEON |
| `server/zcos/runtime/ZcosRequestInterpreter.ts` | `server/intelligence/ZcosRequestInterpreter.ts` | Migrated typed request envelope with explicit action authorization |
| `server/zcos/capabilities/*` | `server/intelligence/capabilities/*` | Migrated governed capability registry and ZYLO artifact resolution; corrected ownership and ZEON naming |
| `server/zcos/orchestration/FlowRecommender.ts` + `server/zcos/flows/ZcosFlowEngine.ts` | ZYLO-owned workflow/capability boundary | Not copied into ZCOS because locked architecture assigns reusable flows/scheduling to ZYLO; ZCOS retains routing only |
| `server/zcos/orchestration/ZarAutonomousOrchestrator.ts` | ZCOS runtime + ZAR assignment boundary | Split by authority; autonomous reasoning ownership in ZAR is retired |

## Canonical runtime contracts

- `server/intelligence/types.ts`
- `server/intelligence/ZcosIntelligenceRuntime.ts`
- `server/intelligence/ZcosContextAssembler.ts`
- `server/intelligence/ExternalSourceGateway.ts`
- `server/intelligence/LightningExternalSourceAdapter.ts`
- `server/intelligence/ExternalEvidenceProcessor.ts`
- `server/intelligence/ExternalEvidenceStore.ts`
- `server/intelligence/IntelligenceAuditStore.ts`
- `server/intelligence/OutcomeLearningEngine.ts`
- `server/routes/intelligence.ts`
- `server/intelligence/ZcosIntelligenceRuntime.test.ts`
- `server/intelligence/GovernedRuntimeMigration.test.ts`
- `server/intelligence/SourceConfluenceEngine.ts`
- `server/intelligence/ZcosPolicyEngine.ts`
- `server/intelligence/ZcosRequestInterpreter.ts`
- `shared/zcos-intelligence.ts`
- `server/intelligence/capabilities/ZcosCapabilityRegistry.ts`
- `server/intelligence/capabilities/ZyloArtifactResolver.ts`
- `scripts/verify-intelligence-migration.mjs`

The runtime is mounted at `/api/zcos/intelligence`. Protected endpoints use canonical authenticated `OwnerContext`; no fallback owner is introduced.

## Implemented request lifecycle

1. Authenticate a ZCOS owner and resolve the active galaxy.
2. Assemble Memory and Knowledge server-side from canonical ZCOS storage. Request payloads cannot impersonate canonical Memory or Knowledge.
3. Filter context by lifecycle, currency, trust and galaxy authorization semantics.
4. Reason and create a typed plan under ZCOS authority.
5. Route independent specialist capabilities into a parallel execution group while preserving galaxy ownership.
6. When fresh evidence is required, return `gather_evidence` instead of pretending the request is grounded.
7. Gather through a registered external-source adapter. Lightning is registered as an evidence-only model/aggregation adapter when configured.
8. Validate, deduplicate and persist external evidence in the canonical Source ledger without promoting it to Knowledge.
9. Reassemble canonical + validated external evidence and synthesize again inside ZCOS.
10. Keep `sideEffectsAuthorized=false` at planning time. Execution authority must be established separately by the governed capability/action path.
11. Verify/evaluate before ZAR presentation.
12. Resolve observed outcomes only against the canonical audited plan, then create reviewable learning proposals. Proposals do not silently mutate Memory, Knowledge or policy.

## Migration invariants

- ZCOS is the reasoning/planning authority.
- ZAR is the relational presentation/assignment authority.
- Providers are evidence sources only.
- Client-supplied text cannot claim canonical Memory/Knowledge status.
- Candidate, proposed, rejected, forgotten, superseded and deprecated records do not enter ordinary current reasoning.
- Disputed material is not silently treated as ordinary truth.
- Historical or review-due Knowledge is only admitted when the objective calls for that context.
- Cross-galaxy context must be canonical to the active galaxy/system or explicitly supplied as an authorized projection.
- External evidence remains source evidence until separately promoted through the Knowledge contract.
- Intent never grants side-effect authority.
- Verification precedes presentation.
- Learning proposals preserve evidence and require a separate canonical promotion path.
- No target runtime imports code from `xoclonholdings/ZedAI`.

## Verification gate

`npm run verify:intelligence` now performs a deterministic static migration check for required runtime artifacts, route mounting, server-side canonical context assembly, no client-context authority, separate side-effect authorization, Lightning evidence-only behavior, synthesis, direct audited plan lookup, and absence of source-repository imports.

The repository's normal `npm run verify` now executes:

`verify:layout → verify:intelligence → typecheck → tests → build`

`.github/workflows/verify.yml` runs `npm run verify` on every push to `main`.

## Certification truth

All migration changes and the verification gate are present on GitHub `main` and were verified by direct repository reads and commit SHAs. The connected GitHub interface available during this migration does not expose push-triggered workflow runs, and the separate execution sandbox cannot resolve `github.com`, so this record does **not** fabricate a CI-green or production-certified result. Production certification remains governed by the repository's normal verification workflow and deployment evidence. This distinction does not revert the migration: `ZedAI` is migration evidence, not a runtime dependency or ZCOS authority.
