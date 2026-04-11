# Phase 4: Wikilinks + Vault Resolution — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Vault bounded context — `VaultPath`, `VaultIndex`, `VaultDetector`, `FileIndexBuilder`, `VaultBootstrap` — and ship the wikilink rule family OFM001–OFM007 on top of it. Wire `--vault-root` and `--no-resolve` CLI flags. Turn the existing `docs/bdd/features/wikilinks.feature` and `docs/bdd/features/vault-detection.feature` green. Exit with `OFM900` when no vault root can be determined.

**Architecture:** Vault is a new bounded context (`src/domain/vault/`). `VaultIndex` is a domain service that answers `resolve(WikilinkNode) → VaultPath | null`. Wikilink rules depend on `VaultIndex` via `RuleParams.vault`, which is injected by `LintUseCase`. Vault bootstrap runs exactly once per `LintRun` (not per file) via a new application use case. Config gains `vaultRoot` override and the `--no-resolve` shortcut.

**Tech Stack:** Phase 3 stack. No new runtime deps.

---

## File Map

```
src/
  domain/
    vault/
      VaultPath.ts                                 VO: { relative, absolute, stem }
      VaultIndex.ts                                Interface: resolve + all + has
      VaultDetector.ts                             Interface: detect(startDir) -> VaultRoot
      VaultRoot.ts                                 Branded string VO
      ResolutionStrategy.ts                        Enum: "exact" | "ci" | "basename"
      WikilinkMatcher.ts                           Domain service: normalise + match
    linting/
      OFMRule.ts                                   UPDATED: RuleParams gains `vault: VaultIndex | null`
  application/
    VaultBootstrap.ts                              Use case: config + startDir -> VaultIndex
    LintUseCase.ts                                 UPDATED: accept vaultIndex in deps
  infrastructure/
    vault/
      NodeFsVaultDetector.ts                       Walk up for .obsidian/, fall back to git root
      FileIndexBuilder.ts                          Scan vault for .md files -> VaultIndex impl
      GitRootFinder.ts                             Walk up for .git/
    rules/ofm/wikilinks/
      OFM001-broken-wikilink.ts
      OFM002-invalid-wikilink-format.ts
      OFM003-self-link.ts
      OFM004-ambiguous-target.ts
      OFM005-case-mismatch.ts
      OFM006-empty-heading.ts
      OFM007-block-ref-in-body.ts
    cli/
      args.ts                                      UPDATED: --vault-root + --no-resolve wiring
      main.ts                                      UPDATED: call VaultBootstrap before lint
tests/
  unit/
    domain/vault/
      VaultPath.test.ts
      WikilinkMatcher.test.ts
    infrastructure/vault/
      NodeFsVaultDetector.test.ts
      FileIndexBuilder.test.ts
      GitRootFinder.test.ts
    application/
      VaultBootstrap.test.ts
    rules/wikilinks/
      OFM001.test.ts ... OFM007.test.ts
  integration/
    rules/
      wikilinks-integration.test.ts
      vault-detection-integration.test.ts
  fixtures/
    vaults/
      basic-vault/                                 Synthetic vault with .obsidian/
      no-vault/                                    No .obsidian/, no .git
      git-fallback/                                With .git/, no .obsidian/
docs/
  rules/wikilinks/OFM001.md ... OFM007.md
  bdd/features/
    wikilinks.feature                              Becomes green in Task 19
    vault-detection.feature                        Becomes green in Task 19
```

---

### Task 1: VaultPath value object

**Files:**
- Create: `src/domain/vault/VaultPath.ts`
- Create: `tests/unit/domain/vault/VaultPath.test.ts`

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { makeVaultPath } from "../../../../src/domain/vault/VaultPath.js";

describe("VaultPath", () => {
  it("computes relative, absolute, and stem", () => {
    const p = makeVaultPath("/vault", "/vault/notes/index.md");
    expect(p.relative).toBe("notes/index.md");
    expect(p.absolute).toBe("/vault/notes/index.md");
    expect(p.stem).toBe("index");
  });

  it("throws if file is outside vault", () => {
    expect(() => makeVaultPath("/vault", "/other/x.md")).toThrow(/outside/);
  });

  it("normalizes backslashes to forward slashes in relative form", () => {
    const p = makeVaultPath("C:\\vault", "C:\\vault\\notes\\index.md");
    expect(p.relative).toBe("notes/index.md");
  });
});
```

- [ ] **Implement `VaultPath.ts`**

```ts
import * as path from "node:path";

export interface VaultPath {
  readonly relative: string;
  readonly absolute: string;
  readonly stem: string;
}

