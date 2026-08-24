import { readFile } from "node:fs/promises";

const required = [
  "server/intelligence/types.ts",
  "server/intelligence/ZcosIntelligenceRuntime.ts",
  "server/intelligence/ZcosContextAssembler.ts",
  "server/intelligence/ExternalSourceGateway.ts",
  "server/intelligence/LightningExternalSourceAdapter.ts",
  "server/intelligence/ExternalEvidenceProcessor.ts",
  "server/intelligence/ExternalEvidenceStore.ts",
  "server/intelligence/IntelligenceAuditStore.ts",
  "server/intelligence/OutcomeLearningEngine.ts",
  "server/intelligence/ZcosIntelligenceRuntime.test.ts",
  "server/routes/intelligence.ts",
  "docs/migrations/ZAR_TO_ZCOS_INTELLIGENCE_MIGRATION.md",
];

const files = Object.fromEntries(await Promise.all(required.map(async (path) => [path, await readFile(path, "utf8")] )));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const index = await readFile("server/index.ts", "utf8");
const runtime = files["server/intelligence/ZcosIntelligenceRuntime.ts"];
const routes = files["server/routes/intelligence.ts"];
const gateway = files["server/intelligence/ExternalSourceGateway.ts"];
const lightning = files["server/intelligence/LightningExternalSourceAdapter.ts"];
const learning = files["server/intelligence/OutcomeLearningEngine.ts"];

assert(index.includes("app.use('/api/zcos/intelligence', intelligenceRoutes)"), "ZCOS intelligence route is not mounted");
assert(runtime.includes("sideEffectsAuthorized: false"), "Planning must never authorize side effects");
assert(runtime.includes('owner: "zcos"') || runtime.includes('"zcos"'), "ZCOS reasoning authority is missing");
assert(runtime.includes('owner: "zar"') || runtime.includes('"zar"'), "ZAR presentation authority is missing");
assert(runtime.includes('parallelGroup'), "Parallel capability routing contract is missing");
assert(routes.includes("ZcosContextAssembler.assemble"), "Routes must assemble canonical context server-side");
assert(!routes.includes("body.context"), "Client-supplied context must not become canonical reasoning context");
assert(routes.includes("IntelligenceAuditStore.findPlan"), "Plan lookup must be owner-scoped and direct");
assert(routes.includes("external_evidence_validated"), "External evidence validation audit is missing");
assert(routes.includes('router.post("/synthesize"'), "ZCOS synthesis stage is missing");
assert(gateway.includes("LightningExternalSourceAdapter"), "Lightning evidence adapter is not registered");
assert(lightning.includes("evidenceOnly: true"), "Lightning must be evidence-only");
assert(learning.includes("never writes directly to Memory or Knowledge") || learning.includes("never writes directly"), "Learning mutation boundary is missing");

for (const [path, content] of Object.entries(files)) {
  assert(!/from\s+["'][^"']*ZedAI/i.test(content), `${path} imports the migration source repository`);
}

console.log(`ZCOS intelligence migration verification passed (${required.length} required artifacts).`);
