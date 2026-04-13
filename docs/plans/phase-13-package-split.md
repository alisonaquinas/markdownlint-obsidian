# Phase 13: Package Split — `markdownlint-obsidian` + `markdownlint-obsidian-cli`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the single package into two independently publishable packages that stay in a single Bun workspace monorepo:

| Package | npm name | Purpose |
|---|---|---|
| Library | `markdownlint-obsidian` | Linting engine, rule set, public API — no CLI, no `process.exit` |
| CLI | `markdownlint-obsidian-cli` | Thin CLI wrapper over the library; owns the binary |

After this phase, a tool author can `import { lint } from "markdownlint-obsidian"` and get a fully wired linting pipeline without touching `process`, `commander`, or argv. The CLI package is optional for library users.

---

## Design constraints (from `docs/superpowers/specs/` and `docs/ddd/`)

All changes must observe these enforced gates:

- **DDD layering** — dependency direction is inward only: `cli` → `infrastructure` → `application` → `domain`. After the split this becomes: `markdownlint-obsidian-cli` → `markdownlint-obsidian` → (nothing external above domain boundary).
- **DIP** — domain layer never imports I/O or framework libraries. `markdownlint-obsidian` must be installable without pulling in `commander` or any process-exit logic.
- **High Coherence** — one bounded context per package. `markdownlint-obsidian` owns Linting + Vault + Config; `markdownlint-obsidian-cli` owns the CLI presentation layer only.
- **Low Coupling** — the CLI package's only coupling to the library is through the public `./engine` export (a single stable interface). No CLI code reaches into `src/infrastructure/` internals directly.
- **SRP** — `markdownlint-obsidian-cli` has exactly one reason to change: the command-line interface. The linting engine changes only when linting behaviour changes.
- **TDD** — every new module enters through a failing test. The `./engine` API surface must have full unit + integration coverage before the CLI is ported to use it.
- **No mutable module-level state** — no implicit I/O at import time. The `lint()` factory must be a pure function of its options.
- **TSDoc on every export** — all exported symbols in the new `./engine` subpath need TSDoc.

---

## Architecture after the split

```
markdownlint-obsidian/             ← Bun workspace root
│
├── packages/
│   ├── core/                      ← markdownlint-obsidian (library)
│   │   ├── src/
│   │   │   ├── domain/            (unchanged — pure domain, zero I/O)
│   │   │   ├── application/       (unchanged — use cases)
│   │   │   ├── infrastructure/    (unchanged — adapters, rules, formatters)
│   │   │   └── public/            (unchanged — custom rule authoring API)
│   │   ├── src/engine/            (NEW — high-level programmatic API)
│   │   │   └── index.ts
│   │   ├── bin/                   (removed — moves to cli package)
│   │   ├── tests/                 (all current unit + integration tests)
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   └── package.json           (name: "markdownlint-obsidian")
│   │
│   └── cli/                       ← markdownlint-obsidian-cli
│       ├── src/
│       │   ├── main.ts            (moved from packages/core/src/cli/main.ts)
│       │   └── args.ts            (moved from packages/core/src/cli/args.ts)
│       ├── bin/
│       │   └── markdownlint-obsidian.js   (moved from packages/core/bin/)
│       ├── tests/
│       │   ├── unit/              (CLI unit tests)
│       │   └── integration/       (CLI integration tests, moved from core)
│       ├── tsconfig.json
│       ├── tsconfig.build.json
│       └── package.json           (name: "markdownlint-obsidian-cli")
│
├── action/                        (unchanged — GitHub Action, uses cli package)
│   └── package.json               (dep: markdownlint-obsidian-cli, not core)
│
├── docker/                        (unchanged structurally)
│   └── Dockerfile                 (updated: installs cli package)
│
├── docs/                          (unchanged content, updated wikilinks)
│
├── package.json                   (workspace root — scripts only, no src)
├── bun.lock
└── bunfig.toml
```

---

## New public API: `markdownlint-obsidian/engine`

The most significant new surface is a high-level programmatic API added to the library. It wires the full DI graph internally so callers never touch infrastructure factories directly.

```typescript
// packages/core/src/engine/index.ts

export interface LintOptions {
  /** Glob patterns to match. Required if config.globs is not set. */
  readonly globs: readonly string[];
  /** Explicit vault root. Auto-detected from .obsidian/ or git root if omitted. */
  readonly vaultRoot?: string;
  /** Explicit path to a config file. */
  readonly config?: string;
  /** Disable wikilink resolution. Defaults to true. */
  readonly resolve?: boolean;
  /** Working directory for config discovery and vault detection. Defaults to cwd. */
  readonly cwd?: string;
}

export interface FixOptions extends LintOptions {
  /** If true, report what would be fixed without writing. */
  readonly check?: boolean;
}

/** Run the linting pipeline and return one LintResult per matched file. */
export async function lint(options: LintOptions): Promise<LintResult[]>;

/** Run the fix pipeline. Returns first-pass and final-pass results. */
export async function fix(options: FixOptions): Promise<FixOutcome>;
```

**What `lint()` wires internally (not exposed to callers):**
- `ConfigLoader` — loads and merges config from `options.cwd`
- `FileDiscovery` — discovers files from `options.globs` and config globs
- `MarkdownItParser` — constructed once, shared across files
- `VaultBootstrap` — detects vault root, builds VaultIndex + BlockRefIndex
- `RuleRegistry` — registers built-ins + any custom rules from config
- `LintUseCase.runLint()` — runs the rules
- `NodeFsExistenceChecker`, `FileReader` — filesystem adapters

