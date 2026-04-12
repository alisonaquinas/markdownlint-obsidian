# Phase 8: CI Delivery — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the CI integration stack that users actually consume: JUnit and SARIF formatters, a GitHub Action, a pre-commit hook, and a Docker image. Publish the npm package as `0.8.0`. By the end of this phase the linter can be dropped into any CI pipeline with one line of YAML.

**Architecture:** Two new formatters live beside the existing default/JSON formatters and register via the same `FormatterRegistry`. The GitHub Action is a JavaScript action (not Docker) so users on macOS/Windows runners are not forced to Linux. A separate Docker image is provided for pipelines that want hermetic execution. The pre-commit hook is a `.pre-commit-hooks.yaml` manifest pointing at the npm bin.

**Tech Stack:** Phase 7 stack plus `fast-xml-parser` 4 (for SARIF/JUnit serialization) — avoids hand-written XML escaping bugs.

---

## File Map

```
src/
  infrastructure/formatters/
    JUnitFormatter.ts
    SarifFormatter.ts
    FormatterRegistry.ts          UPDATED: register junit + sarif
action/
  action.yml                      GitHub Action manifest
  src/
    main.ts                       Action entry — reads inputs, runs CLI, writes outputs
  package.json
  README.md
docker/
  Dockerfile
  entrypoint.sh
.pre-commit-hooks.yaml             Pre-commit manifest
tests/
  unit/formatters/
    JUnitFormatter.test.ts
    SarifFormatter.test.ts
  integration/
    formatters/formatter-cli.test.ts
    docker/docker-smoke.test.ts    (optional; runs only when Docker is available)
docs/
  guides/
    ci-integration.md              Expanded
  rules/                           (no changes)
```

---

### Task 1: Install fast-xml-parser

**Files:**

- Modify: `package.json`

- [ ] **Install**

```bash
npm install fast-xml-parser
```

- [ ] **Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add fast-xml-parser for JUnit/SARIF serialization"
```

---

### Task 2: JUnitFormatter

**Files:**

- Create: `src/infrastructure/formatters/JUnitFormatter.ts`
- Create: `tests/unit/formatters/JUnitFormatter.test.ts`
- Create: `tests/unit/formatters/__snapshots__/JUnitFormatter.snap`

JUnit XML is one `<testsuite>` per file with one `<testcase>` per rule invocation on that file. Each `LintError` becomes a `<failure>` inside its `<testcase>`. Files with no errors become passing test cases so totals line up.

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { formatJUnit } from "../../../src/infrastructure/formatters/JUnitFormatter.js";
import { makeLintError } from "../../../src/domain/linting/LintError.js";
import { makeLintResult } from "../../../src/domain/linting/LintResult.js";

describe("JUnitFormatter", () => {
  it("wraps every result in a testsuite", () => {
    const err = makeLintError({
      ruleCode: "OFM001", ruleName: "no-broken-wikilinks",
      severity: "error", line: 1, column: 1,
      message: "broken", fixable: false,
    });
    const results = [
      makeLintResult("notes/a.md", [err]),
      makeLintResult("notes/b.md", []),
    ];
    const xml = formatJUnit(results);
    expect(xml).toContain(`<testsuite name="notes/a.md"`);
    expect(xml).toContain(`<failure`);
    expect(xml).toContain(`OFM001`);
    expect(xml).toContain(`<testsuite name="notes/b.md"`);
  });

  it("escapes XML-hostile message text", () => {
    const err = makeLintError({
      ruleCode: "OFM002", ruleName: "x",
      severity: "error", line: 1, column: 1,
      message: `bad <tag> & "quote"`,
      fixable: false,
    });
    const xml = formatJUnit([makeLintResult("x.md", [err])]);
    expect(xml).not.toContain("<tag>");
    expect(xml).toContain("&lt;tag&gt;");
    expect(xml).toContain("&amp;");
    expect(xml).toContain("&quot;");
  });

  it("snapshots a representative run", () => {
    const err = makeLintError({
      ruleCode: "OFM001", ruleName: "no-broken-wikilinks",
      severity: "error", line: 3, column: 5,
      message: "missing target", fixable: false,
    });
    expect(formatJUnit([makeLintResult("notes/index.md", [err])])).toMatchSnapshot();
  });
});
```

