---
title: "Config Format Parity Requirements"
aliases:
  - "Config Format Parity"
  - "markdownlint-cli2 Config Format Parity"
tags:
  - "docs"
  - "docs/requirements"
  - "configuration"
type: "requirements"
status: "current"
updated: 2026-05-09
up: "[[requirements/index]]"
---

# Config Format Parity Requirements

`markdownlint-obsidian` must process the same configuration file formats as
`markdownlint-cli2` where those formats affect lint behavior. The baseline is
[[research/markdownlint-cli2-config-loading-analysis]].

## Requirement CFG-001: Discovered CLI2 Options Files

The config loader must discover these `markdownlint-cli2` option files while
walking configuration directories:

| File | Required parser |
| :--- | :--- |
| `.markdownlint-cli2.jsonc` | JSONC |
| `.markdownlint-cli2.yaml` | YAML |
| `.markdownlint-cli2.cjs` | Node module default export |
| `.markdownlint-cli2.mjs` | Node module default export |

CLI2 option files may contain workspace behavior such as `globs`, `ignores`,
`customRules`, and `fix`. They may also contain embedded markdownlint rule
configuration under `config`.

## Requirement CFG-002: Discovered Markdownlint Rule Files

The config loader must discover these markdownlint rule config files while
walking configuration directories:

| File | Required parser |
| :--- | :--- |
| `.markdownlint.jsonc` | JSONC |
| `.markdownlint.json` | JSONC |
| `.markdownlint.yaml` | YAML |
| `.markdownlint.yml` | YAML |
| `.markdownlint.cjs` | Node module default export |
| `.markdownlint.mjs` | Node module default export |

These files configure standard markdownlint rules only. They must not be
treated as OFM-specific settings files.

## Requirement CFG-003: Obsidian Settings Files

The project-specific `.obsidian-linter.*` files remain supported:

| File | Required parser |
| :--- | :--- |
| `.obsidian-linter.jsonc` | JSONC |
| `.obsidian-linter.yaml` | YAML |

These files may contain OFM-specific settings such as `vaultRoot`, `resolve`,
`wikilinks`, `callouts`, `embeds`, `frontmatter`, `tags`, `blockRefs`,
`highlights`, and `comments`.

## Requirement CFG-004: Parser Behavior

JSON and JSONC config files must be parsed with JSONC semantics, including
comments and trailing commas. YAML files must be parsed with YAML semantics.
CJS and MJS files must load the module default export.

Parser failures must produce an `OFM901` configuration error that identifies
the source file.

## Requirement CFG-005: Explicit Config Paths

Explicit `--config` and programmatic config paths must accept files with these
recognized extensions:

| Extension | Required parser |
| :--- | :--- |
| `.jsonc` | JSONC |
| `.json` | JSONC |
| `.yaml` | YAML |
| `.yml` | YAML |
| `.toml` | TOML |
| `.cjs` | Node module default export |
| `.mjs` | Node module default export |

TOML support is required for explicit config paths. TOML is not required for
automatic fixed-name discovery because `markdownlint-cli2` does not discover
`.markdownlint-cli2.toml` or `.markdownlint.toml` by directory walk.

## Requirement CFG-006: File Family Semantics

The loader must keep these meanings distinct:

| Family | Meaning |
| :--- | :--- |
| `.markdownlint-cli2.*` | CLI2-compatible options plus optional embedded `config` |
| `.markdownlint.*` | Standard markdownlint rule configuration |
| `.obsidian-linter.*` | OFM-specific settings plus compatibility options |

A `.markdownlint.*` file must map standard markdownlint rule keys into
`LinterConfig.rules` without allowing OFM-only settings.

## Requirement CFG-007: Merge Semantics

CLI2-compatible option merging must be shallow, with one additional shallow
merge for the embedded `config` object. Arrays replace rather than concatenate.
Nested rule option objects replace rather than deep-merge.

OFM default safety behavior, including standard markdownlint conflict disables,
must be preserved by a separate normalization/defaulting step so compatibility
does not drop Obsidian-safe defaults.

## Requirement CFG-008: Precedence

For a root-level lint run, effective configuration must be ordered from lowest
to highest precedence:

1. Built-in defaults.
2. Explicit config path, when supplied.
3. Discovered `.markdownlint-cli2.*` files.
4. Discovered `.obsidian-linter.*` files.
5. Discovered `.markdownlint.*` rule files.
6. Programmatic or CLI flag overrides.

For nested directories, nearer discovered config must override farther ancestor
config within the same family semantics.

## Requirement CFG-009: Test Coverage

Implementation must be driven by tests. Coverage must include:

- every discovered file name in CFG-001, CFG-002, and CFG-003;
- every explicit parser extension in CFG-005;
- JSONC comments and trailing commas in `.json` and `.jsonc`;
- YAML and TOML parsing;
- CJS and MJS default exports;
- source-path diagnostics for malformed files;
- family semantics for `.markdownlint.*` versus `.markdownlint-cli2.*`;
- preservation of OFM default rule disables after user overrides.

## Requirement CFG-010: Documentation Traceability

Implementation docs, config-domain docs, and the Phase 15 plan must link back
to this requirements page and to the research baseline. Any intentional
divergence from `markdownlint-cli2` must be documented with rationale.
