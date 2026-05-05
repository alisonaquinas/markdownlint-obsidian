# Phase E2 Tickets

## FEAT-003: Typed Core Adapter And Configuration Boundary

Status: `draft`

Goal: let the extension decide eligibility, resolve settings, and call the
bundled library through public APIs without publishing diagnostics yet.

Linked plan: [Phase E2](../phase-e2-core-adapter-and-config.md)

Child tickets:

| Ticket | Type | Title | Status |
| :--- | :--- | :--- | :--- |
| `TASK-006` | task | Implement bundled library adapter | `open` |
| `TASK-007` | task | Implement settings and config resolution | `open` |
| `TASK-008` | task | Implement Flavor Grenade dependency state | `open` |
| `TASK-009` | task | Implement document eligibility service | `open` |
| `SPIKE-001` | spike | Confirm public library API shape for live text lint | `open` |

Acceptance criteria:

- [ ] extension imports only public package exports.
- [ ] adapter tests prove no CLI runtime path is used.
- [ ] eligibility decisions are deterministic and covered.
- [ ] missing Flavor Grenade state is visible but non-crashing.

## TASK-006: Implement Bundled Library Adapter

Scope: add typed adapter interfaces for lint, fix, config loading, and
formatter access through `markdownlint-obsidian` public exports.

Done when unit tests verify adapter calls and no code spawns or resolves the
CLI.

## TASK-007: Implement Settings And Config Resolution

Scope: read VS Code settings, validate runtime values, find supported config
files, and model effective configuration.

Done when defaults, invalid values, explicit config paths, and missing config
cases are covered.

## TASK-008: Implement Flavor Grenade Dependency State

Scope: detect installed, missing, disabled, and inactive
`alisonaquinas.flavor-grenade-lsp` states.

Done when dependency state is exposed to eligibility and output formatting.

## TASK-009: Implement Document Eligibility Service

Scope: accept automatic live lint only for `languageId === "ofmarkdown"` and
reject unsupported URI schemes, disabled session state, and dependency gaps.

Done when `ofmarkdown`, `markdown`, untitled, virtual, and disabled cases are
covered.

## SPIKE-001: Confirm Public Library API Shape For Live Text Lint

Question: can the bundled library lint current in-memory document text without
round-tripping through the CLI or stale files?

Expected output: adapter design note, core API follow-up task, or ADR update.
