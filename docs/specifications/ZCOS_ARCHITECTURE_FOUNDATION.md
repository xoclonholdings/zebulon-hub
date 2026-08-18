# ZCOS Architecture Foundation

**Status:** Locked architecture  
**Original locked date:** August 7, 2026  
**Repository restoration:** August 18, 2026

## Governing rule

One ZCOS. Eight distinct galaxies. One unified Identity. Central Memory and Knowledge engines with galaxy partitions. Controlled cross-galaxy access. Seven shared domains in every galaxy.

## Locked principles

- One intelligence, many specialized interfaces.
- Identity exists once at ZCOS level and is referenced from every galaxy.
- ZCOS Auth is universal auth; galaxies do not own independent authentication authorities.
- Memory and Knowledge remain separate authorities even when they reuse shared object infrastructure.
- Memory and Knowledge each use one central ZCOS engine with eight galaxy partitions.
- Cross-galaxy access is never implicit and is governed through ZCOS Command / Admin Access.
- Extensions install once for the unified Identity and become available through Apps from every galaxy.
- Shared domains have consistent purposes while each galaxy's Desk remains specialized.
- Portal is transport, not content or administration.
- Original personal files remain user-owned under the shared ZCOS Personal Files Authority.
- Approved UI/UX is preserved while ownership and runtime wiring are migrated unless separately changed.

## ZCOS Command Desk

- **All Memory** — governed unified view across all Memory partitions.
- **All Knowledge** — governed unified view across all Knowledge partitions.
- **All Projects** — unified view across galaxy-owned Projects.
- **Admin Access** — grants, revocation, Extensions, cross-galaxy authorization, system administration, and audit.

Admin Access governs scope, duration, revocation, read/write/contribution authority, explicit promotion/sharing, Extension permissions, and audit evidence.

## Eight galaxies

| Galaxy | Console | Desk |
| --- | --- | --- |
| ZAR | Nexys | Operate |
| ZYNC | Canvas | Build |
| ZETA | Control | Integrity |
| ZENO | Unite | Forum |
| ZYLO | Compass | Automate |
| ZWAP! | Discovery | Explore |
| ZENITH | Logos | Scholar |
| ZILLION | Prosper | Capital |

## Seven shared galaxy domains

1. Identity
2. Memory
3. Knowledge
4. Apps
5. Desk
6. Settings
7. Portal

Every galaxy displays these domains, but no galaxy duplicates the underlying foundational authority.

## Memory

One ZCOS Memory Engine owns eight partitions. Each galaxy reads/writes its own partition by default. Every record retains owner, source, origin galaxy, provenance, lifecycle, and relationships. All Memory does not erase partitions.

User-facing organization is You, Topics, and Galaxies over the same canonical records. Conversations are source/history rather than automatic long-term Memory. Vector search is derived indexing only.

## Knowledge

One ZCOS Knowledge Engine owns eight partitions. Required surfaces are Topics, Knowledge Map, Sources, Lexicon, and Curation. Knowledge retains originating galaxy and source. All Knowledge is a governed projection rather than another store.

## Personal Files Authority

Original personal files are user-owned. ZCOS provides private durable custody, file identity, versions, hashes, purpose-limited grants, retention/deletion coordination, provenance, derivatives, restore evidence, and audit.

ZENITH Scholar owns intentional Scholar organization, not every original upload. Git and ephemeral deployment storage are not durable personal-file authorities.

## Shared object framework

Memory and Knowledge may share object IDs, typed properties, sources, evidence, relationships, confidence, provenance, indexes, conflict detection, and versions without collapsing into one authority.

Objects route to the correct canonical owner:

- profile -> Identity
- experiences/decisions/relationships/events -> Memory
- facts/claims/concepts/rules/systems -> Knowledge
- controls/preferences -> Settings
- adaptation -> Glow
- tasks/work products -> Desk/Projects
- original uploads -> Personal Files Authority
- intentional study/library placement -> ZENITH Scholar

## Apps and Integrations

Apps contains ZCOS Extensions. Settings / Integrations connects external services. These are separate systems.

## Desk and Projects

Every galaxy has exactly one specialized Desk. Work created through a Desk becomes a Project associated with its originating galaxy. ZCOS Command / All Projects provides system-wide visibility without changing ownership.

## Settings

Settings remains a simple user-facing control surface. Confirmed groups include Account, System, Appearance, and Account Actions. Admin Access remains separate from ordinary Settings.

## Portal

Portal opens the constellation, identifies the active galaxy, allows movement to another galaxy or ZCOS Command, and preserves unified Identity. Portal contains no Memory, Knowledge, Settings, content store, or administrative authority.

## Rebuild rules

- Preserve reusable object, provenance, graph, ingestion, curation, Lexicon, retrieval, and audit components only when assigned to their correct owners.
- Do not keep disconnected galaxy-specific Memory or Knowledge authorities.
- Do not retain an undifferentiated Object Memory graph as authority for unrelated domains.
- Migrate by classification and ownership.
- Missing authenticated ownership fails closed.
- Local JSON, archives, exports, vectors, generated bundles, and caches are not canonical production truth.
- Do not alter established approved visual design unless separately authorized.
- Do not let migration-source directory topology redefine ZCOS architecture.
