# Phase 3: Frontmatter + Tag Rules — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first real OFM rule families — frontmatter (OFM080–OFM099) and tag (OFM060–OFM079) — against the Phase 2 parser pipeline. Every rule follows the same table-driven test pattern (valid/invalid fixture rows) so Phase 4+ can clone the shape. The `docs/bdd/features/frontmatter.feature` scenarios from the Phase 1 scaffold become green here.

**Architecture:** Each rule is a single file under `src/infrastructure/rules/ofm/<area>/OFM0xx.ts` exporting a const `OFMRule`. Rules pull structured data straight off `ParseResult` — they do not re-parse. Rule-scoped helpers (date parsing, tag validation) live next to the rules. Rule options come from `LinterConfig.frontmatter` / `LinterConfig.tags` branches; options are read once per rule invocation. Config is extended with a new `tags` section and a richer `frontmatter` section.

**Tech Stack:** Phase 2 stack. No new runtime dependencies; `js-yaml` already present. `fast-check` (already in Phase 1) drives property-based tag validation.

---

## File Map

```
src/
  domain/config/LinterConfig.ts                      UPDATED: add TagConfig, extend FrontmatterConfig
  infrastructure/
    config/defaults.ts                               UPDATED: defaults for frontmatter + tags
    config/ConfigValidator.ts                        UPDATED: allow new keys
    rules/ofm/
      registerBuiltin.ts                             UPDATED: register 17 new rules
      frontmatter/
        shared/
          DateFormat.ts                              ISO-8601 date check
          FrontmatterAccess.ts                       Helper: look up nested key via dot path
        OFM080-missing-required-key.ts
        OFM081-invalid-date-format.ts
        OFM082-unknown-top-level-key.ts              (non-fatal; disabled by default)
        OFM083-invalid-value-type.ts
        OFM084-empty-required-key.ts
        OFM085-duplicate-key.ts                      Via gray-matter parse + raw scan
        OFM086-trailing-whitespace-in-string.ts
        OFM087-non-string-tag-entry.ts
      tags/
        shared/TagFormat.ts                          #tag regex + depth util
        OFM060-invalid-tag-format.ts
        OFM061-tag-depth-exceeded.ts
        OFM062-empty-tag.ts
        OFM063-trailing-slash.ts
        OFM064-duplicate-tag.ts
        OFM065-mixed-case-tag.ts
        OFM066-frontmatter-tag-not-in-body.ts        (opt-in)
  application/LintUseCase.ts                         No change beyond RuleParams plumbing
tests/
  unit/
    rules/
      helpers/runRuleOnSource.ts                     Canonical single-rule test entrypoint
      frontmatter/
        OFM080.test.ts ... OFM087.test.ts
        shared/DateFormat.test.ts, FrontmatterAccess.test.ts
      tags/
        OFM060.test.ts ... OFM066.test.ts
        shared/TagFormat.test.ts
  integration/
    helpers/spawnCli.ts                              Canonical CLI-process test helper
    rules/
      frontmatter-integration.test.ts
      tags-integration.test.ts
  fixtures/rules/
    frontmatter/
      missing-tags.md, invalid-date.md, valid.md
    tags/
      bad-format.md, duplicate.md, valid.md
docs/
  rules/
    frontmatter/OFM080.md ... OFM087.md
    tags/OFM060.md ... OFM066.md
    index.md                                         UPDATED: catalog the new rules
  bdd/features/
    frontmatter.feature                              Already exists; becomes green in Task 18
    tags.feature                                     New: tag validation scenarios
```

---

## Rule Authoring Template

Every rule in Phases 3–6 follows this shape. Reuse verbatim.

```ts
// src/infrastructure/rules/ofm/<area>/OFMNNN-<name>.ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFMNNN — short-name
 * One-sentence description of the violation.
 * @see docs/rules/<area>/OFMNNN.md
 */
export const OFMNNNRule: OFMRule = {
  names: ["OFMNNN", "short-name"],
  description: "Human description",
  tags: ["<area>"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    // ... read ParseResult fields off params.parsed and options off params.config
    // call onError({ line, column, message }) for each violation
  },
};
```

Rule tests follow this shape:

```ts
// tests/unit/rules/<area>/OFMNNN.test.ts
import { describe, it, expect } from "vitest";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { OFMNNNRule } from "../../../../src/infrastructure/rules/ofm/<area>/OFMNNN-<name>.js";

const valid: Array<{ name: string; source: string }> = [
  { name: "passes: plain", source: "..." },
];
const invalid: Array<{ name: string; source: string; line: number }> = [
  { name: "fails: X missing", source: "...", line: 1 },
];

describe("OFMNNN", () => {
  for (const { name, source } of valid) {
    it(name, async () => {
      expect(await runRuleOnSource(OFMNNNRule, source)).toEqual([]);
    });
  }
  for (const { name, source, line } of invalid) {
    it(name, async () => {
      const errors = await runRuleOnSource(OFMNNNRule, source);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.line).toBe(line);
      expect(errors[0]?.ruleCode).toBe("OFMNNN");
    });
  }
});
```

---

### Task 1: Test helper — runRuleOnSource

**Files:**

- Create: `tests/unit/rules/helpers/runRuleOnSource.ts`
- Create: `tests/unit/rules/helpers/runRuleOnSource.test.ts`

A single place where "parse this source, run this rule, give me the errors" lives. Every Phase 3+ rule test imports from here.

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { runRuleOnSource } from "./runRuleOnSource.js";
import type { OFMRule } from "../../../../src/domain/linting/OFMRule.js";

const alwaysErrorRule: OFMRule = {
  names: ["TEST001", "always-error"],
  description: "Test double",
  tags: ["test"],
  severity: "error",
  fixable: false,
  run(_params, onError) {
    onError({ line: 1, column: 1, message: "boom" });
  },
};

describe("runRuleOnSource", () => {
  it("returns LintErrors emitted by the rule", async () => {
    const errors = await runRuleOnSource(alwaysErrorRule, "# hi");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("TEST001");
  });
});
```

- [ ] **Implement `runRuleOnSource.ts`**

```ts
import type { OFMRule } from "../../../../src/domain/linting/OFMRule.js";
import type { LintError } from "../../../../src/domain/linting/LintError.js";
import { makeLintError } from "../../../../src/domain/linting/LintError.js";
import { makeMarkdownItParser } from "../../../../src/infrastructure/parser/MarkdownItParser.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";
import type { LinterConfig } from "../../../../src/domain/config/LinterConfig.js";