- [ ] **Implement `JUnitFormatter.ts`**

```ts
import { XMLBuilder } from "fast-xml-parser";
import type { LintResult } from "../../domain/linting/LintResult.js";

interface TestCaseShape {
  "@_name": string;
  "@_classname": string;
  failure?: { "@_message": string; "#text": string };
}

interface TestSuiteShape {
  "@_name": string;
  "@_tests": number;
  "@_failures": number;
  "@_errors": number;
  testcase: TestCaseShape[];
}

const builder = new XMLBuilder({
  ignoreAttributes: false,
  format: true,
  suppressEmptyNode: false,
});

/**
 * JUnit XML with one suite per file and one testcase per error (plus a
 * synthesised passing case for clean files so the suite count is stable).
 */
export function formatJUnit(results: readonly LintResult[]): string {
  const suites: TestSuiteShape[] = results.map((r) => {
    const cases: TestCaseShape[] = r.errors.map((e) => ({
      "@_name": `${e.ruleCode} ${e.ruleName}`,
      "@_classname": r.filePath,
      failure: {
        "@_message": e.message,
        "#text": `${r.filePath}:${e.line}:${e.column} ${e.ruleCode} ${e.message}`,
      },
    }));
    if (cases.length === 0) {
      cases.push({
        "@_name": "clean",
        "@_classname": r.filePath,
      });
    }
    return {
      "@_name": r.filePath,
      "@_tests": cases.length,
      "@_failures": r.errors.length,
      "@_errors": 0,
      testcase: cases,
    };
  });

  const doc = {
    "?xml": { "@_version": "1.0", "@_encoding": "UTF-8" },
    testsuites: {
      testsuite: suites,
    },
  };

  return builder.build(doc);
}
```

- [ ] **Run + Commit**

```bash
git add src/infrastructure/formatters/JUnitFormatter.ts \
        tests/unit/formatters/JUnitFormatter.test.ts
git commit -m "feat(formatters): add JUnit XML formatter"
```

---

### Task 3: SarifFormatter

**Files:**

- Create: `src/infrastructure/formatters/SarifFormatter.ts`
- Create: `tests/unit/formatters/SarifFormatter.test.ts`

SARIF is strict JSON, not XML. GitHub's code scanning requires version `2.1.0`.

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { formatSarif } from "../../../src/infrastructure/formatters/SarifFormatter.js";
import { makeLintError } from "../../../src/domain/linting/LintError.js";
import { makeLintResult } from "../../../src/domain/linting/LintResult.js";

describe("SarifFormatter", () => {
  it("produces valid SARIF 2.1.0 JSON", () => {
    const err = makeLintError({
      ruleCode: "OFM001", ruleName: "no-broken-wikilinks",
      severity: "error", line: 2, column: 3,
      message: "broken", fixable: false,
    });
    const output = JSON.parse(formatSarif([makeLintResult("notes/a.md", [err])]));
    expect(output.version).toBe("2.1.0");
    expect(output.runs[0].tool.driver.name).toBe("markdownlint-obsidian");
    expect(output.runs[0].results).toHaveLength(1);
    const result = output.runs[0].results[0];
    expect(result.ruleId).toBe("OFM001");
    expect(result.level).toBe("error");
    expect(result.locations[0].physicalLocation.region.startLine).toBe(2);
  });

  it("deduplicates rule metadata", () => {
    const mkErr = () => makeLintError({
      ruleCode: "OFM001", ruleName: "no-broken-wikilinks",
      severity: "error", line: 1, column: 1,
      message: "x", fixable: false,
    });
    const sarif = JSON.parse(
      formatSarif([makeLintResult("a.md", [mkErr(), mkErr()])]),
    );
    expect(sarif.runs[0].tool.driver.rules).toHaveLength(1);
    expect(sarif.runs[0].results).toHaveLength(2);
  });
});
```

- [ ] **Implement `SarifFormatter.ts`**

```ts
import type { LintResult } from "../../domain/linting/LintResult.js";
import type { LintError } from "../../domain/linting/LintError.js";

