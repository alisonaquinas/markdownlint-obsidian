# Phase 6: Block References + Highlights + Comments — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the block-reference rule family OFM100–OFM109 and the highlight/comment rule family OFM120–OFM129. Strengthen the Phase 4 placeholder rule OFM007 so block references now validate against a cross-file `BlockRefIndex`. Introduce a per-vault block-id index that `VaultBootstrap` builds alongside the file index, so rules can check `[[page#^blockid]]` targets without re-parsing every file in each rule.

**Architecture:** A new domain service `BlockRefIndex` holds `Map<VaultPath.relative, Set<blockId>>`. It is built during `VaultBootstrap` by parsing every `.md` file once (reusing the Phase 2 parser) and collecting its `parsed.blockRefs`. `RuleParams` gains `blockRefIndex: BlockRefIndex | null` (null when `resolve: false`). Highlight rules are config-driven — `config.highlights` lets teams ban `==highlight==` entirely, or restrict it to specific file globs. Comments work the same with `config.comments`.

**Tech Stack:** Phase 5 stack. No new runtime deps.

---

## File Map

```
src/
  domain/
    vault/
      BlockRefIndex.ts                             Domain service: has(pageRel, blockId)
    config/
      LinterConfig.ts                              UPDATED: HighlightConfig, CommentConfig, BlockRefConfig
    linting/
      OFMRule.ts                                   UPDATED: RuleParams gains blockRefIndex
  application/
    VaultBootstrap.ts                              UPDATED: build BlockRefIndex alongside FileIndex
  infrastructure/
    vault/
      FileIndexBuilder.ts                          UPDATED: return { files, blockRefs }
      BlockRefIndexBuilder.ts                      Scan each file for blockRefs
    rules/ofm/
      block-references/
        OFM100-invalid-block-ref.ts
        OFM101-duplicate-block-id.ts
        OFM102-broken-block-link.ts
        OFM103-block-ref-on-heading.ts
        OFM104-block-id-format.ts
      highlights/
        OFM120-disallowed-highlight.ts
        OFM121-disallowed-comment.ts
        OFM122-malformed-highlight.ts
        OFM123-nested-highlight.ts
        OFM124-empty-highlight.ts
tests/
  unit/
    domain/vault/BlockRefIndex.test.ts
    infrastructure/vault/BlockRefIndexBuilder.test.ts
    rules/block-references/OFM100.test.ts ... OFM104.test.ts
    rules/highlights/OFM120.test.ts ... OFM124.test.ts
  integration/rules/
    block-refs-integration.test.ts
    highlights-integration.test.ts
  fixtures/rules/
    block-refs/page-with-refs.md, page-with-dup.md, consumer.md
    highlights/allowed.md, disallowed.md
docs/
  rules/
    block-references/OFM100.md ... OFM104.md
    highlights/OFM120.md ... OFM124.md
  bdd/features/
    block-references.feature                       New
    highlights.feature                              New
```

---

### Task 1: BlockRefIndex domain service

**Files:**
- Create: `src/domain/vault/BlockRefIndex.ts`
- Create: `tests/unit/domain/vault/BlockRefIndex.test.ts`

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { makeBlockRefIndex } from "../../../../src/domain/vault/BlockRefIndex.js";

describe("BlockRefIndex", () => {
  const idx = makeBlockRefIndex(
    new Map([
      ["notes/a.md", new Set(["intro", "summary"])],
      ["notes/b.md", new Set(["top"])],
    ]),
  );

  it("finds a known blockId on a known page", () => {
    expect(idx.has("notes/a", "intro")).toBe(true);
  });

  it("tolerates .md suffix on target", () => {
    expect(idx.has("notes/a.md", "intro")).toBe(true);
  });

  it("reports missing id on known page", () => {
    expect(idx.has("notes/a", "missing")).toBe(false);
  });

  it("reports any id on unknown page", () => {
    expect(idx.has("notes/unknown", "intro")).toBe(false);
  });

  it("enumerates duplicates per page", () => {
    const dupIdx = makeBlockRefIndex(
      new Map([["x.md", new Set(["id1", "id2"])]]),
      new Map([["x.md", ["id1", "id1", "id2"]]]),
    );
    expect(dupIdx.duplicatesIn("x.md")).toEqual(["id1"]);
  });
});
```

- [ ] **Implement `BlockRefIndex.ts`**

```ts
/**
 * Per-vault index of block-reference ids. Built once per LintRun.
 */
