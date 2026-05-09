---
title: "Config Domain Model"
aliases:
  - "Config Domain Model"
tags:
  - "docs"
  - "docs/ddd"
  - "ddd"
type: "domain-model"
status: "current"
updated: 2026-05-09
up: "[[ddd/bounded-contexts]]"
---

# Config Domain Model

## Value Objects

### LinterConfig

Immutable. The fully merged, validated configuration for one LintRun.

```typescript
interface LinterConfig {
  readonly vaultRoot: string | null;
  readonly resolve: boolean;
  readonly wikilinks: WikilinkConfig;
  readonly callouts: CalloutConfig;
  readonly embeds: EmbedConfig;
  readonly frontmatter: FrontmatterConfig;
  readonly tags: TagConfig;
  readonly blockRefs: BlockRefConfig;
  readonly highlights: HighlightConfig;
  readonly comments: CommentConfig;
  readonly rules: Readonly<Record<string, RuleConfig>>;
  readonly customRules: readonly string[];
  readonly globs: readonly string[];
  readonly ignores: readonly string[];
  readonly fix: boolean;
  readonly outputFormatter: string;
}
```

### WikilinkConfig

Controls alias handling, case sensitivity, and the vault-index resolution mode
used by OFM001, OFM004, OFM005, and other wikilink-aware rules.

```typescript
interface WikilinkConfig {
  readonly caseSensitive: boolean;
  readonly allowAlias: boolean;
  readonly resolveMode: "path-relative" | "obsidian-fuzzy";
}
```

`path-relative` is the default and keeps exact path, case-insensitive path, and
basename matching. `obsidian-fuzzy` adds a path-suffix step for path-like targets
before basename matching, so `[[sources/foo]]` can resolve to
`wiki/sources/foo.md` while bare links like `[[foo]]` still use basename
resolution.

### RuleConfig

Per-rule enable/disable and options.

```typescript
interface RuleConfig {
  readonly enabled: boolean;
  readonly severity?: "error" | "warning";
  readonly options?: Readonly<Record<string, unknown>>;
}
```

### Standard MD Conflict Default

A built-in `RuleConfig` entry for a standard markdownlint rule whose upstream
behavior conflicts with OFM syntax. The authoritative source is
`packages/core/src/infrastructure/rules/standard/OFM_MD_CONFLICTS.ts`;
`DEFAULT_CONFIG.rules` derives one `{ enabled: false }` entry for each conflict.

The rule remains registered in the linting context. Users can opt back in by
overriding that single rule, for example:

```jsonc
{
  "rules": {
    "MD028": { "enabled": true }
  }
}
```

MD028 is a conflict because multi-paragraph callouts are blockquotes whose blank
separators are required by OFM rendering.

## Current Cascade Logic

Config files are discovered by walking from each file's directory up to vault root.
Closer files take precedence. Precedence order (high → low):

1. CLI `--config` flag
2. `.markdownlint-cli2.jsonc/yaml/cjs/mjs`
3. `.obsidian-linter.jsonc/yaml`
4. `.markdownlint.jsonc/yaml`
5. `package.json#/markdownlint`
6. Built-in defaults

The `rules` branch is deep-merged across the cascade. A user override for one
rule replaces that rule's config without discarding sibling defaults, including
the standard MD conflict defaults.

## markdownlint-cli2 Parity Target

Research:
[markdownlint-cli2 configuration loading analysis](../../research/markdownlint-cli2-config-loading-analysis.md)

The current cascade is intentionally simpler than `markdownlint-cli2`. Feature
parity work must close these gaps deliberately rather than by incidental
compatibility.

### Config Families

`markdownlint-cli2` separates two file families:

| Family | Discovered names | Semantics |
| --- | --- | --- |
| CLI2 options | `.markdownlint-cli2.jsonc`, `.markdownlint-cli2.yaml`, `.markdownlint-cli2.cjs`, `.markdownlint-cli2.mjs` | CLI behavior plus optional embedded `config` |
| Rule config | `.markdownlint.jsonc`, `.markdownlint.json`, `.markdownlint.yaml`, `.markdownlint.yml`, `.markdownlint.cjs`, `.markdownlint.mjs` | Underlying markdownlint rule configuration only |

Parity requires preserving that distinction. `.obsidian-linter.*` remains the
project-specific extension point, but it must not blur CLI2 options and
markdownlint rule config semantics.

### Explicit Config Semantics

`--config` is a base layer, not an absolute override. The target order is:

1. built-in defaults and flag-derived defaults;
2. explicit `--config` object, after any `--configPointer`;
3. base-directory discovered `.markdownlint-cli2.*` options;
4. nested `.markdownlint-cli2.*` options merged down the configured directory
   tree;
5. programmatic API overrides.

A local root `.markdownlint-cli2.*` file may therefore override values supplied
by `--config`.

### Markdownlint Rule Config Selection

For each effective directory group, target rule config selection is:

1. embedded `config` from effective `.markdownlint-cli2.*` options;
2. nearest `.markdownlint.*` file, which overrides the embedded `config` for
   that directory;
3. inherited parent `.markdownlint.*` only when the current directory has no
   `.markdownlint.*` and no embedded CLI2 `config`;
4. `extends` for reusable rule config composition.

### Parser And Pointer Coverage

Parity requires:

- JSON and JSONC parsed through JSONC rules, including trailing commas;
- YAML parsing;
- CJS and MJS default-export config loading;
- TOML parsing for explicit `--config`, `--configPointer`, and `extends`, but
  not automatic per-directory discovery;
- JSON Pointer support for `--configPointer` across JSON, YAML, TOML, CJS, and
  MJS loaded objects;
- generic file classification by CLI2 top-level keys after pointer selection.

### Merge Semantics

`markdownlint-cli2` merges CLI2 options shallowly and gives the `config` branch
one additional shallow merge level. Arrays replace rather than concatenate, and
nested rule option objects replace rather than deep-merge.

`markdownlint-obsidian` currently deep-merges `rules` to preserve default
standard-MD conflict disables. Feature parity must decide whether to:

- adopt CLI2 shallow semantics for `.markdownlint-cli2.*` compatibility while
  preserving OFM safety defaults through a separate defaulting step; or
- keep the deeper `rules` merge as an intentional divergence and document the
  incompatibility.

The default target is CLI2-compatible shallow options/config semantics, with OFM
conflict defaults reapplied safely before validation.

### Grouped Effective Config

Parity requires linting files in groups that share the same effective
configuration, rather than loading one root config for the whole run. The config
bounded context therefore needs a `ConfigCascade` or equivalent result that maps
file directories to effective options and rule config.
