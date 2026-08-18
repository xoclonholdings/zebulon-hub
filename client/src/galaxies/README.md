# ZCOS Galaxy Partitions

This directory is the canonical frontend partition boundary for the eight ZCOS galaxies.

Every galaxy contains the same seven shared domains:

- `identity`
- `memory`
- `knowledge`
- `apps`
- `desk`
- `settings`
- `portal`

Each galaxy also owns its named Console implementation and its one specialized Desk. Shared Identity and authentication remain ZCOS authorities; galaxy folders do not create independent identities or authentication systems.

Canonical registry: `registry.ts`.

The eight partitions are:

- `zar` — NEXYS / Operate
- `zync` — CANVAS / Build
- `zeta` — CONTROL / Integrity
- `zeno` — UNITE / Forum
- `zylo` — COMPASS / Automate
- `zwap` — DISCOVERY / Explore
- `zenith` — LOGOS / Scholar
- `zillion` — PROSPER / Capital

Do not add a ninth galaxy or duplicate a shared domain without an explicit architecture amendment.
