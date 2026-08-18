# Zebulon Commander Operating System (ZCOS)

This repository is the implementation home of **ZCOS**.

Start with [`SPEC.md`](./SPEC.md), then read [`docs/specifications/`](./docs/specifications/README.md) before changing architecture, ownership, routing, authentication, persistence, galaxy boundaries, or Dock behavior.

## Canonical source layout

- `client/src/system/` — system-level ZCOS experience surfaces such as the constellation and Command Desk.
- `client/src/galaxies/` — the eight galaxy partitions: ZAR, ZYNC, ZETA, ZENO, ZYLO, ZWAP!, ZENITH, ZILLION.
- `server/` — ZCOS server runtime, routes, persistence, and authority enforcement.
- `prisma/` — canonical database schema and migrations.
- `docs/specifications/` — governing implementation documents.

ZCOS Auth is universal auth. Identity exists once at ZCOS level and is referenced across all galaxies.

`xoclonholdings/ZedAI` is a migration source. Its historical directory topology does not define this repository's architecture.