This API satisfies DIP: callers depend on `LintOptions` (a plain interface) and `LintResult[]` (a domain value object). No infrastructure type leaks across the boundary.

**Package exports map (`packages/core/package.json`):**

```json
{
  "exports": {
    ".": {
      "types": "./dist/src/public/index.d.ts",
      "default": "./dist/src/public/index.js"
    },
    "./api": {
      "types": "./dist/src/public/index.d.ts",
      "default": "./dist/src/public/index.js"
    },
    "./rules": {
      "types": "./dist/src/public/rules.d.ts",
      "default": "./dist/src/public/rules.js"
    },
    "./engine": {
      "types": "./dist/src/engine/index.d.ts",
      "default": "./dist/src/engine/index.js"
    }
  }
}
```

Note: `./cli` is **removed** from the library. It belongs to `markdownlint-obsidian-cli`.

---

## Task 1: Write ADR — package split decision

**Files:**

- Create: `docs/adr/ADR006-package-split.md`

Document the decision before touching any code. The ADR must address:
- Why split (programmatic use case, CLI-free install, separation of concerns)
- Why monorepo over separate repos (shared test fixtures, atomic cross-package changes, single CI run)
- Why Bun workspaces (already the toolchain; workspace protocol is stable)
- Consequences: two npm packages, two release-please entries, `action/` re-pointed at CLI package
- Rejected alternatives: keep single package with `./engine` export only (does not achieve CLI-free install since `commander` stays in deps)

```markdown
---
adr: 006
title: Split into library + CLI packages (monorepo)
status: accepted
date: <implementation date>
---

# ADR 006 — Split into library + CLI packages

## Context
...
## Decision
...
## Consequences
...
```

- [ ] **Write ADR006**
- [ ] **Commit**
```
git add docs/adr/ADR006-package-split.md
git commit -m "docs(adr): ADR006 — library/CLI package split"
```

---

## Task 2: Bun workspace root setup

**Files:**

- Modify: `package.json` (root — becomes workspace root)
- Modify: `bunfig.toml`
- Modify: `bun.lock` (regenerated)
- Keep: `eslint.config.js`, `tsconfig.json` (shared dev tooling at root)

### 2a — Convert root `package.json` to a workspace manifest

The root `package.json` stops being a publishable package. It becomes the workspace host that delegates to `packages/*`.

```json
{
  "name": "markdownlint-obsidian-workspace",
  "private": true,
  "workspaces": ["packages/*", "action"],
  "scripts": {
    "build":       "bun run --filter '*' build",
    "typecheck":   "bun run --filter '*' typecheck",
    "lint":        "eslint . && prettier --check .",
    "format":      "prettier --write .",
    "test":        "bun run --filter '*' test",
    "test:bdd":    "bun node_modules/@cucumber/cucumber/bin/cucumber.js --tags @smoke",
    "test:dogfood":"cd docs && bun ../packages/cli/bin/markdownlint-obsidian.js \"**/*.md\"",
    "test:all":    "bun run typecheck && bun run lint && bun run test && bun run test:bdd",
    "prepublishOnly": "echo 'Publish from packages/core or packages/cli, not the root'"
  },
  "devDependencies": {
    "@cucumber/cucumber": "^10.0.0",
    "@types/bun": "^1.3.12",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "fast-check": "^3.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "bun": ">=1.1.30"
  },
  "packageManager": "bun@1.3.12"
}
```

**Key decisions:**
- `devDependencies` (test runner, linter, tsc) stay at root — shared across all packages.
- Each package's `package.json` carries only its runtime `dependencies`.
- `bun run --filter '*' build` runs the `build` script in every workspace package.

### 2b — Update `bunfig.toml`

```toml
[install]
workspaces = true

[test]
coverage = false
coverageThreshold = { lines = 0.80, functions = 0.80, branches = 0.80 }
coverageReporter = ["text", "lcov"]
coverageDir = "coverage"
```

### 2c — Shared tsconfig at root

Keep `tsconfig.json` at root as the base config. Each package's `tsconfig.json` extends it with `../../tsconfig.json`. This keeps strict settings, target, and module resolution centralised.

- [ ] **Scaffold `packages/` directory** (empty, just `mkdir`)
- [ ] **Update root `package.json`**
- [ ] **Update `bunfig.toml`**
- [ ] **Run `bun install`** to regenerate `bun.lock` with workspace entries
- [ ] **Commit**
```
git add package.json bunfig.toml bun.lock
git commit -m "chore(workspace): convert root to Bun workspace host"
```

---

## Task 3: Create `packages/core/` — the library package

This is the heaviest task. All existing `src/`, `tests/`, `tsconfig*.json` move into `packages/core/`. The `bin/` and `src/cli/` directories do **not** move here.

### 3a — Directory structure

```
packages/core/
├── src/
│   ├── domain/          (move from root src/domain/)
│   ├── application/     (move from root src/application/)
│   ├── infrastructure/  (move from root src/infrastructure/)
│   └── public/          (move from root src/public/)
├── tests/
│   ├── unit/            (move from root tests/unit/ — all except cli tests)
│   ├── integration/     (move from root tests/integration/ — all except cli/)
│   ├── fixtures/        (move from root tests/fixtures/)
│   └── snapshots/       (move from root tests/snapshots/)
├── scripts/
│   └── gen-dist-bin.mjs (no longer needed in core — remove or move to cli)
├── tsconfig.json        (extends ../../tsconfig.json)
├── tsconfig.build.json  (extends ./tsconfig.json, excludes tests)
└── package.json
```