export interface BlockRefIndex {
  has(pageRelative: string, blockId: string): boolean;
  duplicatesIn(pageRelative: string): readonly string[];
  all(): ReadonlyMap<string, ReadonlySet<string>>;
}

/**
 * @param unique - map from vault-relative .md path to the set of unique blockIds
 * @param raw    - optional map from path to raw (possibly-duplicate) list for
 *                 duplicate detection via OFM101
 */
export function makeBlockRefIndex(
  unique: ReadonlyMap<string, ReadonlySet<string>>,
  raw: ReadonlyMap<string, readonly string[]> = new Map(),
): BlockRefIndex {
  const duplicatesByPage = new Map<string, string[]>();
  for (const [page, list] of raw.entries()) {
    const seen = new Set<string>();
    const dups = new Set<string>();
    for (const id of list) {
      if (seen.has(id)) dups.add(id);
      seen.add(id);
    }
    if (dups.size > 0) duplicatesByPage.set(page, [...dups]);
  }

  const normalize = (p: string): string => p.replace(/\.md$/, "") + ".md";

  return {
    has(pageRelative, blockId) {
      const page = normalize(pageRelative);
      return unique.get(page)?.has(blockId) ?? false;
    },
    duplicatesIn(pageRelative) {
      const page = normalize(pageRelative);
      return duplicatesByPage.get(page) ?? [];
    },
    all() {
      return unique;
    },
  };
}
```

- [ ] **Run + Commit**

```bash
git add src/domain/vault/BlockRefIndex.ts tests/unit/domain/vault/BlockRefIndex.test.ts
git commit -m "feat(vault): add BlockRefIndex domain service"
```

---

### Task 2: BlockRefIndexBuilder

**Files:**
- Create: `src/infrastructure/vault/BlockRefIndexBuilder.ts`
- Create: `tests/unit/infrastructure/vault/BlockRefIndexBuilder.test.ts`

- [ ] **Implement**

```ts
import type { Parser } from "../../domain/parsing/Parser.js";
import type { VaultPath } from "../../domain/vault/VaultPath.js";
import { makeBlockRefIndex, type BlockRefIndex } from "../../domain/vault/BlockRefIndex.js";

export interface BlockRefBuildDeps {
  readonly parser: Parser;
  readonly readFile: (absolute: string) => Promise<string>;
}

/**
 * Build a BlockRefIndex by parsing every file in the vault and collecting
 * its blockRefs. Parse failures are silently skipped — OFM902 has already
 * surfaced them during the normal lint pass.
 */
export async function buildBlockRefIndex(
  files: readonly VaultPath[],
  deps: BlockRefBuildDeps,
): Promise<BlockRefIndex> {
  const unique = new Map<string, Set<string>>();
  const raw = new Map<string, string[]>();

  for (const file of files) {
    let parsed;
    try {
      const source = await deps.readFile(file.absolute);
      parsed = deps.parser.parse(file.relative, source);
    } catch {
      continue;
    }
    const rawList: string[] = [];
    const seen = new Set<string>();
    for (const ref of parsed.blockRefs) {
      rawList.push(ref.blockId);
      seen.add(ref.blockId);
    }
    unique.set(file.relative, seen);
    raw.set(file.relative, rawList);
  }

  return makeBlockRefIndex(unique, raw);
}
```

- [ ] **Test** — spin up temp vault with two files: `a.md` containing `^one` and `b.md` containing `^one` twice. Confirm `has("a","one") === true`, `duplicatesIn("b.md") === ["one"]`.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/vault/BlockRefIndexBuilder.ts \
        tests/unit/infrastructure/vault/BlockRefIndexBuilder.test.ts
git commit -m "feat(vault): add BlockRefIndexBuilder"
```

