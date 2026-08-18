# ZCOS Canonical System Specification

**Repository:** `xoclonholdings/zebulon-hub`  
**System:** Zebulon Commander Operating System (ZCOS)  
**Status:** Locked implementation authority  
**Repository authority restored:** August 18, 2026  
**Architecture authority:** ZCOS Architecture Foundation, ZCOS Personal Files Authority contract, ZCOS Memory Engine Specification, ZCOS Knowledge Engine Requirements, ZCOS Universal Dock Specification, ZCOS/ZAR Repository Migration Plan  
**Migration source:** `xoclonholdings/ZedAI`; source topology does not override ZCOS ownership

> **Governing rule:** One ZCOS. Eight distinct galaxies. One unified Identity. ZCOS Auth is universal auth. One Memory Engine and one Knowledge Engine with eight partitions each. Every galaxy exposes the same seven shared domains and exactly one specialized Desk. Cross-galaxy authority is explicit, scoped, revocable, and auditable.

## 1. Repository role

`zebulon-hub` is the ZCOS implementation repository. ZCOS is not a feature folder inside this project and is not a peer application beside the galaxies. The repository must be organized so system-level infrastructure is distinguishable from galaxy partitions without creating a second copy of ZCOS inside `client/src` or `server`.

The repository must remain readable by human developers and external builders. Canonical specifications belong in the repository and code structure must visibly match the locked authority map.

## 2. Authority and status discipline

Locked documents define the target architecture. Existing code, ZedAI files, archives, generated bundles, historical routes, and prior repository layouts are migration evidence only.

Implementation statuses remain distinct:

- **Locked** — approved requirement; implementation must conform.
- **Implemented** — connected code exists.
- **Partial** — substantive implementation exists but required paths or verification remain incomplete.
- **Blocked** — implementation cannot be truthfully presented as operational because a required dependency or authorization is absent.
- **Production certified** — applicable ownership, security, runtime, recovery, UI, and live-path acceptance evidence passed.

Code presence is never proof of production readiness.

## 3. ZCOS operating-system authority

ZCOS is the governing operating system above every galaxy. It owns or governs:

- unified Identity and universal authentication,
- sessions, roles, grants, Admin Access, and system authorization,
- the central Memory Engine and Knowledge Engine,
- shared object, provenance, audit, and partition infrastructure,
- Personal Files custody and purpose-limited access,
- Projects and cross-galaxy project visibility,
- Extensions and external Integrations boundaries,
- execution governance and side-effect authorization,
- Portal transport and cross-galaxy movement,
- system-wide observability and audit coordination.

Galaxies specialize interaction and execution. They do not create duplicate foundational identities, authentication authorities, Memory engines, Knowledge engines, or system governance.

## 4. Universal Identity and Auth

Identity exists once at ZCOS level and is referenced everywhere.

Canonical profile data includes:

- full name,
- preferred name,
- profile image,
- email address,
- Privy wallet address.

**ZCOS Auth is universal auth.** Signing in through any ZCOS galaxy authenticates the same ZCOS Identity for the entire ecosystem. A galaxy may render the universal ZCOS login experience when authentication is required, but it does not own an independent authentication system.

Required behavior:

1. Authenticate once against ZCOS.
2. Preserve the authenticated Identity while moving between galaxies.
3. Do not prompt for a second galaxy-specific login while the ZCOS session is valid.
4. If re-authentication is required, the current galaxy renders the universal ZCOS login and resumes the interrupted context after successful authentication.
5. Missing authenticated ownership fails closed. Fallback owners, anonymous durable ownership, sender-derived owners, and request-body owner claims are prohibited.

## 5. Eight galaxy partitions

| Galaxy | Console | Desk |
| --- | --- | --- |
| ZAR | NEXYS | Operate |
| ZYNC | CANVAS | Build |
| ZETA | CONTROL | Integrity |
| ZENO | UNITE | Forum |
| ZYLO | COMPASS | Automate |
| ZWAP! | DISCOVERY | Explore |
| ZENITH | LOGOS | Scholar |
| ZILLION | PROSPER | Capital |

A galaxy is a specialized system inside ZCOS. Repository organization must expose these eight partitions explicitly rather than hiding them behind one generic ZAR-themed workspace or a single undifferentiated `zcos` UI folder.

## 6. Seven shared domains

Every galaxy exposes exactly these shared domains:

1. **Identity** — the unified ZCOS identity surface.
2. **Memory** — galaxy-aware personal and experiential retention.
3. **Knowledge** — galaxy-aware substantiated understanding.
4. **Apps** — universal Extension access.
5. **Desk** — the galaxy's specialized working domain.
6. **Settings** — account, system, appearance, and account actions.
7. **Portal** — transport between the active galaxy, constellation, other galaxies, and ZCOS Command.

Legacy `Workspaces`, `Projects`, `Tools`, `Connect`, or similarly inherited root nodes are migration sources. They must be mapped to their locked owners rather than retained as competing shared domains.

