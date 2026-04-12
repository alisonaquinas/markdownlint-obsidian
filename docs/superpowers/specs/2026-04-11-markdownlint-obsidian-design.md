# markdownlint-obsidian — Design Spec

**Date:** 2026-04-11
**Status:** Approved
**Author:** Alison Aquinas + Claude

---

## Overview

`markdownlint-obsidian` is a Node.js/TypeScript CLI tool for linting Obsidian Flavored Markdown (OFM) files in GitHub repositories, enabling CI jobs to enforce OFM-specific and standard Markdown quality rules on Obsidian vaults. It mirrors the inputs, outputs, and design patterns of [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2) while adding vault-aware features that markdownlint-cli2 cannot support.

---

## Goals

- Full-featured OFM linting for CI pipelines (GitHub Actions, pre-commit, Docker)
- Mirror markdownlint-cli2's UX (same flags, exit codes, config formats, formatter API)
- Vault-aware wikilink resolution on by default (auto-detect vault root via `.obsidian/` or git root)
- Import and run standard markdownlint rules (MD001–MD049) alongside OFM-specific rules
- Ship as npm package `markdownlint-obsidian`
- Dogfood: the `docs/` folder of this repo is linted by this tool

## Non-Goals

- In-app Obsidian plugin (future work, tracked in `docs/guides/obsidian-plugin.md`)
- Replacing markdownlint-cli2 for non-OFM Markdown

---

## Architecture Policy

These are enforced gates, not guidelines. All policies are verified in CI. Reading order: TDD → SOLID → File/Complexity → High Coherence → Low Coupling → Linting/Tooling → TSDoc → Type Safety → DDD Layer Structure.

### Test-Driven Development

All production code enters through failing tests (red → green → refactor). Four test levels:

| Level | Speed | Scope |
|---|---|---|
| Unit | <1 ms | Single function/class, no I/O |
| Component | Fast | Module boundary, no filesystem |
| Integration | Seconds | Real files, real vault fixtures |
| BDD / Acceptance | CI-gated | Full CLI process, feature scenarios |

Tool: **vitest**. Property-based tests via **fast-check**. No mocks for domain logic — use real fixture files.

### SOLID Principles (TypeScript)

- **SRP** — one reason to change per module; each file exports one public class or function set
- **OCP** — use TypeScript `interface` and strategy pattern at extension points (formatters, rules, resolvers)
- **LSP** — no special-case call sites; subtypes fully honour their contracts
- **ISP** — narrow, role-focused interfaces; no god-interfaces
- **DIP** — domain layer depends only on abstractions; infrastructure implements them. Domain code never imports filesystem, markdown-it, or CLI libraries directly.

### File and Complexity Policy

| Limit | Value | Enforcement |
|---|---|---|
| Cyclomatic complexity | 7 per function | `eslint complexity` rule |
| File length (soft) | 200 lines | ESLint `max-lines` |
| Function length | 30 lines | ESLint `max-lines-per-function` |
| Public exports per file | 1 class or cohesive set | Code review |

### High Coherence

- One bounded context per package (`linting`, `vault`, `config`)
- One domain concept per module
- Dependency direction is acyclic: `domain` ← `application` ← `infrastructure` ← `cli`

### Low Coupling

- Dependencies are explicit, narrow, stable, and acyclic
- Domain never imports IO or framework libraries (`node:fs`, `node:fs/promises`, `node:child_process`, `node:net`, `node:http`, `markdown-it`, `gray-matter`, `globby`, `commander`). Pure-stdlib string utilities (`node:path`, `node:url`, `node:querystring`) are allowed when used for format-only normalisation — see [[adr/ADR005-node-path-in-domain]].
- Cross-boundary contracts defined as TypeScript interfaces
- No module-level mutable state; no implicit I/O at import time

### Linting and Tooling

| Tool | Purpose |
|---|---|
| `tsc --strict` | Type safety (replaces mypy) |
| `eslint` | Lint rules including complexity, max-lines, import order |
| `prettier` | Formatting |
| `vitest` | Test runner |
| `vitest --coverage` (c8) | 90%+ coverage for domain/application layers, 80%+ for infrastructure |
| `markdownlint-cli2` | Vanilla markdown files (CLAUDE.md, AGENTS.md, etc.) |
| `markdownlint-obsidian` | OFM files in `docs/` (dogfood) |

