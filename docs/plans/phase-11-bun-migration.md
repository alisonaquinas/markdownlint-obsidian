# Phase 11: Bun Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

> **Pre-reading:** `docs/research/bun-migration.md` — inventory of Node surface, Bun capabilities, gaps, and migration shape. Read it before starting Task 1.

**Goal:** Adopt Bun 1.1+ as the primary development, test, and CI runtime for markdownlint-obsidian while preserving Node 20+ as a supported runtime for published CLI consumers. Replace tsx, Vitest, and the npm-driven CI path with Bun-native equivalents. Keep the GitHub Action's Node 20 target (Actions runners do not support Bun natively) and keep the published package's bin shebang Node-compatible.

**Architecture:** Dual-runtime. Local dev, `bun test`, `bun run build`, CI workflow, and the Docker image all move to Bun. The published artifact (`dist/`) and the dev bin stay Node-compatible so `npx markdownlint-obsidian` and `node dist/bin.mjs` continue to work. The GitHub Action wrapper (`action/`) keeps esbuild — Actions only supports Node as a JS runtime.

**Tech stack delta:**

- **Add:** Bun ≥ 1.1.30, `bunfig.toml`, `oven-sh/setup-bun@v2`, `oven/bun:1-alpine` base image.
- **Remove:** `tsx`, `vitest`, `@vitest/coverage-v8`, `vitest.config.ts`, `--import tsx` invocations, `package-lock.json` (replaced by `bun.lock`).
- **Unchanged:** TypeScript compiler, ESLint, Prettier, Cucumber, fast-check, markdownlint, esbuild (only inside `action/`), every runtime dependency.

---

## File Map

```
bin/
  markdownlint-obsidian.js                     UPDATED: shebang to bun; still .js name for publish compat
bunfig.toml                                    NEW: Bun config (test coverage, preload)
package.json                                   UPDATED: scripts, devDeps, engines
bun.lock                                       NEW: generated
package-lock.json                              DELETED
vitest.config.ts                               DELETED
tests/
  **/*.test.ts                                 UPDATED: import from "bun:test" instead of "vitest"
  integration/helpers/spawnCli.ts              UPDATED: spawn Bun directly, drop tsx loader
docker/
  Dockerfile                                   UPDATED: oven/bun:1-alpine, drop dist/bin.mjs shim
.github/
  workflows/ci.yml                             UPDATED: setup-bun, bun install --frozen-lockfile
docs/
  guides/ci-integration.md                     UPDATED: Bun-first guidance, Node fallback
  guides/custom-rules.md                       UPDATED: note Bun executes TS directly
  research/bun-migration.md                    (already written, referenced here)
README.md                                      UPDATED: dev setup uses Bun, consumer docs still Node
CHANGELOG.md                                   UPDATED: Phase 11 entry
```

---

### Task 1: Bun installation + lockfile bootstrap

**Goal:** Get a green `bun install` locally and commit the lockfile. No behavior change yet.

**Files:**