## 7. ZCOS Command Desk

The Command Desk is the system-wide visibility and governance surface above galaxy partitions.

| Surface | Purpose |
| --- | --- |
| All Memory | Authorized unified view across all Memory partitions without dissolving origin or lifecycle boundaries |
| All Knowledge | Authorized unified view across all Knowledge partitions while preserving source, status, and origin |
| All Projects | Unified view of projects created through every galaxy Desk |
| Admin Access | Grants, revocation, Extensions, cross-galaxy authority, system administration, and authorization audit |

Cross-galaxy read, write, contribute, promote/share, execute, administer, install, remove, and audit operations require explicit authorization. One operation never silently implies another.

## 8. Memory authority

ZCOS owns one Memory Engine with eight isolated galaxy partitions: ZAR, ZYNC, ZETA, ZENO, ZYLO, ZWAP!, ZENITH, and ZILLION.

Canonical Memory types:

- experience,
- decision,
- person/relationship,
- event,
- user-directed memory.

Lifecycle states:

- Proposed,
- Active,
- Confirmed,
- Corrected,
- Superseded,
- Rejected,
- Forgotten.

Required layers include capture/classification, source ledger, canonical durable record store, relationship links, retrieval indexes, audit ledger, lifecycle enforcement, partition authorization, correction, supersession, and forgetting/deletion propagation.

User-facing Memory remains deliberately simple: **You**, **Topics**, and **Galaxies** are views over the same canonical records. Conversations are History/source evidence and do not automatically become long-term Memory. Vectors, summaries, caches, and prompt projections are derived indexes, never canonical Memory.

When Memory is disabled, ZCOS creates no new long-term memories and retrieves no existing memories for responses. Existing records remain preserved unless deleted. Re-enabling does not silently backfill disabled-period conversations.

## 9. Knowledge authority

ZCOS owns one Knowledge Engine with eight galaxy partitions. Knowledge remains separate from Memory even when both reuse shared object infrastructure.

Required Knowledge surfaces:

- Topics,
- Knowledge Map,
- Sources,
- Lexicon,
- Curation.

Knowledge records retain owner, origin galaxy, source/evidence, provenance, lifecycle/status, confidence, relationships, version history, and authorization state. All Knowledge is a governed projection across partitions, not a second knowledge store.

Original uploads do not become Knowledge merely because they were uploaded. Extracted claims remain source-backed and reviewable. JSON files, archives, exported conversations, vector stores, caches, and generated reports are projections or migration sources unless separately promoted through the canonical Knowledge contract.

## 10. Personal Files Authority

Original personal files remain user-owned and are governed by the shared ZCOS Personal Files Authority.

Required properties include:

- authenticated owner binding,
- private durable object storage,
- canonical file identity,
- versions and SHA-256 hashes,
- provenance and originating context,
- purpose-limited grants,
- derivative relationships,
- retention and deletion coordination,
- restore evidence and audit events.

Original personal file bytes must not depend on Git or an ephemeral deployment filesystem for durable custody. ZENITH Scholar owns intentional Scholar organization; it does not automatically become owner of every uploaded file.

## 11. Shared object and domain boundaries

Shared infrastructure may provide typed IDs, properties, provenance, evidence, relationship links, indexes, conflict detection, versions, grants, and audit records. Shared infrastructure does not collapse canonical authorities.

Canonical routing:

- Profile data -> Identity
- Experiences/decisions/relationships/events/user-directed retention -> Memory
- Facts/claims/concepts/rules/systems/substantiated relationships -> Knowledge
- Explicit interaction controls -> Settings
- Inferred personal adaptation -> ZWAP! Discovery / Glow
- Tasks and work products -> originating Desk / Projects
- Original personal files -> Personal Files Authority
- Intentional study/library placement -> ZENITH Logos / Scholar
- History -> system activity/history; not automatic Memory
- External connections -> Settings / Integrations
- Installed ZCOS Extensions -> Apps

## 12. Universal Dock specification

Every galaxy Console has one five-button Dock. **Chat** and **Upload** are universal. Buttons three through five are the direct controls of the specialized Desk. **History** is universal but is not a Dock button.

Locked left-to-right registry:

| Galaxy | Console | Desk | Dock |
| --- | --- | --- | --- |
| ZAR | NEXYS | Operate | Chat · Upload · Ideas · Task · Search |
| ZYNC | CANVAS | Build | Chat · Upload · Code · Design · Publish |
| ZETA | CONTROL | Integrity | Chat · Upload · Logs · Diagnostics · Monitoring |
| ZWAP! | DISCOVERY | Explore | Chat · Upload · Glow · Move · Play |
| ZENO | UNITE | Forum | Chat · Upload · Board · Team · Notes |
| ZYLO | COMPASS | Automate | Chat · Upload · Flows · Skills · Tips |
| ZENITH | LOGOS | Scholar | Chat · Upload · Files · Study · Library |
| ZILLION | PROSPER | Capital | Chat · Upload · Budget · Trade · Invest |