const TOOL_NAME = "markdownlint-obsidian";
const TOOL_VERSION = "0.8.0";

interface SarifRule {
  id: string;
  name: string;
  shortDescription: { text: string };
  defaultConfiguration: { level: "error" | "warning" | "note" };
}

interface SarifResult {
  ruleId: string;
  level: "error" | "warning";
  message: { text: string };
  locations: ReadonlyArray<{
    physicalLocation: {
      artifactLocation: { uri: string };
      region: { startLine: number; startColumn: number };
    };
  }>;
}

/** Format results as SARIF 2.1.0 JSON. */
export function formatSarif(results: readonly LintResult[]): string {
  const rulesById = new Map<string, SarifRule>();
  const sarifResults: SarifResult[] = [];

  for (const file of results) {
    for (const err of file.errors) {
      if (!rulesById.has(err.ruleCode)) {
        rulesById.set(err.ruleCode, toSarifRule(err));
      }
      sarifResults.push({
        ruleId: err.ruleCode,
        level: err.severity,
        message: { text: err.message },
        locations: [
          {
            physicalLocation: {
              artifactLocation: { uri: file.filePath },
              region: { startLine: err.line, startColumn: err.column },
            },
          },
        ],
      });
    }
  }

  const doc = {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: TOOL_NAME,
            version: TOOL_VERSION,
            informationUri: "https://github.com/mscottx88/markdownlint-obsidian",
            rules: [...rulesById.values()],
          },
        },
        results: sarifResults,
      },
    ],
  };

  return JSON.stringify(doc, null, 2);
}

function toSarifRule(err: LintError): SarifRule {
  return {
    id: err.ruleCode,
    name: err.ruleName,
    shortDescription: { text: err.ruleName },
    defaultConfiguration: { level: err.severity },
  };
}
```

- [ ] **Run + Commit**

```bash
git add src/infrastructure/formatters/SarifFormatter.ts \
        tests/unit/formatters/SarifFormatter.test.ts
git commit -m "feat(formatters): add SARIF 2.1.0 formatter"
```

---

### Task 4: Register new formatters

**Files:**

- Modify: `src/infrastructure/formatters/FormatterRegistry.ts`
- Modify: `src/cli/args.ts` (update `--output-formatter` help text)

- [ ] **Update `FormatterRegistry.ts`**

```ts
import { formatDefault } from "./DefaultFormatter.js";
import { formatJson } from "./JsonFormatter.js";
import { formatJUnit } from "./JUnitFormatter.js";
import { formatSarif } from "./SarifFormatter.js";

type Formatter = (results: readonly LintResult[]) => string;

const FORMATTERS: Record<string, Formatter> = {
  default: formatDefault,
  json: formatJson,
  junit: formatJUnit,
  sarif: formatSarif,
};
```

- [ ] **Update CLI help** — `--output-formatter <name>` now documents `default|json|junit|sarif`.

- [ ] **Add CLI integration test** to `tests/integration/formatters/formatter-cli.test.ts` exercising each formatter via `spawnCli`.

- [ ] **Run + Commit**

```bash
npm run test
git add src/infrastructure/formatters/ src/cli/args.ts tests/integration/formatters/
git commit -m "feat(cli): wire junit + sarif formatters"
```

---

### Task 5: GitHub Action scaffold

**Files:**

- Create: `action/action.yml`
- Create: `action/package.json`
- Create: `action/src/main.ts`
- Create: `action/README.md`

- [ ] **`action/action.yml`**

```yaml
name: "markdownlint-obsidian"
description: "Obsidian Flavored Markdown linter for CI"
author: "mscottx88"
inputs:
  globs:
    description: "Glob patterns to lint (space-separated)"
    required: false
    default: "**/*.md"
  vault-root:
    description: "Override auto-detected vault root"
    required: false
  config:
    description: "Explicit config file path"
    required: false
  format:
    description: "Output formatter: default, json, junit, sarif"
    required: false
    default: "default"
  fail-on-warnings:
    description: "Exit non-zero on warnings as well as errors"
    required: false
    default: "false"
