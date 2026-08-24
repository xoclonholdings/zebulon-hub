# ZAR → ZCOS Intelligence Migration

**Status:** Implemented on `main`  
**Date:** August 24, 2026  
**Source repository:** `xoclonholdings/ZedAI`  
**Target repository:** `xoclonholdings/zebulon-hub`

## Authority correction

The migrated runtime follows the locked request flow: ZAR remains the user-facing relational operator; ZCOS owns context assembly, reasoning, planning, capability routing, external-source governance, evaluation, verification, and outcome-learning proposals. External models/providers are evidence sources, never reasoning authority.

## Source-to-target map

| ZedAI source capability | ZCOS destination | Disposition |
| --- | --- | --- |
| `server/services/intelligence-core/DeepThinkingEngine.ts` | `server/intelligence/ZcosIntelligenceRuntime.ts` | Adapted into ZCOS reasoning assessment, complexity, confidence and uncertainty handling |
| `server/services/ZarStrategicReasoningEngine.ts` | `server/intelligence/ZcosIntelligenceRuntime.ts` | Adapted; strategic reasoning ownership moved from ZAR to ZCOS |
| `server/services/intelligence-core/ContextIntelligenceEngine.ts` | `server/intelligence/ZcosIntelligenceRuntime.ts` + canonical Memory/Knowledge APIs | Adapted to lifecycle-safe, galaxy-aware context selection |
| `server/services/intelligence-core/DocumentIntelligenceService.ts` | canonical Knowledge/Files context + runtime context authority | Split; original artifacts remain governed Files, derived evidence enters Knowledge/context |
| `server/services/intelligence-core/ResponseOrchestrationEngine.ts` | `server/intelligence/ZcosIntelligenceRuntime.ts` | Adapted to typed response-form planning; ZAR remains presentation authority |
| `server/services/intelligence-core/SelfOrchestrationEngine.ts` | `server/intelligence/ZcosIntelligenceRuntime.ts` | Adapted to ZCOS capability routing across galaxies instead of ZAR-owned agents |
| `server/core/providers/*` | `server/intelligence/ExternalSourceGateway.ts` | Replaced with provider-neutral external-source adapter contract; providers cannot become reasoning authority |
| `server/services/KnowledgeCurationEngine.ts` | canonical ZCOS Knowledge Curation API + runtime evaluation | Split into canonical Knowledge curation and request/outcome evaluation |
| `server/services/ZarReflectionEngine.ts` | `server/intelligence/OutcomeLearningEngine.ts` | Adapted; direct Memory writes retired in favor of reviewable learning proposals |
| legacy approval/external-action intent | typed runtime plan + existing ZCOS authorization/audit boundaries | Authority corrected; runtime identifies risk/approval need but does not self-authorize side effects |

## New canonical runtime contracts

- `server/intelligence/types.ts`
- `server/intelligence/ZcosIntelligenceRuntime.ts`
- `server/intelligence/ExternalSourceGateway.ts`
- `server/intelligence/OutcomeLearningEngine.ts`
- `server/routes/intelligence.ts`
- `server/intelligence/ZcosIntelligenceRuntime.test.ts`

The runtime is mounted at `/api/zcos/intelligence` from the main ZCOS server. Protected endpoints use canonical authenticated `OwnerContext`; no fallback owner is introduced. Intelligence plans and observed outcomes write audit evidence through canonical ZCOS storage.

## Preserved behavior

The migration preserves the useful semantics of the ZAR-era engines while changing authority:

- complexity-sensitive reasoning and confidence estimation,
- strategic request detection through task/intent classification,
- lifecycle-safe context selection,
- document/file awareness through canonical context,
- proactive capability selection,
- separation of autonomous/read-only work from side-effect/approval-sensitive work,
- typed execution planning,
- explicit verification/evaluation before ZAR presentation,
- provider-neutral external evidence ingestion,
- outcome/error analysis that proposes learning instead of silently mutating Memory/Knowledge.

## Retired authority assumptions

The target ZCOS runtime does **not** preserve these ZAR-era authority assumptions:

- ZAR as reasoning authority,
- ZAR-owned self-orchestration as final execution authority,
- providers/models as planners or decision-makers,
- reflection writing directly to project memory,
- provider-specific routing embedded into reasoning,
- hidden agent ownership of galaxy-specialized work.

ZedAI remains read-only migration evidence. No target runtime import depends on ZedAI.

## Verification state

Repository writes were made directly to `main` through the GitHub contents API and verified by commit SHA and direct reads from the target paths. The repository does contain `.github/workflows/verify.yml`, configured to run `npm run verify` on every push to `main`. The available GitHub connector does not expose push-triggered workflow runs through its commit-run lookup, so a completed CI verdict is not claimed here. A separate local clone attempt was also blocked because the execution sandbox could not resolve `github.com`. The committed Vitest migration suite remains part of the repository's normal `npm test` / `npm run verify` certification path.