/**
 * Parse `source`, run `rule` once against the parsed result, and collect
 * every LintError the rule emits. Config defaults to DEFAULT_CONFIG; pass
 * `overrides` to patch specific branches for a single test.
 */
export async function runRuleOnSource(
  rule: OFMRule,
  source: string,
  overrides: Partial<LinterConfig> = {},
): Promise<LintError[]> {
  const parser = makeMarkdownItParser();
  let parsed;
  try {
    parsed = parser.parse("test.md", source);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return [
      makeLintError({
        ruleCode: "OFM902",
        ruleName: "frontmatter-parse-error",
        severity: "error",
        line: 1, column: 1, message, fixable: false,
      }),
    ];
  }

  const config: LinterConfig = Object.freeze({ ...DEFAULT_CONFIG, ...overrides });
  const errors: LintError[] = [];
  rule.run(
    { filePath: parsed.filePath, parsed, config },
    (partial) => {
      errors.push(
        makeLintError({
          ruleCode: rule.names[0] ?? "UNKNOWN",
          ruleName: rule.names[1] ?? rule.names[0] ?? "unknown",
          severity: rule.severity,
          line: partial.line,
          column: partial.column,
          message: partial.message,
          fixable: rule.fixable,
        }),
      );
    },
  );

  return errors;
}
```

Note that this relies on Task 2's `RuleParams` shape update.

- [ ] **Commit**

```bash
git add tests/unit/rules/helpers/
git commit -m "test(rules): add runRuleOnSource helper"
```

---

### Task 2: Extend RuleParams with ParseResult and config access

**Files:**

- Modify: `src/domain/linting/OFMRule.ts`
- Modify: `src/application/LintUseCase.ts`
- Modify: `src/domain/parsing/ParseResult.ts` (Phase-2 review fix #2: freeze `frontmatter`)

The Phase 2 `RuleParams` only had `filePath`, `lines`, `frontmatter`, `tokens`. Rules now need the full `ParseResult` plus `LinterConfig`. Expand the contract once; every subsequent rule uses the same shape.

**Phase-2 review follow-ups folded in here:**

1. `runRule` in `LintUseCase.ts` is rewritten anyway, so type its `parsed` parameter as `ParseResult` and drop the four `as` casts (review suggestion #1).
2. `makeParseResult` in `ParseResult.ts` should freeze `frontmatter` for symmetry with the array fields (review suggestion #2).

- [ ] **Update `OFMRule.ts`**

```ts
import type { LintError } from "./LintError.js";
import type { ParseResult } from "../parsing/ParseResult.js";
import type { LinterConfig } from "../config/LinterConfig.js";

export interface RuleParams {
  readonly filePath: string;
  readonly parsed: ParseResult;
  readonly config: LinterConfig;
}

export type OnErrorCallback = (
  error: Pick<LintError, "line" | "column" | "message"> & { fix?: LintError["fix"] },
) => void;

export interface OFMRule {
  readonly names: readonly string[];
  readonly description: string;
  readonly tags: readonly string[];
  readonly severity: "error" | "warning";
  readonly fixable: boolean;
  run(params: RuleParams, onError: OnErrorCallback): void;
}
```

- [ ] **Update `LintUseCase.ts`** to build `{ filePath, parsed, config }` per rule call and thread `config` through the main loop. Type `parsed` as `ParseResult`; no `as` casts.

- [ ] **Update `ParseResult.ts`** — `makeParseResult` returns `frontmatter: Object.freeze({ ...fields.frontmatter })`.

- [ ] **Run Phase 2 tests** — should still pass.

- [ ] **Commit**

```bash
git add src/domain/linting/OFMRule.ts src/application/LintUseCase.ts \
        src/domain/parsing/ParseResult.ts tests/unit/rules/helpers/
git commit -m "refactor(rules): expand RuleParams with full ParseResult and LinterConfig"
```

---

### Task 3: Extend LinterConfig and defaults for frontmatter/tag options

**Files:**

- Modify: `src/domain/config/LinterConfig.ts`
- Modify: `src/infrastructure/config/defaults.ts`
- Modify: `src/infrastructure/config/ConfigValidator.ts`
- Create: `tests/unit/config/LinterConfig.phase3.test.ts`

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";

describe("DEFAULT_CONFIG (phase 3)", () => {
  it("has default tags config", () => {
    expect(DEFAULT_CONFIG.tags.maxDepth).toBe(5);
    expect(DEFAULT_CONFIG.tags.caseSensitive).toBe(false);
  });

  it("has frontmatter.required array and typeMap", () => {
    expect(DEFAULT_CONFIG.frontmatter.required).toEqual([]);
    expect(DEFAULT_CONFIG.frontmatter.typeMap).toEqual({});
  });
});
```

- [ ] **Update `LinterConfig.ts`** — add `TagConfig` and expand `FrontmatterConfig`

```ts
export interface TagConfig {
  readonly maxDepth: number;
  readonly caseSensitive: boolean;
  readonly allowList: readonly string[] | null;
  readonly denyList: readonly string[];
}

export interface FrontmatterConfig {
  readonly required: readonly string[];
  readonly dateFields: readonly string[];
  readonly typeMap: Readonly<Record<string, "string" | "number" | "boolean" | "array" | "date">>;
  readonly allowUnknown: boolean;
}
```

Add `readonly tags: TagConfig` to `LinterConfig`.

- [ ] **Update `defaults.ts`**

```ts
export const DEFAULT_CONFIG: LinterConfig = Object.freeze({
  // ...existing fields...
  frontmatter: Object.freeze({
    required: Object.freeze([]),
    dateFields: Object.freeze([]),
    typeMap: Object.freeze({}),
    allowUnknown: true,
  }),
  tags: Object.freeze({
    maxDepth: 5,
    caseSensitive: false,
    allowList: null,
    denyList: Object.freeze([]),
  }),
});
```