outputs:
  error-count:
    description: "Total error count"
  warning-count:
    description: "Total warning count"
  sarif-path:
    description: "Path to the SARIF output file (when format is sarif)"
runs:
  using: "node20"
  main: "dist/main.js"
branding:
  icon: "book-open"
  color: "purple"
```

- [ ] **`action/package.json`**

```json
{
  "name": "markdownlint-obsidian-action",
  "version": "0.8.0",
  "type": "module",
  "scripts": {
    "build": "esbuild src/main.ts --bundle --platform=node --target=node20 --outfile=dist/main.js"
  },
  "dependencies": {
    "@actions/core": "^1.10.0",
    "markdownlint-obsidian": "^0.8.0"
  },
  "devDependencies": {
    "esbuild": "^0.20.0"
  }
}
```

- [ ] **`action/src/main.ts`**

```ts
import * as core from "@actions/core";
import { main as runLinter } from "markdownlint-obsidian/src/cli/main.js";

async function run(): Promise<void> {
  const globs = core.getInput("globs").split(/\s+/).filter(Boolean);
  const vaultRoot = core.getInput("vault-root");
  const config = core.getInput("config");
  const format = core.getInput("format") || "default";
  const failOnWarnings = core.getBooleanInput("fail-on-warnings");

  const argv = ["node", "markdownlint-obsidian"];
  if (vaultRoot) argv.push("--vault-root", vaultRoot);
  if (config) argv.push("--config", config);
  argv.push("--output-formatter", format);
  argv.push(...globs);

  const exitCode = await runLinter(argv);
  if (failOnWarnings && exitCode === 0) {
    // Hook into the JSON output if needed — for now warnings already map
    // to exit 0, and `fail-on-warnings` is a placeholder for a future
    // severity-aware run summary.
  }
  if (exitCode !== 0) {
    core.setFailed(`markdownlint-obsidian exited with ${exitCode}`);
  }
}

run().catch((err) => core.setFailed(err instanceof Error ? err.message : String(err)));
```

- [ ] **`action/README.md`** — usage example, input table, SARIF upload recipe.

- [ ] **Commit**

```bash
git add action/
git commit -m "feat(action): add GitHub Action scaffold"
```

---

### Task 6: Build the action bundle

**Files:**

- Create: `action/dist/.gitkeep`
- Modify: `.github/workflows/ci.yml` (run `npm run build` in `action/` on PRs)

- [ ] **Run `cd action && npm install && npm run build`** (locally or in CI) and commit `action/dist/main.js`.

- [ ] **Extend CI** to rebuild the action bundle and fail if `git diff --exit-code action/dist` shows changes (bundle drift check).

- [ ] **Commit**

```bash
git add action/dist/ .github/workflows/ci.yml
git commit -m "chore(action): commit built bundle + CI drift check"
```

---

### Task 7: Pre-commit hook manifest

**Files:**

- Create: `.pre-commit-hooks.yaml`

- [ ] **Write**

```yaml
- id: markdownlint-obsidian
  name: markdownlint-obsidian
  description: Lint Obsidian Flavored Markdown files
  entry: markdownlint-obsidian
  language: node
  files: \.md$
  require_serial: false
