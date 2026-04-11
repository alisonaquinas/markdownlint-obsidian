# Phase 7: Standard markdownlint Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Import the upstream `markdownlint` library and adapt every MD001–MD049 rule into our `OFMRule` contract, so users get one consistent rule system for CommonMark + OFM. Document and *disable* the markdown rules that collide with OFM syntax. Teach `ConfigLoader` to honour `markdownlint` rule options from both `.markdownlint.jsonc` and `markdownlint-cli2` keys.

**Architecture:** A new adapter `MarkdownLintAdapter` runs the upstream library once per file and translates each violation into a `LintError`. Rule registration happens via a generated map (names, severity, description) so the registry sees every MD rule as a first-class `OFMRule`. A curated list of OFM-conflicting rules is disabled in `DEFAULT_CONFIG.rules`, each with a `docs/rules/standard-md/<rule>.md` page explaining the conflict.

**Tech Stack:** Phase 6 stack plus `markdownlint@0.34+` (ESM-ready). Consider `markdownlint-rule-helpers` if the lint helpers simplify adaptation — optional, not required.

---

## File Map

```
src/
  infrastructure/
    rules/standard/
      MarkdownLintAdapter.ts            Run markdownlint once per file, translate results
      StandardRuleAdapter.ts            Wrap one markdownlint rule as an OFMRule
      OFM_MD_CONFLICTS.ts               Curated list of disabled MD rules + reasons
      registerStandard.ts               Populate registry with MD001..MD049 wrappers
docs/
  rules/standard-md/
    index.md                            Catalog of every MD rule + enabled/disabled status
    MD013.md                            (one page per disabled-by-default rule)
    MD042.md
    ... (others as needed)
tests/
  unit/
    rules/standard/
      MarkdownLintAdapter.test.ts
      StandardRuleAdapter.test.ts
      registerStandard.test.ts
  integration/
    rules/standard-md-integration.test.ts
```

---

### Task 1: Install markdownlint

**Files:**
- Modify: `package.json`

- [ ] **Install runtime dep**

```bash
npm install markdownlint
```

- [ ] **Typecheck** — `markdownlint` ships its own `.d.ts`; no `@types/` package needed.

- [ ] **Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add markdownlint"
```

---

### Task 2: MarkdownLintAdapter — run-once-per-file

**Files:**
- Create: `src/infrastructure/rules/standard/MarkdownLintAdapter.ts`
- Create: `tests/unit/rules/standard/MarkdownLintAdapter.test.ts`

The adapter is a small shell around `markdownlint.sync({ strings: { file: raw }, config })`. It is called by `StandardRuleAdapter` once per file, and the cached results are shared across every MD rule via `ParseResult`-keyed memoization.

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { makeMarkdownLintAdapter } from "../../../../src/infrastructure/rules/standard/MarkdownLintAdapter.js";

describe("MarkdownLintAdapter", () => {
  const adapter = makeMarkdownLintAdapter();

  it("returns violations for each enabled MD rule", () => {
    const results = adapter.runOnce("x.md", "# h\n## h2\n", { default: true });
    expect(Array.isArray(results)).toBe(true);
  });

  it("caches by filePath so repeat calls return the same object", () => {
    const first = adapter.runOnce("x.md", "# h\n", { default: true });
    const second = adapter.runOnce("x.md", "# h\n", { default: true });
    expect(first).toBe(second);
  });

  it("returns empty array on clean content", () => {
    const results = adapter.runOnce("clean.md", "# clean\n\ntext\n", { default: true });
    expect(results).toEqual([]);
  });
});
```

- [ ] **Implement `MarkdownLintAdapter.ts`**