---

### Task 3: Update VaultBootstrap to produce BlockRefIndex

**Files:**
- Modify: `src/application/VaultBootstrap.ts`
- Modify: `src/cli/main.ts`
- Modify: `tests/unit/application/VaultBootstrap.test.ts`

- [ ] **Return `{ vault, blockRefs }` from `bootstrapVault`**

```ts
export interface BootstrapResult {
  readonly vault: VaultIndex;
  readonly blockRefs: BlockRefIndex;
}

export async function bootstrapVault(
  startDir: string,
  config: LinterConfig,
  deps: BootstrapDeps,
): Promise<BootstrapResult | null> {
  if (!config.resolve) return null;
  // ...detect + buildIndex...
  const vault = await deps.buildIndex(root, { caseSensitive: config.wikilinks.caseSensitive });
  const blockRefs = await deps.buildBlockRefIndex(vault.all());
  return { vault, blockRefs };
}
```

- [ ] **Extend `BootstrapDeps`** with `buildBlockRefIndex`. Wire in `cli/main.ts` using a bound closure that supplies the shared parser + reader.

- [ ] **Update `LintUseCase` deps** to accept `blockRefIndex: BlockRefIndex | null`.

- [ ] **Update `RuleParams` in `OFMRule.ts`** to include `readonly blockRefIndex: BlockRefIndex | null`.

- [ ] **Update `runRuleOnSource`** with an optional fifth/sixth argument for `blockRefIndex`. Default `null`.

- [ ] **Run — expect previous tests still pass**

- [ ] **Commit**

```bash
git add src/application/VaultBootstrap.ts src/cli/main.ts \
        src/domain/linting/OFMRule.ts tests/unit/application/VaultBootstrap.test.ts \
        tests/unit/rules/helpers/runRuleOnSource.ts
git commit -m "feat(vault): bootstrap BlockRefIndex and thread into rules"
```

---

### Task 4: BlockRef + Highlight + Comment config

**Files:**
- Modify: `src/domain/config/LinterConfig.ts`
- Modify: `src/infrastructure/config/defaults.ts`
- Modify: `src/infrastructure/config/ConfigValidator.ts`

- [ ] **Add types**

```ts
export interface BlockRefConfig {
  readonly idPattern: string;      // regex string; default "^[A-Za-z0-9-]{1,32}$"
  readonly requireUnique: boolean;
}

export interface HighlightConfig {
  readonly allow: boolean;
  readonly allowedGlobs: readonly string[];  // subset where highlights are allowed; [] = everywhere
}

export interface CommentConfig {
  readonly allow: boolean;
  readonly disallowMultiline: boolean;
}
```

- [ ] **Defaults**

```ts
blockRefs: Object.freeze({
  idPattern: "^[A-Za-z0-9-]{1,32}$",
  requireUnique: true,
}),
highlights: Object.freeze({
  allow: true,
  allowedGlobs: Object.freeze([]),
}),
comments: Object.freeze({
  allow: true,
  disallowMultiline: false,
}),
```

- [ ] **Extend `KNOWN_KEYS`**

- [ ] **Write tests** for new defaults.

- [ ] **Run + Commit**

```bash
git add src/domain/config/LinterConfig.ts src/infrastructure/config/ \
        tests/unit/config/
git commit -m "feat(config): add BlockRef/Highlight/Comment config"
```

---

### Task 5: OFM100 — invalid-block-ref

**Files:**
- Create: `src/infrastructure/rules/ofm/block-references/OFM100-invalid-block-ref.ts`
- Create: `tests/unit/rules/block-references/OFM100.test.ts`

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM100Rule: OFMRule = {
  names: ["OFM100", "invalid-block-ref"],
  description: "Block reference id does not match the configured pattern",
  tags: ["block-references"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    const pattern = new RegExp(config.blockRefs.idPattern);
    for (const ref of parsed.blockRefs) {
      if (!pattern.test(ref.blockId)) {
        onError({
          line: ref.position.line,
          column: ref.position.column,
          message: `Block reference "^${ref.blockId}" does not match pattern ${config.blockRefs.idPattern}`,
        });
      }
    }
  },
};
```

- [ ] **Test** — pattern `^[a-z-]+$`; valid `^abc`, invalid `^ABC1`.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/block-references/OFM100-invalid-block-ref.ts \
        tests/unit/rules/block-references/OFM100.test.ts
git commit -m "feat(rules): OFM100 invalid-block-ref"
```

