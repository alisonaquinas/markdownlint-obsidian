# Phase 10: Custom Rules API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expose the rule contract as a public API so teams can write their own rules without forking the repo. Teach `ConfigLoader` to resolve `customRules` entries as ESM module paths, import them dynamically, and register them alongside built-in rules. Publish a types-only subpath so rule authors get full TypeScript autocompletion. Ship two worked examples and an authoring guide.

**Architecture:** A new public barrel `src/public/index.ts` re-exports `OFMRule`, `RuleParams`, `OnErrorCallback`, `LintError`, `Fix`, `ParseResult`, and every domain VO needed to read `parsed.*`. `package.json` declares this barrel as an `exports` subpath. `ConfigLoader` gains a `CustomRuleLoader` that converts each `customRules` entry into an absolute path, dynamically imports it, and validates the exported default satisfies `OFMRule`. Rule files may export a single rule or an array.

**Tech Stack:** Phase 9 stack. No new runtime deps.

---

## File Map

```
src/
  public/
    index.ts                               Public API barrel (types + factories)
    rules.ts                               Re-exports built-in rules for extension
  infrastructure/
    config/
      CustomRuleLoader.ts                  Resolve + dynamic import custom rule modules
    rules/
      registerCustom.ts                    Wire loaded custom rules into the registry
  application/
    LintUseCase.ts                         UPDATED: accept custom rules in deps
  cli/
    main.ts                                UPDATED: call loadCustomRules before bootstrap
examples/
  rules/
    require-frontmatter-status.ts          Worked example 1
    banned-wikilink-targets.ts             Worked example 2
  README.md                                How to use the examples
tests/
  unit/
    public/
      api-surface.test.ts                  Assert re-exports exist and are typed
    config/
      CustomRuleLoader.test.ts
  integration/
    rules/
      custom-rules-integration.test.ts
docs/
  guides/
    custom-rules.md                        Authoring guide
    public-api.md                          Subpath usage, TS setup
  rules/
    custom/                                Per-example catalog pages
      require-frontmatter-status.md
      banned-wikilink-targets.md
```

---

### Task 1: Public API barrel

**Files:**

- Create: `src/public/index.ts`
- Create: `src/public/rules.ts`
- Modify: `package.json` (`exports` field)

- [ ] **Write `public/index.ts`**

```ts
/**
 * Public API for authoring custom rules and formatters for
 * markdownlint-obsidian. Import from `"markdownlint-obsidian/api"`.
 *
 * This barrel is frozen — do not add new exports without updating
 * `docs/guides/public-api.md` and bumping the minor version.
 */

// Linting primitives
export type { OFMRule, RuleParams, OnErrorCallback } from "../domain/linting/OFMRule.js";
export type { LintError } from "../domain/linting/LintError.js";
export type { LintResult } from "../domain/linting/LintResult.js";
export { makeLintError } from "../domain/linting/LintError.js";
export { makeLintResult } from "../domain/linting/LintResult.js";

// Fix primitives
export type { Fix } from "../domain/linting/Fix.js";
export { makeFix } from "../domain/linting/Fix.js";

// Parse result VOs
export type { ParseResult } from "../domain/parsing/ParseResult.js";
export type { WikilinkNode } from "../domain/parsing/WikilinkNode.js";
export type { EmbedNode } from "../domain/parsing/EmbedNode.js";
export type { CalloutNode } from "../domain/parsing/CalloutNode.js";
export type { TagNode } from "../domain/parsing/TagNode.js";
export type { BlockRefNode } from "../domain/parsing/BlockRefNode.js";
export type { HighlightNode } from "../domain/parsing/HighlightNode.js";
export type { CommentNode } from "../domain/parsing/CommentNode.js";
export type { SourcePosition } from "../domain/parsing/SourcePosition.js";

// Config
export type {
  LinterConfig,
  RuleConfig,
  FrontmatterConfig,
  TagConfig,
  CalloutConfig,
  WikilinkConfig,
  EmbedConfig,
  HighlightConfig,
  CommentConfig,
  BlockRefConfig,
} from "../domain/config/LinterConfig.js";

// Vault
export type { VaultIndex } from "../domain/vault/VaultIndex.js";
export type { VaultPath } from "../domain/vault/VaultPath.js";
export type { BlockRefIndex } from "../domain/vault/BlockRefIndex.js";
export type { MatchResult } from "../domain/vault/WikilinkMatcher.js";
```

- [ ] **Write `public/rules.ts`** — exposes the built-in rule constants so advanced users can wrap or compose them.

```ts
/** Exported OFM rule constants, for composition and customisation. */
export { frontmatterParseErrorRule } from "../infrastructure/rules/ofm/system/FrontmatterParseError.js";
export { OFM001Rule } from "../infrastructure/rules/ofm/wikilinks/OFM001-broken-wikilink.js";
// ... every other registered OFM rule
```

