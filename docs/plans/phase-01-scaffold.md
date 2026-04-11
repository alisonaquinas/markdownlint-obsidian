# Phase 1: Project Scaffold — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a working project foundation — TypeScript build, linting, test infrastructure, CLI stub with correct exit codes, file discovery, config loading, and two output formatters. No OFM rules yet; running the CLI on any directory should exit 0.

**Architecture:** Strict DDD layering: `domain/` (pure logic) ← `application/` (orchestration) ← `infrastructure/` (I/O, parsers, formatters) ← `cli/` (entry point). Domain never imports Node.js built-ins. Infrastructure adapts external libraries to domain interfaces.

**Tech Stack:** Node.js 20+, TypeScript 5.x strict, ESLint 9, Prettier 3, Vitest 2, cucumber-js 10, globby 14, cosmiconfig 9, jsonc-parser, commander 12, chalk 5

---

## File Map

```
package.json                              npm package, scripts, deps
tsconfig.json                             TypeScript strict config
tsconfig.build.json                       Build-only (excludes tests)
eslint.config.js                          ESLint flat config
.prettierrc.json                          Prettier config
.editorconfig                             Line endings, indent
vitest.config.ts                          Vitest config
cucumber.json                             Cucumber-js config
bin/
  markdownlint-obsidian.js               Thin ESM wrapper → src/cli/main.ts
src/
  cli/
    args.ts                               CLI args type + commander setup
    main.ts                               Entry: parse → run → format → exit
  domain/
    linting/
      LintError.ts                        Value object: one rule violation
      LintResult.ts                       Value object: per-file results
      OFMRule.ts                          Interface: rule contract
      RuleRegistry.ts                     Domain service: register/lookup rules
    config/
      LinterConfig.ts                     Value object: merged config
      RuleConfig.ts                       Value object: per-rule config
    vault/                                (VaultPath.ts added Phase 2)
  application/
    LintUseCase.ts                        Orchestrate: files + config → results
    (VaultBootstrap.ts added Phase 4)
  infrastructure/
    discovery/
      FileDiscovery.ts                    Glob files, apply gitignore
    config/
      ConfigLoader.ts                     Walk dirs, merge config files
      ConfigValidator.ts                  Validate merged config shape
      defaults.ts                         Built-in default LinterConfig
    formatters/
      DefaultFormatter.ts                 Text: file:line:col code message
      JsonFormatter.ts                    Machine-readable JSON
      FormatterRegistry.ts                Select formatter by name
tests/
  unit/
    domain/
      LintError.test.ts
      LintResult.test.ts
      RuleRegistry.test.ts
    config/
      ConfigLoader.test.ts
      ConfigValidator.test.ts
    formatters/
      DefaultFormatter.test.ts
      JsonFormatter.test.ts
    discovery/
      FileDiscovery.test.ts
  integration/
    cli/
      cli.test.ts                         --help, --version, clean-dir all in one file
.markdownlint-cli2.jsonc                  Vanilla MD linting (CLAUDE.md etc.)
docs/.obsidian-linter.jsonc               OFM dogfood config for docs/
docs/bdd/
  features/                               Already scaffolded in DDD/BDD commit
    ci-exit-codes.feature                 Tag clean-vault scenario @smoke in Task 14
  steps/
    world.ts                              Already scaffolded — verify in Task 14
    file-steps.ts
    cli-steps.ts
    assertion-steps.ts
reports/                                  Created in Task 14 (gitignored)
.github/
  workflows/
    ci.yml                                Build, lint, test on every push/PR
```

---

### Task 1: package.json and npm scripts

**Files:**
- Create: `package.json`

- [ ] **Write `package.json`**

```json
{
  "name": "markdownlint-obsidian",
  "version": "0.1.0",
  "description": "Obsidian Flavored Markdown linter for CI pipelines",
  "type": "module",
  "bin": {
    "markdownlint-obsidian": "./bin/markdownlint-obsidian.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . && prettier --check .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:bdd": "node --import tsx node_modules/@cucumber/cucumber/bin/cucumber.js",
    "test:all": "npm run typecheck && npm run lint && npm run test && npm run test:bdd",
    "prepublishOnly": "npm run build && npm run test:all"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^12.0.0",
    "cosmiconfig": "^9.0.0",
    "globby": "^14.0.0",
    "jsonc-parser": "^3.2.0",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@cucumber/cucumber": "^10.0.0",
    "@types/js-yaml": "^4.0.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "eslint": "^9.0.0",
    "fast-check": "^3.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.4.0",
    "vitest": "^2.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "license": "MIT"
}
```

- [ ] **Run `npm install`**

```bash
npm install
```

Expected: `node_modules/` created, no peer dependency errors.

- [ ] **Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add package.json with deps and scripts"
```

---

### Task 2: TypeScript configuration

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`