- [ ] **Update `ConfigValidator.ts` KNOWN_KEYS** to add `"tags"`.

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/domain/config/LinterConfig.ts src/infrastructure/config/defaults.ts \
        src/infrastructure/config/ConfigValidator.ts tests/unit/config/LinterConfig.phase3.test.ts
git commit -m "feat(config): add TagConfig and expand FrontmatterConfig"
```

---

### Task 4: Shared helper — DateFormat

**Files:**

- Create: `src/infrastructure/rules/ofm/frontmatter/shared/DateFormat.ts`
- Create: `tests/unit/rules/frontmatter/shared/DateFormat.test.ts`

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { isIsoDate } from "../../../../../src/infrastructure/rules/ofm/frontmatter/shared/DateFormat.js";

describe("isIsoDate", () => {
  it.each(["2026-04-11", "2026-04-11T12:00:00Z", "1999-12-31T23:59:59.999Z"])(
    "accepts %s",
    (input) => expect(isIsoDate(input)).toBe(true),
  );
  it.each(["2026/04/11", "04-11-2026", "not-a-date", "", "2026-13-40"])(
    "rejects %s",
    (input) => expect(isIsoDate(input)).toBe(false),
  );
});
```

- [ ] **Implement `DateFormat.ts`**

```ts
/**
 * Test whether a string is a parseable ISO-8601 date or datetime.
 * Accepts `YYYY-MM-DD`, `YYYY-MM-DDTHH:MM:SS`, with optional fractional
 * seconds and `Z` or `+HH:MM` offset.
 */
const ISO_PATTERN =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/;

export function isIsoDate(input: unknown): boolean {
  if (typeof input !== "string") return false;
  if (!ISO_PATTERN.test(input)) return false;
  const ms = Date.parse(input);
  return Number.isFinite(ms);
}
```

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/frontmatter/shared/DateFormat.ts \
        tests/unit/rules/frontmatter/shared/DateFormat.test.ts
git commit -m "feat(rules): add isIsoDate helper"
```

---

### Task 5: Shared helper — FrontmatterAccess

**Files:**

- Create: `src/infrastructure/rules/ofm/frontmatter/shared/FrontmatterAccess.ts`
- Create: `tests/unit/rules/frontmatter/shared/FrontmatterAccess.test.ts`

- [ ] **Implement `FrontmatterAccess.ts`**

```ts
/** Traverse an object using a dotted path. Returns undefined if any segment misses. */
export function getByDotPath(source: unknown, dotPath: string): unknown {
  const parts = dotPath.split(".");
  let cursor: unknown = source;
  for (const part of parts) {
    if (typeof cursor !== "object" || cursor === null) return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
    if (cursor === undefined) return undefined;
  }
  return cursor;
}

export type FrontmatterValueType =
  | "null" | "string" | "number" | "boolean" | "array" | "object" | "unknown";

export function typeOf(value: unknown): FrontmatterValueType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  switch (typeof value) {
    case "string": return "string";
    case "number": return "number";
    case "boolean": return "boolean";
    case "object": return "object";
    default: return "unknown";
  }
}
```

- [ ] **Test** — happy-path table for dotted lookups, plus type detection for each kind.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/frontmatter/shared/FrontmatterAccess.ts \
        tests/unit/rules/frontmatter/shared/FrontmatterAccess.test.ts
git commit -m "feat(rules): add getByDotPath and typeOf helpers"
```

---

### Task 6: OFM080 — missing-required-key

**Files:**

- Create: `src/infrastructure/rules/ofm/frontmatter/OFM080-missing-required-key.ts`
- Create: `tests/unit/rules/frontmatter/OFM080.test.ts`

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { OFM080Rule } from "../../../../src/infrastructure/rules/ofm/frontmatter/OFM080-missing-required-key.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

const withRequired = (required: string[]) => ({
  frontmatter: {
    required, dateFields: [], typeMap: {}, allowUnknown: true,
  } as const,
});

