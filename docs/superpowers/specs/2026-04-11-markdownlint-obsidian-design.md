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

## Architecture

```
markdownlint-obsidian
├── CLI entry point          bin/markdownlint-obsidian.js
│   ├── Parse argv (globs, --fix, --config, --format, --help)
│   ├── Load config (hierarchical, cascades through dirs)
│   └── Invoke core engine
│
├── Core engine              src/engine.ts
│   ├── File discovery       glob + gitignore integration
│   ├── Vault root detection walk up for .obsidian/, fall back to git root
│   ├── Config resolution    per-directory cascade, merge with defaults
│   ├── Concurrent linting   async per-file, pooled
│   └── Result aggregation   collect errors → formatters → exit code
│
├── Parser                   src/parser.ts
│   ├── markdown-it instance with OFM plugins loaded
│   └── Produces token stream + AST for rules
│
├── Rule system              src/rules/
│   ├── markdownlint rules   MD001–MD049 imported from markdownlint library
│   ├── Built-in OFM rules   OFM001–OFM199 (wikilinks, embeds, callouts, tags, frontmatter…)
│   └── Custom rules API     same shape as markdownlint-cli2 for familiarity
│
├── Vault context            src/vault.ts
│   ├── Build file index     all .md paths under vault root
│   ├── Resolve wikilinks    fuzzy match (Obsidian's own resolution logic)
│   └── Cache per-run        built once, shared across all file lints
│
└── Output formatters        src/formatters/
    ├── default              text, file:line:col rule message
    ├── json                 machine-readable
    ├── junit                CI test reporting
    ├── sarif                GitHub code scanning / VS Code Problems
    └── (pluggable)          same API as markdownlint-cli2 formatters
```

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
└── adr/
    ├── ADR001-option-b-standalone.md
    ├── ADR002-wikilink-resolution-default-on.md
    └── ADR003-markdownlint-as-dependency.md
```

**Wiki conventions:**
- Pages cross-link with `[[wikilinks]]`
- Rule pages include frontmatter: `tags`, `rule-code`, `severity`, `fixable`, `area`
- `index.md` and `log.md` maintained per `llm-wiki.md` pattern — LLM updates both on every docs change
- `.obsidian-linter.jsonc` at `docs/` level configures the dogfood linting run

---

## Testing Strategy

```
tests/
├── unit/
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
└── snapshots/          # Output formatter snapshots
```

**Key principles:**
- Rule tests are table-driven (valid/invalid fixture lists, same pattern as markdownlint)
- Dogfood test is a first-class CI gate — `docs/` must pass before any PR merges
- Vault resolution tested with real fixture vaults (synthetic `.obsidian/` directories)
- Formatter output pinned as snapshots
- No filesystem mocking — real temp files and fixture directories throughout

---

## Phased Roadmap (high-level)

Detailed phase breakdown lives in `docs/overview/roadmap.md`.

| Phase | Scope |
|---|---|
| 1 | Project scaffold, CLI skeleton, config loader, file discovery, default/json formatters |
| 2 | Parser pipeline, frontmatter rules (OFM080–099), tag rules (OFM060–079) |
| 3 | Wikilink rules + vault resolution (OFM001–019) |
| 4 | Embed rules (OFM020–039), callout rules (OFM040–059) |
| 5 | Block reference rules (OFM100–119), highlight/comment rules (OFM120–139) |
| 6 | markdownlint MD001–MD049 integration, default config baseline |
| 7 | Additional formatters (junit, sarif), GitHub Action, pre-commit hook, Docker image |
| 8 | Auto-fix support for fixable rules |
| 9 | Custom rules API documentation and examples |