export function makeVaultPath(vaultRoot: string, absolute: string): VaultPath {
  const normalizedRoot = path.resolve(vaultRoot);
  const normalizedAbs = path.resolve(absolute);
  const rel = path.relative(normalizedRoot, normalizedAbs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`VaultPath: "${absolute}" is outside vault root "${vaultRoot}"`);
  }
  const forward = rel.split(path.sep).join("/");
  return Object.freeze({
    relative: forward,
    absolute: normalizedAbs,
    stem: path.basename(forward, path.extname(forward)),
  });
}
```

- [ ] **Run + Commit**

```bash
git add src/domain/vault/VaultPath.ts tests/unit/domain/vault/VaultPath.test.ts
git commit -m "feat(vault): add VaultPath value object"
```

---

### Task 2: VaultRoot branded type

**Files:**
- Create: `src/domain/vault/VaultRoot.ts`

- [ ] **Implement**

```ts
import * as path from "node:path";

/** Nominal type over `string` that signals "this has been validated as a vault root". */
export type VaultRoot = string & { readonly __brand: "VaultRoot" };

export function toVaultRoot(absoluteDir: string): VaultRoot {
  const normalized = path.resolve(absoluteDir);
  return normalized as VaultRoot;
}
```

- [ ] **Commit**

```bash
git add src/domain/vault/VaultRoot.ts
git commit -m "feat(vault): add branded VaultRoot type"
```

---

### Task 3: WikilinkMatcher — normalisation + resolution logic

**Files:**
- Create: `src/domain/vault/WikilinkMatcher.ts`
- Create: `tests/unit/domain/vault/WikilinkMatcher.test.ts`

Obsidian's own resolution algorithm, implemented as a pure function:

1. **Exact path match** against `relative` — `"notes/index"` ↔ `"notes/index.md"`.
2. **Case-insensitive** match on step 1.
3. **Basename-only** match — `"index"` resolves to the unique `.md` file whose `stem === "index"`. If multiple files share a stem, resolution is ambiguous and the matcher returns `"ambiguous"`.

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { matchWikilink } from "../../../../src/domain/vault/WikilinkMatcher.js";
import { makeVaultPath } from "../../../../src/domain/vault/VaultPath.js";

const ROOT = "/vault";
const INDEX = makeVaultPath(ROOT, "/vault/notes/index.md");
const OTHER = makeVaultPath(ROOT, "/vault/notes/Other.md");

describe("matchWikilink", () => {
  const all = [INDEX, OTHER];

  it("exact relative match", () => {
    expect(matchWikilink("notes/index", all, { caseSensitive: false })).toEqual({
      kind: "resolved",
      path: INDEX,
      strategy: "exact",
    });
  });

  it("basename match", () => {
    expect(matchWikilink("index", all, { caseSensitive: false })).toEqual({
      kind: "resolved",
      path: INDEX,
      strategy: "basename",
    });
  });

  it("case-insensitive match", () => {
    expect(matchWikilink("notes/OTHER", all, { caseSensitive: false })).toEqual({
      kind: "resolved",
      path: OTHER,
      strategy: "case-insensitive",
    });
  });

  it("case mismatch rejected when caseSensitive", () => {
    expect(matchWikilink("notes/OTHER", all, { caseSensitive: true })).toEqual({
      kind: "not-found",
    });
  });

  it("ambiguous basename", () => {
    const A = makeVaultPath(ROOT, "/vault/a/same.md");
    const B = makeVaultPath(ROOT, "/vault/b/same.md");
    expect(matchWikilink("same", [A, B], { caseSensitive: false }).kind).toBe("ambiguous");
  });

  it("no match", () => {
    expect(matchWikilink("missing", all, { caseSensitive: false })).toEqual({ kind: "not-found" });
  });
});
```

- [ ] **Implement `WikilinkMatcher.ts`**

```ts
import type { VaultPath } from "./VaultPath.js";

export type MatchResult =
  | { kind: "resolved"; path: VaultPath; strategy: "exact" | "case-insensitive" | "basename" }
  | { kind: "ambiguous"; candidates: readonly VaultPath[] }
  | { kind: "not-found" };

export interface MatchOptions {
  readonly caseSensitive: boolean;
}

/**
 * Match a wikilink target against a vault index. Resolution order mirrors
 * Obsidian: exact path, then case-insensitive (if allowed), then basename.
 */
export function matchWikilink(
  target: string,
  files: readonly VaultPath[],
  options: MatchOptions,
): MatchResult {
  const normalizedTarget = normalize(target);

  const exact = files.find((f) => stripExt(f.relative) === normalizedTarget);
  if (exact !== undefined) return { kind: "resolved", path: exact, strategy: "exact" };

  if (!options.caseSensitive) {
    const ci = files.find(
      (f) => stripExt(f.relative).toLowerCase() === normalizedTarget.toLowerCase(),
    );
    if (ci !== undefined) return { kind: "resolved", path: ci, strategy: "case-insensitive" };
  }

  const byStem = files.filter((f) =>
    options.caseSensitive
      ? f.stem === normalizedTarget
      : f.stem.toLowerCase() === normalizedTarget.toLowerCase(),
  );
  if (byStem.length === 1) {
    return { kind: "resolved", path: byStem[0]!, strategy: "basename" };
  }
  if (byStem.length > 1) {
    return { kind: "ambiguous", candidates: byStem };
  }
  return { kind: "not-found" };
}

function normalize(target: string): string {
  return target.replace(/\\/g, "/").replace(/\.md$/, "");
}

function stripExt(relative: string): string {
  return relative.replace(/\.md$/, "");
}
```