describe("OFM080 missing-required-key", () => {
  it("passes when all required keys present", async () => {
    const errors = await runRuleOnSource(
      OFM080Rule,
      "---\ntags: [a]\nauthor: X\n---\nbody",
      withRequired(["tags", "author"]),
    );
    expect(errors).toEqual([]);
  });

  it("reports each missing key on line 1", async () => {
    const errors = await runRuleOnSource(
      OFM080Rule,
      "---\ntags: [a]\n---\nbody",
      withRequired(["tags", "author"]),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM080");
    expect(errors[0]?.message).toContain("author");
  });

  it("reports nothing when no required keys configured", async () => {
    const errors = await runRuleOnSource(OFM080Rule, "---\n---\nbody");
    expect(errors).toEqual([]);
  });
});
```

- [ ] **Implement `OFM080-missing-required-key.ts`**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { getByDotPath } from "./shared/FrontmatterAccess.js";

export const OFM080Rule: OFMRule = {
  names: ["OFM080", "missing-required-key"],
  description: "Required frontmatter key is missing",
  tags: ["frontmatter"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    for (const key of config.frontmatter.required) {
      if (getByDotPath(parsed.frontmatter, key) === undefined) {
        onError({
          line: 1, column: 1,
          message: `Required frontmatter key "${key}" is missing`,
        });
      }
    }
  },
};
```

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/frontmatter/OFM080-missing-required-key.ts \
        tests/unit/rules/frontmatter/OFM080.test.ts
git commit -m "feat(rules): OFM080 missing-required-key"
```

---

### Task 7: OFM081 — invalid-date-format

**Files:**

- Create: `src/infrastructure/rules/ofm/frontmatter/OFM081-invalid-date-format.ts`
- Create: `tests/unit/rules/frontmatter/OFM081.test.ts`

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { isIsoDate } from "./shared/DateFormat.js";
import { getByDotPath } from "./shared/FrontmatterAccess.js";

export const OFM081Rule: OFMRule = {
  names: ["OFM081", "invalid-date-format"],
  description: "Frontmatter date field is not a valid ISO-8601 value",
  tags: ["frontmatter", "dates"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    for (const key of config.frontmatter.dateFields) {
      const value = getByDotPath(parsed.frontmatter, key);
      if (value === undefined) continue;
      if (!isIsoDate(value)) {
        onError({
          line: 1, column: 1,
          message: `Frontmatter key "${key}" must be an ISO-8601 date, got ${JSON.stringify(value)}`,
        });
      }
    }
  },
};
```

- [ ] **Test** — valid/invalid table with `dateFields: ["created"]`. Mirror the BDD scenario `{ created: "not-a-date" }`.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/frontmatter/OFM081-invalid-date-format.ts \
        tests/unit/rules/frontmatter/OFM081.test.ts
git commit -m "feat(rules): OFM081 invalid-date-format"
```

---

### Task 8: OFM082 — unknown-top-level-key (disabled by default)

**Files:**

- Create: `src/infrastructure/rules/ofm/frontmatter/OFM082-unknown-top-level-key.ts`
- Create: `tests/unit/rules/frontmatter/OFM082.test.ts`

Disabled in `DEFAULT_CONFIG.rules["OFM082"] = { enabled: false }` so the dogfood test stays green for existing frontmatter schemas.

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM082Rule: OFMRule = {
  names: ["OFM082", "unknown-top-level-key"],
  description: "Frontmatter contains a key not present in typeMap",
  tags: ["frontmatter", "schema"],
  severity: "warning",
  fixable: false,
  run({ parsed, config }, onError) {
    if (config.frontmatter.allowUnknown) return;
    const known = new Set(Object.keys(config.frontmatter.typeMap));
    for (const key of Object.keys(parsed.frontmatter)) {
      if (!known.has(key)) {
        onError({ line: 1, column: 1, message: `Unknown frontmatter key "${key}"` });
      }
    }
  },
};
```

- [ ] **Append to `defaults.ts` rules map**

```ts
rules: Object.freeze({
  OFM082: Object.freeze({ enabled: false }),
}),
```

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/frontmatter/OFM082-unknown-top-level-key.ts \
        tests/unit/rules/frontmatter/OFM082.test.ts \
        src/infrastructure/config/defaults.ts
git commit -m "feat(rules): OFM082 unknown-top-level-key (warning, off by default)"
```

---

### Task 9: OFM083 — invalid-value-type

**Files:**

- Create: `src/infrastructure/rules/ofm/frontmatter/OFM083-invalid-value-type.ts`
- Create: `tests/unit/rules/frontmatter/OFM083.test.ts`

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { getByDotPath, typeOf } from "./shared/FrontmatterAccess.js";
import { isIsoDate } from "./shared/DateFormat.js";

export const OFM083Rule: OFMRule = {
  names: ["OFM083", "invalid-value-type"],
  description: "Frontmatter key has the wrong type per typeMap",
  tags: ["frontmatter", "schema"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    for (const [key, expected] of Object.entries(config.frontmatter.typeMap)) {
      const value = getByDotPath(parsed.frontmatter, key);
      if (value === undefined) continue;
      const actual = typeOf(value);
      if (expected === "date") {
        if (!isIsoDate(value)) {
          onError({ line: 1, column: 1, message: `Key "${key}" must be date, got ${actual}` });
        }
        continue;
      }
      if (actual !== expected) {
        onError({
          line: 1, column: 1,
          message: `Key "${key}" must be ${expected}, got ${actual}`,
        });
      }
    }
  },
};
```

- [ ] **Test** with `typeMap: { tags: "array", count: "number" }`.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/frontmatter/OFM083-invalid-value-type.ts \
        tests/unit/rules/frontmatter/OFM083.test.ts
git commit -m "feat(rules): OFM083 invalid-value-type"
```

---

### Task 10: OFM084–OFM087 batch — empty/duplicate/whitespace/tag-type

Each is a focused rule on the already-parsed frontmatter. One commit, one test file per rule.

**Files:**

- Create: `src/infrastructure/rules/ofm/frontmatter/OFM084-empty-required-key.ts`
- Create: `src/infrastructure/rules/ofm/frontmatter/OFM085-duplicate-key.ts`
- Create: `src/infrastructure/rules/ofm/frontmatter/OFM086-trailing-whitespace-in-string.ts`
- Create: `src/infrastructure/rules/ofm/frontmatter/OFM087-non-string-tag-entry.ts`
- Create: four matching test files under `tests/unit/rules/frontmatter/`

- [ ] **OFM084 empty-required-key**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { getByDotPath, typeOf } from "./shared/FrontmatterAccess.js";

export const OFM084Rule: OFMRule = {
  names: ["OFM084", "empty-required-key"],
  description: "Required frontmatter key is present but empty",
  tags: ["frontmatter"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    for (const key of config.frontmatter.required) {
      const value = getByDotPath(parsed.frontmatter, key);
      if (value === undefined) continue;
      if (value === null || value === "" || (typeOf(value) === "array" && (value as unknown[]).length === 0)) {
        onError({ line: 1, column: 1, message: `Required frontmatter key "${key}" is empty` });
      }
    }
  },
};
```

- [ ] **OFM085 duplicate-key** (scan `parsed.frontmatterRaw`)

> **Implementation note (Phase 3 amendment):** gray-matter / js-yaml is strict
> about duplicate top-level keys and throws OFM902 *before* OFM085 ever
> runs. The rule remains in the registry as a forward-compat net for any
> future tolerant parser; the unit test exercises it by synthesizing a
> `ParseResult` directly with a hand-crafted `frontmatterRaw`.

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM085Rule: OFMRule = {
  names: ["OFM085", "duplicate-frontmatter-key"],
  description: "Same frontmatter key declared twice in YAML",
  tags: ["frontmatter"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    const raw = parsed.frontmatterRaw;
    if (raw === null) return;
    const seen = new Map<string, number>();
    const rawLines = raw.split(/\r?\n/);
    for (let i = 0; i < rawLines.length; i += 1) {
      const match = /^([A-Za-z0-9_-]+)\s*:/.exec(rawLines[i] ?? "");
      if (match === null) continue;
      const key = match[1] ?? "";
      const absLine = i + 2; // +1 for opening `---`, +1 for 1-based line
      if (seen.has(key)) {
        onError({
          line: absLine, column: 1,
          message: `Duplicate frontmatter key "${key}" (also on line ${seen.get(key)})`,
        });
      } else {
        seen.set(key, absLine);
      }
    }
  },
};
```

- [ ] **OFM086 trailing-whitespace-in-string**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM086Rule: OFMRule = {
  names: ["OFM086", "frontmatter-trailing-whitespace"],
  description: "Frontmatter string value has trailing whitespace",
  tags: ["frontmatter", "whitespace"],
  severity: "warning",
  fixable: true,
  run({ parsed }, onError) {
    walk(parsed.frontmatter, [], onError);
  },
};

function walk(
  obj: unknown,
  path: string[],
  onError: (e: { line: number; column: number; message: string }) => void,
): void {
  if (typeof obj === "string") {
    if (/[ \t]+$/.test(obj)) {
      onError({ line: 1, column: 1, message: `Frontmatter value at "${path.join(".")}" has trailing whitespace` });
    }
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walk(v, [...path, String(i)], onError));
    return;
  }
  if (obj !== null && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      walk(v, [...path, k], onError);
    }
  }
}
```

- [ ] **OFM087 non-string-tag-entry**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM087Rule: OFMRule = {
  names: ["OFM087", "non-string-tag-entry"],
  description: "Frontmatter tags array contains a non-string entry",
  tags: ["frontmatter", "tags"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    const tags = (parsed.frontmatter as { tags?: unknown }).tags;
    if (!Array.isArray(tags)) return;
    for (let i = 0; i < tags.length; i += 1) {
      if (typeof tags[i] !== "string") {
        onError({
          line: 1, column: 1,
          message: `Frontmatter tags[${i}] must be a string, got ${typeof tags[i]}`,
        });
      }
    }
  },
};
```

- [ ] **Write tests** — valid/invalid table per rule via `runRuleOnSource`.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/frontmatter/OFM08*.ts \
        tests/unit/rules/frontmatter/OFM08*.test.ts
git commit -m "feat(rules): OFM084-087 empty/duplicate/whitespace/tag-entry frontmatter rules"
```

---

### Task 11: TagFormat helper

**Files:**

- Create: `src/infrastructure/rules/ofm/tags/shared/TagFormat.ts`
- Create: `tests/unit/rules/tags/shared/TagFormat.test.ts`

- [ ] **Implement**

```ts
/**
 * Validate Obsidian tag syntax rules against a value with no leading '#'.
 * Valid chars: A-Z, a-z, 0-9, '_', '-', '/'.
 * Must not start or end with '/', must not contain '//'.
 * Must contain at least one non-digit character.
 */
const ALLOWED = /^[A-Za-z0-9_/-]+$/;
const HAS_LETTER = /[A-Za-z_-]/;

export function isValidTag(value: string): boolean {
  if (value.length === 0) return false;
  if (!ALLOWED.test(value)) return false;
  if (value.startsWith("/") || value.endsWith("/")) return false;
  if (value.includes("//")) return false;
  if (!HAS_LETTER.test(value)) return false;
  return true;
}

export function tagDepth(value: string): number {
  return value.split("/").length;
}
```

- [ ] **Write property-based test with fast-check**

```ts
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { isValidTag, tagDepth } from "../../../../../src/infrastructure/rules/ofm/tags/shared/TagFormat.js";

describe("isValidTag", () => {
  it.each(["simple", "nested/tag", "area/meta/deep", "with-dash", "with_us"])(
    "accepts %s",
    (v) => expect(isValidTag(v)).toBe(true),
  );
  it.each(["", "/leading", "trailing/", "double//slash", "has space", "123", "#hash"])(
    "rejects %s",
    (v) => expect(isValidTag(v)).toBe(false),
  );
});

describe("tagDepth", () => {
  it("counts slash segments", () => {
    fc.assert(
      fc.property(
        fc.array(fc.stringMatching(/^[a-z]+$/), { minLength: 1, maxLength: 5 }),
        (parts) => {
          const tag = parts.join("/");
          expect(tagDepth(tag)).toBe(parts.length);
        },
      ),
    );
  });
});
```

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/tags/shared/TagFormat.ts \
        tests/unit/rules/tags/shared/TagFormat.test.ts
git commit -m "feat(rules): add isValidTag and tagDepth helpers"
```

---

### Task 12: OFM060 — invalid-tag-format

**Files:**

- Create: `src/infrastructure/rules/ofm/tags/OFM060-invalid-tag-format.ts`
- Create: `tests/unit/rules/tags/OFM060.test.ts`

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { isValidTag } from "./shared/TagFormat.js";

export const OFM060Rule: OFMRule = {
  names: ["OFM060", "invalid-tag-format"],
  description: "Tag contains characters outside Obsidian's allowed set",
  tags: ["tags"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    for (const tag of parsed.tags) {
      if (!isValidTag(tag.value)) {
        onError({
          line: tag.position.line,
          column: tag.position.column,
          message: `Invalid tag "${tag.raw}"`,
        });
      }
    }
  },
};
```

- [ ] **Test** — most invalid tags are filtered by the extractor. Author edge fixtures like `#a//b` that slip past the extractor pattern but still represent a malformed tag.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/tags/OFM060-invalid-tag-format.ts \
        tests/unit/rules/tags/OFM060.test.ts
git commit -m "feat(rules): OFM060 invalid-tag-format"
```

---

### Task 13: OFM061 — tag-depth-exceeded

**Files:**

- Create: `src/infrastructure/rules/ofm/tags/OFM061-tag-depth-exceeded.ts`
- Create: `tests/unit/rules/tags/OFM061.test.ts`

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { tagDepth } from "./shared/TagFormat.js";

export const OFM061Rule: OFMRule = {
  names: ["OFM061", "tag-depth-exceeded"],
  description: "Nested tag exceeds the configured maxDepth",
  tags: ["tags"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    const max = config.tags.maxDepth;
    for (const tag of parsed.tags) {
      if (tagDepth(tag.value) > max) {
        onError({
          line: tag.position.line,
          column: tag.position.column,
          message: `Tag "${tag.raw}" has depth ${tagDepth(tag.value)} (max ${max})`,
        });
      }
    }
  },
};
```

- [ ] **Test** with `maxDepth: 2` and a `#a/b/c` tag.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/tags/OFM061-tag-depth-exceeded.ts \
        tests/unit/rules/tags/OFM061.test.ts
git commit -m "feat(rules): OFM061 tag-depth-exceeded"
```

---

### Task 14: OFM062–OFM066 batch — empty/trailing-slash/duplicate/case/unused

**Files:**

- Create: `src/infrastructure/rules/ofm/tags/OFM062-empty-tag.ts`
- Create: `src/infrastructure/rules/ofm/tags/OFM063-trailing-slash.ts`
- Create: `src/infrastructure/rules/ofm/tags/OFM064-duplicate-tag.ts`
- Create: `src/infrastructure/rules/ofm/tags/OFM065-mixed-case-tag.ts`
- Create: `src/infrastructure/rules/ofm/tags/OFM066-frontmatter-tag-not-in-body.ts`
- Create: five matching test files under `tests/unit/rules/tags/`

- [ ] **OFM062 empty-tag** — fires if a line contains a bare `#` or `#/...`.

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

const EMPTY_TAG = /(?:^|\s)(#\/?)(?:\s|$)/;

export const OFM062Rule: OFMRule = {
  names: ["OFM062", "empty-tag"],
  description: "A lone '#' or '#/' is not a valid tag",
  tags: ["tags"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    parsed.lines.forEach((line, i) => {
      const match = EMPTY_TAG.exec(line);
      if (match !== null) {
        onError({
          line: i + 1,
          column: (match.index ?? 0) + 1,
          message: `Empty tag "${match[1]}"`,
        });
      }
    });
  },
};
```

- [ ] **OFM063 trailing-slash** — `tag.value.endsWith("/")`.

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM063Rule: OFMRule = {
  names: ["OFM063", "tag-trailing-slash"],
  description: "Nested tag ends with a trailing slash",
  tags: ["tags"],
  severity: "error",
  fixable: true,
  run({ parsed }, onError) {
    for (const tag of parsed.tags) {
      if (tag.value.endsWith("/")) {
        onError({
          line: tag.position.line,
          column: tag.position.column,
          message: `Tag "${tag.raw}" has a trailing slash`,
        });
      }
    }
  },
};
```

- [ ] **OFM064 duplicate-tag**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM064Rule: OFMRule = {
  names: ["OFM064", "duplicate-tag"],
  description: "The same tag is repeated within one file",
  tags: ["tags"],
  severity: "warning",
  fixable: false,
  run({ parsed, config }, onError) {
    const seen = new Map<string, { line: number; column: number }>();
    for (const tag of parsed.tags) {
      const key = config.tags.caseSensitive ? tag.value : tag.value.toLowerCase();
      const prior = seen.get(key);
      if (prior !== undefined) {
        onError({
          line: tag.position.line,
          column: tag.position.column,
          message: `Duplicate tag "${tag.raw}" (first seen on line ${prior.line})`,
        });
      } else {
        seen.set(key, { line: tag.position.line, column: tag.position.column });
      }
    }
  },
};
```

- [ ] **OFM065 mixed-case-tag** — warns when case differs from first occurrence.

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM065Rule: OFMRule = {
  names: ["OFM065", "mixed-case-tag"],
  description: "Tag casing differs from its earlier occurrence",
  tags: ["tags", "style"],
  severity: "warning",
  fixable: true,
  run({ parsed, config }, onError) {
    if (config.tags.caseSensitive) return;
    const canonical = new Map<string, string>();
    for (const tag of parsed.tags) {
      const key = tag.value.toLowerCase();
      const seen = canonical.get(key);
      if (seen === undefined) {
        canonical.set(key, tag.value);
      } else if (seen !== tag.value) {
        onError({
          line: tag.position.line,
          column: tag.position.column,
          message: `Tag "${tag.raw}" case differs from earlier "${seen}"`,
        });
      }
    }
  },
};
```

- [ ] **OFM066 frontmatter-tag-not-in-body** — warns when a frontmatter `tags` entry never appears in the body. Off by default.

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM066Rule: OFMRule = {
  names: ["OFM066", "frontmatter-tag-not-in-body"],
  description: "Tag declared in frontmatter is never used in the body",
  tags: ["tags", "style"],
  severity: "warning",
  fixable: false,
  run({ parsed }, onError) {
    const fmTags = (parsed.frontmatter as { tags?: unknown }).tags;
    if (!Array.isArray(fmTags)) return;
    const body = new Set(parsed.tags.map((t) => t.value.toLowerCase()));
    for (const t of fmTags) {
      if (typeof t !== "string") continue;
      if (!body.has(t.toLowerCase())) {
        onError({
          line: 1, column: 1,
          message: `Frontmatter tag "${t}" not used in body`,
        });
      }
    }
  },
};
```

Mark `OFM066` disabled by default in `defaults.ts`. **Phase 3 amendment:** OFM062
is also disabled by default — its `#` (with trailing space) token detection over-fires on prose
markdown (e.g. quoted strings inside code-prose), so it joins OFM066/OFM082 as
opt-in. The unit tests bypass the registry and exercise the rule directly via
`runRuleOnSource`, so coverage is unaffected.

```ts
rules: Object.freeze({
  OFM062: Object.freeze({ enabled: false }),
  OFM066: Object.freeze({ enabled: false }),
  OFM082: Object.freeze({ enabled: false }),
}),
```

- [ ] **Write valid/invalid tests** — one per rule, following the template.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/tags/OFM06[2-6]-*.ts \
        tests/unit/rules/tags/OFM06[2-6].test.ts \
        src/infrastructure/config/defaults.ts
git commit -m "feat(rules): OFM062-066 tag hygiene"
```

---

### Task 15: Register all new rules

**Files:**

- Modify: `src/infrastructure/rules/ofm/registerBuiltin.ts`

- [ ] **Update `registerBuiltin.ts`**

```ts
import type { RuleRegistry } from "../../../domain/linting/RuleRegistry.js";
import { frontmatterParseErrorRule } from "./system/FrontmatterParseError.js";
import { OFM080Rule } from "./frontmatter/OFM080-missing-required-key.js";
import { OFM081Rule } from "./frontmatter/OFM081-invalid-date-format.js";
import { OFM082Rule } from "./frontmatter/OFM082-unknown-top-level-key.js";
import { OFM083Rule } from "./frontmatter/OFM083-invalid-value-type.js";
import { OFM084Rule } from "./frontmatter/OFM084-empty-required-key.js";
import { OFM085Rule } from "./frontmatter/OFM085-duplicate-key.js";
import { OFM086Rule } from "./frontmatter/OFM086-trailing-whitespace-in-string.js";
import { OFM087Rule } from "./frontmatter/OFM087-non-string-tag-entry.js";
import { OFM060Rule } from "./tags/OFM060-invalid-tag-format.js";
import { OFM061Rule } from "./tags/OFM061-tag-depth-exceeded.js";
import { OFM062Rule } from "./tags/OFM062-empty-tag.js";
import { OFM063Rule } from "./tags/OFM063-trailing-slash.js";
import { OFM064Rule } from "./tags/OFM064-duplicate-tag.js";
import { OFM065Rule } from "./tags/OFM065-mixed-case-tag.js";
import { OFM066Rule } from "./tags/OFM066-frontmatter-tag-not-in-body.js";

const ALL = [
  frontmatterParseErrorRule,
  OFM080Rule, OFM081Rule, OFM082Rule, OFM083Rule,
  OFM084Rule, OFM085Rule, OFM086Rule, OFM087Rule,
  OFM060Rule, OFM061Rule, OFM062Rule, OFM063Rule,
  OFM064Rule, OFM065Rule, OFM066Rule,
];

export function registerBuiltinRules(registry: RuleRegistry): void {
  for (const rule of ALL) registry.register(rule);
}
```

- [ ] **Run + Commit**

```bash
npm run test
git add src/infrastructure/rules/ofm/registerBuiltin.ts
git commit -m "feat(rules): register Phase 3 frontmatter and tag rules"
```

---

### Task 16: Integration test helper — spawnCli

**Files:**

- Create: `tests/integration/helpers/spawnCli.ts`
- Create: `tests/integration/helpers/spawnCli.test.ts`

One canonical way to drive a CLI process from every integration test. Uses Node's spawn API via an argv array (never a shell string).

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { spawnCli } from "./spawnCli.js";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

describe("spawnCli", () => {
  it("returns exit 0 for a clean vault", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-spawn-"));
    await fs.writeFile(path.join(tmp, "ok.md"), "# ok\n");
    const r = await spawnCli(["**/*.md"], tmp);
    expect(r.exitCode).toBe(0);
    await fs.rm(tmp, { recursive: true, force: true });
  });
});
```

- [ ] **Implement `spawnCli.ts`**

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
 * Run the markdownlint-obsidian binary with the given args in `cwd`.
 * Never uses a shell — arguments are passed as an array.
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
    child.on("close", (code) => {
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });
  });
}
```

- [ ] **Run + Commit**

```bash
git add tests/integration/helpers/
git commit -m "test(integration): add spawnCli helper"
```

---

### Task 17: Integration tests — frontmatter + tags end-to-end

**Files:**

- Create: `tests/fixtures/rules/frontmatter/{missing-tags,invalid-date,valid}.md`
- Create: `tests/fixtures/rules/tags/{bad-format,duplicate,valid}.md`
- Create: `tests/integration/rules/frontmatter-integration.test.ts`
- Create: `tests/integration/rules/tags-integration.test.ts`

- [ ] **Fixture `missing-tags.md`**

```md
---
author: Alison
---

