# Research: Migrating markdownlint-obsidian from Node.js to Bun

> Scope: evaluate what it would take to move the entire toolchain (dev, test, build, publish, CI, Docker, GitHub Action) from Node 20 + npm + tsx + vitest + cucumber to Bun. Produced as pre-work for the Phase 11 implementation plan.

## 1. Current Node-shaped surface

Before discussing the target, inventory what actually depends on Node today.

### Runtime entry points

- `bin/markdownlint-obsidian.js` — dev shebang `#!/usr/bin/env -S node --import tsx`, imports `src/cli/main.ts` directly. Relies on the **tsx loader** to execute TypeScript without a build step.
- `docker/Dockerfile` — runtime stage generates a second bin, `dist/bin.mjs`, with shebang `#!/usr/bin/env node`, and imports the **compiled** `dist/src/cli/main.js`. This is the hermetic entry.
- `action/src/main.ts` — bundled with **esbuild** to a single CJS file (`--platform=node --target=node20 --format=cjs`) shipped as `action/dist/main.js`. GitHub Actions invokes this with the Actions Node runtime, which is Node 20 today.

### Scripts (`package.json`)

| script | current command | Bun equivalent |
|---|---|---|
| `build` | `tsc -p tsconfig.build.json` | still `tsc`, or `bun build` for the CLI bundle |
| `typecheck` | `tsc --noEmit` | unchanged |
| `lint` | `eslint . && prettier --check .` | unchanged (run via `bun x eslint` / `bun x prettier`) |
| `format` | `prettier --write .` | unchanged |
| `test` | `vitest run` | `bun test` (requires test rewrite — see §3) |
| `test:bdd` | `node --import tsx node_modules/@cucumber/cucumber/bin/cucumber.js --tags @smoke` | `bun node_modules/@cucumber/cucumber/bin/cucumber.js --tags @smoke` (Bun runs TS directly; no loader flag) |
| `test:dogfood` | `node --import tsx ../bin/markdownlint-obsidian.js "**/*.md"` | `bun ../bin/markdownlint-obsidian.ts "**/*.md"` (or keep `.js` re-export) |
| `test:all` | chain | chain |
| `prepublishOnly` | `npm run build && npm run test:all` | `bun run build && bun run test:all` |

### Node-API usage in `src/`

Grepped for `node:` imports and native globals. Findings:

- Pure `node:` stdlib: `node:fs`, `node:fs/promises`, `node:path`, `node:url` (`pathToFileURL`), `node:process` (implicit), `node:os`. Every single one is **fully implemented by Bun**.
- No `child_process` or `worker_threads` in `src/`.
- `tests/integration/helpers/spawnCli.ts` **does** use `node:child_process.spawn`, invoking `process.execPath` + the tsx loader. Under Bun this becomes a single `bun <entry>` invocation — simpler, not more complex.
- No `Buffer.*` constructors, no `__dirname` / `__filename` (the project is pure ESM), no `require()`. Already Bun-friendly.

### Dev toolchain

- **Package manager:** npm (lockfile: `package-lock.json`). Bun has its own lockfile `bun.lock` / `bun.lockb`.
- **TS runner:** tsx (4.21). Bun executes `.ts` and `.tsx` natively; tsx becomes removable.
- **Test runner:** Vitest 2 with `@vitest/coverage-v8`. Bun ships `bun test` with Jest-compatible API and a `vi` alias for Vitest compat — but there are real gaps (see §3).
- **BDD:** Cucumber 10 with `--import tsx`. Works under Bun by dropping `--import tsx`.
- **Property tests:** fast-check 3. Pure JS; runtime-agnostic.
- **Bundler:** esbuild (only inside `action/`). Bun can replace esbuild via `bun build --target=node`, but swapping is optional — esbuild itself works fine under Bun.

### External dependencies (runtime)

`chalk`, `commander`, `fast-xml-parser`, `globby`, `gray-matter`, `js-yaml`, `jsonc-parser`, `markdown-it`, `markdownlint`, `minimatch`. All pure JS / zero native addons. Bun's Node compat covers everything these packages touch.

## 2. Bun capabilities relevant to this project

Summary of what Bun gives us out-of-the-box, confirmed against current upstream docs (context7, `/oven-sh/bun`, accessed during this research):

