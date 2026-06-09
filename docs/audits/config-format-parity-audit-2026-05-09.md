---
title: "Config Format Parity Audit - 2026-05-09"
aliases:
  - "Config Format Parity Audit - 2026-05-09"
tags:
  - "docs"
  - "docs/audits"
  - "configuration"
type: "audit"
status: "current"
updated: 2026-05-09
up: "[[README]]"
---

# Config Format Parity Audit - 2026-05-09

## Scope

Audited `markdownlint-obsidian` config loading against the file format matrix
documented in [[research/markdownlint-cli2-config-loading-analysis]] and
formalized in [[requirements/config-format-parity]].

The audit focused on whether settings files are parsed and applied, not on the
larger future work of per-directory effective config grouping.

## Findings Before Remediation

| Area | Finding | Impact |
| :--- | :--- | :--- |
| Discovered CLI2 files | `.markdownlint-cli2.cjs` and `.markdownlint-cli2.mjs` were ignored; `.yaml` was attempted through JSONC parsing. | Valid upstream config files could be silently skipped or fail incorrectly. |
| Discovered markdownlint files | `.markdownlint.json`, `.yml`, `.cjs`, and `.mjs` were not part of discovery. | Existing markdownlint workspaces lost rule config when moving to OFM linting. |
| Markdownlint rule semantics | `.markdownlint.*` contents were treated like OFM settings and could fail validation. | Standard rule config did not reliably reach `LinterConfig.rules`. |
| Explicit config paths | Passing a file path to `loadConfig` treated that path like a directory. | CLI `--config` could appear accepted while the file was not loaded. |
| Parser diagnostics | Malformed discovered JSONC was swallowed as if no config existed. | Bad config could be missed instead of surfacing an `OFM901` failure. |
| TOML explicit config | TOML was unsupported. | `markdownlint-cli2` explicit-config workflows using TOML had no compatibility path. |

## Remediation Implemented

- Added a requirements baseline in [[requirements/config-format-parity]].
- Added TDD coverage for every discovered CLI2 file format:
  `.markdownlint-cli2.jsonc`, `.yaml`, `.cjs`, and `.mjs`.
- Added TDD coverage for every discovered markdownlint rule file format:
  `.markdownlint.jsonc`, `.json`, `.yaml`, `.yml`, `.cjs`, and `.mjs`.
- Added TDD coverage for `.obsidian-linter.jsonc` and `.obsidian-linter.yaml`.
- Added explicit config path coverage for `.jsonc`, `.json`, `.yaml`, `.yml`,
  `.toml`, `.cjs`, and `.mjs`.
- Added JSONC behavior coverage for comments and trailing commas in `.json`.
- Added source-path diagnostics coverage for malformed config files.
- Normalized `.markdownlint.*` and embedded CLI2 `config` objects into
  `LinterConfig.rules`.
- Added `smol-toml` for explicit TOML config parsing.

## Remaining Work

These are out of scope for this remediation slice and remain Phase 15 work:

- `--configPointer` selection across JSON, YAML, TOML, CJS, and MJS.
- `extends` resolution for markdownlint rule config.
- Full directory-to-effective-config grouping for mixed nested configs.
- Exact `markdownlint-cli2` shallow merge semantics for all CLI2 option
  branches. Current `rules` merging still preserves OFM safety defaults.
- Runtime support for `markdownItPlugins` and output formatter module loading.

## Verification

| Check | Result |
| :--- | :--- |
| `bun test packages/core/tests/unit/config/ConfigLoader.test.ts --timeout 30000` | Pass |
| `bun run typecheck` | Pass |
| `bun run lint` | Pass with max-lines warnings only |
| `bun run test:dogfood` | Pass |
| `bun run --cwd packages/core test --timeout 30000` | Pass |
| `bun run test:all` | Pass |
