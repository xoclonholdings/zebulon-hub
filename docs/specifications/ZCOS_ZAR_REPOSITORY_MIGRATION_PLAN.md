# ZCOS / ZAR Repository Migration Plan

**Status:** Active implementation authority  
**Original audited source:** `xoclonholdings/ZedAI`  
**Target repository:** `xoclonholdings/zebulon-hub`  
**Rule:** migrate ownership, routing, data, and runtime wiring into ZCOS without allowing ZedAI's historical directory topology to redefine the target architecture.

## Authority order

1. ZCOS Architecture Foundation.
2. ZCOS Personal Files Authority contract.
3. ZCOS Memory Engine Specification.
4. ZCOS Knowledge Engine Requirements.
5. ZCOS System Specification / repository `SPEC.md`.
6. ZAR System Specification for ZAR-specific runtime behavior.
7. ZAR interaction and development behavior rules.
8. Existing code and dated inventories as implementation evidence only.

## Non-negotiable migration rules

- Preserve approved UI/UX unless a separate design change is authorized.
- No blind rewriting. Inspect behavior-affecting files/dependencies before changes.
- No invented owners. Missing authenticated Identity fails closed.
- One canonical authority per record class.
- PostgreSQL is canonical production authority for governed ZCOS records; JSON, caches, vectors, reports, exports, and archives are projections or migration sources.
- Preserve owner, origin galaxy, source/provenance, lifecycle, version, legacy identity, and migration-batch evidence.
- Every cutover requires verification and a blocked-new-write step for the superseded authority.
- Original personal files must move into private durable custody with verified owner/version/hash/provenance/restore evidence before repository or filesystem copies are retired.
- Do not let a historical repo folder or working scaffold become a competing ZCOS domain merely because it exists.

## Phase 0 — repository authority and reproducible inventory

Required:

- canonical `SPEC.md` present on `main`,
- governing documentation present and discoverable in the repository,
- reproducible route/writer/store/runtime inventory,
- current commit/date recorded,
- no unexplained top-level authority paths.

Repository documentation and structure must be understandable by other builders before deeper mutation proceeds.

## Phase 1 — Identity, universal Auth, ownership, side-effect stabilization

Required:

- one ZCOS Universal Auth authority,
- one unified authenticated Identity,
- galaxy sessions are projections of ZCOS authority rather than independent login systems,
- all protected routes/services/jobs/channels use authenticated owner context,
- fallback and sender-derived durable owners removed,
- external intake authenticity fails closed in production,
- consequential side effects enforce current authorization and approval immediately before execution,
- replay/idempotency/retry/redaction contracts verified.

Exit condition: no protected read, write, delete, task, approval, channel, or execution path can operate without verified ZCOS Identity authority.

## Phase 2 — shared ZCOS data foundation

Required shared infrastructure:

- Identity reference,
- galaxy registry,
- partition registry,
- grants/Admin Access,
- provenance/source records,
- audit records,
- migration batches,
- shared object envelope/versioning,
- Personal Files records/versions/references/purpose grants/derivatives/retention/audit,
- repositories/adapters that do not create duplicate authorities.

Cross-galaxy access is deny-by-default. File storage is private and purpose-limited.

## Phase 3 — canonical Memory Engine

Required:

- source ledger,
- canonical Memory records,
- eight partitions,
- relationships,
- lifecycle,
- retrieval indexes,
- toggle enforcement,
- audit,
- correction/supersession,
- deletion cascade,
- idempotent migration/quarantine,
- shadow comparison before cutover,
- legacy writers blocked before retirement.

Acceptance includes You/Topics/Galaxies resolving the same canonical IDs, Memory-off behavior, cascade correctness, and grant-gated cross-galaxy retrieval.

## Phase 4 — canonical Knowledge Engine

Required:

- Topics,
- Knowledge Map,
- Sources,
- Lexicon,
- Curation,
- eight partitions,
- source/evidence/provenance,
- deterministic extraction where appropriate,
- conflict/currency/gap handling,
- lifecycle-aware retrieval,
- source-linked file derivation,
- canonical PostgreSQL authority rather than Memory-backed curation or filesystem JSON truth.

## Phase 5 — Personal Files migration

Required:

- durable private object storage,
- authenticated owner binding,
- file/version/hash metadata,
- restore testing,
- purpose-limited access,
- derivatives linked to source versions,
- intentional Scholar placement rather than automatic ZENITH ownership,
- repository/runtime copies removed only after replacement verification and explicit retention decision.

## Phase 6 — galaxy partitions and Desks

The frontend and backend must expose the eight actual galaxy partitions and their locked Console/Desk contracts. Non-ZAR galaxies must not be merely tinted copies of a ZAR workspace scaffold.

Every galaxy exposes Identity, Memory, Knowledge, Apps, Desk, Settings, and Portal. Each has one specialized Desk and the Dock defined in the Universal Dock Specification.

## Phase 7 — execution, channels, learning, and specialized services

Migrate ZAR runtime, communication channels, ZAR learning/Constitution, ZYLO automation, ZETA integrity, ZYNC build functions, ZWAP discovery functions, ZENITH scholar functions, ZENO collaboration functions, and ZILLION capital functions to their canonical owners under ZCOS authorization.

Live provider features remain partial/blocked/uncertified until their own acceptance suites pass.

## Phase 8 — retirement and repository hygiene

Only after replacement ownership and live paths are verified:

- block superseded writers,
- retire duplicate authorities,
- remove generated build artifacts and temporary deployment files from source control,
- remove stale names/topology that conflict with locked ownership,
- remove private/user data from the deploy repo through approved migration procedures,
- preserve necessary audit/migration evidence outside the runtime source tree,
- verify the final tree, build, tests, runtime routes, and deployment.

## Completion definition

Migration is complete only when the repository implements one authenticated, partitioned, provenance-preserving ZCOS system; all eight galaxies visibly exist at their canonical boundaries; shared domains resolve to ZCOS authorities; legacy competing writers are blocked or explicitly retained only as non-authoritative sources; Personal Files have durable private custody; and live verification proves the deployed paths.

No implementation is called complete merely because a route, component, adapter, or file exists.