- **Native TypeScript + JSX execution.** `bun <file>.ts` works with no flags, no loader, no `tsx`. The dev bin can use `#!/usr/bin/env bun` and point straight at `src/cli/main.ts`.
- **`bun test`** — Jest-compatible globals (`describe`, `it`, `expect`), plus a `vi` import from `"bun:test"` that aliases Vitest's mocking API. Coverage is built in (`bun test --coverage`), no `@vitest/coverage-v8` needed.
- **`bun build --compile`** — produces a standalone executable with the Bun runtime embedded. Interesting for distribution but not mandatory for the npm package.
- **`bun build --target=node`** — can replace esbuild in `action/` if we want a single toolchain, but this is optional for Phase 11.
- **`bun install`** — reads `package.json` verbatim; lockfile is separate. Dramatically faster than `npm ci`, which is the main CI win.
- **`node:` compatibility** — every `node:` module we use is implemented. `process.execPath` under Bun points at the Bun binary, which matters for `spawnCli` (see §3).
- **Shebang handling.** Bun respects `#!/usr/bin/env node` by default (runs the file through Node-compat mode), and `#!/usr/bin/env bun` runs through Bun explicitly. A published package can keep the Node shebang and still work for Bun users.

## 3. Gaps, risks, and open questions

### 3.1 Vitest → Bun test migration

This is the single biggest piece of work. Current test files import from `"vitest"`:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
```

Bun test wants:

```ts
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
```

Bun advertises that it auto-rewrites `@jest/globals` imports, but **does not auto-rewrite `"vitest"` imports** — those have to be changed manually (or by codemod). Every `*.test.ts` under `tests/` will need its import line rewritten.

Other known friction:

- **`vitest.config.ts` does not map to `bun test`.** Bun reads coverage config from `bunfig.toml` and CLI flags. Per-directory coverage thresholds (we don't use them yet, just a global 80%) map cleanly; the `include: ["src/**"]` filter maps to `--coverage-dir`.
- **Property tests.** fast-check works under `bun test` (it's runtime-agnostic), but its integration with Vitest's `test.prop` helper won't exist. We don't use that helper, so this is a non-issue.
- **Snapshot format.** If we use `toMatchSnapshot()` anywhere, the snapshot file layout differs slightly. Quick grep needed during implementation.
- **`vi.*` ↔ Bun.** Bun's `bun:test` exports a `vi` object that proxies to `mock`/`spyOn`. We can keep `vi.fn()` calls intact if we import `vi` from `"bun:test"`.

Risk level: **Medium.** Mechanical rewrite, but touches every test file.

### 3.2 Cucumber under Bun

Cucumber's CLI is a plain Node script. Under Bun it runs as:

```shell
bun node_modules/@cucumber/cucumber/bin/cucumber.js --tags @smoke
```

No loader flag needed — Bun transpiles the TS step definitions (`docs/bdd/steps/**/*.ts`) on the fly. The one thing to verify during implementation is that Cucumber's dynamic `import()` of step files resolves TS paths; it does in practice because Bun intercepts the loader, but this needs a live smoke test before we declare it green.

Risk level: **Low–Medium.**

### 3.3 `spawnCli` helper

`tests/integration/helpers/spawnCli.ts` currently spawns `process.execPath` with `--import <tsx loader>`. Under Bun:

- `process.execPath` points at the Bun binary. Good.
- We drop the `--import` argument entirely and point the spawn at `bin/markdownlint-obsidian.ts` (or keep `.js`, since Bun handles either).
- The `BIN` path constant needs updating because we may rename the shebang bin.

Risk level: **Low.** One file, ~5-line edit.

### 3.4 Docker image

Currently `FROM node:20-alpine`. Options:

- **`oven/bun:1-alpine`** (official). Same Alpine base layer size; swaps Node for Bun.
- Keep Node image, install Bun on top. Not worth it — we'd ship both runtimes.

The `dist/bin.mjs` trick in the Dockerfile exists because the dev bin uses tsx. Under Bun, the dev bin works as-is in the runtime stage (Bun executes TS natively), so we can **delete** the whole `printf '#!/usr/bin/env node' …` block. The bin becomes:

```dockerfile
RUN ln -s /app/bin/markdownlint-obsidian.js /usr/local/bin/markdownlint-obsidian
```

We may still want a build step for smaller images (no src, no devDeps), but it becomes optional instead of required.

Risk level: **Low.**

### 3.5 GitHub Action bundle

`action/` uses esbuild to produce a CJS bundle. GitHub's action runner **only supports Node as the JS runtime** for `runs.using: node20` / `node24`. Bun is not a supported action runtime.

Implications:

- `action/src/main.ts` must keep targeting Node. Either leave esbuild in place (simplest — it works fine invoked by Bun) or switch to `bun build --target=node --format=cjs` which produces equivalent output. Both are valid; I'd recommend leaving esbuild alone in Phase 11 and only migrating if we see a reason.
- The action's own build command runs in CI; that CI job will run under Bun but shell out to esbuild. No breakage.

Risk level: **Low**, but worth calling out explicitly so we don't accidentally try to make the action use Bun at runtime.

### 3.6 `npm publish` semantics

Bun can publish via `bun publish` (Bun 1.1.22+). For a package that's already on npmjs.org, `npm publish` still works when invoked from the Bun install tree — npm only needs Node when it execs a lifecycle script that we've defined, and our only lifecycle is `prepublishOnly`, which calls `bun run build && bun run test:all`. Either path works. Simplest plan: keep `npm publish` for the actual publish step, run everything else through Bun.

Risk level: **Low.**

### 3.7 CI caching

`actions/setup-node@v4` with `cache: npm` is Node-specific. Bun has `oven-sh/setup-bun@v2` with lockfile-aware caching. Cache key becomes `bun.lock`. The swap is mechanical.

Risk level: **Low.**

### 3.8 Engines field and consumer impact

`package.json` currently declares `"engines": { "node": ">=20.0.0" }`. Options:

- **Dual-support** (recommended): keep Node 20+ as a supported runtime, add Bun 1.1+ as a tested runtime. Ship the same `dist/`, don't lock out Node consumers. The bin keeps a Node-compatible shebang so `npx markdownlint-obsidian` still works. Internal dev uses Bun.
- **Bun-only:** change the bin shebang to `#!/usr/bin/env bun`, drop the `"engines.node"` field, add `"engines.bun"`. This would break every existing Node consumer. **Not recommended** for a published CLI with external users.