- [ ] **Run + Commit**

```bash
git add src/domain/vault/WikilinkMatcher.ts tests/unit/domain/vault/WikilinkMatcher.test.ts
git commit -m "feat(vault): add WikilinkMatcher with exact/case-insensitive/basename strategies"
```

---

### Task 4: VaultIndex + VaultDetector interfaces

**Files:**
- Create: `src/domain/vault/VaultIndex.ts`
- Create: `src/domain/vault/VaultDetector.ts`

```ts
// VaultIndex.ts
import type { VaultPath } from "./VaultPath.js";
import type { WikilinkNode } from "../parsing/WikilinkNode.js";
import type { MatchResult } from "./WikilinkMatcher.js";

/** In-memory index of every `.md` file in a vault. Built once per LintRun. */
export interface VaultIndex {
  readonly root: string;
  readonly all: () => readonly VaultPath[];
  readonly has: (relative: string) => boolean;
  readonly resolve: (link: Pick<WikilinkNode, "target">) => MatchResult;
}
```

```ts
// VaultDetector.ts
export interface VaultDetector {
  /**
   * Detect the vault root starting from `startDir`. Walks upward looking
   * for `.obsidian/`, then falls back to the closest `.git/` directory,
   * then throws OFM900 when neither exists.
   */
  detect(startDir: string): Promise<string>;
}
```

- [ ] **Commit**

```bash
git add src/domain/vault/VaultIndex.ts src/domain/vault/VaultDetector.ts
git commit -m "feat(vault): add VaultIndex and VaultDetector interfaces"
```

---

### Task 5: GitRootFinder + NodeFsVaultDetector

**Files:**
- Create: `src/infrastructure/vault/GitRootFinder.ts`
- Create: `src/infrastructure/vault/NodeFsVaultDetector.ts`
- Create: `tests/unit/infrastructure/vault/GitRootFinder.test.ts`
- Create: `tests/unit/infrastructure/vault/NodeFsVaultDetector.test.ts`

- [ ] **Implement `GitRootFinder.ts`**

```ts
import * as fs from "node:fs/promises";
import * as path from "node:path";

/** Walk up from `startDir` returning the closest ancestor containing `.git/`. */
export async function findGitRoot(startDir: string): Promise<string | null> {
  let dir = path.resolve(startDir);
  while (true) {
    try {
      const stat = await fs.stat(path.join(dir, ".git"));
      if (stat.isDirectory()) return dir;
    } catch {
      // continue upward
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
```

- [ ] **Implement `NodeFsVaultDetector.ts`**

```ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { VaultDetector } from "../../domain/vault/VaultDetector.js";
import { findGitRoot } from "./GitRootFinder.js";

/** Detect vault root via .obsidian/ directory, falling back to git root. */
export function makeNodeFsVaultDetector(): VaultDetector {
  return {
    async detect(startDir: string): Promise<string> {
      const obsidian = await findObsidianRoot(startDir);
      if (obsidian !== null) return obsidian;
      const git = await findGitRoot(startDir);
      if (git !== null) return git;
      throw new Error(
        `OFM900: no vault root found — no .obsidian/ or .git/ above ${startDir}`,
      );
    },
  };
}

async function findObsidianRoot(startDir: string): Promise<string | null> {
  let dir = path.resolve(startDir);
  while (true) {
    try {
      const stat = await fs.stat(path.join(dir, ".obsidian"));
      if (stat.isDirectory()) return dir;
    } catch {
      // continue upward
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
```

- [ ] **Write tests** — same temp-dir pattern as Phase 2's `FileReader.test.ts`:
  - `findGitRoot`: returns null on empty tree; walks up to find `.git`.
  - `NodeFsVaultDetector`: detects `.obsidian/` parent; falls back to `.git/`; throws `OFM900` when neither exists.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/vault/ tests/unit/infrastructure/vault/