```ts
import markdownlint from "markdownlint";

export interface StandardViolation {
  readonly ruleNames: readonly string[];
  readonly ruleDescription: string;
  readonly lineNumber: number;
  readonly errorContext?: string;
  readonly errorDetail?: string;
  readonly errorRange?: readonly [number, number];
}

export interface MarkdownLintAdapter {
  runOnce(
    filePath: string,
    content: string,
    config: Readonly<Record<string, unknown>>,
  ): readonly StandardViolation[];
}

/**
 * Thin adapter over markdownlint.sync with per-file memoization so multiple
 * rules sharing the same file each consume the cached violation list.
 */
export function makeMarkdownLintAdapter(): MarkdownLintAdapter {
  const cache = new Map<string, readonly StandardViolation[]>();

  return {
    runOnce(filePath, content, config) {
      const key = `${filePath}::${hash(content)}`;
      const cached = cache.get(key);
      if (cached !== undefined) return cached;

      const raw = markdownlint.sync({
        strings: { [filePath]: content },
        config: config as markdownlint.Configuration,
      });
      const list: StandardViolation[] = (raw[filePath] ?? []).map((r) => ({
        ruleNames: r.ruleNames,
        ruleDescription: r.ruleDescription,
        lineNumber: r.lineNumber,
        errorContext: r.errorContext ?? undefined,
        errorDetail: r.errorDetail ?? undefined,
        errorRange: r.errorRange ?? undefined,
      }));
      const frozen = Object.freeze(list);
      cache.set(key, frozen);
      return frozen;
    },
  };
}

function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return (h >>> 0).toString(16);
}
```

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/standard/MarkdownLintAdapter.ts \
        tests/unit/rules/standard/MarkdownLintAdapter.test.ts
git commit -m "feat(rules): add MarkdownLintAdapter with per-file memoization"
```

---

### Task 3: StandardRuleAdapter — one OFMRule per MD rule

**Files:**
- Create: `src/infrastructure/rules/standard/StandardRuleAdapter.ts`
- Create: `tests/unit/rules/standard/StandardRuleAdapter.test.ts`

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../domain/linting/OFMRule.js";
import type { MarkdownLintAdapter } from "./MarkdownLintAdapter.js";

export interface StandardRuleDescriptor {
  readonly code: string;      // "MD013"
  readonly name: string;      // "line-length"
  readonly description: string;
  readonly fixable: boolean;
  readonly severity: "error" | "warning";
}

/**
 * Build a single OFMRule whose `run` defers to the shared
 * MarkdownLintAdapter and filters the violation list by code.
 */
export function buildStandardRule(
  desc: StandardRuleDescriptor,
  adapter: MarkdownLintAdapter,
): OFMRule {
  return {
    names: [desc.code, desc.name],
    description: desc.description,
    tags: ["markdownlint", "standard"],
    severity: desc.severity,
    fixable: desc.fixable,
    run({ filePath, parsed, config }, onError) {
      const mdConfig = extractMdConfig(config);
      const violations = adapter.runOnce(filePath, parsed.raw, mdConfig);
      for (const v of violations) {
        if (!v.ruleNames.includes(desc.code)) continue;
        onError({
          line: v.lineNumber,
          column: v.errorRange?.[0] ?? 1,
          message: v.errorDetail
            ? `${v.ruleDescription}: ${v.errorDetail}`
            : v.ruleDescription,
        });
      }
    },
  };
}

function extractMdConfig(config: { rules: Readonly<Record<string, unknown>> }): Readonly<Record<string, unknown>> {
  // Translate our RuleConfig map into the shape markdownlint expects.
  const out: Record<string, unknown> = { default: true };
  for (const [key, value] of Object.entries(config.rules)) {
    if (!key.startsWith("MD")) continue;
    const rc = value as { enabled: boolean; options?: Record<string, unknown> };
    out[key] = rc.enabled === false ? false : rc.options ?? true;
  }
  return out;
}
```

- [ ] **Test** — stub adapter that returns one fake MD013 violation; confirm the OFMRule surfaces it with correct `{line, column, message}`; verify disabled config suppresses it.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/standard/StandardRuleAdapter.ts \
        tests/unit/rules/standard/StandardRuleAdapter.test.ts
git commit -m "feat(rules): add StandardRuleAdapter"
```

---

### Task 4: OFM_MD_CONFLICTS curated list

**Files:**
- Create: `src/infrastructure/rules/standard/OFM_MD_CONFLICTS.ts`

- [ ] **Implement**

```ts
/**
 * MD rules that conflict with Obsidian Flavored Markdown syntax.
 * Each entry lists the MD code, a one-line reason, and the doc page.
 */
export interface MdConflict {
  readonly code: string;
  readonly reason: string;
  readonly docPage: string;
}