- Add: `bun.lock`
- Modify: `package.json` (add `"packageManager"` field, keep all scripts as-is for now)
- Modify: `.gitignore` if it explicitly ignores `bun.lock` (it won't, but check)

- [ ] **Verify Bun version**

```bash
bun --version    # must be >= 1.1.30
```

- [ ] **Generate lockfile**

```bash
bun install
```

This reads `package.json`, writes `bun.lock` (text format; the binary `bun.lockb` is an older default — text is current recommendation), populates `node_modules/`. Confirm `npm run test` still passes using the freshly-populated `node_modules/` — this proves the dependency graph resolves identically.

- [ ] **Run the full npm-driven suite as a sanity check**

```bash
npm run typecheck
npm run lint
npm run test
npm run test:bdd
```

All must pass using the Bun-populated `node_modules/`. If any fails, investigate before continuing — this is the last known-good checkpoint.

- [ ] **Commit**

```bash
git add bun.lock package.json
git commit -m "chore(bun): add bun.lock and packageManager field"
```

---

### Task 2: Rewrite `tests/**/*.test.ts` imports

**Goal:** Flip every test import from `"vitest"` to `"bun:test"` in a single sweep. No infrastructure changes yet; tests keep running under Vitest until Task 3.

**Files:**

- Modify: every `tests/**/*.test.ts` that imports from `"vitest"`

- [ ] **Sweep the imports**

```bash
# verify scope first
grep -rln 'from "vitest"' tests/

# then rewrite (macOS/BSD sed: -i ''; GNU: -i)
find tests -name '*.test.ts' -exec sed -i 's|from "vitest"|from "bun:test"|g' {} +
```

- [ ] **Confirm `bun:test` covers every imported symbol.** Cross-check against the research doc (§3.1). The Vitest symbols we use: `describe`, `it`, `expect`, `beforeEach`, `afterEach`, `beforeAll`, `afterAll`, `vi`. All are exported from `"bun:test"`.

- [ ] **Verify no `vi.mock` path ambiguity.** Bun's `vi` alias supports `vi.fn`, `vi.spyOn`, `vi.mock`, `vi.clearAllMocks`, `vi.restoreAllMocks`. Grep for any other `vi.*` usage:

```bash
grep -rn "vi\." tests/ | grep -v "vi\.fn\|vi\.spyOn\|vi\.mock\|vi\.clearAllMocks\|vi\.restoreAllMocks"
```

If this returns any hits, pause and triage each — they need manual porting.

- [ ] **Verify `bun test` runs green**

```bash
bun test
```

This should pass without `bunfig.toml` — Bun discovers `tests/**/*.test.ts` by default. Coverage thresholds are not yet enforced; that's Task 3.

- [ ] **Commit**

```bash
git add tests/
git commit -m "test(bun): port vitest imports to bun:test"
```

---

### Task 3: Delete Vitest, add `bunfig.toml`, wire coverage

**Goal:** Remove Vitest entirely and replace coverage config with `bunfig.toml`.

**Files:**

- Delete: `vitest.config.ts`
- Create: `bunfig.toml`
- Modify: `package.json` (remove `vitest`, `@vitest/coverage-v8` from `devDependencies`; update `test`/`test:coverage`/`test:watch` scripts)

- [ ] **Write `bunfig.toml`**

```toml
[test]
coverage = false
coverageThreshold = { lines = 0.80, functions = 0.80, branches = 0.80 }
coverageReporter = ["text", "lcov"]
coverageDir = "coverage"
```

Coverage stays **off by default** so `bun test` without flags is fast; `bun test --coverage` enforces the thresholds. This matches the prior Vitest behavior where `npm run test` did not gate on coverage and `npm run test:coverage` did.

- [ ] **Update `package.json` scripts**

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . && prettier --check .",
    "format": "prettier --write .",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage",
    "test:bdd": "bun node_modules/@cucumber/cucumber/bin/cucumber.js --tags @smoke",
    "test:dogfood": "cd docs && bun ../bin/markdownlint-obsidian.js \"**/*.md\"",
    "test:all": "bun run typecheck && bun run lint && bun run test && bun run test:bdd",
    "prepublishOnly": "bun run build && bun run test:all"
  }
}
```

- [ ] **Remove Vitest devDependencies**

```bash
bun remove vitest @vitest/coverage-v8
```

- [ ] **Delete config**

```bash
rm vitest.config.ts
```

- [ ] **Remove `vitest.config.ts` from `tsconfig.json` `include`** if listed (it is — drop that entry).

- [ ] **Verify**

```bash
bun run typecheck
bun run test
bun run test:coverage
bun run test:bdd
```

All green.

- [ ] **Commit**

```bash
git add bunfig.toml package.json bun.lock tsconfig.json
git rm vitest.config.ts
git commit -m "test(bun): replace vitest with bun test + bunfig.toml"
```

---

### Task 4: Drop tsx, repoint dev bin and `spawnCli`

**Goal:** Remove tsx as a dependency. Dev bin runs through Bun, and the integration spawn helper shells Bun directly.

**Files:**

- Modify: `bin/markdownlint-obsidian.js` (shebang)
- Modify: `tests/integration/helpers/spawnCli.ts`
- Modify: `package.json` (remove `tsx` devDep; `test:bdd`/`test:dogfood` already cleaned in Task 3)

- [ ] **Update `bin/markdownlint-obsidian.js`**

```js
#!/usr/bin/env bun
// Dev entry: Bun executes the TypeScript entry point directly.
// The published hermetic entry is dist/bin.mjs, which keeps a Node-compatible shebang.
import { main } from "../src/cli/main.ts";
const code = await main(process.argv);
process.exit(code);
```

Rationale: local dev uses Bun; consumers who install the published package still get `dist/bin.mjs` (Node shebang). If the published `bin` entry is this file, we must either (a) keep a Node-compatible shebang on the published copy or (b) make `package.json` point its `bin` field at `dist/bin.mjs`. Verify which is in play:

```bash
node -e "const p=require('./package.json'); console.log(p.bin)"
```

If `package.json.bin` points at `bin/markdownlint-obsidian.js`, update it to `dist/bin.mjs` and keep `dist/bin.mjs` as the publish target. The `files` array already includes `dist/`; also add `bin/` only if we publish dev-mode too (we don't need to).

- [ ] **Update `spawnCli.ts`**

```ts
import { spawn } from "node:child_process";
import * as path from "node:path";