---

### Task 6: OFM101 — duplicate-block-id

**Files:**
- Create: `src/infrastructure/rules/ofm/block-references/OFM101-duplicate-block-id.ts`
- Create: `tests/unit/rules/block-references/OFM101.test.ts`

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM101Rule: OFMRule = {
  names: ["OFM101", "duplicate-block-id"],
  description: "Same block id declared twice in the same file",
  tags: ["block-references"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    if (!config.blockRefs.requireUnique) return;
    const seen = new Map<string, { line: number; column: number }>();
    for (const ref of parsed.blockRefs) {
      const prior = seen.get(ref.blockId);
      if (prior !== undefined) {
        onError({
          line: ref.position.line,
          column: ref.position.column,
          message: `Duplicate block id "^${ref.blockId}" (first on line ${prior.line})`,
        });
      } else {
        seen.set(ref.blockId, { line: ref.position.line, column: ref.position.column });
      }
    }
  },
};
```

- [ ] **Test** with a source containing `^dup` twice.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/block-references/OFM101-duplicate-block-id.ts \
        tests/unit/rules/block-references/OFM101.test.ts
git commit -m "feat(rules): OFM101 duplicate-block-id"
```

---

### Task 7: OFM102 — broken-block-link (cross-file)

**Files:**
- Create: `src/infrastructure/rules/ofm/block-references/OFM102-broken-block-link.ts`
- Create: `tests/unit/rules/block-references/OFM102.test.ts`

Uses `blockRefIndex` to verify `[[page#^blockid]]` targets an existing id in the target file. Supersedes Phase 4's OFM007 placeholder for same-file checks.

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM102Rule: OFMRule = {
  names: ["OFM102", "broken-block-link"],
  description: "Wikilink block reference targets a missing block id",
  tags: ["block-references", "wikilinks"],
  severity: "error",
  fixable: false,
  run({ parsed, vault, blockRefIndex }, onError) {
    if (vault === null || blockRefIndex === null) return;
    for (const link of parsed.wikilinks) {
      if (link.blockRef === null) continue;
      const match = vault.resolve(link);
      if (match.kind !== "resolved") continue;
      if (!blockRefIndex.has(match.path.relative, link.blockRef)) {
        onError({
          line: link.position.line,
          column: link.position.column,
          message: `Block link "[[${link.target}#^${link.blockRef}]]" targets unknown block id`,
        });
      }
    }
  },
};
```

- [ ] **Test** — stub vault and blockRefIndex with one known id; exercise resolved/missing.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/block-references/OFM102-broken-block-link.ts \
        tests/unit/rules/block-references/OFM102.test.ts
git commit -m "feat(rules): OFM102 broken-block-link"
```

---

### Task 8: OFM103 — block-ref-on-heading / OFM104 — block-id-format

**Files:**
- Create: `src/infrastructure/rules/ofm/block-references/OFM103-block-ref-on-heading.ts`
- Create: `src/infrastructure/rules/ofm/block-references/OFM104-block-id-format.ts`
- Create: matching test files