Body.
```

- [ ] **Fixture `invalid-date.md`**

```md
---
tags: [x]
created: not-a-date
---

Body.
```

- [ ] **Fixture `valid.md`**

```md
---
tags: [project]
created: 2026-04-11
---

# Valid

Body with #project tag.
```

- [ ] **Fixture `tags/bad-format.md`**

```md
# Bad tags

Text with #a//b and #good tag.
```

- [ ] **Fixture `tags/duplicate.md`**

```md
# Dup

#project once and #Project again.
```

- [ ] **Write `frontmatter-integration.test.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

let tmp: string;
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-fm-int-"));
  await fs.mkdir(path.join(tmp, ".obsidian"), { recursive: true });
  await fs.writeFile(
    path.join(tmp, ".obsidian-linter.jsonc"),
    JSON.stringify({
      frontmatter: { required: ["tags"], dateFields: ["created"], typeMap: {}, allowUnknown: true },
    }),
  );
});
afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("frontmatter rules integration", () => {
  it("fails when required key missing", async () => {
    await fs.copyFile(
      path.resolve("tests/fixtures/rules/frontmatter/missing-tags.md"),
      path.join(tmp, "note.md"),
    );
    const r = await spawnCli(["**/*.md"], tmp);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM080");
  });

  it("fails on invalid date", async () => {
    await fs.copyFile(
      path.resolve("tests/fixtures/rules/frontmatter/invalid-date.md"),
      path.join(tmp, "note.md"),
    );
    const r = await spawnCli(["**/*.md"], tmp);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM081");
  });

  it("passes for valid file", async () => {
    await fs.copyFile(
      path.resolve("tests/fixtures/rules/frontmatter/valid.md"),
      path.join(tmp, "note.md"),
    );
    const r = await spawnCli(["**/*.md"], tmp);
    expect(r.exitCode).toBe(0);
  });
});
```

- [ ] **Write analogous `tags-integration.test.ts`** — one fails-with-OFM060 case (bad-format) and one exits-0-with-warning case (duplicate — OFM064 is a warning).

- [ ] **Run + Commit**

```bash
npm run test -- tests/integration/rules
git add tests/fixtures/rules tests/integration/rules
git commit -m "test(rules): frontmatter + tags integration tests"
```

---

### Task 18: Green the existing frontmatter.feature + add tags.feature

**Files:**

- Modify: `docs/bdd/steps/file-steps.ts`
- Modify: `docs/bdd/features/frontmatter.feature` (add `@smoke` tags so `npm run test:bdd` exercises them)
- Create: `docs/bdd/features/tags.feature` (also tagged `@smoke`)

> Note: `npm run test:bdd` runs `--tags @smoke`, so any new scenarios that need to run inside `npm run test:all` must be tagged `@smoke`.

- [ ] **Add missing step definitions** to `docs/bdd/steps/file-steps.ts`:

```ts
Given("a file {string} with frontmatter missing {string}", async function (this: OFMWorld, relPath: string, missingKey: string) {
  if (!this.vaultDir) await this.initVault();
  await this.writeFile(relPath, "---\nauthor: Someone\n---\n\nbody\n");
  if (missingKey === "") throw new Error("missing key must be non-empty");
});