export interface SpawnResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

const BIN = path.resolve("bin/markdownlint-obsidian.js");

/**
 * Spawn the dev CLI under Bun. No loader flags needed — Bun executes
 * TypeScript entry points natively.
 */
export function spawnCli(args: readonly string[], cwd: string): Promise<SpawnResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [BIN, ...args], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString("utf8"); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString("utf8"); });
    child.on("close", (code) => { resolve({ exitCode: code ?? 1, stdout, stderr }); });
  });
}
```

Under Bun, `process.execPath` is the Bun binary. The shebang is redundant when we spawn explicitly, but we leave it so direct `./bin/markdownlint-obsidian.js` invocation still works.

- [ ] **Remove tsx**

```bash
bun remove tsx
```

- [ ] **Verify every integration test that uses `spawnCli` still passes**

```bash
bun test tests/integration
```

- [ ] **Commit**

```bash
git add bin/ tests/integration/helpers/spawnCli.ts package.json bun.lock
git commit -m "chore(bun): drop tsx, run dev bin and spawnCli through bun"
```

---

### Task 5: Update `engines`, delete `package-lock.json`

**Goal:** Formalize dual-runtime support in `package.json` and stop shipping the npm lockfile as the source of truth.

**Files:**

- Modify: `package.json`
- Delete: `package-lock.json`

- [ ] **Update engines + packageManager**

```json
{
  "engines": {
    "node": ">=20.0.0",
    "bun": ">=1.1.30"
  },
  "packageManager": "bun@1.1.30"
}
```

Keep `node` so consumers who `npm install markdownlint-obsidian` under Node still get the engines warning, not an error.

- [ ] **Delete `package-lock.json`**

```bash
git rm package-lock.json
```

- [ ] **Verify a clean install still works**

```bash
rm -rf node_modules
bun install --frozen-lockfile
bun run test:all
```

- [ ] **Commit**

```bash
git add package.json
git rm package-lock.json
git commit -m "chore(bun): engines.bun >=1.1.30, drop package-lock.json"
```

---

### Task 6: Docker image on `oven/bun:1-alpine`

**Goal:** Rebuild the hermetic runtime image on Bun. The image exposes the same CLI contract.

**Files:**

- Modify: `docker/Dockerfile`

- [ ] **Rewrite the build stage**

```dockerfile
FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY package.json bun.lock tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY bin ./bin
RUN bun install --frozen-lockfile
RUN bun run build