### 3b — `packages/core/package.json`

```json
{
  "name": "markdownlint-obsidian",
  "version": "1.0.0",
  "description": "Obsidian Flavored Markdown linting engine — programmatic API and rule set",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/src/public/index.d.ts",
      "default": "./dist/src/public/index.js"
    },
    "./api": {
      "types": "./dist/src/public/index.d.ts",
      "default": "./dist/src/public/index.js"
    },
    "./rules": {
      "types": "./dist/src/public/rules.d.ts",
      "default": "./dist/src/public/rules.js"
    },
    "./engine": {
      "types": "./dist/src/engine/index.d.ts",
      "default": "./dist/src/engine/index.js"
    }
  },
  "files": ["dist/", "src/", "examples/", "README.md", "CHANGELOG.md", "LICENSE"],
  "scripts": {
    "build":     "tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit",
    "test":      "bun test --timeout 30000",
    "test:coverage": "bun test --coverage --timeout 30000",
    "prepublishOnly": "bun run build && bun run test"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "fast-xml-parser": "^5.5.11",
    "globby": "^14.0.0",
    "gray-matter": "^4.0.3",
    "js-yaml": "^4.1.0",
    "jsonc-parser": "^3.2.0",
    "markdown-it": "^14.1.1",
    "markdownlint": "^0.40.0",
    "minimatch": "^10.2.5"
  },
  "engines": { "node": ">=20.0.0", "bun": ">=1.1.30" },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/alisonaquinas/markdownlint-obsidian.git",
    "directory": "packages/core"
  }
}
```

**Note:** `commander` is absent. The library has zero CLI deps.

### 3c — `packages/core/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["src", "tests", "eslint.config.js"]
}
```

### 3d — `packages/core/tsconfig.build.json`

```json
{
  "extends": "./tsconfig.json",
  "include": ["src"],
  "exclude": ["tests", "**/*.test.ts"]
}
```

### 3e — File moves (git mv to preserve history)

```bash
git mv src/domain            packages/core/src/domain
git mv src/application       packages/core/src/application
git mv src/infrastructure    packages/core/src/infrastructure
git mv src/public            packages/core/src/public
git mv tests/unit            packages/core/tests/unit
git mv tests/integration     packages/core/tests/integration
git mv tests/fixtures        packages/core/tests/fixtures
git mv tests/snapshots       packages/core/tests/snapshots
git mv examples              packages/core/examples
```

**Do not move:**
- `src/cli/` → moves to `packages/cli/` in Task 4
- `bin/` → moves to `packages/cli/` in Task 4
- `tests/integration/cli/` → moves to `packages/cli/tests/` in Task 4

### 3f — Update all import paths in moved files

All relative imports like `../../domain/linting/LintError.js` remain correct since directory structure within `src/` is unchanged. Spot-check with:

```bash
grep -r "from.*\.\./\.\./\.\." packages/core/src/
```

Expected: zero results (no import goes above `src/`). If any exist, they point to something that should be a workspace dep instead.

### 3g — Update `tests/` imports

Test files currently import from `../../../src/...`. After the move they import from `../../src/...` (one level shallower since we're now inside `packages/core/`). Run a find-and-replace:

```bash
# In packages/core/tests/**/*.ts:
# "../../../src/" → "../../src/"
```

### 3h — Verification

```bash
cd packages/core
bun run typecheck   # must pass with zero errors
bun run test        # must pass — same count as before the move
```

- [ ] **Create `packages/core/` scaffold**
- [ ] **Write `packages/core/package.json`**
- [ ] **Write `packages/core/tsconfig.json` + `tsconfig.build.json`**
- [ ] **`git mv` all source + test directories**
- [ ] **Fix import paths in tests**
- [ ] **Verify typecheck + test pass**
- [ ] **Commit**
```
git add packages/core/
git commit -m "refactor(core): move library source into packages/core/"
```

---

## Task 4: Add `packages/core/src/engine/` — the programmatic API

This is the main new public-facing code. It must follow TDD: write the tests first, then implement.

### 4a — Write failing tests

**File:** `packages/core/tests/unit/engine/lint.test.ts`

```typescript
import { describe, it, expect } from "bun:test";
import { lint } from "../../src/engine/index.js";
import * as path from "node:path";

const FIXTURES = path.resolve(import.meta.dir, "../fixtures");

describe("lint() engine API", () => {
  it("returns an empty array when no files match", async () => {
    const results = await lint({ globs: ["**/*.nonexistent"], cwd: FIXTURES });
    expect(results).toEqual([]);
  });

  it("returns LintResults for each matched file", async () => {
    const results = await lint({
      globs: ["rules/frontmatter/valid.md"],
      cwd: FIXTURES,
    });
    expect(results).toHaveLength(1);
    expect(results[0]!.filePath).toContain("valid.md");
  });

  it("reports errors for a file with known violations", async () => {
    const results = await lint({
      globs: ["rules/frontmatter/missing-tags.md"],
      cwd: FIXTURES,
    });
    expect(results[0]!.errors.length).toBeGreaterThan(0);
  });

  it("respects resolve: false (skips vault bootstrap)", async () => {
    const results = await lint({
      globs: ["rules/frontmatter/valid.md"],
      cwd: FIXTURES,
      resolve: false,
    });
    expect(results).toBeDefined();
  });

  it("returns LintResult with correct filePath type", async () => {
    const results = await lint({
      globs: ["**/*.md"],
      cwd: FIXTURES,
      resolve: false,
    });
    for (const r of results) {
      expect(typeof r.filePath).toBe("string");
      expect(Array.isArray(r.errors)).toBe(true);
    }
  });
});
```

**File:** `packages/core/tests/integration/engine/lint-integration.test.ts`

```typescript
import { describe, it, expect } from "bun:test";
import { lint, fix } from "../../../src/engine/index.js";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";

