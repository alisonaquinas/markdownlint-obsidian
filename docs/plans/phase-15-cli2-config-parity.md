# Phase 15: markdownlint-cli2 Configuration Parity

Required pre-reading:
[markdownlint-cli2 configuration loading analysis](../research/markdownlint-cli2-config-loading-analysis.md).

## Goal

Bring `markdownlint-obsidian` configuration loading close enough to
`markdownlint-cli2` that existing `.markdownlint-cli2.*` and `.markdownlint.*`
workspaces behave predictably when moved to Obsidian-aware linting.

The target is feature parity for configuration discovery, parsing, explicit
config handling, pointer selection, inheritance, and effective-config grouping.
Intentional OFM-specific differences must be named, tested, and documented.

## Parity Baseline

The research note establishes these upstream behaviors as the baseline:

- `.markdownlint-cli2.*` files configure CLI options and may embed a
  markdownlint rule `config`.
- `.markdownlint.*` files configure only markdownlint rule behavior.
- `--config` is a base layer; discovered root and nested config still
  participates.
- `--configPointer` applies before generic file classification.
- JSON and JSONC are parsed as JSONC with trailing commas allowed.
- YAML, CJS, and MJS participate in discovered config.
- TOML participates in explicit `--config`, `--configPointer`, and `extends`,
  but not automatic per-directory discovery.
- CLI2 option merge is shallow, with one additional shallow merge level for
  `config`.
- `.markdownlint.*` config wins over embedded CLI2 `config` for that directory.
- Parent `.markdownlint.*` config is inherited only when no nearer
  `.markdownlint.*` or embedded CLI2 `config` exists.
- Files are linted in groups that share effective configuration.

## Non-Goals

- Replacing OFM-specific config keys such as `vaultRoot`, `resolve`,
  `wikilinks`, `callouts`, `embeds`, `frontmatter`, `tags`, `blockRefs`,
  `highlights`, or `comments`.
- Removing the `.obsidian-linter.*` family.
- Copying upstream runtime non-validation if stricter OFM validation is needed
  for predictable diagnostics.
- Implementing `.markdownlint.toml` or `.markdownlint-cli2.toml` automatic
  discovery. Upstream does not discover TOML by fixed per-directory names.

## Design Decisions

### Preserve Config Family Boundaries

The loader must classify loaded files as one of:

| Kind | Purpose |
| --- | --- |
| CLI2 options | CLI/workspace behavior plus optional embedded `config` |
| Markdownlint rule config | MD rule configuration only |
| Obsidian options | OFM-specific behavior plus optional compatibility keys |
| Unknown explicit config | Classified after parsing and `--configPointer` |

`.obsidian-linter.*` may include OFM-specific keys and CLI2-compatible keys, but
plain `.markdownlint.*` files must not gain OFM-only meaning.

### Make `--config` A Base Layer

`--config` must not short-circuit local discovery. The explicit object becomes a
base layer, then root `.markdownlint-cli2.*` and `.obsidian-linter.*` files can
override it.

### Separate Merge Semantics From Safety Defaults

`markdownlint-cli2` shallow-merges options. Current `markdownlint-obsidian`
deep-merges `rules` to avoid losing OFM-conflicting standard-MD disables. The
parity implementation should apply CLI2-compatible shallow merge semantics first,
then reapply mandatory defaulting or conflict-safety behavior in a separate,
tested normalization step.

### Return Effective Config Groups

The engine should receive effective config groups instead of one global config.
A future shape may look like:

```typescript
interface EffectiveConfigGroup {
  readonly directory: string;
  readonly files: readonly string[];
  readonly options: LinterOptions;
  readonly markdownlintConfig: MarkdownlintRuleConfig | null;
  readonly obsidianConfig: LinterConfig;
}
```

The exact public type can differ, but tests must prove files in different
directories can lint under different effective configs in one run.

## Implementation Tasks

### Task 1: Add Config Parity Test Fixtures

Create fixtures that mirror the upstream behavioral categories:

- discovered `.markdownlint-cli2.jsonc`, `.yaml`, `.cjs`, `.mjs`;
- discovered `.markdownlint.jsonc`, `.json`, `.yaml`, `.yml`, `.cjs`, `.mjs`;
- explicit `--config` with generic `.jsonc`, `.json`, `.yaml`, `.yml`,
  `.toml`, `.cjs`, and `.mjs`;
- `--configPointer` with valid, missing, nested, null, number, string, and
  invalid pointers;
- nested directory overrides;
- embedded `config.extends`;
- root globs, ignores, gitignore, literal files, and `--no-globs`;
- shallow merge replacement for arrays and nested rule option objects.

Acceptance:

- Tests fail against the current simplified loader.
- Fixture names map back to sections in
  [markdownlint-cli2 configuration loading analysis](../research/markdownlint-cli2-config-loading-analysis.md).

### Task 2: Introduce Config Source Model

Add internal value types for loaded config sources:

- source path;
- source kind;
- directory;
- parsed object;
- parser used;
- pointer, if any;
- import mode;
- diagnostic context for parse/import errors.

Acceptance:

- Parser errors include the source path.
- Unknown explicit files classify only after parsing and pointer selection.
- `$schema` alone does not classify a generic file as CLI2 options.

### Task 3: Expand Parser Support

Implement parser coverage:

- JSONC for `.json` and `.jsonc`;
- YAML for `.yaml` and `.yml`;
- TOML for explicit config, pointers, and `extends`;
- CJS/MJS default-export imports.

Acceptance:

- `.json` accepts comments and trailing commas just like upstream.
- TOML is accepted through explicit config but not fixed-name discovery.
- String import suppression remains available for safe editor contexts.

### Task 4: Implement `--configPointer`

Support JSON Pointer selection for explicit config across all parser/import
types before classification.

Acceptance:

- Missing or falsy pointer results become `{}`.
- Invalid pointer syntax returns an OFM901-style tool/config failure.
- Generic file classification happens after pointer selection.

### Task 5: Implement Directory Config Map

Replace single merged-root loading with a directory map:

1. build matched file set;
2. create directory info for file directories and needed parents;
3. load config families per directory;
4. collapse directories without local config into configured ancestors;
5. merge CLI2/Obsidian options down the tree;
6. select effective markdownlint rule config per directory;
7. lint file groups with shared effective config.

Acceptance:

- Nested config can affect only files beneath that directory.
- Files outside the base directory inherit base config as their parent.
- Parent `.markdownlint.*` inheritance follows upstream rules.

### Task 6: Align CLI And Engine Options

Update `packages/cli` and `packages/core/src/engine` so all config-relevant
flags are represented:

- `--config`;
- `--configPointer` / `--config-pointer`;
- `--no-globs`;
- `--fix` and `--fix-check`;
- root `globs`, `ignores`, and `gitignore`;
- `customRules`, `markdownItPlugins`, and `modulePaths` where supported.

Acceptance:

- CLI options and programmatic engine options document the same precedence.
- Extension adapters can call the same public API without shelling out to the
  CLI.

### Task 7: Document Intentional Divergences

Update public docs and schemas:

- config guide;
- custom rules guide;
- VS Code schema contribution docs;
- `docs/ddd/config/domain-model.md`;
- extension requirements that depend on config behavior.

Acceptance:

- Any divergence from `markdownlint-cli2` is named in one place with rationale.
- `.obsidian-linter.*` semantics are documented separately from
  `.markdownlint-cli2.*` and `.markdownlint.*`.

## Verification

```bash
bun run typecheck
bun run lint
bun run test
bun run test:bdd
bun run test:dogfood
bun run --cwd extension test
bun run --cwd extension package:check
```

## Acceptance Criteria

- Existing `markdownlint-cli2` configuration workflows have a documented
  compatibility path.
- Explicit config behaves as a base, not as an exclusive override.
- JSON Pointer, CJS/MJS, TOML explicit config, JSONC parsing, and `extends`
  behavior are covered by tests.
- Nested directories can lint with different effective configurations in a
  single run.
- VS Code extension behavior is explicitly tied to the same core config
  semantics.