- [ ] **Update `package.json` exports**

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./api": {
      "types": "./dist/public/index.d.ts",
      "default": "./dist/public/index.js"
    },
    "./rules": {
      "types": "./dist/public/rules.d.ts",
      "default": "./dist/public/rules.js"
    }
  }
}
```

- [ ] **API-surface smoke test**

```ts
// tests/unit/public/api-surface.test.ts
import { describe, it, expect } from "vitest";
import * as api from "../../../src/public/index.js";

describe("public API surface", () => {
  it("exports rule primitives", () => {
    expect(typeof api.makeLintError).toBe("function");
    expect(typeof api.makeLintResult).toBe("function");
    expect(typeof api.makeFix).toBe("function");
  });
});
```

- [ ] **Run + Commit**

```bash
git add src/public/ package.json tests/unit/public/
git commit -m "feat(public): add /api and /rules subpath exports"
```

---

### Task 2: CustomRuleLoader

**Files:**

- Create: `src/infrastructure/config/CustomRuleLoader.ts`
- Create: `tests/unit/config/CustomRuleLoader.test.ts`

- [ ] **Implement**

```ts
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import type { OFMRule } from "../../domain/linting/OFMRule.js";

export interface CustomRuleLoadError {
  readonly modulePath: string;
  readonly message: string;
}

export interface CustomRuleLoadResult {
  readonly rules: readonly OFMRule[];
  readonly errors: readonly CustomRuleLoadError[];
}

/**
 * Resolve each `customRules` entry to an absolute path, dynamically import
 * it, and collect every exported rule. Entries may:
 *   - export default an OFMRule
 *   - export default an array of OFMRules
 *   - export named `rules` containing either of the above
 *
 * Bad modules become CustomRuleLoadError entries and do NOT crash the run.
 */