- [ ] **OFM103 block-ref-on-heading** — warn when `^blockid` appears on a line that starts with `#` (headings cannot carry block ids in OFM).

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM103Rule: OFMRule = {
  names: ["OFM103", "block-ref-on-heading"],
  description: "Block reference attached to a heading line",
  tags: ["block-references"],
  severity: "warning",
  fixable: false,
  run({ parsed }, onError) {
    for (const ref of parsed.blockRefs) {
      const line = parsed.lines[ref.position.line - 1] ?? "";
      if (/^#{1,6}\s/.test(line)) {
        onError({
          line: ref.position.line,
          column: ref.position.column,
          message: "Block reference cannot be attached to a heading line",
        });
      }
    }
  },
};
```

- [ ] **OFM104 block-id-format** — warning-level style: block ids should be lowercase.

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM104Rule: OFMRule = {
  names: ["OFM104", "block-id-case"],
  description: "Block id contains uppercase letters",
  tags: ["block-references", "style"],
  severity: "warning",
  fixable: true,
  run({ parsed }, onError) {
    for (const ref of parsed.blockRefs) {
      if (ref.blockId !== ref.blockId.toLowerCase()) {
        onError({
          line: ref.position.line,
          column: ref.position.column,
          message: `Block id "^${ref.blockId}" should be lowercase`,
        });
      }
    }
  },
};
```

- [ ] **Write tests** for both rules.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/block-references/OFM10[34]-*.ts \
        tests/unit/rules/block-references/OFM10[34].test.ts
git commit -m "feat(rules): OFM103 block-ref-on-heading and OFM104 block-id-case"
```

---

### Task 9: OFM120 — disallowed-highlight

**Files:**
- Create: `src/infrastructure/rules/ofm/highlights/OFM120-disallowed-highlight.ts`
- Create: `tests/unit/rules/highlights/OFM120.test.ts`

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { minimatch } from "minimatch";

export const OFM120Rule: OFMRule = {
  names: ["OFM120", "disallowed-highlight"],
  description: "Highlight `==text==` is disabled by config in this file",
  tags: ["highlights"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    if (config.highlights.allow) {
      if (config.highlights.allowedGlobs.length === 0) return;
      const allowedHere = config.highlights.allowedGlobs.some((g) => minimatch(parsed.filePath, g));
      if (allowedHere) return;
    }
    for (const h of parsed.highlights) {
      onError({
        line: h.position.line,
        column: h.position.column,
        message: "Highlight `==...==` is disallowed by config",
      });
    }
  },
};
```

Adds a new runtime dep `minimatch`. Install it with `npm install minimatch` (and `@types/minimatch` via devDependencies if not bundled).

- [ ] **Test** with `highlights: { allow: false, allowedGlobs: [] }` and a source containing `==x==`.

- [ ] **Run + Commit**

```bash
npm install minimatch
git add package.json package-lock.json \
        src/infrastructure/rules/ofm/highlights/OFM120-disallowed-highlight.ts \
        tests/unit/rules/highlights/OFM120.test.ts
git commit -m "feat(rules): OFM120 disallowed-highlight"
```

---

### Task 10: OFM121 — disallowed-comment

**Files:**
- Create: `src/infrastructure/rules/ofm/highlights/OFM121-disallowed-comment.ts`
- Create: `tests/unit/rules/highlights/OFM121.test.ts`

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM121Rule: OFMRule = {
  names: ["OFM121", "disallowed-comment"],
  description: "Obsidian comment `%%...%%` is disabled by config",
  tags: ["comments"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    if (config.comments.allow && !config.comments.disallowMultiline) return;
    for (const c of parsed.comments) {
      const isMultiline = c.position.line !== c.endPosition.line;
      if (!config.comments.allow) {
        onError({
          line: c.position.line,
          column: c.position.column,
          message: "Obsidian comment `%%...%%` is disallowed",
        });
        continue;
      }
      if (isMultiline && config.comments.disallowMultiline) {
        onError({
          line: c.position.line,
          column: c.position.column,
          message: "Multi-line `%%...%%` comments are disallowed",
        });
      }
    }
  },
};
```

- [ ] **Test** — 3 rows: single-line allowed, multi-line disallowed when flag set, all disallowed when `allow: false`.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/highlights/OFM121-disallowed-comment.ts \
        tests/unit/rules/highlights/OFM121.test.ts
git commit -m "feat(rules): OFM121 disallowed-comment"
```

---

### Task 11: OFM122 — malformed-highlight / OFM123 — nested-highlight / OFM124 — empty-highlight