Phase 11 should pick dual-support. The `dist/bin.mjs` shim produced during `npm run build` stays Node-compatible; the dev bin may move to a Bun shebang for local speed.

Risk level: **Policy decision, not technical.**

### 3.9 Windows support

The user's primary machine is Windows. Bun has native Windows support (stable since 1.1). All scripts in `package.json` are shell-agnostic. The one thing to verify during implementation: the `node --import tsx …` replacement in `test:bdd` becomes a bare `bun`, so nothing shell-quoting-sensitive changes.

Risk level: **Low.** Worth a fresh `bun test` smoke on Windows before declaring done.

## 4. Migration shape

A good migration minimizes mixed state. The proposed shape:

1. **Install Bun locally**, generate `bun.lock`, delete `package-lock.json` (or keep it until we're confident — dual lockfiles are legal but confusing).
2. **Drop tsx dependency.** Remove from `devDependencies`. Update dev bin shebang to `#!/usr/bin/env bun`. Remove `--import tsx` from every script.
3. **Rewrite test imports** from `"vitest"` to `"bun:test"`. Delete `vitest.config.ts`. Add `bunfig.toml` with coverage thresholds.
4. **Update `spawnCli`** to invoke Bun directly.
5. **Docker:** swap to `oven/bun:1-alpine`. Delete the dist bin shim.
6. **CI:** swap `setup-node` → `setup-bun`. Replace `npm ci` with `bun install --frozen-lockfile`. Replace every `npm run <x>` with `bun run <x>`.
7. **Action:** leave esbuild in place. The action's own `npm install && npm run build` step in CI keeps working (Bun installs via `bun install`, esbuild runs under Bun fine). Optionally migrate to `bun build --target=node` in a follow-up.
8. **Docs:** update README, CI guide, and custom-rules guide to mention Bun as the primary dev runtime with Node as a supported consumer runtime.

## 5. What this buys us

- **CI time:** `bun install` vs `npm ci` is typically a 3–10× win on cold cache. Test runtime also drops substantially (Bun test is faster than Vitest on comparable suites).
- **Fewer moving pieces:** dropping tsx removes one loader and one source of "why isn't my TS import resolving?" confusion.
- **One tool for test + bundle + package-manage.** Less Node-version drift; less `which node` vs `which bun` ambiguity.
- **Windows dev velocity** improves (Bun install is substantially faster than npm on Windows's filesystem).

## 6. What this costs us

- One-off migration effort (~Phase 11 scope, see plan).
- Ongoing dual-runtime awareness: we need to keep the published bin Node-compatible for consumers who don't use Bun.
- Any future test-runner feature that Vitest adds ahead of Bun needs a compat check.

## 7. References

- `/oven-sh/bun` (context7 query, 2026-04-12): `bun test` is Jest-compatible, `bun:test` exports `vi`, `bun build --compile` for executables, shebang handling defaults to Node-compat.
- Local inventory: `src/`, `tests/`, `bin/`, `docker/Dockerfile`, `action/`, `.github/workflows/ci.yml`.