describe("lint() — integration", () => {
  it("lints a real vault and exits with errors on broken wikilinks", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "mlo-engine-"));
    await fs.mkdir(path.join(dir, ".obsidian"));
    await fs.writeFile(
      path.join(dir, "index.md"),
      "[[missing-page]]\n",
      "utf-8",
    );

    const results = await lint({ globs: ["**/*.md"], cwd: dir });
    await fs.rm(dir, { recursive: true });

    const errors = results.flatMap((r) => r.errors);
    expect(errors.some((e) => e.ruleCode === "OFM001")).toBe(true);
  });
});
```

### 4b — Implement `packages/core/src/engine/index.ts`

```typescript
import { loadConfig } from "../infrastructure/config/ConfigLoader.js";
import { discoverFiles } from "../infrastructure/discovery/FileDiscovery.js";
import { makeMarkdownItParser } from "../infrastructure/parser/MarkdownItParser.js";
import { readMarkdownFile } from "../infrastructure/io/FileReader.js";
import { writeMarkdownFile } from "../infrastructure/io/FileWriter.js";
import { makeNodeFsExistenceChecker } from "../infrastructure/fs/NodeFsExistenceChecker.js";
import { makeNodeFsVaultDetector } from "../infrastructure/vault/NodeFsVaultDetector.js";
import { buildFileIndex } from "../infrastructure/vault/FileIndexBuilder.js";
import { buildBlockRefIndex } from "../infrastructure/vault/BlockRefIndexBuilder.js";
import { registerBuiltinRules } from "../infrastructure/rules/ofm/registerBuiltin.js";
import { loadCustomRules } from "../infrastructure/config/CustomRuleLoader.js";
import { registerCustomRules } from "../infrastructure/rules/registerCustom.js";
import { makeRuleRegistry } from "../domain/linting/RuleRegistry.js";
import { runLint, type LintDependencies } from "../application/LintUseCase.js";
import { runFix, type FixDependencies } from "../application/FixUseCase.js";
import { bootstrapVault } from "../application/VaultBootstrap.js";
import type { LintResult } from "../domain/linting/LintResult.js";
import type { FixOutcome } from "../application/FixUseCase.js";
import * as process from "node:process";

export interface LintOptions {
  /** Glob patterns to match. */
  readonly globs: readonly string[];
  /** Explicit vault root. Auto-detected if omitted. */
  readonly vaultRoot?: string;
  /** Path to a config file. Config cascade applies if omitted. */
  readonly config?: string;
  /** Disable wikilink resolution. Defaults to true. */
  readonly resolve?: boolean;
  /** Working directory for config discovery and glob resolution. Defaults to process.cwd(). */
  readonly cwd?: string;
}

export interface FixOptions extends LintOptions {
  /** Report what would be fixed without writing files. */
  readonly check?: boolean;
}

export type { LintResult, FixOutcome };

/** Run the full linting pipeline and return one LintResult per matched file. */
export async function lint(options: LintOptions): Promise<LintResult[]> {
  const cwd = options.cwd ?? process.cwd();
  const config = await loadConfig(cwd, options.config);
  const effectiveConfig = {
    ...config,
    ...(options.vaultRoot !== undefined && { vaultRoot: options.vaultRoot }),
    ...(options.resolve !== undefined && { resolve: options.resolve }),
  };

  const globs = options.globs.length > 0 ? options.globs : (effectiveConfig.globs ?? []);
  const files = await discoverFiles(globs, effectiveConfig.ignores ?? [], cwd);
  if (files.length === 0) return [];

  const parser = makeMarkdownItParser();
  const fsCheck = makeNodeFsExistenceChecker();
  const registry = makeRuleRegistry();
  registerBuiltinRules(registry);
  const customRuleMods = await loadCustomRules(effectiveConfig.customRules ?? [], cwd);
  registerCustomRules(registry, customRuleMods);

  const bootstrap = await bootstrapVault(cwd, effectiveConfig, {
    detector: makeNodeFsVaultDetector(),
    buildIndex: buildFileIndex,
    buildBlockRefIndex,
  });

  const deps: LintDependencies = {
    parser,
    readFile: readMarkdownFile,
    vault: bootstrap?.vault,
    blockRefIndex: bootstrap?.blockRefs,
    fsCheck,
  };

  return runLint(files, effectiveConfig, registry, deps);
}