# Runtime image still uses Node so consumers who exec into the container
# can run tooling without a Bun dependency. Swap FROM line to oven/bun
# if we decide the runtime should also be Bun.
RUN bun install --production --frozen-lockfile

FROM node:20-alpine AS runtime
WORKDIR /workdir
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
RUN ln -s /app/dist/bin.mjs /usr/local/bin/markdownlint-obsidian \
    && chmod +x /app/dist/bin.mjs
ENTRYPOINT ["markdownlint-obsidian"]
```

Note: `dist/bin.mjs` is produced by `tsc`, not by the old printf shim. Verify `tsconfig.build.json` already emits a Node-compatible bin; if not, keep the printf shim but have it point at the compiled `dist/src/cli/main.js`. (If the printf shim is the only producer of `dist/bin.mjs`, preserve it — the goal here is not to redesign the bin, only to swap `FROM node:20-alpine` → `oven/bun:1-alpine` in the build stage.)

- [ ] **Decide runtime base.** Two valid options:
  - **Split (recommended for Phase 11):** build in Bun, runtime in Node. Smallest consumer-surface change — shipping a Node-runtime image is what existing users expect.
  - **All-Bun:** runtime also on `oven/bun:1-alpine`. Saves an image layer, but consumers who `docker exec -it …` into the container lose Node. Revisit post-Phase-11.

- [ ] **Build and smoke test**

```bash
docker build -t markdownlint-obsidian:phase11 -f docker/Dockerfile .
echo "# hi" > /tmp/a.md
docker run --rm -v /tmp:/workdir markdownlint-obsidian:phase11 a.md
```

- [ ] **Commit**

```bash
git add docker/Dockerfile
git commit -m "build(docker): bun build stage, node runtime"
```

---

### Task 7: CI workflow on setup-bun

**Goal:** Replace `actions/setup-node` with `oven-sh/setup-bun` for the main build job.

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/docker-publish.yml` (only if it runs `npm` commands)

- [ ] **Update `ci.yml`**

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
          bun-version: "1.1.30"

      - run: bun install --frozen-lockfile

      - name: Type check
        run: bun run typecheck

      - name: Lint
        run: bun run lint

      - name: Unit + integration tests
        run: bun run test

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
            echo "action/dist/ is stale — run 'cd action && bun install && bun run build' and commit"
            exit 1
          }
```

Note on the action bundle job: `action/` still uses esbuild + its own `package.json`. `bun install` inside `action/` works fine and `bun run build` shells out to esbuild. No content change to the action itself.

- [ ] **Check `docker-publish.yml`** and swap any `npm ci` / `npm run build` lines to their Bun equivalents. If the job only runs Docker commands, no change is needed.

- [ ] **Push to a branch, verify CI green.**

- [ ] **Commit**

```bash
git add .github/workflows/
git commit -m "ci(bun): setup-bun, bun install, bun run scripts"
```

---

### Task 8: Docs — README, guides, changelog

**Goal:** Tell users (contributors and consumers) what changed.

**Files:**

- Modify: `README.md`
- Modify: `docs/guides/ci-integration.md`
- Modify: `docs/guides/custom-rules.md`
- Modify: `CHANGELOG.md`

- [ ] **README dev setup section:**

```markdown
## Development