Warnings are errors. Every suppression (`// eslint-disable`, `// @ts-ignore`) requires an explanatory comment.

### TSDoc Comments

Every exported symbol has a TSDoc comment: one-line summary + `@param`, `@returns`, `@throws` where applicable. First line is imperative mood. No invented guarantees or stale examples.

### Type Safety

TypeScript strict mode (`strict: true` in `tsconfig.json`) plus:

```jsonc
{
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

Value objects use `readonly` properties. Domain types never use `any`. `unknown` is preferred at system boundaries (file I/O, config parsing). Every `// @ts-ignore` or `as` cast requires a bracket code and explanation.

---

## Architecture — Source Layout (DDD Layers)

The source tree follows a strict Domain-Driven Design layering. Dependencies flow inward only: `cli` → `infrastructure` → `application` → `domain`.

```
src/
│
├── domain/                        # Pure domain — zero I/O, zero framework deps
│   ├── linting/                   # Linting bounded context
│   │   ├── LintError.ts           # Value object: error code, line, col, message, severity
│   │   ├── LintResult.ts          # Value object: per-file result set
│   │   ├── OFMRule.ts             # Interface: rule contract
│   │   ├── RuleRegistry.ts        # Domain service: register + look up rules
│   │   └── RuleParams.ts          # Value object: what a rule receives
│   ├── vault/                     # Vault bounded context
│   │   ├── VaultPath.ts           # Value object: typed, normalized vault-relative path
│   │   ├── VaultIndex.ts          # Domain service: file index + wikilink resolution
│   │   └── WikilinkNode.ts        # Value object: parsed wikilink structure
│   └── config/                    # Config bounded context
│       ├── LinterConfig.ts        # Value object: merged, validated config
│       └── RuleConfig.ts          # Value object: per-rule enable/disable + options
│
├── application/                   # Orchestration — coordinates domain services
│   ├── LintUseCase.ts             # Use case: given files + config, produce results
│   ├── FixUseCase.ts              # Use case: apply auto-fixes and write back
│   └── VaultBootstrap.ts          # Use case: detect vault root, build VaultIndex
│
├── infrastructure/                # I/O, parsing, external library adapters
│   ├── parser/
│   │   ├── MarkdownItParser.ts    # Adapter: markdown-it + OFM plugins → ParseResult
│   │   └── FrontmatterParser.ts   # Adapter: gray-matter → frontmatter object
│   ├── rules/
│   │   ├── ofm/                   # Built-in OFM rules (OFM001–OFM199)
│   │   │   ├── wikilinks/
│   │   │   ├── embeds/
│   │   │   ├── callouts/
│   │   │   ├── tags/
│   │   │   ├── frontmatter/
│   │   │   ├── block-references/
│   │   │   └── highlights/
│   │   └── standard/              # markdownlint MD001–MD049 adapters
│   ├── config/
│   │   ├── ConfigLoader.ts        # Walks dir tree, merges config files
│   │   └── ConfigValidator.ts     # Validates merged config against schema
│   ├── formatters/
│   │   ├── DefaultFormatter.ts
│   │   ├── JsonFormatter.ts
│   │   ├── JUnitFormatter.ts
│   │   └── SarifFormatter.ts
│   └── vault/
│       ├── VaultDetector.ts       # Walks up for .obsidian/, falls back to git root
│       └── FileIndexBuilder.ts    # Scans vault root, builds VaultIndex
│
└── cli/                           # Entry point only — arg parsing, process exit
    ├── main.ts
    └── args.ts
```

---

## BDD Layer

Acceptance-level behaviour is specified in Gherkin and executed by **cucumber-js** against the real CLI binary.