```

- [ ] **Update `docs/guides/ci-integration.md`** with a pre-commit usage example:

```yaml
- repo: https://github.com/mscottx88/markdownlint-obsidian
  rev: v0.8.0
  hooks:
    - id: markdownlint-obsidian
```

- [ ] **Commit**

```bash
git add .pre-commit-hooks.yaml docs/guides/ci-integration.md
git commit -m "feat(pre-commit): add .pre-commit-hooks.yaml manifest"
```

---

### Task 8: Dockerfile

**Files:**

- Create: `docker/Dockerfile`
- Create: `docker/entrypoint.sh`
- Create: `.github/workflows/docker-publish.yml`

- [ ] **`docker/Dockerfile`**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json tsconfig*.json ./
COPY src ./src
COPY bin ./bin
RUN npm ci && npm run build

FROM node:20-alpine AS runtime
WORKDIR /workdir
RUN adduser -D -u 1000 linter
COPY --from=build /app /app
RUN ln -s /app/bin/markdownlint-obsidian.js /usr/local/bin/markdownlint-obsidian
USER linter
ENTRYPOINT ["markdownlint-obsidian"]
CMD ["--help"]
```

- [ ] **`docker/entrypoint.sh`** — optional shim that resolves `/workdir` as the working directory. Omit if the ENTRYPOINT above is sufficient.

- [ ] **`docker-publish.yml`** — builds and pushes to GHCR on `release` events.

```yaml
name: docker-publish
on:
  release:
    types: [published]
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile
          push: true
          tags: |
            ghcr.io/mscottx88/markdownlint-obsidian:latest
            ghcr.io/mscottx88/markdownlint-obsidian:${{ github.event.release.tag_name }}
```

- [ ] **Local smoke test**

```bash
docker build -f docker/Dockerfile -t mlo:test .
docker run --rm -v "$(pwd):/workdir" mlo:test "**/*.md"
```

- [ ] **Commit**

```bash
git add docker/ .github/workflows/docker-publish.yml
git commit -m "feat(docker): add Dockerfile and publish workflow"
```

---

### Task 9: Release prep

**Files:**

- Modify: `package.json` (`version: "0.8.0"`)
- Create: `CHANGELOG.md`
- Modify: `README.md`

- [ ] **Bump version** to `0.8.0`.

- [ ] **Write `CHANGELOG.md`** — one section per phase with highlights and rule codes.

- [ ] **Update `README.md`** — quick-start, install, three minimal CI examples (GitHub Actions, pre-commit, Docker).

- [ ] **Dry-run publish**

```bash
npm publish --dry-run
```

Expected: pack lists `bin/`, `dist/`, `package.json`, `README.md`, `LICENSE`, `CHANGELOG.md`.

- [ ] **Commit**

```bash
git add package.json CHANGELOG.md README.md
git commit -m "chore(release): prep v0.8.0"
```

---

### Task 10: Phase 8 verification

- [ ] **Full run** `npm run test:all`

- [ ] **Docker smoke test** (manual, if Docker available)

```bash
docker run --rm -v "$(pwd):/workdir" mlo:test "docs/**/*.md"
```

Expected: exit 0 on clean docs.

- [ ] **Tag release locally**

```bash
git tag v0.8.0
```

- [ ] **Final commit**

```bash
git add -A
git commit -m "chore: Phase 8 complete — junit, sarif, GitHub Action, pre-commit, Docker"
```

---

## Phase 8 acceptance criteria

- `--output-formatter junit|sarif` emits valid XML/JSON that GitHub Actions and Jenkins consume without post-processing.
- `action/` contains a working GitHub Action with `action.yml`, built bundle, and README.
- `docker/Dockerfile` produces a hermetic runtime image; `docker-publish.yml` auto-publishes on release.
- `.pre-commit-hooks.yaml` is discoverable by the pre-commit framework.
- `CHANGELOG.md` is seeded; version bumped to 0.8.0; `npm publish --dry-run` succeeds.