**Files:**
- Create: three rule files + three test files under `src/infrastructure/rules/ofm/highlights/` and `tests/unit/rules/highlights/`

- [ ] **OFM122 malformed-highlight** — detects unmatched `==` on a line (odd count).

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM122Rule: OFMRule = {
  names: ["OFM122", "malformed-highlight"],
  description: "Unmatched `==` markers on a single line",
  tags: ["highlights", "syntax"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    parsed.lines.forEach((line, i) => {
      const markers = line.match(/==/g);
      if (markers !== null && markers.length % 2 !== 0) {
        onError({
          line: i + 1,
          column: 1,
          message: `Unmatched '==' on line (count ${markers.length})`,
        });
      }
    });
  },
};
```

- [ ] **OFM123 nested-highlight** — detects `==a ==b== c==` patterns.

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

const NESTED = /==[^=\n]*==[^=\n]*==/;

export const OFM123Rule: OFMRule = {
  names: ["OFM123", "nested-highlight"],
  description: "Highlights cannot be nested",
  tags: ["highlights", "syntax"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    parsed.lines.forEach((line, i) => {
      if (NESTED.test(line)) {
        onError({ line: i + 1, column: 1, message: "Nested highlight detected" });
      }
    });
  },
};
```

- [ ] **OFM124 empty-highlight**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM124Rule: OFMRule = {
  names: ["OFM124", "empty-highlight"],
  description: "Highlight contains no text",
  tags: ["highlights"],
  severity: "warning",
  fixable: true,
  run({ parsed }, onError) {
    for (const h of parsed.highlights) {
      if (h.text.trim().length === 0) {
        onError({
          line: h.position.line,
          column: h.position.column,
          message: "Empty highlight `====`",
        });
      }
    }
  },
};
```

- [ ] **Write tests** for the three.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/highlights/OFM12[234]-*.ts \
        tests/unit/rules/highlights/OFM12[234].test.ts
git commit -m "feat(rules): OFM122 malformed, OFM123 nested, OFM124 empty highlight"
```

---

### Task 12: Register block-ref + highlight rules

**Files:**
- Modify: `src/infrastructure/rules/ofm/registerBuiltin.ts`

- [ ] **Append imports for OFM100–104 and OFM120–124**. Extend `ALL`. Defaults: OFM103 and OFM104 warning; OFM120 and OFM121 enabled only when the corresponding config flips `allow: false`.

- [ ] **Run full suite + Commit**

```bash
npm run test
git add src/infrastructure/rules/ofm/registerBuiltin.ts
git commit -m "feat(rules): register Phase 6 block-ref and highlight rules"
```

---

### Task 13: Retire OFM007 placeholder

**Files:**
- Modify: `src/infrastructure/rules/ofm/wikilinks/OFM007-block-ref-in-body.ts`

OFM102 now owns cross-file block-reference validation. Keep OFM007 as a deprecated alias that simply points at the same implementation so existing configs do not break.

- [ ] **Update `OFM007-block-ref-in-body.ts`** to re-export `OFM102Rule`'s behaviour under the old name, or delete it and add a config migration note to `docs/guides/configuration.md`.

Recommended: keep the file but mark it deprecated and delegate to OFM102.

```ts
import { OFM102Rule } from "../block-references/OFM102-broken-block-link.js";

/** @deprecated Superseded by OFM102 in Phase 6. Alias retained for back-compat. */
export const OFM007Rule = {
  ...OFM102Rule,
  names: ["OFM007", "wikilink-block-ref"] as const,
};
```

- [ ] **Update tests** — OFM007 tests become smoke checks that the alias still resolves.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/wikilinks/OFM007-block-ref-in-body.ts \
        tests/unit/rules/wikilinks/OFM007.test.ts
