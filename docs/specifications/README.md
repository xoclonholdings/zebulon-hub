# ZCOS Documentation Authority

This directory contains the specifications that govern the `xoclonholdings/zebulon-hub` implementation.

## Read order

1. [`/SPEC.md`](../../SPEC.md) — repository-level canonical ZCOS contract.
2. [`ZCOS_ARCHITECTURE_FOUNDATION.md`](./ZCOS_ARCHITECTURE_FOUNDATION.md) — locked system ownership and boundaries.
3. [`ZCOS_MEMORY_ENGINE_SPECIFICATION.md`](./ZCOS_MEMORY_ENGINE_SPECIFICATION.md) — canonical Memory contract.
4. [`ZCOS_KNOWLEDGE_ENGINE_REQUIREMENTS.md`](./ZCOS_KNOWLEDGE_ENGINE_REQUIREMENTS.md) — canonical Knowledge contract.
5. [`ZCOS_UNIVERSAL_DOCK_SPECIFICATION.md`](./ZCOS_UNIVERSAL_DOCK_SPECIFICATION.md) — locked five-control Dock baseline.
6. [`ZCOS_ZAR_REPOSITORY_MIGRATION_PLAN.md`](./ZCOS_ZAR_REPOSITORY_MIGRATION_PLAN.md) — migration sequence and evidence rules.

## Locked source PDFs

The original locked source documents are retained in [`source-pdfs/`](./source-pdfs/) alongside the repository-readable Markdown contracts:

- [`ZCOS_ARCHITECTURE_FOUNDATION.pdf`](./source-pdfs/ZCOS_ARCHITECTURE_FOUNDATION.pdf)
- [`ZCOS_MEMORY_ENGINE_SPECIFICATION.pdf`](./source-pdfs/ZCOS_MEMORY_ENGINE_SPECIFICATION.pdf)
- [`ZCOS_KNOWLEDGE_ENGINE_REQUIREMENTS.pdf`](./source-pdfs/ZCOS_KNOWLEDGE_ENGINE_REQUIREMENTS.pdf)
- [`ZCOS_ZAR_REPOSITORY_MIGRATION_PLAN.pdf`](./source-pdfs/ZCOS_ZAR_REPOSITORY_MIGRATION_PLAN.pdf)

The PDFs remain source authority. The Markdown files make that authority searchable inside the repository and must not silently narrow or replace the locked source documents.

## Authority rule

The specifications define the target. Existing code, old ZedAI topology, generated bundles, historical exports, screenshots, and prior repository organization are implementation evidence or migration sources only. They do not override a locked specification.

## Current repository identity

- System: Zebulon Commander Operating System (ZCOS)
- Repository: `xoclonholdings/zebulon-hub`
- Migration source: `xoclonholdings/ZedAI`
- Universal identity authority: ZCOS Identity
- Universal authentication authority: ZCOS Auth
- Galaxies: ZAR, ZYNC, ZETA, ZENO, ZYLO, ZWAP!, ZENITH, ZILLION
- Shared galaxy domains: Identity, Memory, Knowledge, Apps, Desk, Settings, Portal

Builders must read the documentation before changing architecture, ownership, routing, authentication, persistence, or Dock behavior.
