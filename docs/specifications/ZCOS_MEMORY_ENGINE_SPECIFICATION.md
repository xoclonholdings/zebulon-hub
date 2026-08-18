# ZCOS Memory Engine Specification

**Status:** Locked for implementation  
**Authority:** ZCOS Architecture Foundation  
**Canonical rule:** One ZCOS Memory Engine. Eight isolated galaxy partitions. One canonical object record per retained memory. Controlled cross-galaxy access. Complete provenance. Cascading correction and deletion.

## Required outcomes

- Preserve compliant structural strengths of the existing Object Memory implementation without retaining mixed-domain authority.
- Give each authenticated user one logically unified Memory system divided into eight galaxy partitions.
- Keep the user-facing experience simple: You, Topics, Galaxies, Memory Summary, and direct remember commands.
- Make every retained memory traceable, correctable, supersedable, reviewable, and forgettable.
- Prevent disabled, unauthorized, rejected, superseded, or forgotten records from influencing responses.

## Non-negotiable invariants

- **One engine:** no galaxy, workspace, feature, filesystem path, vector database, or cache becomes a competing Memory authority.
- **Authenticated ownership:** every user-owned Memory operation requires a verified owner user ID; missing or fallback owners fail closed.
- **Galaxy partitioning:** every Memory record belongs to exactly one originating galaxy at creation; cross-galaxy access does not change origin.
- **Canonical object record:** durable canonical records are authoritative; summaries, caches, prompts, and embeddings are derived.
- **Provenance required:** no canonical Memory record exists without source evidence or an explicit user-directed source.
- **State-safe retrieval:** lifecycle, Memory toggle, owner, partition authorization, and retention policy all gate retrieval.
- **No silent overwrite:** corrections and conflicts preserve history.
- **Deletion propagation:** forgetting invalidates canonical active use plus indexes, caches, summaries, and unauthorized replicas.
- **Domain separation:** Identity, Knowledge, Glow, Settings, Projects, Personal Files, and conversation History remain separate authorities.

## Canonical Memory types

| Type | Retains |
| --- | --- |
| Experience | Something the user experienced or reports having experienced |
| Decision | A choice plus relevant context/rationale |
| Person / Relationship | A person and the user's relationship or interaction context |
| Event | Something that occurred and may matter later |
| User-directed | Anything the user explicitly instructs ZCOS to remember, subject to routing/safety rules |

## Items routed elsewhere

- name, email, profile image, Privy wallet -> Identity
- facts, claims, concepts, systems, rules, sources, substantiated relationships -> Knowledge
- explicit interaction preferences and controls -> Settings
- inferred patterns/adaptation/growth -> ZWAP! Discovery / Glow
- tasks, open questions, project state, work products -> Desk / Projects
- original files and stored artifacts -> ZCOS Personal Files Authority; intentional Scholar placement -> ZENITH Logos / Scholar
- conversation transcripts/messages -> History/source; not automatic Memory
- system identity, policy, reasoning rules, tool contracts -> ZCOS Core/system governance

A source may produce multiple routed objects, but each resulting object has one canonical owner.

## Engine layers

1. Capture and classification
2. Source ledger
3. Canonical Memory store
4. Relationship links
5. Lifecycle state machine
6. Retrieval indexes
7. Authorization / partition gates
8. Audit ledger
9. Correction / supersession handling
10. Forgetting / deletion cascade

## Partitions

Exactly eight partitions:

- ZAR
- ZYNC
- ZETA
- ZENO
- ZYLO
- ZWAP!
- ZENITH
- ZILLION

Each galaxy reads and writes its own partition by default. Cross-galaxy access requires an active ZCOS grant and remains auditable.

## Canonical record requirements

A retained Memory record includes at minimum:

- durable record ID
- owner user ID
- originating galaxy ID
- memory type
- canonical name / content
- source ledger references
- topics
- people/projects/entities
- occurredAt where applicable
- created/updated timestamps
- lifecycle state
- confirmation method
- relationships / derivation links
- retention/deletion metadata
- version / correction history
- audit correlation

## Relationship semantics

Required Memory semantics include:

- RELATED_TO
- INVOLVES
- DERIVED_FROM
- SUPERSEDES
- CONTRADICTS
- AFFECTS
- OCCURRED_IN

Relationships never bypass partition authorization.

## Lifecycle

| State | Retrieval behavior |
| --- | --- |
| Proposed | Not used as user truth; reviewable where applicable |
| Active | Eligible only when all gates pass |
| Confirmed | Eligible and favored over unconfirmed conflicting records |
| Corrected | Corrected version eligible; prior version remains historical |
| Superseded | Excluded from ordinary retrieval |
| Rejected | Excluded from retrieval and ordinary re-promotion from the same evidence |
| Forgotten | Never retrievable as content; minimal audit evidence may remain where required |

## User-facing Memory

The interface remains simple:

- **You** — personal experiences, decisions, people/relationships, and user-directed memories.
- **Topics** — the same canonical records grouped by recurring subjects.
- **Galaxies** — entry to each actual Memory partition.

`Tell ZAR what to remember` is a direct user-directed Memory input and may enter as Confirmed after required validation/routing.

## Memory toggle

Settings / Memory contains Enable Memory, Memory Summary, and Manage Memory.

When Memory is off:

- ZCOS creates no new long-term memories,
- ZCOS retrieves no existing Memory for responses,
- existing Memory remains preserved unless deleted,
- conversation History follows its own retention controls,
- re-enabling restores authorized access but does not backfill disabled-period conversations.

## Retrieval and truth

- Proposed records never appear as confirmed truth.
- Corrected records replace prior meaning for ordinary use while preserving history.
- Superseded records are excluded from ordinary retrieval.
- Conflicts remain distinguishable and may trigger review/inquiry.
- Retrieval must satisfy owner, partition, lifecycle, toggle, retention, source, and objective relevance gates.
- Directly confirmed corrections outrank older extraction confidence.
- Vector index loss must be repairable from canonical records.

## Forgetting

A forgotten Memory cannot be found through semantic, keyword, topic, entity, date, relationship, summary, cache, or cross-galaxy retrieval. Deletion propagation is idempotent and remains incomplete/failed until required derivatives are invalidated. The same source must not silently recreate a forgotten record.

## Guardrails

Do not build:

- a second Memory graph,
- automatic disabled-period backfill,
- a shared personal-memory folder,
- keyword-only truth retrieval,
- silent conflict overwrites,
- fallback-owner behavior,
- UI complexity merely because backend governance is sophisticated.

Reusable Object Memory components should be integrated before replacements are invented, and legacy writers must be blocked before canonical cutover is considered complete.