git commit -m "feat(vault): add NodeFsVaultDetector and GitRootFinder"
```

---

### Task 6: FileIndexBuilder — concrete VaultIndex

**Files:**
- Create: `src/infrastructure/vault/FileIndexBuilder.ts`
- Create: `tests/unit/infrastructure/vault/FileIndexBuilder.test.ts`

- [ ] **Write failing test**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { buildFileIndex } from "../../../../src/infrastructure/vault/FileIndexBuilder.js";

let tmp: string;
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-idx-"));
  await fs.mkdir(path.join(tmp, "a"), { recursive: true });
  await fs.writeFile(path.join(tmp, "a", "one.md"), "# one");
  await fs.writeFile(path.join(tmp, "a", "two.md"), "# two");
  await fs.writeFile(path.join(tmp, "skip.txt"), "not md");
});
afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("buildFileIndex", () => {
  it("indexes every .md file under the vault root", async () => {
    const idx = await buildFileIndex(tmp, { caseSensitive: false });
    expect(idx.all().map((p) => p.relative).sort()).toEqual(["a/one.md", "a/two.md"]);
  });

  it("resolves by relative path", async () => {
    const idx = await buildFileIndex(tmp, { caseSensitive: false });
    expect(idx.resolve({ target: "a/one" }).kind).toBe("resolved");
  });

  it("resolves by basename", async () => {
    const idx = await buildFileIndex(tmp, { caseSensitive: false });
    expect(idx.resolve({ target: "two" }).kind).toBe("resolved");
  });

  it("reports not-found", async () => {
    const idx = await buildFileIndex(tmp, { caseSensitive: false });
    expect(idx.resolve({ target: "missing" }).kind).toBe("not-found");
  });
});
```

- [ ] **Implement `FileIndexBuilder.ts`**

```ts
import * as path from "node:path";
import { globby } from "globby";
import type { VaultIndex } from "../../domain/vault/VaultIndex.js";
import { makeVaultPath, type VaultPath } from "../../domain/vault/VaultPath.js";
import { matchWikilink, type MatchResult } from "../../domain/vault/WikilinkMatcher.js";
import type { WikilinkNode } from "../../domain/parsing/WikilinkNode.js";

export interface BuildOptions {
  readonly caseSensitive: boolean;
  readonly ignores?: readonly string[];
}

/** Scan the vault root for every .md file and return an in-memory VaultIndex. */
export async function buildFileIndex(vaultRoot: string, options: BuildOptions): Promise<VaultIndex> {
  const absolutes = await globby(["**/*.md"], {
    cwd: vaultRoot,
    absolute: true,
    gitignore: true,
    ignore: [...(options.ignores ?? []), "**/.obsidian/**", "**/node_modules/**"],
  });
  const paths: VaultPath[] = absolutes.map((abs) => makeVaultPath(vaultRoot, abs));
  const byRelative = new Set(paths.map((p) => p.relative));

  return {
    root: path.resolve(vaultRoot),
    all: () => paths,
    has: (relative) => byRelative.has(relative),
    resolve: (link: Pick<WikilinkNode, "target">): MatchResult =>
      matchWikilink(link.target, paths, { caseSensitive: options.caseSensitive }),
  };
}
```

- [ ] **Run + Commit**

```bash
git add src/infrastructure/vault/FileIndexBuilder.ts tests/unit/infrastructure/vault/FileIndexBuilder.test.ts
git commit -m "feat(vault): add FileIndexBuilder"
```

---

### Task 7: VaultBootstrap application use case

**Files:**
- Create: `src/application/VaultBootstrap.ts`
- Create: `tests/unit/application/VaultBootstrap.test.ts`

- [ ] **Implement `VaultBootstrap.ts`**

```ts
import type { LinterConfig } from "../domain/config/LinterConfig.js";
import type { VaultDetector } from "../domain/vault/VaultDetector.js";
import type { VaultIndex } from "../domain/vault/VaultIndex.js";

export interface BootstrapDeps {
  readonly detector: VaultDetector;
  readonly buildIndex: (root: string, opts: { caseSensitive: boolean }) => Promise<VaultIndex>;
}

/**
 * Resolve the vault root (config override > detector) and build the index.
 * When `config.resolve === false`, returns null so rules skip resolution.
 */
export async function bootstrapVault(
  startDir: string,
  config: LinterConfig,
  deps: BootstrapDeps,
): Promise<VaultIndex | null> {
  if (!config.resolve) return null;
  const root =
    config.vaultRoot !== null && config.vaultRoot !== undefined
      ? config.vaultRoot
      : await deps.detector.detect(startDir);
  return deps.buildIndex(root, { caseSensitive: config.wikilinks.caseSensitive });
}
```

- [ ] **Test** — stub `detector` and `buildIndex`, confirm:
  - `resolve: false` returns null
  - config override bypasses detector
  - detector result passed to builder

- [ ] **Run + Commit**

```bash
git add src/application/VaultBootstrap.ts tests/unit/application/VaultBootstrap.test.ts
git commit -m "feat(application): add VaultBootstrap use case"
```

---

### Task 8: RuleParams gains `vault`, LintUseCase threads VaultIndex