export const OFM_MD_CONFLICTS: readonly MdConflict[] = Object.freeze([
  {
    code: "MD013",
    reason: "line-length — wikilinks and embeds routinely exceed column limits",
    docPage: "rules/standard-md/MD013.md",
  },
  {
    code: "MD042",
    reason: "no-empty-links — does not understand `[[]]` wikilink syntax",
    docPage: "rules/standard-md/MD042.md",
  },
  {
    code: "MD034",
    reason: "no-bare-urls — Obsidian auto-links bare URLs by default",
    docPage: "rules/standard-md/MD034.md",
  },
  {
    code: "MD033",
    reason: "no-inline-html — OFM callouts and embeds render as HTML elements",
    docPage: "rules/standard-md/MD033.md",
  },
  {
    code: "MD041",
    reason: "first-line-heading — frontmatter-only notes are common in Obsidian",
    docPage: "rules/standard-md/MD041.md",
  },
]);
```

This list is authoritative. Any future conflict gets an entry + a doc page.

- [ ] **Commit**

```bash
git add src/infrastructure/rules/standard/OFM_MD_CONFLICTS.ts
git commit -m "feat(rules): enumerate OFM/MD rule conflicts"
```

---

### Task 5: registerStandard — all MD001..MD049 entries

**Files:**
- Create: `src/infrastructure/rules/standard/registerStandard.ts`
- Create: `tests/unit/rules/standard/registerStandard.test.ts`

The MD rule metadata list is verbose but mechanical. Capture it inline as a frozen table of `StandardRuleDescriptor`.

- [ ] **Implement**

```ts
import type { RuleRegistry } from "../../../domain/linting/RuleRegistry.js";
import { buildStandardRule, type StandardRuleDescriptor } from "./StandardRuleAdapter.js";
import { makeMarkdownLintAdapter } from "./MarkdownLintAdapter.js";

const DESCRIPTORS: readonly StandardRuleDescriptor[] = Object.freeze([
  { code: "MD001", name: "heading-increment", description: "Heading levels should only increment by one level at a time", fixable: false, severity: "error" },
  { code: "MD003", name: "heading-style", description: "Heading style", fixable: true, severity: "error" },
  { code: "MD004", name: "ul-style", description: "Unordered list style", fixable: true, severity: "error" },
  { code: "MD005", name: "list-indent", description: "Inconsistent indentation for list items at the same level", fixable: false, severity: "error" },
  { code: "MD007", name: "ul-indent", description: "Unordered list indentation", fixable: true, severity: "error" },
  { code: "MD009", name: "no-trailing-spaces", description: "Trailing spaces", fixable: true, severity: "warning" },
  { code: "MD010", name: "no-hard-tabs", description: "Hard tabs", fixable: true, severity: "warning" },
  { code: "MD011", name: "no-reversed-links", description: "Reversed link syntax", fixable: false, severity: "error" },
  { code: "MD012", name: "no-multiple-blanks", description: "Multiple consecutive blank lines", fixable: true, severity: "warning" },
  { code: "MD013", name: "line-length", description: "Line length", fixable: false, severity: "warning" },
  { code: "MD014", name: "commands-show-output", description: "Dollar signs used before commands without showing output", fixable: false, severity: "warning" },
  { code: "MD018", name: "no-missing-space-atx", description: "No space after hash on atx-style heading", fixable: true, severity: "error" },
  { code: "MD019", name: "no-multiple-space-atx", description: "Multiple spaces after hash on atx-style heading", fixable: true, severity: "error" },
  { code: "MD020", name: "no-missing-space-closed-atx", description: "No space inside hashes on closed atx-style heading", fixable: true, severity: "error" },
  { code: "MD021", name: "no-multiple-space-closed-atx", description: "Multiple spaces inside hashes on closed atx-style heading", fixable: true, severity: "error" },
  { code: "MD022", name: "blanks-around-headings", description: "Headings should be surrounded by blank lines", fixable: true, severity: "error" },
  { code: "MD023", name: "heading-start-left", description: "Headings must start at the beginning of the line", fixable: true, severity: "error" },
  { code: "MD024", name: "no-duplicate-heading", description: "Multiple headings with the same content", fixable: false, severity: "error" },
  { code: "MD025", name: "single-title", description: "Multiple top-level headings in the same document", fixable: false, severity: "error" },
  { code: "MD026", name: "no-trailing-punctuation", description: "Trailing punctuation in heading", fixable: true, severity: "warning" },
  { code: "MD027", name: "no-multiple-space-blockquote", description: "Multiple spaces after blockquote symbol", fixable: true, severity: "warning" },
  { code: "MD028", name: "no-blanks-blockquote", description: "Blank line inside blockquote", fixable: false, severity: "warning" },
  { code: "MD029", name: "ol-prefix", description: "Ordered list item prefix", fixable: true, severity: "warning" },
  { code: "MD030", name: "list-marker-space", description: "Spaces after list markers", fixable: true, severity: "warning" },
  { code: "MD031", name: "blanks-around-fences", description: "Fenced code blocks should be surrounded by blank lines", fixable: true, severity: "warning" },
  { code: "MD032", name: "blanks-around-lists", description: "Lists should be surrounded by blank lines", fixable: true, severity: "warning" },
  { code: "MD033", name: "no-inline-html", description: "Inline HTML", fixable: false, severity: "warning" },
  { code: "MD034", name: "no-bare-urls", description: "Bare URL used", fixable: true, severity: "warning" },
  { code: "MD035", name: "hr-style", description: "Horizontal rule style", fixable: true, severity: "warning" },
  { code: "MD036", name: "no-emphasis-as-heading", description: "Emphasis used instead of a heading", fixable: false, severity: "warning" },
  { code: "MD037", name: "no-space-in-emphasis", description: "Spaces inside emphasis markers", fixable: true, severity: "warning" },
  { code: "MD038", name: "no-space-in-code", description: "Spaces inside code span elements", fixable: true, severity: "warning" },
  { code: "MD039", name: "no-space-in-links", description: "Spaces inside link text", fixable: true, severity: "warning" },
  { code: "MD040", name: "fenced-code-language", description: "Fenced code blocks should have a language specified", fixable: false, severity: "warning" },
  { code: "MD041", name: "first-line-heading", description: "First line in a file should be a top-level heading", fixable: false, severity: "error" },
  { code: "MD042", name: "no-empty-links", description: "No empty links", fixable: false, severity: "error" },
  { code: "MD043", name: "required-headings", description: "Required heading structure", fixable: false, severity: "error" },
  { code: "MD044", name: "proper-names", description: "Proper names should have the correct capitalization", fixable: true, severity: "warning" },
  { code: "MD045", name: "no-alt-text", description: "Images should have alternate text (alt text)", fixable: false, severity: "warning" },
  { code: "MD046", name: "code-block-style", description: "Code block style", fixable: false, severity: "warning" },
  { code: "MD047", name: "single-trailing-newline", description: "Files should end with a single newline character", fixable: true, severity: "error" },
  { code: "MD048", name: "code-fence-style", description: "Code fence style", fixable: true, severity: "warning" },
  { code: "MD049", name: "emphasis-style", description: "Emphasis style", fixable: true, severity: "warning" },
]);