/** Run the fix pipeline. Returns first-pass and final-pass LintResults. */
export async function fix(options: FixOptions): Promise<FixOutcome> {
  const cwd = options.cwd ?? process.cwd();
  const config = await loadConfig(cwd, options.config);
  const effectiveConfig = {
    ...config,
    ...(options.vaultRoot !== undefined && { vaultRoot: options.vaultRoot }),
    ...(options.resolve !== undefined && { resolve: options.resolve }),
    fix: !options.check,
  };

  const globs = options.globs.length > 0 ? options.globs : (effectiveConfig.globs ?? []);
  const files = await discoverFiles(globs, effectiveConfig.ignores ?? [], cwd);

  const parser = makeMarkdownItParser();
  const fsCheck = makeNodeFsExistenceChecker();
  const registry = makeRuleRegistry();
  registerBuiltinRules(registry);
  const customRuleMods = await loadCustomRules(effectiveConfig.customRules ?? [], cwd);
  registerCustomRules(registry, customRuleMods);

  const bootstrap = await bootstrapVault(cwd, effectiveConfig, {
    detector: makeNodeFsVaultDetector(),
    buildIndex: buildFileIndex,
    buildBlockRefIndex,
  });

  const deps: FixDependencies = {
    parser,
    readFile: readMarkdownFile,
    writeFile: writeMarkdownFile,
    vault: bootstrap?.vault,
    blockRefIndex: bootstrap?.blockRefs,
    fsCheck,
  };

  return runFix(files, effectiveConfig, registry, deps);
}
```

**Design note:** `lint()` and `fix()` are **not** pure functions (they do I/O). They are, however, free of module-level side effects — no I/O happens at import time. Each call constructs fresh infrastructure objects, consistent with the Low Coupling and no-mutable-state policies.

### 4c — Export `LintOptions`, `FixOptions`, `LintResult`, `FixOutcome` from `src/public/index.ts`

The public API surface (`./api` / `.`) gains the engine types so custom-rule authors can type-check against them. Add re-exports:

```typescript
// packages/core/src/public/index.ts  (additions only)
export type { LintOptions, FixOptions } from "../engine/index.js";
export type { FixOutcome } from "../application/FixUseCase.js";
```

### 4d — Verify

```bash
cd packages/core
bun run test                  # all existing tests + new engine tests pass
bun run typecheck             # zero errors
```

- [ ] **Write failing engine tests**
- [ ] **Implement `src/engine/index.ts`**
- [ ] **Add type re-exports to `src/public/index.ts`**
- [ ] **Verify tests pass and typecheck is clean**
- [ ] **Commit**
```
git add packages/core/src/engine/ packages/core/tests/unit/engine/ \
        packages/core/tests/integration/engine/ packages/core/src/public/index.ts
git commit -m "feat(core): add ./engine programmatic API — lint() and fix()"
```

---

## Task 5: Create `packages/cli/` — the CLI package

The CLI package is intentionally thin. Its only job is argument parsing and calling the library.

### 5a — Directory structure

```
packages/cli/
├── src/
│   ├── main.ts          (moved from packages/core/src/cli/main.ts, adapted)
│   └── args.ts          (moved from packages/core/src/cli/args.ts, unchanged)
├── bin/
│   └── markdownlint-obsidian.js   (moved from packages/core/bin/)
├── tests/
│   ├── unit/
│   │   └── args.test.ts           (moved from core — CLI-specific)
│   └── integration/
│       └── cli/                   (moved from core — CLI integration tests)
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

### 5b — `packages/cli/package.json`

```json
{
  "name": "markdownlint-obsidian-cli",
  "version": "1.0.0",
  "description": "CLI for markdownlint-obsidian — Obsidian Flavored Markdown linting",
  "type": "module",
  "bin": {
    "markdownlint-obsidian": "./dist/bin.mjs"
  },
  "exports": {
    ".": {
      "types": "./dist/src/main.d.ts",
      "default": "./dist/src/main.js"
    }
  },
  "files": ["dist/", "bin/", "README.md", "CHANGELOG.md", "LICENSE"],
  "scripts": {
    "build":     "tsc -p tsconfig.build.json && bun scripts/gen-dist-bin.mjs",
    "typecheck": "tsc --noEmit",
    "test":      "bun test --timeout 30000",
    "prepublishOnly": "bun run build && bun run test"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^12.0.0",
    "markdownlint-obsidian": "workspace:*"
  },
  "engines": { "node": ">=20.0.0", "bun": ">=1.1.30" },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/alisonaquinas/markdownlint-obsidian.git",
    "directory": "packages/cli"
  }
}
```

**Key points:**
- `markdownlint-obsidian: "workspace:*"` — references the library via the Bun workspace protocol. Published packages resolve to the real npm version.
- `commander` lives here, not in the library.
- `chalk` stays here too — it is only needed for terminal formatting.

### 5c — Refactor `packages/cli/src/main.ts`

The current `src/cli/main.ts` imports infrastructure factories directly. After the split it imports from `markdownlint-obsidian/engine` instead. This is the key architectural shift.

**Before (excerpt):**
```typescript
import { loadConfig } from "../infrastructure/config/ConfigLoader.js";
import { discoverFiles } from "../infrastructure/discovery/FileDiscovery.js";
// ... 15 more infrastructure imports
import { runLint } from "../application/LintUseCase.js";
```

**After:**
```typescript
import { lint, fix } from "markdownlint-obsidian/engine";
import { getFormatter } from "markdownlint-obsidian/engine";   // or keep formatter in cli
import type { LintResult } from "markdownlint-obsidian";
```

**Key change:** `main.ts` no longer wires infrastructure. It:
1. Parses argv via `buildProgram()` from `./args.js`
2. Translates CLI options into `LintOptions` / `FixOptions`
3. Calls `lint()` or `fix()` from the library engine
4. Formats and prints output
5. Returns the appropriate exit code

