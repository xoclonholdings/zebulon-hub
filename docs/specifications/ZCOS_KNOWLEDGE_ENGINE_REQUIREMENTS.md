# ZCOS Knowledge Engine Requirements

**Status:** Locked for implementation  
**Authority:** ZCOS Architecture Foundation and ZCOS Memory Engine compatibility boundaries  
**Canonical rule:** One ZCOS Knowledge Engine. Eight galaxy partitions. Knowledge is source-backed, lifecycle-governed, provenance-preserving, curation-aware, and separate from Memory.

## Purpose

Knowledge holds what ZCOS understands and can substantiate. It does not own personal experience merely because the system has encountered it, and it does not convert uploaded source material directly into truth.

## Non-negotiable invariants

- One canonical Knowledge Engine.
- Eight galaxy partitions: ZAR, ZYNC, ZETA, ZENO, ZYLO, ZWAP!, ZENITH, ZILLION.
- Authenticated owner binding for user-owned knowledge operations.
- Knowledge and Memory remain separate authorities.
- Source evidence and provenance are required for canonical Knowledge.
- Cross-galaxy access is deny-by-default and requires an active ZCOS grant.
- Vector, keyword, graph, topic, relationship, and semantic retrieval structures are indexes/projections, never competing canonical truth stores.
- Conflicts, uncertainty, currency, gaps, and multiple supported senses remain representable.
- No automatic upload-to-truth promotion.

## Required user-facing surfaces

1. **Topics** — knowledge organized by subject.
2. **Knowledge Map** — concepts, facts, claims, rules, systems, and relationships.
3. **Sources** — UGC/Uploaded or Extracted/Compiled origin plus evidence and provenance.
4. **Lexicon** — meanings, terminology, slang, symbols, and contextual language.
5. **Curation** — conflicts, duplicates, confidence, currency, gaps, and open questions.

Origin is metadata under Sources; it is not a sixth Knowledge surface.

## Partition governance

- Every canonical Knowledge record retains originating galaxy and source record.
- Each galaxy accesses its own partition by default.
- All Knowledge provides a governed unified view without creating a second store.
- Admin Access controls cross-galaxy Knowledge authorization.
- Read, write, contribute, promote/share, and curate are separate permissions.

## Canonical Knowledge object categories

Canonical Knowledge includes source-backed:

- facts,
- claims,
- concepts,
- systems,
- rules,
- definitions/senses,
- source records,
- substantiated relationships.

Profile data belongs to Identity. Personal experiences belong to Memory. Explicit controls belong to Settings. Adaptation belongs to Glow. Tasks and work products belong to Desk/Projects. Original files belong to the Personal Files Authority and intentional Scholar placement belongs to ZENITH.

## Evidence and provenance

Knowledge must retain enough evidence to answer:

- what is being asserted,
- where it came from,
- which source/version supports it,
- how it was extracted or created,
- who/what reviewed or promoted it,
- confidence/status/currency,
- which galaxy originated it,
- what conflicts with it,
- what later superseded or corrected it.

Source diversity and freshness may affect confidence but do not silently erase conflicting supported records.

## Ingestion

Ingestion is processing, not authority. A file, URL, message, conversation, tool result, or external source may produce candidates and derived text, but canonical Knowledge requires source linking, domain routing, lifecycle/status assignment, and required authorization.

Original source bytes remain under the Personal Files Authority where applicable. Derived claims link back to the exact file ID/version/hash or external source identity used.

## Lexicon

Lexicon resolves contextual meanings, terminology, slang, symbols, and language senses. It must be galaxy-aware and context-aware rather than assuming one flattened meaning for every token.

Lexicon resolution may guide interpretation and retrieval, but it cannot rewrite user Identity, Memory, Settings, or policy.

## Curation

Curation manages:

- conflicts,
- duplicates,
- confidence,
- currency/freshness,
- gaps,
- source diversity,
- open questions,
- review outcomes.

Curation reports are projections over canonical Knowledge, not another authority. Knowledge Curation must not depend on Memory as its canonical store.

## Retrieval

Retrieval must gate by:

- authenticated owner,
- galaxy partition and active grants,
- lifecycle/status,
- source/evidence requirements,
- confidence/review state,
- currency where material,
- objective relevance,
- domain separation.

Keyword-only retrieval is insufficient for canonical truth selection. Semantic/vector search remains an index and must be reconstructable from durable canonical records.

## Conflict handling

The engine must preserve materially conflicting claims as distinguishable objects when evidence supports them. It may resolve context-specific differences, mark one as superseded, or request review, but it must not silently flatten disagreement into one unsupported truth.

## Response traceability

Response traces should identify which Knowledge objects, claims, sources, and Lexicon senses materially supported an answer without exposing private chain-of-thought. This is evidence/provenance traceability, not hidden reasoning disclosure.

## Migration direction

Reusable object, source, graph, ingestion, Lexicon, curation, and retrieval components from the migration source may be preserved only after they are assigned to this canonical authority.

Memory-backed curation, filesystem JSON truth, overlapping graphs, keyword-only selection, and galaxy-blind Lexicon behavior must be retired or adapted after replacement paths are verified and legacy writers are blocked.

## Guardrails

Do not build:

- a third Knowledge graph,
- a shared user-data folder as truth authority,
- automatic upload-to-truth promotion,
- a single flattened claim per topic,
- galaxy-blind Lexicon resolution,
- Memory-backed Knowledge curation,
- keyword-only truth retrieval,
- fallback-owner behavior.

Preserve the approved five-surface Knowledge structure and existing visual design unless a separate UI specification authorizes change.
