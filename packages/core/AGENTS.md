# AGENTS.md — Guide for AI Agents Working in `packages/core`

Linting engine and OFM rule set for `markdownlint-obsidian`. Implements the
full DDD stack: domain types, application use cases, infrastructure adapters,
and the high-level wired engine API.

## Layout

```text
packages/core/
├── src/
│   ├── domain/            # pure types, value objects, interfaces — no I/O
│   │   ├── config/        # LinterConfig, RuleConfig
│   │   ├── fix/           # applyFixes — conflict resolution algorithm
│   │   ├── fs/            # FileExistenceChecker interface
│   │   ├── linting/       # OFMRule, LintError, LintResult, Fix, RuleRegistry
│   │   ├── parsing/       # ParseResult, WikilinkNode, EmbedNode, … VOs
│   │   └── vault/         # VaultIndex, VaultPath, BlockRefIndex, WikilinkMatcher
│   ├── application/       # LintUseCase, FixUseCase, VaultBootstrap
│   ├── infrastructure/    # adapters — Node.js I/O, parsers, rules, formatters
│   │   ├── config/        # ConfigLoader, ConfigValidator, CustomRuleLoader
│   │   ├── discovery/     # FileDiscovery (glob expansion)
│   │   ├── formatters/    # default, json, junit, sarif + FormatterRegistry
│   │   ├── fs/            # NodeFsExistenceChecker
│   │   ├── io/            # FileReader, FileWriter
│   │   ├── parser/        # MarkdownItParser, FrontmatterParser, ofm/ extractors
│   │   ├── rules/
│   │   │   ├── ofm/       # built-in OFM rules (grouped by family)
│   │   │   │   ├── wikilinks/      OFM001–OFM007
│   │   │   │   ├── embeds/         OFM020–OFM025
│   │   │   │   ├── callouts/       OFM040–OFM044
│   │   │   │   ├── tags/           OFM060–OFM066
│   │   │   │   ├── frontmatter/    OFM080–OFM087
│   │   │   │   ├── block-references/ OFM100–OFM104
│   │   │   │   ├── highlights/     OFM120–OFM124
│   │   │   │   ├── system/         OFM904, OFM905
│   │   │   │   └── registerBuiltin.ts
│   │   │   ├── standard/  # MarkdownLintAdapter, conflict overrides
│   │   │   └── registerCustom.ts
│   │   └── vault/         # FileIndexBuilder, BlockRefIndexBuilder, NodeFsVaultDetector
│   ├── engine/            # index.ts — DI root; wires full graph for callers
│   └── public/            # index.ts (custom rule API), rules.ts
├── tests/
│   ├── unit/              # per-rule and per-module unit tests
│   ├── integration/       # end-to-end lint runs against fixture vaults
│   ├── fixtures/          # markdown files used as rule inputs
│   └── snapshots/         # bun test snapshots
├── examples/              # runnable code samples for docs/guides/
├── scripts/               # gen-dist-pkg.mjs (post-build package.json rewrite)
├── AGENTS.md              # this file
├── CLAUDE.md
└── package.json
```

## Workflows

### Adding a rule

1. Pick the OFM family (or add a new family folder if needed).
2. Create `src/infrastructure/rules/ofm/<family>/OFMxxx-<slug>.ts`.
3. Implement the `OFMRule` interface from `src/domain/linting/OFMRule.ts`.
   - Mark `fixable: true` only when every violation can carry a `Fix`.
   - Do not import Node.js `fs` — use `params.fsCheck`.
4. Register in `src/infrastructure/rules/ofm/registerBuiltin.ts`.
5. Add rule docs at `docs/rules/<family>/OFMxxx.md`.
6. Add unit tests in `tests/unit/`.
7. Run `bun test` and confirm `bun run test:dogfood` still passes.

### Running tests

```bash
bun test                          # all tests in this package
bun test --watch                  # watch mode
bun test tests/unit/rules/        # single directory
bun test --coverage               # coverage report
```

### Building

```bash
bun run build
```

Outputs to `dist/`. The post-build script `scripts/gen-dist-pkg.mjs`
rewrites `package.json` inside `dist/` to resolve `workspace:*` deps.

### Adding a formatter

1. Create `src/infrastructure/formatters/<Name>Formatter.ts` implementing
   `(results: LintResult[]) => string`.
2. Register in `src/infrastructure/formatters/FormatterRegistry.ts`.
3. Expose in `src/engine/index.ts` via `getFormatter`.
4. Add a guide entry or CLI flag if user-facing.

## Invariants — Do Not Violate

- `domain/` must not import from `application/`, `infrastructure/`, or
  `engine/`. Imports must flow inward only.
- Rules must not import Node.js built-ins (`fs`, `path`, `os`, etc.) directly.
  Use `params.fsCheck` for existence checks and `params.parsed` for content.
- Every rule must be stateless. No module-level mutable state, no caches
  inside rule objects.
- `params.vault` and `params.blockRefIndex` are `null` when
  `config.resolve === false`. Rules must null-guard before accessing them.
- `public/index.ts` is the published API surface. Adding a type here is
  semver-minor. Removing or renaming one is semver-major.
- Snapshot files in `tests/snapshots/` must be updated intentionally via
  `bun test --update-snapshots`, never hand-edited.

## See Also

- [Root AGENTS.md](../../AGENTS.md)
- [CONCEPTS.md](../../CONCEPTS.md)
- [src/domain AGENTS.md](src/domain/AGENTS.md)
- [src/infrastructure AGENTS.md](src/infrastructure/AGENTS.md)
- [docs/rules/index.md](../../docs/rules/index.md)