**Files:**
- Modify: `src/domain/linting/OFMRule.ts`
- Modify: `src/application/LintUseCase.ts`
- Modify: `tests/unit/rules/helpers/runRuleOnSource.ts`

- [ ] **Update `OFMRule.RuleParams`**

```ts
import type { VaultIndex } from "../vault/VaultIndex.js";

export interface RuleParams {
  readonly filePath: string;
  readonly parsed: ParseResult;
  readonly config: LinterConfig;
  readonly vault: VaultIndex | null;
}
```

- [ ] **Update `LintUseCase.runLint`** to accept `vaultIndex: VaultIndex | null` in deps and pass it into every rule call.

- [ ] **Update `runRuleOnSource`** with a new optional fourth argument `vault: VaultIndex | null = null`. Every existing rule test stays green because `null` is the default.

- [ ] **Run full test suite — expect PASS**

- [ ] **Commit**

```bash
git add src/domain/linting/OFMRule.ts src/application/LintUseCase.ts tests/unit/rules/helpers/runRuleOnSource.ts
git commit -m "refactor(rules): thread VaultIndex into RuleParams"
```

---

### Task 9: OFM001 — broken-wikilink

**Files:**
- Create: `src/infrastructure/rules/ofm/wikilinks/OFM001-broken-wikilink.ts`
- Create: `tests/unit/rules/wikilinks/OFM001.test.ts`

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { OFM001Rule } from "../../../../src/infrastructure/rules/ofm/wikilinks/OFM001-broken-wikilink.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { makeVaultPath } from "../../../../src/domain/vault/VaultPath.js";
import { matchWikilink } from "../../../../src/domain/vault/WikilinkMatcher.js";
import type { VaultIndex } from "../../../../src/domain/vault/VaultIndex.js";

function stubVault(files: string[]): VaultIndex {
  const paths = files.map((rel) => makeVaultPath("/v", `/v/${rel}`));
  return {
    root: "/v",
    all: () => paths,
    has: (rel) => paths.some((p) => p.relative === rel),
    resolve: (link) => matchWikilink(link.target, paths, { caseSensitive: false }),
  };
}

describe("OFM001 broken-wikilink", () => {
  it("passes when target exists", async () => {
    const vault = stubVault(["notes/index.md"]);
    const errors = await runRuleOnSource(OFM001Rule, "[[notes/index]]", {}, vault);
    expect(errors).toEqual([]);
  });

  it("reports broken target", async () => {
    const vault = stubVault(["notes/index.md"]);
    const errors = await runRuleOnSource(OFM001Rule, "[[missing]]", {}, vault);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM001");
  });

  it("skips when resolve disabled (vault is null)", async () => {
    const errors = await runRuleOnSource(OFM001Rule, "[[missing]]", {}, null);
    expect(errors).toEqual([]);
  });
});
```

- [ ] **Implement `OFM001-broken-wikilink.ts`**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM001Rule: OFMRule = {
  names: ["OFM001", "no-broken-wikilinks"],
  description: "Wikilink target does not resolve within the vault",
  tags: ["wikilinks", "links"],
  severity: "error",
  fixable: false,
  run({ parsed, vault }, onError) {
    if (vault === null) return;
    for (const link of parsed.wikilinks) {
      if (link.isEmbed) continue; // embeds are OFM020/OFM022's territory
      const match = vault.resolve(link);
      if (match.kind === "not-found") {
        onError({
          line: link.position.line,
          column: link.position.column,
          message: `Broken wikilink: target "${link.target}" not found in vault`,
        });
      }
    }
  },
};
```

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/wikilinks/OFM001-broken-wikilink.ts \
        tests/unit/rules/wikilinks/OFM001.test.ts \
        tests/unit/rules/helpers/runRuleOnSource.ts