```
bdd/
├── features/                      # Gherkin .feature files — one per OFM feature area
│   ├── wikilinks.feature
│   ├── embeds.feature
│   ├── callouts.feature
│   ├── tags.feature
│   ├── frontmatter.feature
│   ├── block-references.feature
│   ├── highlights.feature
│   ├── vault-detection.feature
│   ├── config-cascade.feature
│   └── ci-exit-codes.feature
│
└── steps/                         # Step definitions (TypeScript)
    ├── world.ts                   # Shared World: temp vault, CLI runner, result capture
    ├── file-steps.ts              # Given: file with content / vault structure
    ├── cli-steps.ts               # When: run CLI with args
    └── assertion-steps.ts         # Then: exit code, error codes, line numbers
```

**Scenario example (`wikilinks.feature`):**

```gherkin
Feature: Wikilink resolution

  Scenario: Broken wikilink is an error by default
    Given a vault with file "notes/index.md" containing "[[missing-page]]"
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 1
    And error OFM001 is reported on line 1

  Scenario: Resolution can be disabled
    Given a vault with file "notes/index.md" containing "[[missing-page]]"
    When I run markdownlint-obsidian on "notes/index.md" with "--no-resolve"
    Then the exit code is 0
```

BDD scenarios are the source of truth for observable CLI behaviour. Unit and integration tests cover implementation details; BDD scenarios cover user-facing contracts.

---

## Configuration System

Config files are discovered by walking up from each linted file's directory to the vault root. Closer configs win.

### Precedence (highest → lowest)

1. CLI `--config` flag
2. `.markdownlint-cli2.jsonc` / `.yaml` / `.cjs` / `.mjs` (per-directory)
3. `.obsidian-linter.jsonc` / `.yaml` (OFM-specific options, per-directory)
4. `.markdownlint.jsonc` / `.yaml` (rule config only, per-directory)
5. `package.json#/markdownlint` (root only)
6. Built-in defaults

### `.obsidian-linter.jsonc` — OFM-specific keys

```jsonc
{
  "vaultRoot": "./",           // explicit override; auto-detected if omitted
  "resolve": true,             // wikilink resolution on by default
  "wikilinks": {
    "caseSensitive": false,    // Obsidian is case-insensitive by default
    "allowAlias": true
  },
  "callouts": {
    "allowList": ["NOTE", "WARNING", "TIP", "IMPORTANT", "CAUTION"]
  },
  "frontmatter": {
    "required": ["tags"],
    "dateFields": ["created", "modified"]
  }
}
```

Standard markdownlint-cli2 keys (`config`, `customRules`, `globs`, `ignores`, `gitignore`, `fix`, `outputFormatters`) work identically to markdownlint-cli2.

### Inline rule disabling

```markdown
<!-- markdownlint-disable OFM001 -->
<!-- markdownlint-disable MD013 -->
```

---

## Parsing Pipeline

Each file passes through a single markdown-it instance configured with OFM plugins. The parser runs once per file; all rules consume the shared output.

### OFM plugins loaded by default

| Plugin | Handles |
|---|---|
| `markdown-it-wikilinks` | `[[page]]`, `[[page\|alias]]`, `[[page#heading]]`, `![[embed]]` |
| `markdown-it-obsidian-tags` | `#tag`, `#nested/tag` in body text |
| `markdown-it-callout` | `> [!NOTE]` callout blocks |
| `markdown-it-highlight` | `==highlighted text==` |
| `markdown-it-comment` | `%%comment blocks%%` |
| `gray-matter` | YAML/TOML frontmatter (stripped before markdown-it, parsed separately) |

### Parse output per file

```typescript
interface ParseResult {
  frontmatter: Record<string, unknown>;
  tokens: Token[];
  wikilinks: WikilinkNode[];
  embeds: EmbedNode[];
  callouts: CalloutNode[];
  tags: TagNode[];
  blockRefs: BlockRefNode[];
  raw: string;
  lines: string[];
}
```

### Vault context

Built once before any file is linted — an index of all `.md` files under vault root. Wikilink resolution hits the index (O(1) after build), not the filesystem. Concurrent linting remains fast on large vaults.

---

## Rule System & Error Codes

### Rule object shape

```typescript
interface OFMRule {
  names: string[];          // ["OFM001", "no-broken-wikilinks"]
  description: string;
  tags: string[];           // ["wikilinks", "links"]
  severity: "error" | "warning";
  fixable: boolean;
  function: (params: RuleParams, onError: OnErrorCallback) => void;
}
```