export async function loadCustomRules(
  customRules: readonly string[],
  baseDir: string,
): Promise<CustomRuleLoadResult> {
  const rules: OFMRule[] = [];
  const errors: CustomRuleLoadError[] = [];

  for (const entry of customRules) {
    try {
      const absolute = path.isAbsolute(entry) ? entry : path.resolve(baseDir, entry);
      const mod = (await import(pathToFileURL(absolute).toString())) as Record<string, unknown>;
      const candidate = mod.default ?? mod.rules;
      if (Array.isArray(candidate)) {
        for (const r of candidate) rules.push(validate(r, entry));
      } else {
        rules.push(validate(candidate, entry));
      }
    } catch (err) {
      errors.push({
        modulePath: entry,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { rules, errors };
}

function validate(candidate: unknown, modulePath: string): OFMRule {
  if (candidate === null || typeof candidate !== "object") {
    throw new Error(`Custom rule module "${modulePath}" does not export a rule object`);
  }
  const rule = candidate as Partial<OFMRule>;
  if (!Array.isArray(rule.names) || rule.names.length === 0) {
    throw new Error(`Custom rule from "${modulePath}" is missing "names"`);
  }
  if (typeof rule.run !== "function") {
    throw new Error(`Custom rule from "${modulePath}" is missing "run"`);
  }
  return candidate as OFMRule;
}
```

- [ ] **Test** — four cases: valid default export, valid array default, missing `run`, unresolvable path (should produce CustomRuleLoadError without throwing).

- [ ] **Run + Commit**

```bash
git add src/infrastructure/config/CustomRuleLoader.ts tests/unit/config/CustomRuleLoader.test.ts
git commit -m "feat(config): add CustomRuleLoader"
```

---

### Task 3: registerCustom + CLI wiring

**Files:**

- Create: `src/infrastructure/rules/registerCustom.ts`
- Modify: `src/cli/main.ts`

- [ ] **Implement `registerCustom.ts`**

```ts
import type { RuleRegistry } from "../../domain/linting/RuleRegistry.js";
import type { OFMRule } from "../../domain/linting/OFMRule.js";

/** Register every custom rule with the registry, skipping duplicates. */
export function registerCustomRules(registry: RuleRegistry, rules: readonly OFMRule[]): void {
  for (const rule of rules) {
    try {
      registry.register(rule);
    } catch (err) {
      // Duplicate — surface via stderr but keep going.
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(`OFM904: skipped duplicate custom rule ${rule.names[0]}: ${message}\n`);
    }
  }
}
```

- [ ] **Update `cli/main.ts`** to load + register custom rules after `registerBuiltinRules`:

```ts
import { loadCustomRules } from "../infrastructure/config/CustomRuleLoader.js";
import { registerCustomRules } from "../infrastructure/rules/registerCustom.js";

const registry = makeRuleRegistry();
registerBuiltinRules(registry);

const { rules: customRules, errors: customErrors } =
  await loadCustomRules(effectiveConfig.customRules, cwd);
for (const err of customErrors) {
  process.stderr.write(`OFM905: failed to load ${err.modulePath}: ${err.message}\n`);
}
registerCustomRules(registry, customRules);
```

- [ ] **Add a new OFM code** `OFM905: failed to load custom rule module` and document it in `docs/rules/standard-md/` (or `docs/rules/system/OFM905.md` — pick a home).

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/registerCustom.ts src/cli/main.ts docs/rules/
git commit -m "feat(cli): load and register custom rules at startup"
```

---

### Task 4: Example rule 1 — require-frontmatter-status

**Files:**

- Create: `examples/rules/require-frontmatter-status.ts`
- Create: `tests/integration/rules/custom-require-frontmatter-status.test.ts`

- [ ] **Write the rule**

```ts
import type { OFMRule } from "markdownlint-obsidian/api";

const ALLOWED_STATUS = new Set(["draft", "review", "published", "archived"]);

/**
 * Require every note to declare a `status` frontmatter key drawn from a
 * fixed vocabulary. Demonstrates: reading frontmatter, emitting a
 * structured LintError, and surfacing meaningful messages.
 */
const rule: OFMRule = {
  names: ["CUSTOM001", "require-frontmatter-status"],
  description: "Frontmatter must declare status in {draft, review, published, archived}",
  tags: ["custom", "frontmatter"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    const status = (parsed.frontmatter as { status?: unknown }).status;
    if (status === undefined) {
      onError({ line: 1, column: 1, message: `Missing frontmatter key "status"` });
      return;
    }
    if (typeof status !== "string" || !ALLOWED_STATUS.has(status)) {
      onError({
        line: 1, column: 1,
        message: `Frontmatter status must be one of ${[...ALLOWED_STATUS].join(", ")}, got ${JSON.stringify(status)}`,
      });
    }
  },
};

export default rule;
```

- [ ] **Write integration test**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

let vault: string;
beforeEach(async () => {
  vault = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-cr1-"));
  await fs.mkdir(path.join(vault, ".obsidian"), { recursive: true });
  await fs.writeFile(
    path.join(vault, ".obsidian-linter.jsonc"),
    JSON.stringify({
      customRules: [path.resolve("examples/rules/require-frontmatter-status.ts")],
    }),
  );
});
afterEach(async () => {
  await fs.rm(vault, { recursive: true, force: true });
});

describe("custom require-frontmatter-status", () => {
  it("passes when status is valid", async () => {
    await fs.writeFile(
      path.join(vault, "note.md"),
      "---\nstatus: draft\n---\n\nbody\n",
    );
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(0);
  });

  it("fails when status is missing", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "---\n---\n\nbody\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("CUSTOM001");
  });
});
```

Because the example uses a `.ts` file, CLI needs to import it via `tsx` when running locally. Document that users compile custom rules to `.js` (or run via `tsx`) in `docs/guides/custom-rules.md`.

- [ ] **Commit**

```bash
git add examples/rules/require-frontmatter-status.ts \
        tests/integration/rules/custom-require-frontmatter-status.test.ts
git commit -m "feat(examples): custom rule require-frontmatter-status"
```

---

### Task 5: Example rule 2 — banned-wikilink-targets

**Files:**

- Create: `examples/rules/banned-wikilink-targets.ts`
- Create: `tests/integration/rules/custom-banned-wikilink-targets.test.ts`

- [ ] **Write the rule**

```ts
import type { OFMRule } from "markdownlint-obsidian/api";

const BANNED = new Set(["wiki/deprecated", "drafts/private"]);

const rule: OFMRule = {
  names: ["CUSTOM002", "banned-wikilink-targets"],
  description: "Disallow linking to configured target paths",
  tags: ["custom", "wikilinks"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    for (const link of parsed.wikilinks) {
      if (BANNED.has(link.target)) {
        onError({
          line: link.position.line,
          column: link.position.column,
          message: `Wikilink target "${link.target}" is banned`,
        });
      }
    }
  },
};

export default rule;
```

- [ ] **Write integration test** — 2 scenarios: banned target fails, allowed passes.

- [ ] **Commit**

```bash
git add examples/rules/banned-wikilink-targets.ts \
        tests/integration/rules/custom-banned-wikilink-targets.test.ts
git commit -m "feat(examples): custom rule banned-wikilink-targets"
```

---

### Task 6: Examples README

**Files:**

- Create: `examples/README.md`

- [ ] **Write**

````markdown
# markdownlint-obsidian — Example Custom Rules

Two worked examples that exercise the public rule API.

## `rules/require-frontmatter-status.ts`

Enforces a fixed vocabulary in frontmatter. Demonstrates reading
`parsed.frontmatter`, validating string values, and emitting a structured
`LintError`.

## `rules/banned-wikilink-targets.ts`

Blocks wikilinks to specific targets. Demonstrates iterating
`parsed.wikilinks` and surfacing the original source position.

## Running the examples

Compile to `.js` and point your config at the built file:

```bash
npx tsc examples/rules/require-frontmatter-status.ts --module nodenext --target es2022 --outDir examples/rules/dist
```

```jsonc
// .obsidian-linter.jsonc
{
  "customRules": ["./examples/rules/dist/require-frontmatter-status.js"]
}
```

Or run the linter through `tsx` to load `.ts` files directly:

```bash
npx tsx bin/markdownlint-obsidian.js "**/*.md"
```
````

- [ ] **Commit**

```bash
git add examples/README.md
git commit -m "docs(examples): README for custom rule examples"
```

---

### Task 7: Authoring guide

**Files:**

- Create: `docs/guides/custom-rules.md`
- Create: `docs/guides/public-api.md`

- [ ] **Write `custom-rules.md`** — walkthrough of:
  - Installing `markdownlint-obsidian`
  - Importing `OFMRule` from `"markdownlint-obsidian/api"`
  - Minimal rule template
  - Reading from `ParseResult`
  - Writing valid/invalid fixtures with `runRuleOnSource` (exposed via a new `/testing` subpath? Phase 11 consideration — for Phase 10 the recommendation is to hand-roll a test that constructs a fake `RuleParams`.)
  - Emitting a `Fix` for fixable rules
  - Registering via `customRules` in config
  - Distributing as a standalone npm package

- [ ] **Write `public-api.md`** — document every export from `src/public/index.ts`, the stability guarantees (semver minor = additive only), and the `/rules` subpath for re-wrapping built-ins.

- [ ] **Dogfood docs/**

- [ ] **Commit**

```bash
git add docs/guides/custom-rules.md docs/guides/public-api.md
git commit -m "docs(guides): custom rules authoring guide and public API reference"
```

---

### Task 8: Rule catalog pages for examples

**Files:**

- Create: `docs/rules/custom/require-frontmatter-status.md`
- Create: `docs/rules/custom/banned-wikilink-targets.md`
- Modify: `docs/rules/index.md`

- [ ] **Write pages** using the Phase 3 template.

- [ ] **Update `docs/rules/index.md`** to show the custom rules section at the bottom with a note that codes are user-defined and not reserved.

- [ ] **Commit**

```bash
git add docs/rules
git commit -m "docs(rules): catalog pages for example custom rules"
```

---

### Task 9: Release + publish

**Files:**

- Modify: `package.json` (`version: "1.0.0"`)
- Modify: `CHANGELOG.md`

- [ ] **Bump version to `1.0.0`** — Phase 10 completes the MVP feature set.

- [ ] **Expand CHANGELOG** with the Phase 10 highlights:
  - Public API subpath (`markdownlint-obsidian/api`)
  - Custom rule loading via `customRules` config key
  - Two worked examples under `examples/`
  - Authoring guide

- [ ] **Dry-run publish**

```bash
npm publish --dry-run
```

Confirm the pack contains `dist/public/` and `examples/`.

- [ ] **Commit**

```bash
git add package.json CHANGELOG.md
git commit -m "chore(release): prep v1.0.0"
```

---

### Task 10: Phase 10 verification

- [ ] **Full run** `npm run test:all`

- [ ] **Coverage** — `src/public/` ≥ 100% (pure re-exports), `src/infrastructure/config/CustomRuleLoader.ts` ≥ 90%.

- [ ] **Manual smoke**

```bash
cat > /tmp/my-rule.mjs <<'RULE'
export default {
  names: ["DEMO001", "demo-rule"],
  description: "demo",
  tags: ["demo"],
  severity: "error",
  fixable: false,
  run(_params, onError) { onError({ line: 1, column: 1, message: "always fires" }); },
};
RULE

cat > /tmp/.obsidian-linter.jsonc <<'CFG'
{ "customRules": ["/tmp/my-rule.mjs"] }
CFG

echo "# test" > /tmp/a.md
node bin/markdownlint-obsidian.js /tmp/a.md
```

Expected: exit 1 with `DEMO001` in the output.

- [ ] **Final commit**

```bash
git add -A
git commit -m "chore: Phase 10 complete — custom rules API, examples, v1.0.0"
```

---

## Phase 10 acceptance criteria

- `markdownlint-obsidian/api` subpath exports every type and helper required to author a rule.
- `customRules` config entries are dynamically imported and registered; errors never crash the run.
- Two worked examples under `examples/rules/` have integration-test coverage.
- `docs/guides/custom-rules.md` and `docs/guides/public-api.md` walk users through the API.
- Version bumped to `1.0.0`; `npm publish --dry-run` succeeds and ships `dist/public/` + `examples/`.