git commit -m "refactor(rules): retire OFM007 in favour of OFM102 alias"
```

---

### Task 14: Integration tests

**Files:**
- Create: `tests/integration/rules/block-refs-integration.test.ts`
- Create: `tests/integration/rules/highlights-integration.test.ts`

- [ ] **block-refs-integration** — three scenarios: valid `[[a#^one]]`, missing id → OFM102, duplicate id in same file → OFM101.

- [ ] **highlights-integration** — two scenarios: default (allowed) passes, `allow: false` reports OFM120.

- [ ] **Run + Commit**

```bash
npm run test -- tests/integration/rules/block-refs-integration.test.ts tests/integration/rules/highlights-integration.test.ts
git add tests/integration/rules
git commit -m "test(rules): Phase 6 integration tests"
```

---

### Task 15: BDD features

**Files:**
- Create: `docs/bdd/features/block-references.feature`
- Create: `docs/bdd/features/highlights.feature`

- [ ] **block-references.feature**

```gherkin
Feature: Block reference linting

  Scenario: Broken block link reports OFM102
    Given a vault with a file "notes/a.md" containing:
      """
      # A

      Paragraph ^one
      """
    And a file "notes/b.md" containing "See [[a#^missing]]"
    When I run markdownlint-obsidian on "notes/b.md"
    Then the exit code is 1
    And error OFM102 is reported on line 1

  Scenario: Duplicate block id reports OFM101
    Given a file "notes/dup.md" containing:
      """
      first ^same

      second ^same
      """
    When I run markdownlint-obsidian on "notes/dup.md"
    Then the exit code is 1
    And error OFM101 is reported

  Scenario: Valid block reference passes
    Given a vault with a file "notes/a.md" containing:
      """
      Paragraph ^one
      """
    And a file "notes/b.md" containing "See [[a#^one]]"
    When I run markdownlint-obsidian on "notes/b.md"
    Then the exit code is 0
```

- [ ] **highlights.feature**

```gherkin
Feature: Highlight linting

  Scenario: Default allows highlights
    Given a file "notes/x.md" containing "== highlighted =="
    When I run markdownlint-obsidian on "notes/x.md"
    Then the exit code is 0

  Scenario: Config can disallow highlights
    Given a config file disabling highlights
    And a file "notes/x.md" containing "==nope=="
    When I run markdownlint-obsidian on "notes/x.md"
    Then the exit code is 1
    And error OFM120 is reported on line 1
```

- [ ] **Add new step** to `docs/bdd/steps/file-steps.ts`

```ts
Given("a config file disabling highlights", async function (this: OFMWorld) {
  if (!this.vaultDir) await this.initVault();
  await this.writeFile(
    ".obsidian-linter.jsonc",
    JSON.stringify({ highlights: { allow: false, allowedGlobs: [] } }),
  );
});
```

- [ ] **Run**

```bash
npm run test:bdd -- docs/bdd/features/block-references.feature docs/bdd/features/highlights.feature
```

- [ ] **Commit**

```bash
git add docs/bdd/features/ docs/bdd/steps/file-steps.ts
git commit -m "feat(bdd): add block-references and highlights features"
```

---

### Task 16: Rule documentation pages

**Files:**
- Create: `docs/rules/block-references/OFM100.md` ... `OFM104.md`
- Create: `docs/rules/highlights/OFM120.md` ... `OFM124.md`
- Modify: `docs/rules/index.md`

- [ ] **Write all pages** following the Phase 3 template.

- [ ] **Dogfood** and fix fresh violations.

- [ ] **Commit**

```bash
git add docs/rules
git commit -m "docs(rules): Phase 6 catalog pages"
```

---

### Task 17: Phase 6 verification

- [ ] **Full run** `npm run test:all`

- [ ] **Coverage** — all new layers ≥ 85%.

- [ ] **Final commit**

```bash
git add -A
git commit -m "chore: Phase 6 complete — block-refs OFM100-104 and highlights OFM120-124"
```

---

## Phase 6 acceptance criteria

- `BlockRefIndex` is built once per LintRun during VaultBootstrap.
- 10 new rules (OFM100–OFM104, OFM120–OFM124) registered.
- OFM007 retained as a deprecated alias delegating to OFM102.
- `block-references.feature` and `highlights.feature` both green.
- `config.highlights` and `config.comments` can fully disable `==...==` / `%%...%%` per file glob.
- Coverage targets met on all new layers.