This five-button baseline supersedes earlier six-button Dock drafts. Talk and SMS remain ZAR communication modes rather than universal Dock buttons. Image/document/file type branches from Upload.

## 13. Galaxy Desk control contracts

- **ZAR / Operate:** Ideas, Task, Search.
- **ZYNC / Build:** Code, Design, Publish.
- **ZETA / Integrity:** Logs, Diagnostics, Monitoring.
- **ZWAP! / Explore:** Glow, Move, Play.
- **ZENO / Forum:** Board, Team, Notes.
- **ZYLO / Automate:** Flows, Skills, Tips.
- **ZENITH / Scholar:** Files, Study, Library.
- **ZILLION / Capital:** Budget, Trade, Invest.

The Dock launches actions. Portal handles navigation. Desk controls do not become duplicate system domains.

## 14. Portal

Portal is transport only. It:

- opens the constellation,
- identifies the current galaxy,
- permits entry into another available galaxy or ZCOS Command,
- preserves the unified Identity during movement.

Portal does not own content, Settings, Memory, Knowledge, Files, or administrative controls.

## 15. Execution and authority path

A governed request path must:

1. authenticate the unified ZCOS Identity,
2. resolve active galaxy, Desk, Project, conversation, channel, and file context,
3. normalize request and attachments without trusting source content as system instructions,
4. resolve language/context and retrieve only authorized eligible records,
5. produce a typed plan with capabilities, evidence, risks, approvals, and expected outputs,
6. execute read-only work or governed side effects through the canonical execution lifecycle,
7. verify/reconcile outcomes,
8. return one truthful response,
9. record History/audit evidence,
10. propose Memory or Knowledge changes only through their own authority contracts.

ZCOS governs. Galaxies execute specialized work under that authority.

## 16. ZETA and system integrity

ZETA Control / Integrity owns the specialized integrity surface: Logs, Diagnostics, and Monitoring. ZETA may detect and surface system conditions. System-wide authorization remains ZCOS authority. Security Extensions such as Fantasma Firewall/FanFI are installed and authorized through ZCOS Apps/Admin Access and may be invoked through the appropriate governed capability path.

## 17. Migration ownership

`xoclonholdings/ZedAI` is a migration source. Migration is by classification and ownership, not by copying its directory topology.

Examples:

| Source area | Locked destination |
| --- | --- |
| constellation/home shell | ZCOS system experience / Portal |
| Nexys | `galaxies/zar` only |
| legacy workspaces | appropriate galaxy Desk |
| project work | originating Desk / Projects |
| tools | Extensions, Integrations, device capabilities, or Desk capabilities |
| Object Memory | shared objects plus canonical Memory/Knowledge/domain routing |
| Knowledge ingestion/curation | ZCOS Knowledge Engine |
| Learning Studio | ZENITH Logos / Scholar |
| flows/runs/suggestions | ZYLO Compass / Automate |
| trading/budget/investing | ZILLION Prosper / Capital |
| discovery/adaptation | ZWAP! Discovery / Explore |
| external intake | governed ZCOS channel/transport services |

Do not allow legacy code presence or old names to redefine locked ownership.

## 18. Repository structure requirement

The frontend source must make the architecture visible:

```text
client/src/
  galaxies/
    zar/
    zync/
    zeta/
    zeno/
    zylo/
    zwap/
    zenith/
    zillion/
  system/
  components/
  context/
  hooks/
  lib/
  pages/
```

`Nexys` belongs beneath the ZAR partition, never as a peer of ZCOS/system source. There is no `client/src/zcos` feature boundary because the entire repository is ZCOS.

Each galaxy partition contains the seven shared-domain boundaries (`identity`, `memory`, `knowledge`, `apps`, `desk`, `settings`, `portal`) plus its Console-specific implementation.

Server organization should likewise distinguish core ZCOS authorities, routes, storage/adapters, and galaxy-specialized services without creating duplicate foundational engines.

## 19. Build and repository hygiene

Repository root should contain source directories, canonical documentation, and required project/deployment configuration. Generated frontend bundles, cookie captures, temporary test artifacts, local backup packages, private uploads, database dumps, and superseded runtime artifacts do not belong in the production source tree unless explicitly retained by an approved repository policy.

No secret values, personal exports, uploaded personal files, or unrestricted private data may be committed.

## 20. Verification rule

A repository change is not complete until the resulting file path and commit are verified on `main`. Build/test/runtime claims require actual evidence. The system must report blocked, partial, implemented, and certified states truthfully.

This file is the canonical repository-level implementation authority for `xoclonholdings/zebulon-hub`. Detailed engine and migration documents under `docs/specifications/` remain normative and must be read with this file.