### Rule sources

| Source | Codes | Notes |
|---|---|---|
| markdownlint library | MD001–MD049 | Imported directly; OFM-conflicting rules auto-disabled with documented rationale |
| markdownlint-obsidian built-in | OFM001–OFM199 | OFM-specific rules |
| Custom user rules | Any other prefix | Via `customRules` config |

### Error code taxonomy

| Range | Area | Examples |
|---|---|---|
| OFM001–019 | Wikilinks | OFM001 broken-wikilink, OFM002 invalid-wikilink-format |
| OFM020–039 | Embeds | OFM020 broken-embed, OFM021 invalid-embed-syntax |
| OFM040–059 | Callouts | OFM040 unknown-callout-type, OFM041 malformed-callout |
| OFM060–079 | Tags | OFM060 invalid-tag-format, OFM061 tag-depth-exceeded |
| OFM080–099 | Frontmatter | OFM080 missing-required-key, OFM081 invalid-date-format |
| OFM100–119 | Block references | OFM100 invalid-block-ref, OFM101 duplicate-block-id |
| OFM120–139 | Highlights / Comments | OFM120 disallowed-highlight, OFM121 disallowed-comment |
| OFM900–999 | Config / tool errors | OFM900 vault-root-not-found, OFM901 invalid-config |

### MD rules disabled by default (OFM conflicts)

Rules that conflict with OFM syntax are disabled in the default config with documented rationale in `docs/rules/standard-md/`. Examples:

- `MD013` (line-length) — long wikilinks routinely exceed column limits
- `MD042` (no-empty-links) — does not understand `[[]]` OFM syntax

---

## CLI Interface

```
Usage: markdownlint-obsidian [options] <globs...>

Options:
  --config <path>          Explicit config file path
  --configPointer <ptr>    JSON Pointer into config file (e.g. #/markdownlint)
  --fix                    Auto-fix fixable errors in-place
  --format                 Read stdin, write linted/fixed content to stdout
  --no-globs               Ignore globs property in config file
  --vault-root <path>      Override auto-detected vault root
  --no-resolve             Disable wikilink resolution for this run
  --help                   Display help
  --version                Print version

Exit codes:
  0   Clean — no errors
  1   Lint errors found
  2   Tool / configuration failure
```

### CI integration

**GitHub Actions:**

```yaml
- uses: mscottx88/markdownlint-obsidian-action@v1
  with:
    globs: "docs/**/*.md"
```

**Pre-commit:**

```yaml
- repo: https://github.com/mscottx88/markdownlint-obsidian
  rev: v1.0.0
  hooks:
    - id: markdownlint-obsidian
```

**Docker:**

```bash
docker run -v $PWD:/workdir markdownlint-obsidian "**/*.md"
```

---

## `docs/` Folder Structure

The `docs/` folder is an Obsidian Flavored Markdown wiki maintained by LLMs (per the `llm-wiki.md` pattern). It serves dual purpose: project documentation and live dogfood target for the linter.

