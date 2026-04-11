# Phase 9: Auto-fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fully wire the `--fix` flag. `--fix` reads every discovered file, runs the lint pipeline, applies non-overlapping fixes produced by rules that report `fixable: true`, writes the patched content back, then re-runs the lint pass to report any remaining unfixable violations. Fix support covers every OFM rule already marked `fixable`, every upstream markdownlint rule that ships its own fix hints, plus one new helper `--fix-check` mode that reports what *would* change without touching disk.

**Architecture:** A new application use case `FixUseCase` drives the loop. A new domain type `Fix` (already declared in Phase 1's `LintError.ts`) carries the patch: `{ line, editColumn, deleteCount, insertText }`. A new helper `applyFixes(raw, fixes)` sorts fixes by position (end-to-start) and applies them without overlap. The standard markdownlint adapter exposes its own `fixInfo` as `Fix` so MD rule fixes flow through the same pipeline. Safety: fixes are always computed against the original file content; if two fixes would overlap on the same line range, the second one is skipped and reported as `OFM903 fix-conflict`.

**Tech Stack:** Phase 8 stack. No new runtime deps.

---

## File Map

```
src/
  domain/
    linting/
      Fix.ts                              Extracted from LintError.ts; exported standalone
      FixPlan.ts                          VO: readonly list of fixes per file
      FixConflict.ts                      VO: rule codes + range overlap description
    fix/
      applyFixes.ts                       Pure function: raw + FixPlan -> (patched, conflicts)
  application/
    FixUseCase.ts                         Orchestrate read -> lint -> apply -> write -> re-lint
  infrastructure/
    io/
      FileWriter.ts                       Adapter: atomic write via temp + rename
    rules/
      standard/
        StandardRuleAdapter.ts            UPDATED: propagate markdownlint fixInfo as Fix
      ofm/
        frontmatter/
          OFM086-trailing-whitespace-in-string.ts   UPDATED: emit Fix
        tags/
          OFM063-trailing-slash.ts                  UPDATED: emit Fix
          OFM065-mixed-case-tag.ts                  UPDATED: emit Fix
        wikilinks/
          OFM005-case-mismatch.ts                   UPDATED: emit Fix
        callouts/
          OFM044-callout-fold-on-note.ts            UPDATED: emit Fix
        highlights/
          OFM124-empty-highlight.ts                 UPDATED: emit Fix
        block-references/
          OFM104-block-id-format.ts                 UPDATED: emit Fix
  cli/
    main.ts                                UPDATED: --fix branches into FixUseCase
tests/
  unit/
    fix/
      applyFixes.test.ts
    application/
      FixUseCase.test.ts
    rules/*                                UPDATED: new fix assertions
  integration/
    cli/fix.test.ts                        End-to-end --fix runs
```

---

### Task 1: Extract `Fix` to its own file

**Files:**
- Modify: `src/domain/linting/LintError.ts`
- Create: `src/domain/linting/Fix.ts`
- Create: `tests/unit/domain/Fix.test.ts`

- [ ] **Move the `Fix` interface** to `Fix.ts`

```ts
/**
 * An atomic text edit produced by a fixable rule. Immutable.
 *
 * The edit window is defined as "starting at column `editColumn` on line
 * `lineNumber`, delete `deleteCount` characters, then insert `insertText`".
 * All positions are 1-based to match LintError.
 */
export interface Fix {
  readonly lineNumber: number;
  readonly editColumn: number;
  readonly deleteCount: number;
  readonly insertText: string;
}

export function makeFix(fields: Fix): Fix {
  if (fields.lineNumber < 1) throw new Error("Fix.lineNumber must be >= 1");
  if (fields.editColumn < 1) throw new Error("Fix.editColumn must be >= 1");
  if (fields.deleteCount < 0) throw new Error("Fix.deleteCount must be >= 0");
  return Object.freeze({ ...fields });
}
```

- [ ] **Re-export from `LintError.ts`** for backwards compatibility:

```ts
export type { Fix } from "./Fix.js";
```

- [ ] **Test** — invariant checks.

- [ ] **Commit**

```bash
git add src/domain/linting/Fix.ts src/domain/linting/LintError.ts tests/unit/domain/Fix.test.ts
git commit -m "refactor(domain): extract Fix to its own module"
```

---

### Task 2: FixPlan + FixConflict value objects

**Files:**
- Create: `src/domain/linting/FixPlan.ts`
- Create: `src/domain/linting/FixConflict.ts`
- Create: `tests/unit/domain/FixPlan.test.ts`

- [ ] **Implement `FixPlan.ts`**

```ts
import type { Fix } from "./Fix.js";

/** Ordered list of fixes for a single file. Immutable. */
export interface FixPlan {
  readonly filePath: string;
  readonly fixes: readonly Fix[];
}

export function makeFixPlan(filePath: string, fixes: readonly Fix[]): FixPlan {
  return Object.freeze({ filePath, fixes: Object.freeze([...fixes]) });
}
```

- [ ] **Implement `FixConflict.ts`**

```ts
import type { Fix } from "./Fix.js";

/** Two fixes whose ranges overlap on the same line. Immutable. */
export interface FixConflict {
  readonly filePath: string;
  readonly ruleA: string;
  readonly ruleB: string;
  readonly first: Fix;
  readonly second: Fix;
  readonly reason: string;
}
```

- [ ] **Test** — freeze + array defensive copy.

- [ ] **Commit**

```bash
git add src/domain/linting/FixPlan.ts src/domain/linting/FixConflict.ts tests/unit/domain/FixPlan.test.ts
git commit -m "feat(domain): add FixPlan and FixConflict value objects"
```

---

### Task 3: applyFixes — the core edit engine

**Files:**
- Create: `src/domain/fix/applyFixes.ts`
- Create: `tests/unit/fix/applyFixes.test.ts`

Sort fixes by `(lineNumber desc, editColumn desc)` and apply end-to-start so earlier positions stay valid. Two fixes are considered to conflict when they share the same line and their column ranges intersect; the second one is skipped and surfaced as a `FixConflict`.

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { applyFixes } from "../../../src/domain/fix/applyFixes.js";
import { makeFix } from "../../../src/domain/linting/Fix.js";

describe("applyFixes", () => {
  it("replaces a single-line span", () => {
    const out = applyFixes("Hello world", [
      makeFix({ lineNumber: 1, editColumn: 7, deleteCount: 5, insertText: "there" }),
    ]);
    expect(out.patched).toBe("Hello there");
    expect(out.conflicts).toEqual([]);
  });

  it("applies multiple non-overlapping fixes end-to-start", () => {
    const out = applyFixes("aaa bbb ccc", [
      makeFix({ lineNumber: 1, editColumn: 1, deleteCount: 3, insertText: "AAA" }),
      makeFix({ lineNumber: 1, editColumn: 9, deleteCount: 3, insertText: "CCC" }),
    ]);
    expect(out.patched).toBe("AAA bbb CCC");
  });

  it("skips overlapping fixes and records a conflict", () => {
    const out = applyFixes("hello world", [
      makeFix({ lineNumber: 1, editColumn: 1, deleteCount: 5, insertText: "hi" }),
      makeFix({ lineNumber: 1, editColumn: 3, deleteCount: 3, insertText: "XXX" }),
    ]);
    expect(out.patched).toBe("hi world");
    expect(out.conflicts).toHaveLength(1);
  });

  it("edits multi-line input by line number", () => {
    const input = "one\ntwo\nthree";
    const out = applyFixes(input, [
      makeFix({ lineNumber: 2, editColumn: 1, deleteCount: 3, insertText: "TWO" }),
    ]);
    expect(out.patched).toBe("one\nTWO\nthree");
  });
});
```

- [ ] **Implement `applyFixes.ts`**

```ts
import type { Fix } from "../linting/Fix.js";
import type { FixConflict } from "../linting/FixConflict.js";

export interface ApplyResult {
  readonly patched: string;
  readonly conflicts: readonly FixConflict[];
}

/**
 * Apply a list of fixes to raw text. Fixes are sorted last-to-first so
 * earlier positions remain valid. Overlapping fixes on the same line
 * produce FixConflict entries and are skipped after the first applies.
 */
export function applyFixes(raw: string, fixes: readonly Fix[]): ApplyResult {
  const lines = raw.split("\n");
  const conflicts: FixConflict[] = [];
  const byLine = new Map<number, Fix[]>();
  for (const fix of fixes) {
    const list = byLine.get(fix.lineNumber) ?? [];
    list.push(fix);
    byLine.set(fix.lineNumber, list);
  }

  for (const [lineNumber, list] of byLine.entries()) {
    const sorted = [...list].sort((a, b) => b.editColumn - a.editColumn);
    const accepted: Fix[] = [];
    for (const fix of sorted) {
      const overlaps = accepted.find((a) => rangesIntersect(a, fix));
      if (overlaps !== undefined) {
        conflicts.push({
          filePath: "",
          ruleA: "<fix>",
          ruleB: "<fix>",
          first: overlaps,
          second: fix,
          reason: `Overlap on line ${lineNumber}`,
        });
        continue;
      }
      accepted.push(fix);
      const lineIndex = lineNumber - 1;
      const line = lines[lineIndex] ?? "";
      const before = line.slice(0, fix.editColumn - 1);
      const after = line.slice(fix.editColumn - 1 + fix.deleteCount);
      lines[lineIndex] = before + fix.insertText + after;
    }
  }

  return { patched: lines.join("\n"), conflicts };
}

function rangesIntersect(a: Fix, b: Fix): boolean {
  const aStart = a.editColumn;
  const aEnd = a.editColumn + a.deleteCount;
  const bStart = b.editColumn;
  const bEnd = b.editColumn + b.deleteCount;
  return aStart < bEnd && bStart < aEnd;
}
```

- [ ] **Run + Commit**

```bash
git add src/domain/fix/applyFixes.ts tests/unit/fix/applyFixes.test.ts
git commit -m "feat(fix): add applyFixes with overlap detection"
```

---

### Task 4: FileWriter — atomic writes

**Files:**
- Create: `src/infrastructure/io/FileWriter.ts`
- Create: `tests/unit/io/FileWriter.test.ts`

- [ ] **Implement**

```ts
import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Atomically write `content` to `absolutePath`. Uses a sibling temp file
 * + rename so a crash mid-write never leaves a partially written file.
 */
export async function writeMarkdownFile(absolutePath: string, content: string): Promise<void> {
  const dir = path.dirname(absolutePath);
  const tmp = path.join(dir, `.${path.basename(absolutePath)}.tmp-${process.pid}-${Date.now()}`);
  await fs.writeFile(tmp, content, "utf8");
  await fs.rename(tmp, absolutePath);
}
```

- [ ] **Test** — round-trip write, assert file contents, assert temp file gone.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/io/FileWriter.ts tests/unit/io/FileWriter.test.ts
git commit -m "feat(io): add atomic FileWriter"
```

---

### Task 5: FixUseCase

**Files:**
- Create: `src/application/FixUseCase.ts`
- Create: `tests/unit/application/FixUseCase.test.ts`

- [ ] **Implement**

```ts
import type { LinterConfig } from "../domain/config/LinterConfig.js";
import type { LintResult } from "../domain/linting/LintResult.js";
import type { RuleRegistry } from "../domain/linting/RuleRegistry.js";
import type { LintDependencies } from "./LintUseCase.js";
import { runLint } from "./LintUseCase.js";
import { applyFixes } from "../domain/fix/applyFixes.js";
import type { Fix } from "../domain/linting/Fix.js";

export interface FixDependencies extends LintDependencies {
  readonly writeFile: (absolute: string, content: string) => Promise<void>;
}

export interface FixOutcome {
  readonly firstPass: readonly LintResult[];
  readonly finalPass: readonly LintResult[];
  readonly filesFixed: readonly string[];
}

/**
 * Run the linter, apply every fixable violation's fix, write the patched
 * files back, and return the results from a second pass.
 */
export async function runFix(
  filePaths: readonly string[],
  config: LinterConfig,
  registry: RuleRegistry,
  deps: FixDependencies,
): Promise<FixOutcome> {
  const firstPass = await runLint(filePaths, config, registry, deps);
  const fixed: string[] = [];

  for (const result of firstPass) {
    const fixes: Fix[] = [];
    for (const err of result.errors) {
      if (err.fix !== undefined) fixes.push(err.fix);
    }
    if (fixes.length === 0) continue;

    const raw = await deps.readFile(result.filePath);
    const { patched } = applyFixes(raw, fixes);
    if (patched !== raw) {
      await deps.writeFile(result.filePath, patched);
      fixed.push(result.filePath);
    }
  }

  const finalPass = await runLint(filePaths, config, registry, deps);
  return { firstPass, finalPass, filesFixed: fixed };
}
```

- [ ] **Test** with a stub parser, stub rule that emits a fix, stub writer capturing the patched content. Two runs: first emits the fix, second returns clean. Final `filesFixed` contains the single path.

- [ ] **Run + Commit**

```bash
git add src/application/FixUseCase.ts tests/unit/application/FixUseCase.test.ts
git commit -m "feat(application): add FixUseCase"
```

---

### Task 6: Extend OFMRule fix contract

**Files:**
- Modify: `src/domain/linting/OFMRule.ts`

The `onError` callback currently allows an optional `fix` field but only at the type level. Clarify that `fix` is required when `rule.fixable === true` and that the `editColumn` is interpreted relative to the *post-frontmatter body* line number, matching `ParseResult.lines`.

- [ ] **Update `OFMRule.ts` TSDoc** and add a runtime invariant check inside `LintUseCase.runRule`: if `rule.fixable && error.fix === undefined`, log an internal warning (but do not throw) once per process via a flag.

- [ ] **Commit**

```bash
git add src/domain/linting/OFMRule.ts src/application/LintUseCase.ts
git commit -m "docs(rules): clarify Fix contract for fixable rules"
```

---

### Task 7: Fixable OFM rules — emit Fix

Seven rules already advertise `fixable: true` but their implementations do not emit a Fix yet. Add the fix payload per rule. Each update is a small TDD cycle.

**Files:**
- Modify: `src/infrastructure/rules/ofm/frontmatter/OFM086-trailing-whitespace-in-string.ts`
- Modify: `src/infrastructure/rules/ofm/tags/OFM063-trailing-slash.ts`
- Modify: `src/infrastructure/rules/ofm/tags/OFM065-mixed-case-tag.ts`
- Modify: `src/infrastructure/rules/ofm/wikilinks/OFM005-case-mismatch.ts`
- Modify: `src/infrastructure/rules/ofm/callouts/OFM044-callout-fold-on-note.ts`
- Modify: `src/infrastructure/rules/ofm/highlights/OFM124-empty-highlight.ts`
- Modify: `src/infrastructure/rules/ofm/block-references/OFM104-block-id-format.ts`

For each, add an `expect(errors[0]?.fix).toBeDefined()` assertion and verify the patched output.

- [ ] **OFM063 trailing-slash** — delete the trailing `/` character.

```ts
onError({
  line: tag.position.line,
  column: tag.position.column,
  message: `Tag "${tag.raw}" has a trailing slash`,
  fix: {
    lineNumber: tag.position.line,
    editColumn: tag.position.column + tag.raw.length - 1,
    deleteCount: 1,
    insertText: "",
  },
});
```

- [ ] **OFM065 mixed-case-tag** — replace the tag text with the canonical casing.

- [ ] **OFM005 case-mismatch** — replace the wikilink target text with the canonical relative path.

- [ ] **OFM044 callout-fold-on-note** — strip the trailing `+`/`-` marker from the callout header.

- [ ] **OFM124 empty-highlight** — delete `====`.

- [ ] **OFM104 block-id-case** — lowercase the id in place.

- [ ] **OFM086 trailing-whitespace-in-string** — rstrip the string; edit happens inside frontmatter so `lineNumber` is 1-based on the file including frontmatter, with `editColumn` on the raw frontmatter line.

- [ ] **Update each rule's test file** to assert on the produced `fix` payload.

- [ ] **Run + Commit**

```bash
npm run test
git add src/infrastructure/rules/ofm/ tests/unit/rules/
git commit -m "feat(rules): emit Fix payload for all fixable OFM rules"
```

---

### Task 8: Propagate markdownlint fixInfo

**Files:**
- Modify: `src/infrastructure/rules/standard/StandardRuleAdapter.ts`
- Modify: `src/infrastructure/rules/standard/MarkdownLintAdapter.ts`

- [ ] **Update `StandardViolation`** to carry `fixInfo?: { lineNumber?: number; editColumn: number; deleteCount: number; insertText: string }`.

- [ ] **Translate in `StandardRuleAdapter`**

```ts
const fix = v.fixInfo
  ? {
      lineNumber: v.fixInfo.lineNumber ?? v.lineNumber,
      editColumn: v.fixInfo.editColumn,
      deleteCount: v.fixInfo.deleteCount,
      insertText: v.fixInfo.insertText,
    }
  : undefined;
onError({ line: v.lineNumber, column: v.errorRange?.[0] ?? 1, message, fix });
```

- [ ] **Test** with a synthetic markdownlint violation that includes `fixInfo`.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/standard/
git commit -m "feat(rules): propagate markdownlint fixInfo through StandardRuleAdapter"
```

---

### Task 9: `--fix` wiring in CLI

**Files:**
- Modify: `src/cli/args.ts`
- Modify: `src/cli/main.ts`

- [ ] **Update `main.ts`**

```ts
import { runFix } from "../application/FixUseCase.js";
import { writeMarkdownFile } from "../infrastructure/io/FileWriter.js";

if (opts.fix) {
  const outcome = await runFix(files, effectiveConfig, registry, {
    parser,
    readFile: readMarkdownFile,
    writeFile: writeMarkdownFile,
    vault,
    blockRefIndex,
    fsCheck,
  });
  const formatter = getFormatter(opts.outputFormatter);
  const output = formatter(outcome.finalPass);
  if (output) process.stdout.write(output + "\n");
  if (outcome.filesFixed.length > 0) {
    process.stderr.write(`Fixed ${outcome.filesFixed.length} file(s)\n`);
  }
  return outcome.finalPass.some((r) => r.hasErrors) ? 1 : 0;
}
```

- [ ] **Add `--fix-check` flag** (dry-run) to `args.ts`. When set, mount a writer that does not touch disk but still reports which files *would* change.

- [ ] **Run + Commit**

```bash
git add src/cli/
git commit -m "feat(cli): wire --fix and --fix-check"
```

---

### Task 10: Integration test — --fix round trip

**Files:**
- Create: `tests/integration/cli/fix.test.ts`

- [ ] **Write**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

let vault: string;
beforeEach(async () => {
  vault = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-fix-int-"));
  await fs.mkdir(path.join(vault, ".obsidian"), { recursive: true });
});
afterEach(async () => {
  await fs.rm(vault, { recursive: true, force: true });
});

describe("CLI --fix", () => {
  it("rewrites a file with a trailing-slash tag", async () => {
    const file = path.join(vault, "note.md");
    await fs.writeFile(file, "body #project/\n");
    const r = await spawnCli(["--fix", "**/*.md"], vault);
    expect(r.exitCode).toBe(0);
    expect(await fs.readFile(file, "utf8")).toBe("body #project\n");
  });

  it("dry-run --fix-check does not modify files", async () => {
    const file = path.join(vault, "note.md");
    await fs.writeFile(file, "body #project/\n");
    const r = await spawnCli(["--fix-check", "**/*.md"], vault);
    expect(r.exitCode).toBe(1); // still fails because nothing was fixed
    expect(await fs.readFile(file, "utf8")).toBe("body #project/\n");
  });
});
```

- [ ] **Run + Commit**

```bash
npm run test -- tests/integration/cli/fix.test.ts
git add tests/integration/cli/fix.test.ts
git commit -m "test(cli): --fix and --fix-check round-trip integration"
```

---

### Task 11: Guide — autofix

**Files:**
- Create: `docs/guides/autofix.md`
- Modify: `docs/rules/index.md`

- [ ] **Write `autofix.md`** — table of fixable rules, `--fix` vs `--fix-check`, conflict semantics, example before/after snippets.

- [ ] **Update rule index** to show the fixable column.

- [ ] **Commit**

```bash
git add docs/guides/autofix.md docs/rules/index.md
git commit -m "docs(guides): autofix walkthrough"
```

---

### Task 12: Phase 9 verification

- [ ] **Full run** `npm run test:all`

- [ ] **Coverage** — `src/domain/fix/` ≥ 95%, `src/application/FixUseCase.ts` ≥ 90%.

- [ ] **Manual**

```bash
echo "body #project/" > /tmp/fix-me.md
node bin/markdownlint-obsidian.js --fix /tmp/fix-me.md
cat /tmp/fix-me.md
```

Expected: `body #project`.

- [ ] **Final commit**

```bash
git add -A
git commit -m "chore: Phase 9 complete — autofix engine and --fix/--fix-check"
```

---

## Phase 9 acceptance criteria

- `applyFixes` applies non-overlapping fixes end-to-start and records conflicts.
- `FixUseCase` runs lint → fix → re-lint and returns both passes plus the list of modified files.
- Every rule with `fixable: true` emits a valid `Fix` payload.
- `--fix` and `--fix-check` are wired through the CLI with integration coverage.
- `docs/guides/autofix.md` documents the feature and the conflict semantics.
- Coverage targets met.