markdownlint-obsidian uses [Bun](https://bun.sh) 1.1+ for development and CI.
Consumers can still install and run the package under Node.js 20+.

```bash
curl -fsSL https://bun.sh/install | bash
bun install
bun run test:all
```
```

- [ ] **`docs/guides/ci-integration.md`:** add a "Using Bun" section that mirrors the existing Node example. Keep the Node example — most consumer CI pipelines still run on Node.

- [ ] **`docs/guides/custom-rules.md`:** update the "run via tsx" subsection. Under Bun, a `.ts` custom rule file can be loaded directly — no compile step, no `--import tsx`. Consumers who use Node still need to compile or run through tsx, so keep both paths documented.

- [ ] **`CHANGELOG.md` — Phase 11 entry:**

```markdown
## [Unreleased]

### Changed
- Development toolchain migrated to Bun 1.1+. CI, tests, and local dev scripts
  now run through `bun`. Node 20+ remains a supported runtime for the
  published CLI and for programmatic consumers.
- Replaced Vitest with `bun test`. All test imports now come from `bun:test`.
- Dropped `tsx` dev dependency; Bun executes TypeScript entry points natively.
- Docker build stage moved to `oven/bun:1-alpine`; runtime stage stays on
  `node:20-alpine` so consumers who `docker exec` into the container keep
  Node tooling available.

### Removed
- `vitest`, `@vitest/coverage-v8`, `tsx` from devDependencies.
- `package-lock.json` (replaced by `bun.lock`).
- `vitest.config.ts` (replaced by `bunfig.toml`).
```

- [ ] **Commit**

```bash
git add README.md docs/guides/ CHANGELOG.md
git commit -m "docs(bun): document bun-based dev workflow and dual-runtime support"
```

---

### Task 9: Phase 11 verification

- [ ] **Clean slate run**

```bash
rm -rf node_modules dist coverage
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun run test
bun run test:coverage
bun run test:bdd
bun run test:dogfood
bun run build
```

All green.

- [ ] **Coverage thresholds** — `bun test --coverage` must report ≥ 80% lines / functions / branches, matching the pre-migration baseline.

- [ ] **Publish dry-run**

```bash
bun run prepublishOnly
npm publish --dry-run
```

The pack must contain `dist/`, `examples/`, `README.md`, `CHANGELOG.md`, `LICENSE`. It must **not** contain `bun.lock`, `bunfig.toml`, or `vitest.config.ts`.

- [ ] **Node-consumer smoke test** — simulate a Node user installing the published pack:

```bash
bun run build
npm pack
cd /tmp && mkdir node-smoke && cd node-smoke
npm init -y
npm install /path/to/markdownlint-obsidian-*.tgz
npx markdownlint-obsidian --version
```

Must print a version string under Node 20. This proves we haven't accidentally Bun-locked the consumer path.

- [ ] **Docker smoke test** — rebuild, run, expect exit 0 on a valid fixture and exit 1 on a broken one.

- [ ] **Final commit**

```bash
git add -A
git commit -m "chore: Phase 11 complete — Bun dev toolchain, Node runtime support preserved"
```

---

## Phase 11 acceptance criteria

- `bun install --frozen-lockfile` reproduces a working `node_modules/` from `bun.lock`.
- `bun run test:all` passes on Linux, macOS, and Windows.
- CI workflow runs exclusively through Bun; no `actions/setup-node` step remains in `ci.yml`.
- `vitest`, `@vitest/coverage-v8`, and `tsx` no longer appear in `package.json` or `bun.lock`.
- The published pack runs end-to-end under Node 20+ via `npx markdownlint-obsidian`.
- Docker image boots, lints a fixture, and exits with the correct code.
- GitHub Action bundle (`action/dist/main.js`) is regenerated and matches HEAD.
- Coverage thresholds ≥ 80% enforced via `bunfig.toml` + `bun test --coverage`.
- CHANGELOG, README, and CI integration guide reflect the new dual-runtime story.

---

## Out of scope (deferred to a future phase)

- Replacing esbuild with `bun build --target=node` inside `action/`. The Actions runner is Node-only, so there is no runtime benefit; the esbuild swap is pure tooling churn and can wait.
- Compiling a standalone Bun binary via `bun build --compile`. Interesting for single-file distribution but orthogonal to the Node-compat publish story.
- Switching the Docker runtime stage to `oven/bun:1-alpine`. Revisit after users have had a release to adjust to the Bun-dev story.
- Publishing via `bun publish` instead of `npm publish`. `npm publish` keeps working and there's no observable user-facing difference.