Given("the config requires frontmatter key {string}", async function (this: OFMWorld, key: string) {
  const cfg = {
    frontmatter: { required: [key], dateFields: [], typeMap: {}, allowUnknown: true },
  };
  await this.writeFile(".obsidian-linter.jsonc", JSON.stringify(cfg));
});

Given(
  "a file {string} with frontmatter {string}",
  async function (this: OFMWorld, relPath: string, yamlLine: string) {
    if (!this.vaultDir) await this.initVault();
    await this.writeFile(relPath, `---\n${yamlLine}\n---\n\nbody\n`);
  },
);

Given("the config declares {string} as a date field", async function (this: OFMWorld, key: string) {
  const cfg = {
    frontmatter: { required: [], dateFields: [key], typeMap: {}, allowUnknown: true },
  };
  await this.writeFile(".obsidian-linter.jsonc", JSON.stringify(cfg));
});

Given(
  "a file {string} with frontmatter {string} and {string}",
  async function (this: OFMWorld, relPath: string, a: string, b: string) {
    if (!this.vaultDir) await this.initVault();
    await this.writeFile(relPath, `---\n${a}\n${b}\n---\n\nbody\n`);
  },
);

Given(
  "the config requires frontmatter key {string} and declares {string} as a date field",
  async function (this: OFMWorld, key: string, dateKey: string) {
    const cfg = {
      frontmatter: { required: [key], dateFields: [dateKey], typeMap: {}, allowUnknown: true },
    };
    await this.writeFile(".obsidian-linter.jsonc", JSON.stringify(cfg));
  },
);