export function registerStandardRules(registry: RuleRegistry): void {
  const adapter = makeMarkdownLintAdapter();
  for (const desc of DESCRIPTORS) {
    registry.register(buildStandardRule(desc, adapter));
  }
}
```

- [ ] **Test** — register into a fresh registry, assert `registry.get("MD013") !== undefined` and `registry.all().length >= 43`.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/standard/registerStandard.ts \
        tests/unit/rules/standard/registerStandard.test.ts
git commit -m "feat(rules): registerStandard for MD001..MD049"
```

---

### Task 6: Disable conflicting rules in defaults

**Files:**
- Modify: `src/infrastructure/config/defaults.ts`

- [ ] **Expand `DEFAULT_CONFIG.rules`** to disable each entry from `OFM_MD_CONFLICTS`:

```ts
import { OFM_MD_CONFLICTS } from "../rules/standard/OFM_MD_CONFLICTS.js";

const disabledFromConflicts = Object.fromEntries(
  OFM_MD_CONFLICTS.map((c) => [c.code, Object.freeze({ enabled: false })]),
);

rules: Object.freeze({
  ...existingRuleOverrides,
  ...disabledFromConflicts,
}),
```

- [ ] **Write test** — for each conflict, confirm `DEFAULT_CONFIG.rules[code].enabled === false`.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/config/defaults.ts tests/unit/config/
git commit -m "feat(config): disable OFM-conflicting MD rules by default"
```

---

### Task 7: Wire registerStandard into registerBuiltin

**Files:**
- Modify: `src/infrastructure/rules/ofm/registerBuiltin.ts`

- [ ] **Update**

```ts
import { registerStandardRules } from "../standard/registerStandard.js";