The formatters (`DefaultFormatter`, `JsonFormatter`, `JUnitFormatter`, `SarifFormatter`) need a decision:

**Option A — Formatters stay in the library** (recommended): The `FormatterRegistry` and all formatters remain in `packages/core/src/infrastructure/formatters/`. They are exposed via a new `./formatters` export on the library, or via a `getFormatter(name)` addition to the `./engine` export.

**Option B — Formatters move to CLI**: Only the CLI needs formatters. The library just returns `LintResult[]`. Simpler, but means custom tooling authors have to roll their own output.

**Recommendation: Option A.** Formatters are part of the linting output contract, not the CLI. A programmatic user calling `lint()` may want to format results too. Add a `getFormatter` re-export to `./engine`:

```typescript
// packages/core/src/engine/index.ts (addition)
export { getFormatter } from "../infrastructure/formatters/FormatterRegistry.js";
export type { Formatter } from "../infrastructure/formatters/FormatterRegistry.js";
```

The CLI then becomes:
```typescript
import { lint, fix, getFormatter } from "markdownlint-obsidian/engine";
```

### 5d — Move CLI-specific files

```bash
git mv packages/core/src/cli/main.ts  packages/cli/src/main.ts
git mv packages/core/src/cli/args.ts  packages/cli/src/args.ts
git mv packages/core/bin/             packages/cli/bin/
git mv packages/core/tests/integration/cli/  packages/cli/tests/integration/cli/
# CLI unit tests (if any in core/tests/unit/cli/):
git mv packages/core/tests/unit/cli/  packages/cli/tests/unit/
```

Remove `src/cli/` from `packages/core/` after the move:
```bash
rmdir packages/core/src/cli
```

### 5e — Update imports in `packages/cli/src/main.ts`

Replace all infrastructure/application/domain imports with `markdownlint-obsidian/engine` imports. Also remove the `// @ts-expect-error` import style carried over from earlier phases.

### 5f — `packages/cli/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["src", "tests", "bin"]
}
```

### 5g — Integration tests for the CLI package

The CLI tests (`tests/integration/cli/cli.test.ts`, `tests/integration/cli/fix.test.ts`) use `spawnCli()`. After the move they still spawn the process binary but from the CLI package's `bin/`. Verify the `spawnCli` helper points at the right binary:

```typescript
// packages/cli/tests/integration/helpers/spawnCli.ts
import { bin } from "../../package.json";
// bin path: "../../dist/bin.mjs"
```

### 5h — Verify

```bash
cd packages/cli
bun run typecheck   # zero errors
bun run test        # all CLI integration tests pass
```

- [ ] **Create `packages/cli/` scaffold + `package.json`**
- [ ] **Write `packages/cli/tsconfig.json` + `tsconfig.build.json`**
- [ ] **`git mv` CLI source, bin, tests**
- [ ] **Refactor `packages/cli/src/main.ts`** to use `markdownlint-obsidian/engine`
- [ ] **Update formatter exports in `packages/core/src/engine/`**
- [ ] **Fix `spawnCli` path in CLI tests**
- [ ] **Verify typecheck + tests pass**
- [ ] **Commit**
```
git add packages/cli/
git commit -m "feat(cli): scaffold markdownlint-obsidian-cli package"
```

---

## Task 6: Remove `src/cli/` from root; update root `package.json`

After Tasks 3–5, the root `src/` no longer exists. Clean up root-level files that pointed at it:

- Remove: root `src/`, `bin/`, `tests/`, `examples/`, `scripts/`, `tsconfig.json`, `tsconfig.build.json` (all moved into packages)
- Remove: root `package.json` `exports`, `bin`, `files`, `dependencies` (replaced by workspace scripts in Task 2)
- Update: `dist/` entries in `.gitignore` — each package now has its own `dist/`
- Update: `docs/.obsidian-linter.jsonc` — `test:dogfood` path already updated in Task 2 root scripts

```bash
rm -rf src/ bin/ tests/ examples/ scripts/ dist/
git add -A
git commit -m "chore(root): remove old single-package source tree"
```

---

## Task 7: Update `action/` to use `markdownlint-obsidian-cli`

The GitHub Action currently imports `markdownlint-obsidian/cli` (the `main()` function). After the split, the CLI is in `markdownlint-obsidian-cli`.

### 7a — Update `action/package.json`

```json
{
  "devDependencies": {
    "esbuild": "^0.20.0",
    "markdownlint-obsidian-cli": "workspace:*"
  }
}
```

### 7b — Update `action/src/main.ts`

```typescript
// Before:
import { main as runLinter } from "markdownlint-obsidian/cli";

// After:
import { main as runLinter } from "markdownlint-obsidian-cli";
```

### 7c — Update `action/package.json` root export reference

The esbuild bundler resolves `markdownlint-obsidian-cli` via the workspace link. Verify the action bundle rebuilds cleanly:

```bash
cd action
bun install
bun run build
```

### 7d — Update `packages/cli/package.json` exports

Ensure the default `.` export from `markdownlint-obsidian-cli` exposes `main()` so the action can import it:

```json
{
  "exports": {
    ".": {
      "types": "./dist/src/main.d.ts",
      "default": "./dist/src/main.js"
    }
  }
}
```

- [ ] **Update `action/package.json` dep**
- [ ] **Update `action/src/main.ts` import**
- [ ] **Rebuild action bundle**
- [ ] **Commit**
```
git add action/
git commit -m "fix(action): depend on markdownlint-obsidian-cli, not core ./cli"
```

---

## Task 8: Update Docker image

The Dockerfile builds the CLI binary for hermetic container use. It changes minimally: install the CLI package instead of the single package, and the dist entrypoint becomes the CLI package's `dist/bin.mjs`.

### 8a — Updated `docker/Dockerfile`

```dockerfile
FROM oven/bun:1-alpine AS build
WORKDIR /app