- [ ] **Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src", "tests", "bin", "vitest.config.ts", "eslint.config.js"]
}
```

- [ ] **Write `tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "include": ["src", "bin"],
  "exclude": ["tests", "**/*.test.ts"]
}
```

- [ ] **Run typecheck to verify config is valid**

```bash
npm run typecheck
```

Expected: exits 0 (no source files yet, that's fine).

- [ ] **Commit**

```bash
git add tsconfig.json tsconfig.build.json
git commit -m "feat: add TypeScript strict config"
```

---

### Task 3: ESLint and Prettier

**Files:**
- Create: `eslint.config.js`
- Create: `.prettierrc.json`
- Create: `.editorconfig`

- [ ] **Write `eslint.config.js`**

```js
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["dist/", "node_modules/", "coverage/"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: { parser: tsparser },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      "complexity": ["error", 7],
      "max-lines": ["warn", 200],
      "max-lines-per-function": ["warn", 30],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
];
```

- [ ] **Write `.prettierrc.json`**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Write `.editorconfig`**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Run `npm run lint`** (will warn about no files — that's OK)

- [ ] **Commit**

```bash
git add eslint.config.js .prettierrc.json .editorconfig
git commit -m "feat: add ESLint flat config and Prettier"
```

---

### Task 4: Vitest configuration

**Files:**
- Create: `vitest.config.ts`

- [ ] **Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      thresholds: {
        // domain/ and application/ require 90%; infrastructure/ 80%
        // Vitest per-directory thresholds added in Phase 2 once layers are populated
        lines: 80,
        functions: 80,
        branches: 80,
      },
      include: ["src/**"],
    },
  },
});
```

- [ ] **Write a smoke test to verify vitest works**

Create `tests/unit/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("vitest is running", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Run tests**

```bash
npm run test
```

Expected: 1 test passing.

- [ ] **Commit**

```bash
git add vitest.config.ts tests/unit/smoke.test.ts
git commit -m "feat: add Vitest config and smoke test"
```

---

### Task 5: Domain value objects — LintError and LintResult

**Files:**
- Create: `src/domain/linting/LintError.ts`
- Create: `src/domain/linting/LintResult.ts`
- Create: `tests/unit/domain/LintError.test.ts`
- Create: `tests/unit/domain/LintResult.test.ts`

- [ ] **Write failing tests first**

`tests/unit/domain/LintError.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { makeLintError } from "../../../src/domain/linting/LintError.js";

describe("LintError", () => {
  it("creates a valid error with required fields", () => {
    const e = makeLintError({
      ruleCode: "OFM001",
      ruleName: "no-broken-wikilinks",
      severity: "error",
      line: 3,
      column: 1,
      message: "Wikilink target 'missing' not found in vault",
      fixable: false,
    });
    expect(e.ruleCode).toBe("OFM001");
    expect(e.line).toBe(3);
    expect(e.fixable).toBe(false);
  });

  it("is frozen (immutable)", () => {
    const e = makeLintError({
      ruleCode: "OFM001", ruleName: "no-broken-wikilinks",
      severity: "error", line: 1, column: 1,
      message: "msg", fixable: false,
    });
    expect(Object.isFrozen(e)).toBe(true);
  });
});
```

`tests/unit/domain/LintResult.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { makeLintResult } from "../../../src/domain/linting/LintResult.js";
import { makeLintError } from "../../../src/domain/linting/LintError.js";

describe("LintResult", () => {
  it("holds file path and errors", () => {
    const err = makeLintError({
      ruleCode: "OFM001", ruleName: "no-broken-wikilinks",
      severity: "error", line: 1, column: 1, message: "msg", fixable: false,
    });
    const result = makeLintResult("notes/index.md", [err]);
    expect(result.filePath).toBe("notes/index.md");
    expect(result.errors).toHaveLength(1);
  });

  it("hasErrors is true when errors present", () => {
    const err = makeLintError({
      ruleCode: "OFM001", ruleName: "no-broken-wikilinks",
      severity: "error", line: 1, column: 1, message: "msg", fixable: false,
    });
    const result = makeLintResult("notes/index.md", [err]);
    expect(result.hasErrors).toBe(true);
  });

  it("hasErrors is false for clean file", () => {
    const result = makeLintResult("notes/clean.md", []);
    expect(result.hasErrors).toBe(false);
  });
});
```

- [ ] **Run tests — expect FAIL** (modules don't exist yet)

```bash
npm run test
```

- [ ] **Implement `LintError.ts`**

```ts
/** A single rule violation in a Markdown file. Immutable. */
export interface LintError {
  readonly ruleCode: string;
  readonly ruleName: string;
  readonly severity: "error" | "warning";
  readonly line: number;
  readonly column: number;
  readonly message: string;
  readonly fixable: boolean;
  readonly fix?: Fix;
}

export interface Fix {
  readonly lineNumber: number;
  readonly editColumn: number;
  readonly deleteCount: number;
  readonly insertText: string;
}

/** Factory — returns a frozen LintError. */
export function makeLintError(fields: Omit<LintError, "fix"> & { fix?: Fix }): LintError {
  return Object.freeze({ ...fields });
}
```

- [ ] **Implement `LintResult.ts`**

```ts
import type { LintError } from "./LintError.js";

/** All lint errors for one file. Immutable. */
export interface LintResult {
  readonly filePath: string;
  readonly errors: readonly LintError[];
  readonly hasErrors: boolean;
}