export function registerBuiltinRules(registry: RuleRegistry): void {
  // Phase 2-6 OFM rules
  for (const rule of ALL) registry.register(rule);
  // Phase 7 standard MD rules
  registerStandardRules(registry);
}
```

- [ ] **Run + Commit**

```bash
npm run test
git add src/infrastructure/rules/ofm/registerBuiltin.ts
git commit -m "feat(rules): register standard markdownlint rules alongside OFM rules"
```

---

### Task 8: Integration test

**Files:**
- Create: `tests/integration/rules/standard-md-integration.test.ts`

- [ ] **Write**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

let vault: string;
beforeEach(async () => {
  vault = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-md-int-"));
  await fs.mkdir(path.join(vault, ".obsidian"), { recursive: true });
});
afterEach(async () => {
  await fs.rm(vault, { recursive: true, force: true });
});

describe("standard MD integration", () => {
  it("MD001 fires on incorrect heading increment", async () => {
    await fs.writeFile(
      path.join(vault, "note.md"),
      "# h1\n\n### h3 (skips h2)\n",
    );
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("MD001");
  });

  it("MD013 is disabled by default (long wikilink passes)", async () => {
    const longLink = "[[very/long/path/that/would/normally/fail/md013/but/should/pass]]";
    await fs.writeFile(path.join(vault, "note.md"), `# h\n\n${longLink}\n`);
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.stdout).not.toContain("MD013");
  });

  it("MD042 is disabled (wikilinks look empty to it)", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "# h\n\n[[link]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.stdout).not.toContain("MD042");
  });
});
```

- [ ] **Run + Commit**

```bash
npm run test -- tests/integration/rules/standard-md-integration.test.ts
git add tests/integration/rules/standard-md-integration.test.ts
git commit -m "test(rules): standard MD integration with OFM conflict coverage"
```

---

### Task 9: Documentation — standard-md catalog

**Files:**
- Create: `docs/rules/standard-md/index.md`
- Create: one page per conflict (`MD013.md`, `MD033.md`, `MD034.md`, `MD041.md`, `MD042.md`)
- Modify: `docs/rules/index.md`

- [ ] **`index.md`** — table of every MD rule with enabled/disabled status and a wikilink to the upstream markdownlint docs.

```markdown
# Standard markdownlint Rules

| Code | Name | Enabled by default | OFM conflict note |
|---|---|---|---|
| MD001 | heading-increment | yes | — |
| MD013 | line-length | **no** | [[MD013]] |
| MD033 | no-inline-html | **no** | [[MD033]] |
| ... | ... | ... | ... |
```

- [ ] **Conflict pages** — one paragraph each explaining the collision and the recommended workaround. Example `MD013.md`:

```markdown
---
rule-code: MD013
inherited-from: markdownlint
status: disabled-by-default
area: standard-md
---

# MD013 — line-length

**Why disabled:** wikilinks and embeds routinely produce lines longer than
the default 80-column limit. Re-enable it in your own config via
`{ "rules": { "MD013": { "enabled": true, "options": { "line_length": 120 } } } }`
if you maintain a hard column rule.

**Upstream docs:** https://github.com/DavidAnson/markdownlint/blob/main/doc/md013.md
```

- [ ] **Dogfood** — `cd docs && node ../bin/markdownlint-obsidian.js "**/*.md"`. Because MD rules are now active, expect to fix real violations in our own docs.

- [ ] **Commit**

```bash
git add docs/rules/standard-md/
git commit -m "docs(rules): standard-md catalog and OFM conflict pages"
```

---

### Task 10: Phase 7 verification

- [ ] **Full run** `npm run test:all`

- [ ] **Coverage** — standard/ ≥ 85%.

- [ ] **Final commit**

```bash
git add -A
git commit -m "chore: Phase 7 complete — markdownlint MD001-MD049 integration"
```

---

## Phase 7 acceptance criteria

- `markdownlint` runs once per file, regardless of how many MD rules fire.
- Every MD001–MD049 rule is available as an `OFMRule` via `registry.get("MDNNN")`.
- `OFM_MD_CONFLICTS` enumerates every disabled MD rule; `DEFAULT_CONFIG.rules` reflects the list.
- `docs/rules/standard-md/` hosts a catalog page plus one per disabled rule.
- `npm run test:all` remains green; dogfood docs pass with the new MD rules active.