Then("error {word} is reported", function (this: OFMWorld, code: string) {
  const out = (this.cliResult?.stdout ?? "") + (this.cliResult?.stderr ?? "");
  expect(out).toContain(code);
});

Given("a config file with {string} set to {int}", async function (this: OFMWorld, dotKey: string, value: number) {
  if (!this.vaultDir) await this.initVault();
  const cfg: Record<string, unknown> = {};
  const parts = dotKey.split(".");
  let cursor: Record<string, unknown> = cfg;
  for (let i = 0; i < parts.length - 1; i += 1) {
    cursor[parts[i]!] = {};
    cursor = cursor[parts[i]!] as Record<string, unknown>;
  }
  cursor[parts.at(-1)!] = value;
  await this.writeFile(".obsidian-linter.jsonc", JSON.stringify(cfg));
});
```

- [ ] **Write `docs/bdd/features/tags.feature`**

```gherkin
Feature: Tag linting

  Scenario: Invalid tag format reports OFM060
    Given a file "notes/tags.md" containing "Body #a//b"
    When I run markdownlint-obsidian on "notes/tags.md"
    Then the exit code is 1
    And error OFM060 is reported on line 1

  Scenario: Nested tag beyond maxDepth reports OFM061
    Given a config file with "tags.maxDepth" set to 2
    And a file "notes/tags.md" containing "Body #a/b/c"
    When I run markdownlint-obsidian on "notes/tags.md"
    Then the exit code is 1
    And error OFM061 is reported on line 1

  Scenario: Valid tag passes
    Given a file "notes/tags.md" containing "Body #project/meta"
    When I run markdownlint-obsidian on "notes/tags.md"
    Then the exit code is 0