git commit -m "feat(rules): OFM001 broken-wikilink"
```

---

### Task 10: OFM002 — invalid-wikilink-format

**Files:**
- Create: `src/infrastructure/rules/ofm/wikilinks/OFM002-invalid-wikilink-format.ts`
- Create: `tests/unit/rules/wikilinks/OFM002.test.ts`

This rule scans raw lines for `[[]]` and other malformed wikilink patterns that the extractor silently drops. The wikilink extractor is tolerant; this is where we complain.

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

const EMPTY = /\[\[\s*\]\]/g;
const UNCLOSED_TAIL = /\[\[([^\]\n]*)$/;
const NESTED = /\[\[[^\]]*\[\[/;

export const OFM002Rule: OFMRule = {
  names: ["OFM002", "invalid-wikilink-format"],
  description: "Wikilink syntax is malformed",
  tags: ["wikilinks", "syntax"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    parsed.lines.forEach((line, i) => {
      const lineNumber = i + 1;
      for (const m of line.matchAll(EMPTY)) {
        onError({
          line: lineNumber,
          column: (m.index ?? 0) + 1,
          message: "Empty wikilink `[[]]`",
        });
      }
      if (UNCLOSED_TAIL.test(line) && !line.includes("]]")) {
        onError({
          line: lineNumber, column: 1,
          message: "Unclosed wikilink — missing `]]`",
        });
      }
      if (NESTED.test(line)) {
        onError({
          line: lineNumber, column: 1,
          message: "Nested wikilink `[[ [[`",
        });
      }
    });
  },
};
```

- [ ] **Test** — empty, unclosed, nested, plus two valid cases. The BDD scenario `[[]]` is mirrored here.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/wikilinks/OFM002-invalid-wikilink-format.ts \
        tests/unit/rules/wikilinks/OFM002.test.ts
git commit -m "feat(rules): OFM002 invalid-wikilink-format"
```

---

### Task 11: OFM003 — self-link (warning)

**Files:**
- Create: `src/infrastructure/rules/ofm/wikilinks/OFM003-self-link.ts`
- Create: `tests/unit/rules/wikilinks/OFM003.test.ts`

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import * as path from "node:path";

export const OFM003Rule: OFMRule = {
  names: ["OFM003", "self-link"],
  description: "Wikilink points back at the same file",
  tags: ["wikilinks", "style"],
  severity: "warning",
  fixable: false,
  run({ parsed, vault }, onError) {
    if (vault === null) return;
    const selfStem = path.basename(parsed.filePath, ".md");
    for (const link of parsed.wikilinks) {
      const match = vault.resolve(link);
      if (match.kind !== "resolved") continue;
      if (match.path.absolute === path.resolve(parsed.filePath)) {
        onError({
          line: link.position.line,
          column: link.position.column,
          message: `Self-link to "${selfStem}" in ${path.basename(parsed.filePath)}`,
        });
      }
    }
  },
};
```

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/wikilinks/OFM003-self-link.ts \
        tests/unit/rules/wikilinks/OFM003.test.ts
git commit -m "feat(rules): OFM003 self-link (warning)"
```

---

### Task 12: OFM004 — ambiguous-target

**Files:**
- Create: `src/infrastructure/rules/ofm/wikilinks/OFM004-ambiguous-target.ts`
- Create: `tests/unit/rules/wikilinks/OFM004.test.ts`

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM004Rule: OFMRule = {
  names: ["OFM004", "ambiguous-wikilink-target"],
  description: "Wikilink basename matches multiple files",
  tags: ["wikilinks"],
  severity: "error",
  fixable: false,
  run({ parsed, vault }, onError) {
    if (vault === null) return;
    for (const link of parsed.wikilinks) {
      const match = vault.resolve(link);
      if (match.kind === "ambiguous") {
        const candidates = match.candidates.map((c) => c.relative).join(", ");
        onError({
          line: link.position.line,
          column: link.position.column,
          message: `Wikilink "${link.target}" is ambiguous — matches: ${candidates}`,
        });
      }
    }
  },
};
```

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/wikilinks/OFM004-ambiguous-target.ts \
        tests/unit/rules/wikilinks/OFM004.test.ts
git commit -m "feat(rules): OFM004 ambiguous-wikilink-target"
```

---

### Task 13: OFM005 — case-mismatch (warning)

**Files:**
- Create: `src/infrastructure/rules/ofm/wikilinks/OFM005-case-mismatch.ts`
- Create: `tests/unit/rules/wikilinks/OFM005.test.ts`

Fires when Obsidian would resolve the link case-insensitively but the written form's case differs from the canonical file's case.

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM005Rule: OFMRule = {
  names: ["OFM005", "wikilink-case-mismatch"],
  description: "Wikilink target only resolves case-insensitively",
  tags: ["wikilinks", "style"],
  severity: "warning",
  fixable: true,
  run({ parsed, vault }, onError) {
    if (vault === null) return;
    for (const link of parsed.wikilinks) {
      const match = vault.resolve(link);
      if (match.kind === "resolved" && match.strategy === "case-insensitive") {
        onError({
          line: link.position.line,
          column: link.position.column,
          message: `Wikilink "${link.target}" case differs from canonical "${match.path.relative}"`,
        });
      }
    }
  },
};
```

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/wikilinks/OFM005-case-mismatch.ts \
        tests/unit/rules/wikilinks/OFM005.test.ts
git commit -m "feat(rules): OFM005 wikilink-case-mismatch"
```

---

### Task 14: OFM006 — empty-heading / OFM007 — block-ref-in-body

**Files:**
- Create: `src/infrastructure/rules/ofm/wikilinks/OFM006-empty-heading.ts`
- Create: `src/infrastructure/rules/ofm/wikilinks/OFM007-block-ref-in-body.ts`
- Create: `tests/unit/rules/wikilinks/OFM006.test.ts`
- Create: `tests/unit/rules/wikilinks/OFM007.test.ts`

- [ ] **OFM006 empty-heading**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM006Rule: OFMRule = {
  names: ["OFM006", "empty-wikilink-heading"],
  description: "Wikilink declares `#` with no heading text",
  tags: ["wikilinks"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    for (const link of parsed.wikilinks) {
      if (link.heading !== null && link.heading.trim() === "") {
        onError({
          line: link.position.line,
          column: link.position.column,
          message: `Wikilink "${link.raw}" has an empty heading after '#'`,
        });
      }
    }
  },
};
```

- [ ] **OFM007 block-ref-in-body** — warns when `[[page#^blockid]]` targets a file that does not exist. Phase 6 strengthens this with cross-file blockid checks.

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM007Rule: OFMRule = {
  names: ["OFM007", "wikilink-block-ref"],
  description: "Block-reference wikilink target file not found",
  tags: ["wikilinks", "block-refs"],
  severity: "warning",
  fixable: false,
  run({ parsed, vault }, onError) {
    if (vault === null) return;
    for (const link of parsed.wikilinks) {
      if (link.blockRef === null) continue;
      const match = vault.resolve(link);
      if (match.kind === "not-found") {
        onError({
          line: link.position.line,
          column: link.position.column,
          message: `Block-reference target file "${link.target}" not found`,
        });
      }
    }
  },
};
```

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/wikilinks/OFM006-empty-heading.ts \
        src/infrastructure/rules/ofm/wikilinks/OFM007-block-ref-in-body.ts \
        tests/unit/rules/wikilinks/OFM006.test.ts \
        tests/unit/rules/wikilinks/OFM007.test.ts
git commit -m "feat(rules): OFM006 empty-heading and OFM007 block-ref-in-body"
```

---

### Task 15: Register wikilink rules

**Files:**
- Modify: `src/infrastructure/rules/ofm/registerBuiltin.ts`
- Modify: `src/infrastructure/config/defaults.ts`

- [ ] **Append wikilink imports and extend `ALL`**

```ts
import { OFM001Rule } from "./wikilinks/OFM001-broken-wikilink.js";
import { OFM002Rule } from "./wikilinks/OFM002-invalid-wikilink-format.js";
import { OFM003Rule } from "./wikilinks/OFM003-self-link.js";
import { OFM004Rule } from "./wikilinks/OFM004-ambiguous-target.js";
import { OFM005Rule } from "./wikilinks/OFM005-case-mismatch.js";
import { OFM006Rule } from "./wikilinks/OFM006-empty-heading.js";
import { OFM007Rule } from "./wikilinks/OFM007-block-ref-in-body.js";
```

Keep OFM003 disabled by default (self-links are sometimes intentional):

```ts
OFM003: Object.freeze({ enabled: false }),
```

- [ ] **Run + Commit**

```bash
npm run test
git add src/infrastructure/rules/ofm/registerBuiltin.ts src/infrastructure/config/defaults.ts
git commit -m "feat(rules): register wikilink rules OFM001-007"
```

---

### Task 16: CLI wiring — `--vault-root`, `--no-resolve`, VaultBootstrap

**Files:**
- Modify: `src/cli/args.ts`
- Modify: `src/cli/main.ts`
- Modify: `src/application/LintUseCase.ts`

- [ ] **Update `args.ts`** — the flags already exist from Phase 1. Verify they are forwarded to `LinterConfig` as overrides.

- [ ] **Update `main.ts`** to call `bootstrapVault` before `runLint`:

```ts
import { makeNodeFsVaultDetector } from "../infrastructure/vault/NodeFsVaultDetector.js";
import { buildFileIndex } from "../infrastructure/vault/FileIndexBuilder.js";
import { bootstrapVault } from "../application/VaultBootstrap.js";

const effectiveConfig = applyCliOverrides(config, opts);
let vault;
try {
  vault = await bootstrapVault(cwd, effectiveConfig, {
    detector: makeNodeFsVaultDetector(),
    buildIndex: buildFileIndex,
  });
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`${message}\n`);
  return 2;
}

const results = await runLint(files, effectiveConfig, registry, {
  parser,
  readFile: readMarkdownFile,
  vault,
});
```

- [ ] **Add `applyCliOverrides`** helper to translate `--vault-root`, `--no-resolve` into a shallow-merged `LinterConfig`. Keep it under 20 lines.

- [ ] **Update `runLint` signature** to accept `vault` in deps.

- [ ] **Run full test suite**

- [ ] **Commit**

```bash
git add src/cli/ src/application/LintUseCase.ts
git commit -m "feat(cli): wire VaultBootstrap and --vault-root / --no-resolve"
```

---

### Task 17: Integration tests — wikilinks + vault detection

**Files:**
- Create: `tests/integration/rules/wikilinks-integration.test.ts`
- Create: `tests/integration/rules/vault-detection-integration.test.ts`

- [ ] **Write `wikilinks-integration.test.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

let vault: string;
beforeEach(async () => {
  vault = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-wl-int-"));
  await fs.mkdir(path.join(vault, ".obsidian"), { recursive: true });
  await fs.mkdir(path.join(vault, "notes"), { recursive: true });
  await fs.writeFile(path.join(vault, "notes", "existing.md"), "# existing\n");
});
afterEach(async () => {
  await fs.rm(vault, { recursive: true, force: true });
});

describe("wikilink rules integration", () => {
  it("broken link exits 1 with OFM001", async () => {
    await fs.writeFile(path.join(vault, "notes", "index.md"), "[[missing]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM001");
  });

  it("valid link exits 0", async () => {
    await fs.writeFile(path.join(vault, "notes", "index.md"), "[[existing]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(0);
  });

  it("--no-resolve suppresses OFM001", async () => {
    await fs.writeFile(path.join(vault, "notes", "index.md"), "[[missing]]\n");
    const r = await spawnCli(["--no-resolve", "**/*.md"], vault);
    expect(r.exitCode).toBe(0);
  });

  it("empty wikilink fires OFM002", async () => {
    await fs.writeFile(path.join(vault, "notes", "index.md"), "[[]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM002");
  });
});
```

- [ ] **Write `vault-detection-integration.test.ts`** — four scenarios matching `docs/bdd/features/vault-detection.feature`:
  - `.obsidian/` ancestor detection
  - git root fallback
  - explicit `vaultRoot` override
  - OFM900 when neither detectable

- [ ] **Run + Commit**

```bash
npm run test -- tests/integration/rules/wikilinks-integration.test.ts tests/integration/rules/vault-detection-integration.test.ts
git add tests/integration/rules
git commit -m "test(rules): wikilink + vault-detection integration tests"
```

---

### Task 18: Rule documentation pages

**Files:**
- Create: `docs/rules/wikilinks/OFM001.md` ... `OFM007.md`
- Modify: `docs/rules/index.md`

- [ ] **Write all 7 rule pages** using the Phase 3 template.

- [ ] **Update `docs/rules/index.md`**.

- [ ] **Dogfood docs/**

```bash
cd docs && node ../bin/markdownlint-obsidian.js "**/*.md"
```

Fix broken wikilinks in our own docs or add them to ignore lists.

- [ ] **Commit**

```bash
git add docs/rules
git commit -m "docs(rules): wikilink rule catalog pages"
```

---

### Task 19: Green the existing BDD features

**Files:**
- Modify: `docs/bdd/steps/file-steps.ts`
- Modify: `docs/bdd/steps/assertion-steps.ts`

The existing `wikilinks.feature` and `vault-detection.feature` use phrasing that needs step implementations.

- [ ] **Add steps** for phrases like `Given a vault with a file "..."`, `Given a directory tree with ".obsidian/" at "..."`, `Given a config file setting vaultRoot to "..."`, `Then the vault root is resolved to "..."`, `And error OFM001 is reported (missing-page not in vault)`, `Given a git repo root at "..." with no ".obsidian/" directory`, `Given a directory with no ".obsidian/" and no git repo`, `Given a vault with a broken wikilink`.

Each step is 5–15 lines and uses `OFMWorld`'s temp vault helpers.

- [ ] **Run both features**

```bash
npm run test:bdd -- docs/bdd/features/wikilinks.feature docs/bdd/features/vault-detection.feature
```

Expected: all scenarios pass.

- [ ] **Commit**

```bash
git add docs/bdd/steps/
git commit -m "feat(bdd): wire wikilinks and vault-detection feature steps"
```

---

### Task 20: Phase 4 verification

- [ ] **Full run**

```bash
npm run test:all
```

- [ ] **Coverage** — domain/vault ≥ 95%, application/VaultBootstrap ≥ 90%, infrastructure/vault ≥ 85%.

- [ ] **Final commit**

```bash
git add -A
git commit -m "chore: Phase 4 complete — vault context, wikilink rules OFM001-007"
```

---

## Phase 4 acceptance criteria

- `VaultIndex` resolves with Obsidian's exact → case-insensitive → basename strategy.
- `VaultDetector` walks up for `.obsidian/` then falls back to `.git/`; raises `OFM900` when neither exists.
- `bootstrapVault` runs exactly once per LintRun and returns `null` when `config.resolve === false`.
- 7 wikilink rules (OFM001–OFM007) registered. OFM001, 002, 004, 006 default to error; OFM003, 005, 007 default to warning; OFM003 disabled by default.
- `wikilinks.feature` and `vault-detection.feature` both green.
- `--vault-root` and `--no-resolve` flags are honoured end-to-end.
- Coverage targets met on new layers.