export function makeLintResult(filePath: string, errors: LintError[]): LintResult {
  return Object.freeze({
    filePath,
    errors: Object.freeze([...errors]),
    hasErrors: errors.some((e) => e.severity === "error"),
  });
}
```

- [ ] **Run tests — expect PASS**

```bash
npm run test
```

- [ ] **Commit**

```bash
git add src/domain/linting/ tests/unit/domain/
git commit -m "feat: add LintError and LintResult domain value objects"
```

---

### Task 6: Domain — OFMRule interface and RuleRegistry

**Files:**
- Create: `src/domain/linting/OFMRule.ts`
- Create: `src/domain/linting/RuleRegistry.ts`
- Create: `tests/unit/domain/RuleRegistry.test.ts`

- [ ] **Write failing test**

`tests/unit/domain/RuleRegistry.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { makeRuleRegistry } from "../../../src/domain/linting/RuleRegistry.js";
import type { OFMRule } from "../../../src/domain/linting/OFMRule.js";

const stubRule: OFMRule = {
  names: ["OFM001", "no-broken-wikilinks"],
  description: "Broken wikilink",
  tags: ["wikilinks"],
  severity: "error",
  fixable: false,
  run: () => undefined,
};

describe("RuleRegistry", () => {
  it("registers and retrieves a rule by code", () => {
    const registry = makeRuleRegistry();
    registry.register(stubRule);
    expect(registry.get("OFM001")).toBe(stubRule);
    expect(registry.get("no-broken-wikilinks")).toBe(stubRule);
  });

  it("throws on duplicate code", () => {
    const registry = makeRuleRegistry();
    registry.register(stubRule);
    expect(() => registry.register(stubRule)).toThrow(/duplicate/i);
  });

  it("all() returns registered rules", () => {
    const registry = makeRuleRegistry();
    registry.register(stubRule);
    expect(registry.all()).toHaveLength(1);
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `OFMRule.ts`**

```ts
import type { LintError } from "./LintError.js";

export interface RuleParams {
  readonly filePath: string;
  readonly lines: readonly string[];
  readonly frontmatter: Record<string, unknown>;
  readonly tokens: unknown[];
}

export type OnErrorCallback = (error: Omit<LintError, "ruleCode" | "ruleName" | "severity" | "fixable">) => void;

/** Contract every linting rule must satisfy. */
export interface OFMRule {
  readonly names: readonly string[];
  readonly description: string;
  readonly tags: readonly string[];
  readonly severity: "error" | "warning";
  readonly fixable: boolean;
  run(params: RuleParams, onError: OnErrorCallback): void;
}
```

- [ ] **Implement `RuleRegistry.ts`**

```ts
import type { OFMRule } from "./OFMRule.js";

export interface RuleRegistry {
  register(rule: OFMRule): void;
  get(nameOrCode: string): OFMRule | undefined;
  all(): readonly OFMRule[];
}

export function makeRuleRegistry(): RuleRegistry {
  const byName = new Map<string, OFMRule>();

  return {
    register(rule: OFMRule): void {
      for (const name of rule.names) {
        if (byName.has(name)) {
          throw new Error(`Duplicate rule name: ${name}`);
        }
        byName.set(name, rule);
      }
    },
    get(nameOrCode: string): OFMRule | undefined {
      return byName.get(nameOrCode);
    },
    all(): readonly OFMRule[] {
      return [...new Set(byName.values())];
    },
  };
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/domain/linting/OFMRule.ts src/domain/linting/RuleRegistry.ts tests/unit/domain/RuleRegistry.test.ts
git commit -m "feat: add OFMRule interface and RuleRegistry domain service"
```

---

### Task 7: Domain config value objects

**Files:**
- Create: `src/domain/config/RuleConfig.ts`
- Create: `src/domain/config/LinterConfig.ts`

- [ ] **Implement `RuleConfig.ts`**

```ts
/** Per-rule enable/disable and options. Immutable. */
export interface RuleConfig {
  readonly enabled: boolean;
  readonly severity?: "error" | "warning";
  readonly options?: Readonly<Record<string, unknown>>;
}

export const DEFAULT_RULE_CONFIG: RuleConfig = Object.freeze({ enabled: true });
```

- [ ] **Implement `LinterConfig.ts`**

```ts
import type { RuleConfig } from "./RuleConfig.js";

export interface WikilinkConfig {
  readonly caseSensitive: boolean;
  readonly allowAlias: boolean;
}

export interface CalloutConfig {
  readonly allowList: readonly string[];
}

export interface FrontmatterConfig {
  readonly required: readonly string[];
  readonly dateFields: readonly string[];
}

/** Fully merged, validated configuration for one LintRun. Immutable. */
export interface LinterConfig {
  readonly vaultRoot: string | null;
  readonly resolve: boolean;
  readonly wikilinks: WikilinkConfig;
  readonly callouts: CalloutConfig;
  readonly frontmatter: FrontmatterConfig;
  readonly rules: Readonly<Record<string, RuleConfig>>;
  readonly customRules: readonly string[];
  readonly globs: readonly string[];
  readonly ignores: readonly string[];
  readonly fix: boolean;
  readonly outputFormatter: string;
}
```

- [ ] **Run typecheck**

```bash
npm run typecheck
```

Expected: exits 0.

- [ ] **Commit**

```bash
git add src/domain/config/
git commit -m "feat: add LinterConfig and RuleConfig domain types"
```

---

### Task 8: Default config and config validator

**Files:**
- Create: `src/infrastructure/config/defaults.ts`
- Create: `src/infrastructure/config/ConfigValidator.ts`
- Create: `tests/unit/config/ConfigValidator.test.ts`

- [ ] **Write failing test**

`tests/unit/config/ConfigValidator.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { validateConfig } from "../../../src/infrastructure/config/ConfigValidator.js";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";

describe("ConfigValidator", () => {
  it("accepts valid default config", () => {
    expect(() => validateConfig(DEFAULT_CONFIG)).not.toThrow();
  });

  it("throws OFM901 on unknown top-level key", () => {
    const bad = { ...DEFAULT_CONFIG, unknownKey: true } as unknown;
    expect(() => validateConfig(bad)).toThrow("OFM901");
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `defaults.ts`**

```ts
import type { LinterConfig } from "../../domain/config/LinterConfig.js";

export const DEFAULT_CONFIG: LinterConfig = Object.freeze({
  vaultRoot: null,
  resolve: true,
  wikilinks: Object.freeze({ caseSensitive: false, allowAlias: true }),
  callouts: Object.freeze({
    allowList: Object.freeze(["NOTE", "WARNING", "TIP", "IMPORTANT", "CAUTION"]),
  }),
  frontmatter: Object.freeze({ required: Object.freeze([]), dateFields: Object.freeze([]) }),
  rules: Object.freeze({}),
  customRules: Object.freeze([]),
  globs: Object.freeze(["**/*.md"]),
  ignores: Object.freeze([]),
  fix: false,
  outputFormatter: "default",
});
```

- [ ] **Implement `ConfigValidator.ts`**

```ts
import type { LinterConfig } from "../../domain/config/LinterConfig.js";

const KNOWN_KEYS: ReadonlySet<string> = new Set([
  "vaultRoot", "resolve", "wikilinks", "callouts", "frontmatter",
  "rules", "customRules", "globs", "ignores", "fix", "outputFormatter",
]);

/** Validate a raw config object. Throws with OFM901 on invalid shape. */
export function validateConfig(raw: unknown): asserts raw is LinterConfig {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("OFM901: config must be an object");
  }
  for (const key of Object.keys(raw as Record<string, unknown>)) {
    if (!KNOWN_KEYS.has(key)) {
      throw new Error(`OFM901: unknown config key "${key}"`);
    }
  }
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/infrastructure/config/defaults.ts src/infrastructure/config/ConfigValidator.ts tests/unit/config/ConfigValidator.test.ts
git commit -m "feat: add default config and ConfigValidator"
```

---

### Task 9: Config loader

**Files:**
- Create: `src/infrastructure/config/ConfigLoader.ts`
- Create: `tests/unit/config/ConfigLoader.test.ts`

- [ ] **Write failing test**

`tests/unit/config/ConfigLoader.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../../../src/infrastructure/config/ConfigLoader.js";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-config-test-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("ConfigLoader", () => {
  it("returns default config when no config file present", async () => {
    const config = await loadConfig(tmpDir);
    expect(config.resolve).toBe(DEFAULT_CONFIG.resolve);
    expect(config.fix).toBe(false);
  });

  it("merges .obsidian-linter.jsonc when present", async () => {
    await fs.writeFile(
      path.join(tmpDir, ".obsidian-linter.jsonc"),
      JSON.stringify({ resolve: false }),
    );
    const config = await loadConfig(tmpDir);
    expect(config.resolve).toBe(false);
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `ConfigLoader.ts`**

```ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parse as parseJsonc } from "jsonc-parser";
import { DEFAULT_CONFIG } from "./defaults.js";
import { validateConfig } from "./ConfigValidator.js";
import type { LinterConfig } from "../../domain/config/LinterConfig.js";

const CONFIG_FILES = [
  ".markdownlint-cli2.jsonc",
  ".markdownlint-cli2.yaml",
  ".obsidian-linter.jsonc",
  ".obsidian-linter.yaml",
  ".markdownlint.jsonc",
  ".markdownlint.yaml",
];

/** Walk from startDir upward, merge all config files found. */
export async function loadConfig(startDir: string): Promise<LinterConfig> {
  const layers = await collectConfigLayers(startDir);
  const merged = layers.reduce(
    (acc, layer) => ({ ...acc, ...layer }),
    { ...DEFAULT_CONFIG } as Record<string, unknown>,
  );
  validateConfig(merged);
  return merged as LinterConfig;
}

async function collectConfigLayers(startDir: string): Promise<Record<string, unknown>[]> {
  const layers: Record<string, unknown>[] = [];
  let dir = path.resolve(startDir);

  while (true) {
    for (const name of CONFIG_FILES) {
      const filePath = path.join(dir, name);
      const layer = await tryReadJsonc(filePath);
      if (layer !== null) layers.unshift(layer);
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return layers;
}

async function tryReadJsonc(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return parseJsonc(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/infrastructure/config/ConfigLoader.ts tests/unit/config/ConfigLoader.test.ts
git commit -m "feat: add ConfigLoader with cascading config file discovery"
```

---

### Task 10: File discovery

**Files:**
- Create: `src/infrastructure/discovery/FileDiscovery.ts`
- Create: `tests/unit/discovery/FileDiscovery.test.ts`

- [ ] **Write failing test**

`tests/unit/discovery/FileDiscovery.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { discoverFiles } from "../../../src/infrastructure/discovery/FileDiscovery.js";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-disc-test-"));
  await fs.writeFile(path.join(tmpDir, "a.md"), "# A");
  await fs.writeFile(path.join(tmpDir, "b.txt"), "text");
  await fs.mkdir(path.join(tmpDir, "sub"));
  await fs.writeFile(path.join(tmpDir, "sub", "c.md"), "# C");
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("discoverFiles", () => {
  it("finds all .md files matching glob", async () => {
    const files = await discoverFiles(["**/*.md"], [], tmpDir);
    expect(files).toHaveLength(2);
    expect(files.every((f) => f.endsWith(".md"))).toBe(true);
  });

  it("respects ignore patterns", async () => {
    const files = await discoverFiles(["**/*.md"], ["sub/**"], tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain("a.md");
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `FileDiscovery.ts`**

```ts
import { globby } from "globby";
import * as path from "node:path";

/**
 * Discover files matching globs, excluding ignore patterns.
 * Returns absolute paths sorted alphabetically.
 */
export async function discoverFiles(
  globs: readonly string[],
  ignores: readonly string[],
  cwd: string,
): Promise<string[]> {
  const patterns = [
    ...globs,
    ...ignores.map((p) => `!${p}`),
  ];

  const files = await globby(patterns, {
    cwd,
    absolute: true,
    gitignore: true,
    dot: false,
  });

  return files.sort();
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/infrastructure/discovery/ tests/unit/discovery/
git commit -m "feat: add FileDiscovery with globby and gitignore support"
```

---

### Task 11: Default and JSON formatters

**Files:**
- Create: `src/infrastructure/formatters/DefaultFormatter.ts`
- Create: `src/infrastructure/formatters/JsonFormatter.ts`
- Create: `src/infrastructure/formatters/FormatterRegistry.ts`
- Create: `tests/unit/formatters/DefaultFormatter.test.ts`
- Create: `tests/unit/formatters/JsonFormatter.test.ts`

- [ ] **Write failing tests**

`tests/unit/formatters/DefaultFormatter.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { formatDefault } from "../../../src/infrastructure/formatters/DefaultFormatter.js";
import { makeLintResult } from "../../../src/domain/linting/LintResult.js";
import { makeLintError } from "../../../src/domain/linting/LintError.js";

describe("DefaultFormatter", () => {
  it("formats a lint error as file:line:col code message", () => {
    const err = makeLintError({
      ruleCode: "OFM001", ruleName: "no-broken-wikilinks",
      severity: "error", line: 3, column: 5,
      message: "Wikilink 'missing' not found", fixable: false,
    });
    const result = makeLintResult("notes/index.md", [err]);
    const output = formatDefault([result]);
    expect(output).toContain("notes/index.md:3:5");
    expect(output).toContain("OFM001");
    expect(output).toContain("Wikilink 'missing' not found");
  });

  it("returns empty string for clean results", () => {
    const result = makeLintResult("notes/clean.md", []);
    expect(formatDefault([result])).toBe("");
  });
});
```

`tests/unit/formatters/JsonFormatter.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { formatJson } from "../../../src/infrastructure/formatters/JsonFormatter.js";
import { makeLintResult } from "../../../src/domain/linting/LintResult.js";
import { makeLintError } from "../../../src/domain/linting/LintError.js";

describe("JsonFormatter", () => {
  it("outputs valid JSON array", () => {
    const err = makeLintError({
      ruleCode: "OFM001", ruleName: "no-broken-wikilinks",
      severity: "error", line: 1, column: 1, message: "msg", fixable: false,
    });
    const result = makeLintResult("notes/index.md", [err]);
    const json = JSON.parse(formatJson([result]));
    expect(Array.isArray(json)).toBe(true);
    expect(json[0].filePath).toBe("notes/index.md");
    expect(json[0].errors[0].ruleCode).toBe("OFM001");
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `DefaultFormatter.ts`**

```ts
import type { LintResult } from "../../domain/linting/LintResult.js";

/** Format results as human-readable text: file:line:col code message */
export function formatDefault(results: readonly LintResult[]): string {
  const lines: string[] = [];

  for (const result of results) {
    for (const err of result.errors) {
      lines.push(
        `${result.filePath}:${err.line}:${err.column} ${err.ruleCode} ${err.message}`,
      );
    }
  }

  return lines.join("\n");
}
```

- [ ] **Implement `JsonFormatter.ts`**

```ts
import type { LintResult } from "../../domain/linting/LintResult.js";

/** Format results as machine-readable JSON. */
export function formatJson(results: readonly LintResult[]): string {
  return JSON.stringify(
    results.map((r) => ({
      filePath: r.filePath,
      errors: r.errors.map((e) => ({ ...e })),
    })),
    null,
    2,
  );
}
```

- [ ] **Implement `FormatterRegistry.ts`**

```ts
import { formatDefault } from "./DefaultFormatter.js";
import { formatJson } from "./JsonFormatter.js";
import type { LintResult } from "../../domain/linting/LintResult.js";

type Formatter = (results: readonly LintResult[]) => string;

const FORMATTERS: Record<string, Formatter> = {
  default: formatDefault,
  json: formatJson,
};

/** Retrieve a formatter by name. Throws if unknown. */
export function getFormatter(name: string): Formatter {
  const formatter = FORMATTERS[name];
  if (!formatter) {
    throw new Error(`OFM901: unknown formatter "${name}"`);
  }
  return formatter;
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/infrastructure/formatters/ tests/unit/formatters/
git commit -m "feat: add DefaultFormatter, JsonFormatter, FormatterRegistry"
```

---

### Task 12: LintUseCase stub

**Files:**
- Create: `src/application/LintUseCase.ts`
- Create: `tests/unit/application/LintUseCase.test.ts`

- [ ] **Write failing test**

`tests/unit/application/LintUseCase.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { runLint } from "../../../src/application/LintUseCase.js";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";
import { makeRuleRegistry } from "../../../src/domain/linting/RuleRegistry.js";

describe("LintUseCase", () => {
  it("returns empty results for empty file list", async () => {
    const registry = makeRuleRegistry();
    const results = await runLint([], DEFAULT_CONFIG, registry);
    expect(results).toHaveLength(0);
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `LintUseCase.ts`** (stub — no rules run yet)

```ts
import type { LinterConfig } from "../domain/config/LinterConfig.js";
import type { LintResult } from "../domain/linting/LintResult.js";
import type { RuleRegistry } from "../domain/linting/RuleRegistry.js";
import { makeLintResult } from "../domain/linting/LintResult.js";

/**
 * Run all registered rules against each file.
 * Phase 1: returns clean results (no rules registered yet).
 */
export async function runLint(
  filePaths: readonly string[],
  _config: LinterConfig,
  _registry: RuleRegistry,
): Promise<LintResult[]> {
  return filePaths.map((fp) => makeLintResult(fp, []));
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/application/LintUseCase.ts tests/unit/application/
git commit -m "feat: add LintUseCase stub"
```

---

### Task 13: CLI entry point

**Files:**
- Create: `src/cli/args.ts`
- Create: `src/cli/main.ts`
- Create: `bin/markdownlint-obsidian.js`
- Create: `tests/integration/cli/cli.test.ts`

- [ ] **Write failing integration tests**

`tests/integration/cli/cli.test.ts` — note the `--import` prefix pointing at the absolute tsx loader path so the shipped-as-TS source can run under `node` without a build step:
```ts
import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";

const execAsync = promisify(execFile);
const BIN = path.resolve("bin/markdownlint-obsidian.js");
const TSX_URL = pathToFileURL(path.resolve("node_modules/tsx/dist/loader.mjs")).href;
const NODE_ARGS = ["--import", TSX_URL, BIN];

describe("CLI", () => {
  it("--help exits 0 and prints usage", async () => {
    const { stdout } = await execAsync("node", [...NODE_ARGS, "--help"]);
    expect(stdout).toContain("markdownlint-obsidian");
    expect(stdout).toContain("--fix");
  });

  it("--version exits 0 and prints semver", async () => {
    const { stdout } = await execAsync("node", [...NODE_ARGS, "--version"]);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("clean directory exits 0 with no output", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-cli-test-"));
    await fs.writeFile(path.join(tmp, "clean.md"), "# Clean\n");
    try {
      const { stdout } = await execAsync("node", [...NODE_ARGS, "**/*.md"], { cwd: tmp });
      expect(stdout.trim()).toBe("");
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `src/cli/args.ts`**

```ts
import { Command } from "commander";

export interface CLIArgs {
  globs: string[];
  config?: string;
  configPointer?: string;
  fix: boolean;
  format: boolean;
  noGlobs: boolean;
  vaultRoot?: string;
  noResolve: boolean;
  outputFormatter: string;
}

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("markdownlint-obsidian")
    .description("Obsidian Flavored Markdown linter for CI pipelines")
    .version("0.1.0")
    .argument("[globs...]", "Glob patterns for files to lint")
    .option("--config <path>", "Explicit config file path")
    .option("--config-pointer <ptr>", "JSON Pointer into config (e.g. #/markdownlint)")
    .option("--fix", "Auto-fix fixable errors in-place", false)
    .option("--format", "Read stdin, write linted content to stdout", false)
    .option("--no-globs", "Ignore globs property in config file")
    .option("--vault-root <path>", "Override auto-detected vault root")
    .option("--no-resolve", "Disable wikilink resolution")
    .option("--output-formatter <name>", "Output formatter (default, json)", "default");
  return program;
}
```

- [ ] **Implement `src/cli/main.ts`**

```ts
import { buildProgram } from "./args.js";
import { loadConfig } from "../infrastructure/config/ConfigLoader.js";
import { discoverFiles } from "../infrastructure/discovery/FileDiscovery.js";
import { makeRuleRegistry } from "../domain/linting/RuleRegistry.js";
import { runLint } from "../application/LintUseCase.js";
import { getFormatter } from "../infrastructure/formatters/FormatterRegistry.js";
import * as path from "node:path";

export async function main(argv: string[]): Promise<number> {
  const program = buildProgram();
  program.exitOverride();

  try {
    program.parse(argv);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "commander.helpDisplayed" || e.code === "commander.version") {
      return 0;
    }
    return 2;
  }

  const globs = program.args as string[];
  const opts = program.opts<{
    fix: boolean; format: boolean; vaultRoot?: string;
    noResolve: boolean; outputFormatter: string; config?: string;
  }>();

  const cwd = process.cwd();
  const config = await loadConfig(opts.config ?? cwd).catch(() => null);

  if (!config) {
    process.stderr.write("OFM901: failed to load configuration\n");
    return 2;
  }

  const effectiveGlobs = globs.length > 0 ? globs : config.globs;
  const files = await discoverFiles(effectiveGlobs, config.ignores, cwd);
  const registry = makeRuleRegistry();
  const results = await runLint(files, config, registry);

  const formatter = getFormatter(opts.outputFormatter);
  const output = formatter(results);
  if (output) process.stdout.write(output + "\n");

  const hasErrors = results.some((r) => r.hasErrors);
  return hasErrors ? 1 : 0;
}
```

- [ ] **Install tsx as a dev dep** (also used by cucumber-js in Task 14)

```bash
npm install --save-dev tsx
```

- [ ] **Create `bin/markdownlint-obsidian.js`**

```js
#!/usr/bin/env -S node --import tsx
import { main } from "../src/cli/main.ts";
const code = await main(process.argv);
process.exit(code);
```

The bin file is imported as a TS module via `tsx`. On Unix the shebang provides the loader for `./bin/markdownlint-obsidian.js`. On Windows (and in tests) callers invoke it as `node --import <abs-path>/node_modules/tsx/dist/loader.mjs bin/markdownlint-obsidian.js` — the absolute loader path is necessary because `--import tsx` resolves relative to cwd, not the bin script.

- [ ] **Run — expect PASS**

```bash
npm run test
```

- [ ] **Manual smoke test**

```bash
node bin/markdownlint-obsidian.js --help
node bin/markdownlint-obsidian.js --version
node bin/markdownlint-obsidian.js "**/*.md"
```

Expected: help text, version, then exit 0 (no rules = no errors).

- [ ] **Commit**

```bash
git add src/cli/ bin/ tests/integration/cli/
git commit -m "feat: wire CLI entry point — --help, --version, file discovery, formatters"
```

---

### Task 14: BDD harness setup

**Files:**
- Update: `docs/bdd/steps/world.ts` (already scaffolded — verify contents match below)
- Create: `cucumber.json`
- Create: `docs/bdd/steps/file-steps.ts`
- Create: `docs/bdd/steps/cli-steps.ts`
- Create: `docs/bdd/steps/assertion-steps.ts`

- [ ] **Verify `docs/bdd/steps/world.ts` exists and contains `OFMWorld`**

The file was scaffolded in the DDD/BDD commit. Confirm it exports `OFMWorld` with `vaultDir`, `cliResult`, `initVault()`, `writeFile()`, `runCLI()`, and `cleanup()`. If missing or incomplete, write:

```ts
import { setWorldConstructor, World } from "@cucumber/cucumber";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface CLIResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export class OFMWorld extends World {
  vaultDir: string = "";
  cliResult: CLIResult | null = null;

  async initVault(): Promise<void> {
    this.vaultDir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-test-"));
    await fs.mkdir(path.join(this.vaultDir, ".obsidian"), { recursive: true });
  }

  async writeFile(relPath: string, content: string): Promise<void> {
    const abs = path.join(this.vaultDir, relPath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content, "utf8");
  }

  async runCLI(globs: string, extraArgs: string[] = []): Promise<void> {
    const bin = path.resolve("bin/markdownlint-obsidian.js");
    try {
      const { stdout, stderr } = await execFileAsync("node", [bin, ...extraArgs, globs], {
        cwd: this.vaultDir,
      });
      this.cliResult = { exitCode: 0, stdout, stderr };
    } catch (err: unknown) {
      const e = err as { code?: number; stdout?: string; stderr?: string };
      this.cliResult = { exitCode: e.code ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
    }
  }

  async cleanup(): Promise<void> {
    if (this.vaultDir) {
      await fs.rm(this.vaultDir, { recursive: true, force: true });
    }
  }
}

setWorldConstructor(OFMWorld);
```

- [ ] **Install tsx for TypeScript ESM support in cucumber-js** (already installed in Task 13 for the CLI bin — skip if present)

```bash
npm install --save-dev tsx
```

`tsx` handles TypeScript ESM natively without extra loader configuration — preferred over `ts-node/esm` for ESM projects. Note: both the CLI integration tests and the BDD world spawn `node --import <abs-path-to-tsx/dist/loader.mjs> bin/markdownlint-obsidian.js` so that the shipped-as-TS source can be executed without a build step.

- [ ] **Create `reports/` directory and gitignore it** (must exist before cucumber.json references it)

```bash
mkdir -p reports
echo "reports/" >> .gitignore
```

- [ ] **Write `cucumber.json`**

```json
{
  "default": {
    "paths": ["docs/bdd/features/**/*.feature"],
    "import": ["docs/bdd/steps/**/*.ts"],
    "format": ["progress-bar", "json:reports/cucumber.json"]
  }
}
```

Note: use `import` (not `require`) for ESM + cucumber-js 10. Do NOT put `"loader": ["tsx"]` in the config — cucumber-js wires that to the deprecated `--loader` flag which tsx rejects on Node 20+. Instead, update the `test:bdd` npm script to launch cucumber-js via `node --import tsx node_modules/@cucumber/cucumber/bin/cucumber.js` so tsx is registered before cucumber-js reads step files.

- [ ] **Implement `docs/bdd/steps/file-steps.ts`**

```ts
import { Given } from "@cucumber/cucumber";
import type { OFMWorld } from "./world.js";
import * as path from "node:path";

Given("a vault with a file {string}", async function (this: OFMWorld, relPath: string) {
  await this.initVault();
  await this.writeFile(relPath, `# ${path.basename(relPath, ".md")}\n`);
});

Given("a file {string} containing {string}", async function (this: OFMWorld, relPath: string, content: string) {
  if (!this.vaultDir) await this.initVault();
  await this.writeFile(relPath, content);
});
```

- [ ] **Implement `docs/bdd/steps/cli-steps.ts`**

```ts
import { When } from "@cucumber/cucumber";
import type { OFMWorld } from "./world.js";

When("I run markdownlint-obsidian on {string}", async function (this: OFMWorld, glob: string) {
  await this.runCLI(glob);
});

When("I run markdownlint-obsidian on {string} with {string}", async function (
  this: OFMWorld, glob: string, extraArgsStr: string,
) {
  const extraArgs = extraArgsStr.split(" ").filter(Boolean);
  await this.runCLI(glob, extraArgs);
});
```

- [ ] **Implement `docs/bdd/steps/assertion-steps.ts`**

```ts
import { Then, After } from "@cucumber/cucumber";
import { expect } from "vitest";
import type { OFMWorld } from "./world.js";

Then("the exit code is {int}", function (this: OFMWorld, expected: number) {
  expect(this.cliResult?.exitCode).toBe(expected);
});

Then("error {word} is reported on line {int}", function (this: OFMWorld, code: string, line: number) {
  const output = (this.cliResult?.stdout ?? "") + (this.cliResult?.stderr ?? "");
  expect(output).toContain(code);
  expect(output).toContain(`:${line}:`);
});

After(async function (this: OFMWorld) {
  await this.cleanup();
});
```

- [ ] **Tag the clean-vault scenario `@smoke` in `docs/bdd/features/ci-exit-codes.feature`**

The feature file already exists from the DDD/BDD scaffold commit. Add `@smoke` to the clean-vault scenario:

```gherkin
  @smoke
  Scenario: Clean vault exits 0
    Given a vault with a file "notes/clean.md"
    When I run markdownlint-obsidian on "**/*.md"
    Then the exit code is 0
```

- [ ] **Run the `@smoke` BDD scenario**

```bash
npm run test:bdd -- --tags "@smoke"
```

Expected: 1 scenario, 1 passing.

- [ ] **Commit**

```bash
git add cucumber.json docs/bdd/steps/ docs/bdd/features/ci-exit-codes.feature .gitignore package.json package-lock.json
git commit -m "feat: wire cucumber-js BDD harness with World, file, CLI, assertion steps"
```

---

### Task 15: Markdown lint configs and dogfood stub

**Files:**
- Create: `.markdownlint-cli2.jsonc`
- Create: `docs/.obsidian-linter.jsonc`
- Create: `tests/integration/dogfood/dogfood.test.ts`

- [ ] **Write `.markdownlint-cli2.jsonc`** (vanilla MD — CLAUDE.md, README.md, etc.)

```jsonc
{
  // Lint vanilla markdown files (not docs/ — those use markdownlint-obsidian)
  "globs": ["**/*.md", "!docs/**", "!node_modules/**"],
  "config": {
    "default": true,
    "MD013": false
  }
}
```

- [ ] **Write `docs/.obsidian-linter.jsonc`** (OFM dogfood)

```jsonc
{
  // Dogfood: lint docs/ with markdownlint-obsidian
  // No OFM rules active yet (Phase 2+). This file wires up the config.
  "vaultRoot": "../",
  "resolve": false,
  "globs": ["**/*.md"],
  "ignores": ["superpowers/**"]
}
```

- [ ] **Write dogfood integration test**

`tests/integration/dogfood/dogfood.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as path from "node:path";

const execAsync = promisify(execFile);
const BIN = path.resolve("bin/markdownlint-obsidian.js");

describe("dogfood", () => {
  it("docs/ directory passes the linter (Phase 1: no rules active)", async () => {
    const { exitCode } = await execAsync("node", [BIN, "**/*.md"], {
      cwd: path.resolve("docs"),
    }).catch((e: unknown) => ({ exitCode: (e as { code?: number }).code ?? 2 }));
    expect(exitCode ?? 0).toBe(0);
  });
});
```

- [ ] **Run dogfood test**

```bash
npm run test -- tests/integration/dogfood
```

Expected: PASS (no rules = exit 0).

- [ ] **Commit**

```bash
git add .markdownlint-cli2.jsonc docs/.obsidian-linter.jsonc tests/integration/dogfood/
git commit -m "feat: add markdownlint configs and dogfood integration test"
```

---

### Task 16: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Unit + integration tests
        run: npm run test

      - name: BDD acceptance tests
        run: npm run test:bdd

      - name: Dogfood docs/
        run: node bin/markdownlint-obsidian.js "**/*.md"
        working-directory: docs
```

- [ ] **Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions workflow (typecheck, lint, test, bdd, dogfood)"
```

---

### Task 17: Final smoke and cleanup

- [ ] **Run full test suite**

```bash
npm run test:all
```

Expected: all passing, coverage report generated.

- [ ] **Run linter on own source**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Verify CLI end-to-end**

```bash
node bin/markdownlint-obsidian.js "**/*.md" --output-formatter json
```

Expected: JSON array of file paths, all with empty errors arrays, exit 0.

- [ ] **Final commit**

```bash
git add -A
git commit -m "chore: Phase 1 complete — scaffold, CLI, formatters, BDD harness, CI"
```