# Copy workspace manifests
COPY package.json bun.lock bunfig.toml ./
COPY packages/core/package.json  packages/core/
COPY packages/cli/package.json   packages/cli/

# Install all workspace deps
RUN bun install --frozen-lockfile

# Copy source
COPY packages/core/src  packages/core/src
COPY packages/core/tsconfig*.json packages/core/
COPY packages/cli/src   packages/cli/src
COPY packages/cli/bin   packages/cli/bin
COPY packages/cli/scripts packages/cli/scripts
COPY packages/cli/tsconfig*.json packages/cli/

# Build library first, then CLI
RUN bun run --cwd packages/core build
RUN bun run --cwd packages/cli  build

# Strip dev deps
RUN bun install --production --frozen-lockfile

FROM node:20-alpine AS runtime
WORKDIR /workdir
COPY --from=build /app/packages/cli/package.json /app/packages/cli/
COPY --from=build /app/packages/cli/node_modules /app/packages/cli/node_modules
COPY --from=build /app/packages/cli/dist /app/packages/cli/dist
COPY --from=build /app/packages/core/dist /app/packages/core/dist
RUN ln -s /app/packages/cli/dist/bin.mjs /usr/local/bin/markdownlint-obsidian \
    && chmod +x /app/packages/cli/dist/bin.mjs
USER node
ENTRYPOINT ["markdownlint-obsidian"]
CMD ["--help"]
```

- [ ] **Update `docker/Dockerfile`**
- [ ] **Local smoke test (if Docker available):**
```bash
docker build -f docker/Dockerfile -t mlo:test .
docker run --rm ghcr.io/alisonaquinas/markdownlint-obsidian:test --version
```
- [ ] **Commit**
```
git add docker/Dockerfile
git commit -m "build(docker): update Dockerfile for monorepo workspace layout"
```

---

## Task 9: Update `.pre-commit-hooks.yaml`

The pre-commit hook runs the binary, which is now provided by `markdownlint-obsidian-cli`. The hook YAML does not change its content (it still calls `markdownlint-obsidian`), but add a note that the language package is now `markdownlint-obsidian-cli`:

```yaml
- id: markdownlint-obsidian
  name: markdownlint-obsidian
  description: Lint Obsidian Flavored Markdown files
  entry: markdownlint-obsidian
  language: node
  # Installed from: markdownlint-obsidian-cli
  additional_dependencies: []
  files: \.md$
  require_serial: false
```

Check whether the pre-commit `language: node` resolver uses `package.json#bin` or the package name. If it uses the package name, the hook file will need to specify `additional_dependencies: [markdownlint-obsidian-cli]`. Consult the pre-commit docs at implementation time.

- [ ] **Update `.pre-commit-hooks.yaml`**
- [ ] **Commit**
```
git add .pre-commit-hooks.yaml
git commit -m "fix(pre-commit): point hook at markdownlint-obsidian-cli"
```

---

## Task 10: Update CI/CD workflows

### 10a — `ci.yml`

The build-and-test workflow needs to be workspace-aware.

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.3.12"

      - name: Install workspace deps
        run: bun install --frozen-lockfile

      - name: Type check (all packages)
        run: bun run --filter '*' typecheck

      - name: Lint
        run: bun run lint

      - name: Build core
        run: bun run --cwd packages/core build

      - name: Build CLI
        run: bun run --cwd packages/cli build

      - name: Test core
        run: bun run --cwd packages/core test

      - name: Test CLI
        run: bun run --cwd packages/cli test

      - name: BDD acceptance tests
        run: bun run test:bdd

      - name: Dogfood docs/
        run: bun run test:dogfood

      - name: Verify action bundle is up-to-date
        run: |
          cd action
          bun install
          bun run build
          cd ..
          git diff --exit-code action/dist/ || {
            echo "action/dist/ is stale — rebuild and commit"
            exit 1
          }
```

### 10b — `release-please-config.json` (update for Phase 12)

When Phase 12 (CD Automation) is implemented, the release-please config must manage two packages:

```json
{
  "$schema": "...",
  "packages": {
    "packages/core": {
      "release-type": "node",
      "package-name": "markdownlint-obsidian",
      "changelog-path": "packages/core/CHANGELOG.md"
    },
    "packages/cli": {
      "release-type": "node",
      "package-name": "markdownlint-obsidian-cli",
      "changelog-path": "packages/cli/CHANGELOG.md",
      "extra-files": [
        {
          "type": "json",
          "path": "action/package.json",
          "jsonpath": "$.version"
        }
      ]
    }
  }
}
```

**Release cadence policy:**
- Library and CLI are versioned **independently**.
- A rule fix bumps `markdownlint-obsidian` only.
- A CLI flag change bumps `markdownlint-obsidian-cli` only.
- Both bump together only for coordinated breaking changes.

### 10c — `npm-publish.yml` (update for Phase 12)

The npm publish workflow publishes both packages on their respective release events:

```yaml
jobs:
  publish-core:
    if: startsWith(github.event.release.tag_name, 'markdownlint-obsidian-v')
    # ...publish packages/core/

  publish-cli:
    if: startsWith(github.event.release.tag_name, 'markdownlint-obsidian-cli-v')
    # ...publish packages/cli/
