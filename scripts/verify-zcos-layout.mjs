import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const requiredDocs = [
  "SPEC.md",
  "docs/specifications/README.md",
  "docs/specifications/ZCOS_ARCHITECTURE_FOUNDATION.md",
  "docs/specifications/ZCOS_MEMORY_ENGINE_SPECIFICATION.md",
  "docs/specifications/ZCOS_KNOWLEDGE_ENGINE_REQUIREMENTS.md",
  "docs/specifications/ZCOS_UNIVERSAL_DOCK_SPECIFICATION.md",
  "docs/specifications/ZCOS_ZAR_REPOSITORY_MIGRATION_PLAN.md",
  "docs/specifications/source-pdfs/ZCOS_ARCHITECTURE_FOUNDATION.pdf",
  "docs/specifications/source-pdfs/ZCOS_MEMORY_ENGINE_SPECIFICATION.pdf",
  "docs/specifications/source-pdfs/ZCOS_KNOWLEDGE_ENGINE_REQUIREMENTS.pdf",
  "docs/specifications/source-pdfs/ZCOS_ZAR_REPOSITORY_MIGRATION_PLAN.pdf",
];

const galaxies = ["zar", "zync", "zeta", "zeno", "zylo", "zwap", "zenith", "zillion"];
const domains = ["identity", "memory", "knowledge", "apps", "desk", "settings", "portal"];

const requiredPaths = [
  ...requiredDocs,
  "client/src/system/ZebulonConstellationPage.tsx",
  "client/src/system/ZcosLandingPage.tsx",
  "client/src/system/CommanderDock.tsx",
  "client/src/system/commanderDock.ts",
  "client/src/system/CommanderHeader.tsx",
  "client/src/system/constellationSceneContract.ts",
  "client/src/system/vesselIdentity.ts",
  "client/src/system/ZcosCommandDesk.tsx",
  "client/src/pages/history.tsx",
  "client/src/galaxies/registry.ts",
  ...galaxies.flatMap((galaxy) => [
    `client/src/galaxies/${galaxy}/index.ts`,
    ...domains.map((domain) => `client/src/galaxies/${galaxy}/${domain}/index.ts`),
  ]),
  "client/src/galaxies/zar/nexys/consoleIdentity.ts",
  "server/core/GalaxyRegistry.ts",
  "server/core/OwnerContext.ts",
  "server/core/requireOwner.ts",
];

const forbiddenPaths = [
  "client/src/zcos",
  "client/src/nexys",
  "server/zcos-core",
  "server/public",
  "uploads",
  "cookies.txt",
  "final-test-cookies.txt",
  "test-cookies.txt",
  "test-sample.ged",
  "test-knowledge-pool.js",
  "oracle_feed.json",
  "oracle_feed.md",
  "zebulon_frontend_build.tar.gz",
  "zebulon_offline_bundle.tar",
  "zebulon_offline_bundle_final.tar.gz",
  "zebulon_oracle_backup.sql",
  "zebulon_structure_backup.sql",
  "replit.md",
];

const missing = requiredPaths.filter((path) => !existsSync(join(root, path)));
const forbidden = forbiddenPaths.filter((path) => existsSync(join(root, path)));
const constellationSource = readFileSync(join(root, "client/src/system/ZebulonConstellationPage.tsx"), "utf8");
const landingSource = readFileSync(join(root, "client/src/system/ZcosLandingPage.tsx"), "utf8");
const forbiddenLandingTokens = [
  "GalaxyMapDock",
  "NexysConsoleHeader",
  "ZAR_NEXYS_CONSOLE",
  "ZEBULON_VESSEL_ROUTE",
  "nexys-online-pill",
  "Reset chart",
  "Zebulon Vessel",
  "MutationObserver",
];
const legacyLandingTokens = forbiddenLandingTokens.filter(
  (token) => constellationSource.includes(token) || landingSource.includes(token),
);

if (missing.length || forbidden.length || legacyLandingTokens.length) {
  if (missing.length) console.error("Missing canonical ZCOS paths:\n" + missing.map((path) => `  - ${path}`).join("\n"));
  if (forbidden.length) console.error("Forbidden legacy/generated ZCOS paths:\n" + forbidden.map((path) => `  - ${path}`).join("\n"));
  if (legacyLandingTokens.length) console.error("Legacy ZAR/Nexys landing tokens remain:\n" + legacyLandingTokens.map((token) => `  - ${token}`).join("\n"));
  process.exit(1);
}

console.log(`ZCOS layout verified: ${galaxies.length} galaxies × ${domains.length} concrete shared-domain modules, Commander landing present, canonical specs present, legacy boundaries absent.`);