```

- [ ] **Run**

```bash
npm run test:bdd -- docs/bdd/features/frontmatter.feature docs/bdd/features/tags.feature
```

Expected: 6 scenarios pass.

- [ ] **Commit**

```bash
git add docs/bdd/features/tags.feature docs/bdd/steps/file-steps.ts
git commit -m "feat(bdd): wire frontmatter.feature steps and add tags.feature"
```

---

### Task 19: Rule documentation pages

**Files:**

- Create: `docs/rules/frontmatter/OFM080.md` ... `OFM087.md`
- Create: `docs/rules/tags/OFM060.md` ... `OFM066.md`
- Modify: `docs/rules/index.md`

Each rule page uses this template:

````markdown
---
rule-code: OFMNNN
rule-name: kebab-name
severity: error
fixable: false
area: frontmatter
tags: [frontmatter]
---

# OFMNNN — Short title

**Severity:** error | warning
**Fixable:** yes | no
**Added in:** Phase 3

## What it does

One paragraph explaining the violation.

## Bad example

```markdown
<!-- offending sample -->
```

## Good example

```markdown
<!-- fixed sample -->
```

## Config

```jsonc
{
  "frontmatter": { "required": ["tags"] }
}
```

## Related

- [[index]]
````

- [ ] **Write all 15 pages** — clones of the template with per-rule content.

- [ ] **Update `docs/rules/index.md`** to list every rule with wikilinks.

- [ ] **Dogfood the docs folder**

```bash
cd docs && node ../bin/markdownlint-obsidian.js "**/*.md"
```

Fix any real violations new rules surface in our own docs, or ignore them in `docs/.obsidian-linter.jsonc` with a comment explaining why.

- [ ] **Commit**

```bash
git add docs/rules
git commit -m "docs(rules): Phase 3 rule catalog pages"
```

---

### Task 20: Phase 3 verification

- [ ] **Run everything**

```bash
npm run test:all
```

- [ ] **Coverage check** — `npm run test:coverage`; domain/application ≥ 90%, infrastructure ≥ 80%.

- [ ] **Final commit**

```bash
git add -A
git commit -m "chore: Phase 3 complete — frontmatter OFM080-087 and tag OFM060-066 rules"
```

---

## Phase 3 acceptance criteria

- `RuleParams` exposes full `ParseResult` + `LinterConfig`. Every subsequent phase consumes this contract.
- `runRuleOnSource` is the canonical unit-test entrypoint for every rule file.
- `spawnCli` is the canonical integration-test entrypoint.
- 15 new rules (OFM080–OFM087, OFM060–OFM066) registered via `registerBuiltinRules`.
- OFM082 and OFM066 disabled by default; others enabled.
- `docs/bdd/features/frontmatter.feature` and `docs/bdd/features/tags.feature` both green.
- Coverage ≥ 90% on all new `src/infrastructure/rules/ofm/frontmatter/` and `src/infrastructure/rules/ofm/tags/` files.
- Every new rule has a doc page in `docs/rules/<area>/`.