```

- [ ] **Update `ci.yml`**
- [ ] **Update `release-please-config.json`** (note: Phase 12 must be implemented first)
- [ ] **Update `npm-publish.yml`** (note: Phase 12 must be implemented first)
- [ ] **Commit**
```
git add .github/workflows/ci.yml
git commit -m "ci: update CI for monorepo workspace layout"
```

---

## Task 11: Update documentation

### 11a — New ADR (already done in Task 1)

### 11b — `docs/ddd/bounded-contexts.md`

Add a fourth "context" — the CLI presentation layer — or update the diagram to show the two-package boundary:

```
┌──────────────────────────────────────┐
│  markdownlint-obsidian (library)     │
│  ┌──────────┐  ┌─────────┐  ┌──────┐│
│  │  Config  │→ │ Linting │← │Vault ││
│  └──────────┘  └─────────┘  └──────┘│
└──────────────────────────────────────┘
           ↑ (workspace dep)
┌──────────────────────────────────────┐
│  markdownlint-obsidian-cli           │
│  CLI args → engine API → output      │
└──────────────────────────────────────┘
```

### 11c — `docs/guides/public-api.md`

Add a section on programmatic use via `markdownlint-obsidian/engine`:

```typescript
import { lint } from "markdownlint-obsidian/engine";

const results = await lint({
  globs: ["docs/**/*.md"],
  vaultRoot: "./",
  resolve: true,
});

for (const file of results) {
  for (const error of file.errors) {
    console.log(`${file.filePath}:${error.line} ${error.ruleCode} ${error.message}`);
  }
}
```

### 11d — `README.md` (in both packages)

- `packages/core/README.md` — library focus: programmatic API, custom rules, no binary
- `packages/cli/README.md` — CLI focus: install, usage, exit codes, CI examples

### 11e — `docs/roadmap.md`

Mark Phase 13 as in-progress / complete.

- [ ] **Update `docs/ddd/bounded-contexts.md`**
- [ ] **Update `docs/guides/public-api.md`**
- [ ] **Write `packages/core/README.md`**
- [ ] **Write `packages/cli/README.md`**
- [ ] **Update `docs/roadmap.md`**
- [ ] **Commit**
```
git add docs/ packages/core/README.md packages/cli/README.md
git commit -m "docs: update for package split — engine API, bounded-context diagram, READMEs"
```

---

## Task 12: Full verification pass

Before declaring Phase 13 done, run the complete acceptance criteria:

```bash
# Root workspace
bun install --frozen-lockfile

# Type-check all packages
bun run --filter '*' typecheck

# Lint
bun run lint

# Build all
bun run --cwd packages/core build
bun run --cwd packages/cli  build

# Test all
bun run --cwd packages/core test
bun run --cwd packages/cli  test

# BDD
bun run test:bdd

# Dogfood
bun run test:dogfood

# Action bundle drift
cd action && bun install && bun run build && cd ..
git diff --exit-code action/dist/

# Dry-run publish both packages
cd packages/core && npm publish --dry-run
cd ../cli        && npm publish --dry-run
```

Expected pack contents:
- `markdownlint-obsidian`: `dist/`, `src/`, `examples/`, `README.md`, `CHANGELOG.md`, `LICENSE` — **no `bin/`, no `cli/`, no `commander`**
- `markdownlint-obsidian-cli`: `dist/`, `bin/`, `README.md`, `CHANGELOG.md`, `LICENSE` — **no `domain/`, no `infrastructure/`**

---

## Acceptance criteria

| Check | Expected |
|---|---|
| `npm install markdownlint-obsidian` | Installs with zero CLI/process dependencies |
| `import { lint } from "markdownlint-obsidian/engine"` | Works in Node 20+ and Bun 1.1+ without installing `commander` |
| `npm install markdownlint-obsidian-cli -g` | Installs binary `markdownlint-obsidian` |
| CLI binary smoke test | `markdownlint-obsidian --version` prints current version |
| `bun run test` (core) | All existing library + engine tests pass |
| `bun run test` (cli) | All CLI integration + BDD tests pass |
| `bun run typecheck` (both) | Zero TypeScript errors |
| `npm publish --dry-run` (core) | `commander` absent from pack contents |
| `npm publish --dry-run` (cli) | `markdownlint` rules absent from pack contents |
| Action bundle rebuilds cleanly | `git diff --exit-code action/dist/` passes after rebuild |
| Docker build | `docker run ... --version` succeeds |

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Circular workspace dep (cli → core → cli) | Low | core must never import cli; enforced by ESLint import rule |
| `bun install` file: link issues on Windows (seen in PR #7 CI fix) | Medium | Use `workspace:*` protocol, not `file:..`; Bun handles workspace links correctly |
| release-please monorepo versioning complexity | Medium | Phase 12 must be updated before the first post-split release; bootstrap-sha must be reset |
| Pre-commit hook package name change breaks existing users | Low | `markdownlint-obsidian-cli` publishes the same binary name; only the npm package name changes |
| Docker multi-stage COPY paths become more complex | Low | Dockerfile is tested in CI on every release |
| BDD world.ts `runCLI` binary path breaks | Medium | Update `world.ts` to reference `packages/cli/bin/` explicitly; test in CI |
