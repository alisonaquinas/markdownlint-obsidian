# AGENTS.md — Guide for AI Agents Working in this Repository

> **Scope guard** — This repository is at `C:\Users\aaqui\obsidian-stack\markdownlint-obsidian`.
> It is a fully independent git repo. Never `cd` to the parent (`obsidian-stack/`) or run
> any git, build, or file commands outside this directory. `origin` is
> `git@github.com:alisonaquinas/markdownlint-obsidian.git`.

Monorepo for `markdownlint-obsidian`: an Obsidian Flavored Markdown linter
that runs in CI pipelines. Publishes two npm packages and one GitHub Action.

## Layout

```text
markdownlint-obsidian/
├── packages/
│   ├── core/              # markdownlint-obsidian — linting engine and rule set
│   │   ├── src/
│   │   │   ├── domain/    # pure domain types, value objects, rule contract
│   │   │   ├── application/ # LintUseCase, FixUseCase, VaultBootstrap
│   │   │   ├── infrastructure/ # parsers, formatters, config, vault I/O adapters
│   │   │   ├── engine/    # high-level wired API (DI root)
│   │   │   └── public/    # exported API surface for consumers
│   │   ├── tests/         # unit, integration, fixture, snapshot tests
│   │   └── AGENTS.md
│   └── cli/               # markdownlint-obsidian-cli — commander wrapper
│       ├── src/           # args.ts, main.ts
│       ├── bin/           # entry point shim
│       └── AGENTS.md
├── action/                # GitHub Action wrapper (esbuild bundle)
│   ├── src/main.ts        # action entry point
│   ├── dist/main.js       # pre-built bundle — must be committed
│   └── AGENTS.md
├── docs/
│   ├── rules/             # per-rule reference docs (OFM* + standard-md overrides)
│   ├── guides/            # install, ci-integration, autofix, custom-rules, public-api
│   ├── adr/               # Architecture Decision Records
│   ├── ddd/               # Domain model, bounded context, ubiquitous language
│   ├── plans/             # Phase execution plans and ledger
│   └── AGENTS.md
├── scripts/               # repo-level maintenance scripts (prepare-publish)
├── .github/
│   ├── README.md          # rich GitHub landing page (dark/light logo, badges)
│   └── workflows/         # CI workflows
├── .claude/               # Claude Code config (launch.json)
├── AGENTS.md              # this file
├── CLAUDE.md              # stub — see AGENTS.md
├── CONCEPTS.md            # domain vocabulary
├── CHANGELOG.md           # keep-a-changelog format
├── README.md              # npm-facing plain README
├── .markdownlint-cli2.jsonc
└── package.json           # workspace root (Bun workspaces)
```

## Workflows

### Running tests

```bash
bun install
bun run test:all          # typecheck + lint + unit + BDD smoke tests
bun run test              # unit tests for all workspace packages
bun run test:bdd          # BDD smoke suite (@smoke tag only)
bun run test:dogfood      # lint docs/ with the built CLI
```

Run tests inside a single package:

```bash
cd packages/core && bun test
cd packages/cli && bun test
```

### Adding an OFM lint rule

1. Choose the rule family: `wikilinks`, `embeds`, `callouts`, `tags`,
   `frontmatter`, `highlights`, or `block-references`.
2. Add the rule file:
   `packages/core/src/infrastructure/rules/ofm/<family>/OFMxxx-<slug>.ts`
3. Implement `OFMRule` from `packages/core/src/domain/linting/OFMRule.ts`.
4. Register the rule in
   `packages/core/src/infrastructure/rules/ofm/registerBuiltin.ts`.
5. Add rule doc at `docs/rules/<family>/OFMxxx.md`.
6. Add unit tests in `packages/core/tests/unit/`.
7. Run `bun run test:all` and `bun run test:dogfood`.

### Building packages

```bash
bun run build             # build all workspace packages
cd packages/core && bun run build
cd packages/cli && bun run build
```

### Rebuilding the GitHub Action bundle

```bash
cd action
npm install
npm run build
```

The `action/dist/main.js` bundle must be committed. CI enforces this with
`git diff --exit-code action/dist/`.

### Publishing

Publish from the individual packages, not from the workspace root.

```bash
cd packages/core && npm publish
cd packages/cli && npm publish
```

`scripts/prepare-publish.mjs` rewrites workspace-local `workspace:*`
dependencies to real semver ranges before publish.

## Invariants — Do Not Violate

- The `domain/` layer must never import from `infrastructure/` or
  `application/`. All cross-layer communication flows inward toward the
  domain via interfaces.
- Rules in `infrastructure/rules/` must implement `OFMRule` from the domain.
  They must not depend on Node.js APIs directly — use `RuleParams.fsCheck`
  for filesystem access.
- Every rule must be stateless: the same `RuleParams` must produce the same
  `LintError` set on every call. Mutable rule state is forbidden.
- `action/dist/main.js` is a committed build artifact. Modify only via
  `npm run build` inside `action/`. Do not edit the dist file by hand.
- Never publish from the workspace root. The root `package.json` has a
  `prepublishOnly` guard that exits 1 to enforce this.
- `workspace:*` dependencies must be resolved to real semver ranges by
  `scripts/prepare-publish.mjs` before any `npm publish` call.
- CHANGELOG entries must follow Keep a Changelog 1.1.0 format.
  Add `[Unreleased]` entries; release automation promotes them.

## See Also

- [packages/core AGENTS.md](packages/core/AGENTS.md)
- [packages/cli AGENTS.md](packages/cli/AGENTS.md)
- [action AGENTS.md](action/AGENTS.md)
- [docs AGENTS.md](docs/AGENTS.md)
- [CONCEPTS.md](CONCEPTS.md)
- [docs/ddd/ubiquitous-language.md](docs/ddd/ubiquitous-language.md)