```
docs/
├── index.md                    # Wiki catalog — every page listed with one-line summary
├── log.md                      # Append-only chronological record of wiki changes
│
├── ddd/                        # Domain-Driven Design layer (design docs)
│   ├── ubiquitous-language.md  # Canonical glossary — all code uses these terms
│   ├── bounded-contexts.md     # Context map: linting / vault / config
│   ├── linting/
│   │   └── domain-model.md     # LintError, LintResult, Rule, RuleRegistry
│   ├── vault/
│   │   └── domain-model.md     # VaultIndex, VaultPath, WikilinkNode
│   └── config/
│       └── domain-model.md     # LinterConfig, RuleConfig, cascade logic
│
├── bdd/                        # Behaviour-Driven Design layer (feature specs)
│   ├── features/               # Gherkin .feature files — source of truth for CLI behaviour
│   │   ├── wikilinks.feature
│   │   ├── embeds.feature
│   │   ├── callouts.feature
│   │   ├── tags.feature
│   │   ├── frontmatter.feature
│   │   ├── block-references.feature
│   │   ├── highlights.feature
│   │   ├── vault-detection.feature
│   │   ├── config-cascade.feature
│   │   └── ci-exit-codes.feature
│   └── steps/                  # cucumber-js step definitions (TypeScript)
│       ├── world.ts             # Shared World: temp vault, CLI runner, result capture
│       ├── file-steps.ts
│       ├── cli-steps.ts
│       └── assertion-steps.ts
│
├── overview/
│   ├── project-vision.md
│   ├── architecture.md
│   └── roadmap.md
│
├── rules/
│   ├── index.md                # Rule catalog
│   ├── wikilinks/
│   │   ├── OFM001.md
│   │   └── OFM002.md
│   ├── embeds/
│   ├── callouts/
│   ├── tags/
│   ├── frontmatter/
│   ├── block-references/
│   └── standard-md/
│
├── guides/
│   ├── getting-started.md
│   ├── configuration.md
│   ├── ci-integration.md
│   ├── custom-rules.md
│   └── obsidian-plugin.md
│
├── adr/
│   ├── ADR001-option-b-standalone.md
│   ├── ADR002-wikilink-resolution-default-on.md
│   └── ADR003-markdownlint-as-dependency.md
│
└── superpowers/
    └── specs/
        └── 2026-04-11-markdownlint-obsidian-design.md
```

**Wiki conventions:**

- Pages cross-link with `[[wikilinks]]`
- Rule pages include frontmatter: `tags`, `rule-code`, `severity`, `fixable`, `area`
- `index.md` and `log.md` maintained per `llm-wiki.md` pattern — LLM updates both on every docs change
- `.obsidian-linter.jsonc` at `docs/` level configures the dogfood linting run
- `docs/ddd/` owns the ubiquitous language — all other docs and code defer to its terms
- `docs/bdd/features/` is the source of truth for observable CLI behaviour; unit/integration tests cover implementation details

---

## Testing Strategy

```
tests/
├── unit/
│   ├── domain/         # Value objects, domain services — pure logic, no I/O
│   ├── rules/          # One test file per rule — valid[] and invalid[] fixtures
│   ├── parser/         # Token/AST output for OFM syntax edge cases
│   ├── vault/          # Vault index build, wikilink resolution logic
│   └── config/         # Config cascade, merge, precedence
│
├── integration/
│   ├── cli/            # Spawn CLI process, assert exit codes + stdout
│   ├── fixtures/       # Synthetic vault directories with known errors
│   └── dogfood/        # Run linter against docs/ — must exit 0 on clean docs
│
├── snapshots/          # Output formatter snapshots (default, json, sarif, junit)
│
└── (bdd/ at repo root — see BDD Layer section)
```

**Key principles:**

- Rule tests are table-driven (valid/invalid fixture lists, same pattern as markdownlint)
- Dogfood test is a first-class CI gate — `docs/` must pass before any PR merges
- Vault resolution tested with real fixture vaults (synthetic `.obsidian/` directories)
- Formatter output pinned as snapshots
- No filesystem mocking — real temp files and fixture directories throughout
- BDD acceptance scenarios are the source of truth for observable CLI behaviour

---

## Phased Roadmap (high-level)

Detailed phase breakdown lives in `docs/overview/roadmap.md`.

| Phase | Scope |
|---|---|
| 1 | Project scaffold: DDD layer skeleton, BDD harness, eslint/tsc/prettier/vitest, CLI stub, config loader, file discovery, default/json formatters |
| 2 | Parser pipeline (markdown-it + OFM plugins), ParseResult domain types, first BDD feature (frontmatter) |
| 3 | Frontmatter rules OFM080–099, tag rules OFM060–079 |
| 4 | Wikilink rules + vault resolution OFM001–019, vault-detection BDD feature |
| 5 | Embed rules OFM020–039, callout rules OFM040–059 |
| 6 | Block reference rules OFM100–119, highlight/comment rules OFM120–139 |
| 7 | markdownlint MD001–MD049 integration, default config baseline, OFM-conflicting rules enumerated and documented |
| 8 | Additional formatters (junit, sarif), GitHub Action, pre-commit hook, Docker image |
| 9 | Auto-fix support for fixable rules |
| 10 | Custom rules API documentation and examples |
