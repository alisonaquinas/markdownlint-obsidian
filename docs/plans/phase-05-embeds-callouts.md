# Phase 5: Embeds + Callouts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the embed rule family OFM020–OFM029 and the callout rule family OFM040–OFM049. Turn `docs/bdd/features/callouts.feature` green. Introduce a `FileExistenceChecker` that resolves non-markdown embed targets (`.png`, `.pdf`, etc.) against the real filesystem beneath the vault root — the VaultIndex is markdown-only.

**Architecture:** Callout rules consume `parsed.callouts` and `config.callouts.allowList`. Embed rules consume `parsed.embeds`, and for non-markdown targets they consult a new `FileExistenceChecker` interface served by `NodeFsExistenceChecker`. Both are injected into `RuleParams` alongside `vault` from Phase 4. Config adds `embeds: { allowedExtensions, maxWidth, maxHeight }` and richer `callouts` options.

**Tech Stack:** Phase 4 stack. No new runtime deps.

---

## File Map

```
src/
  domain/
    fs/
      FileExistenceChecker.ts                      Interface (DIP)
    config/
      LinterConfig.ts                              UPDATED: EmbedConfig + richer CalloutConfig
    linting/
      OFMRule.ts                                   UPDATED: RuleParams gains `fsCheck: FileExistenceChecker`
  infrastructure/
    fs/
      NodeFsExistenceChecker.ts                    fs.access-based implementation
    rules/ofm/
      embeds/
        shared/
          EmbedClassifier.ts                       Decide markdown vs asset by extension
        OFM020-broken-embed.ts
        OFM021-invalid-embed-syntax.ts
        OFM022-embed-target-missing.ts
        OFM023-embed-size-invalid.ts
        OFM024-disallowed-embed-extension.ts
        OFM025-embed-extension-mismatch.ts
      callouts/
        shared/
          CalloutTypeRegistry.ts                   Default + user allowList merge
        OFM040-unknown-callout-type.ts
        OFM041-malformed-callout.ts
        OFM042-empty-callout.ts
        OFM043-callout-in-list.ts                  Warning: OFM requires blank line before callout
        OFM044-callout-fold-on-note.ts             Warning: foldable '+'/'-' on informational type
  application/
    LintUseCase.ts                                 UPDATED: thread FileExistenceChecker through deps
tests/
  unit/
    domain/fs/                                     Interface-only file; no unit tests needed
    infrastructure/fs/NodeFsExistenceChecker.test.ts
    rules/embeds/OFM020.test.ts ... OFM025.test.ts
    rules/callouts/OFM040.test.ts ... OFM044.test.ts
    rules/embeds/shared/EmbedClassifier.test.ts
    rules/callouts/shared/CalloutTypeRegistry.test.ts
  integration/
    rules/embeds-integration.test.ts
    rules/callouts-integration.test.ts
  fixtures/rules/
    embeds/broken-image.md, valid-image.md, invalid-size.md, image.png
    callouts/unknown.md, valid.md, custom.md
docs/
  rules/
    embeds/OFM020.md ... OFM025.md
    callouts/OFM040.md ... OFM044.md
  bdd/features/
    callouts.feature                               Becomes green in Task 17
    embeds.feature                                 New: embed scenarios
```

---

### Task 1: FileExistenceChecker interface

**Files:**

- Create: `src/domain/fs/FileExistenceChecker.ts`

- [ ] **Implement**

```ts
/**
 * DIP boundary for checking whether an asset file exists beneath the vault
 * root. The VaultIndex only tracks `.md` files; embedded assets (images,
 * PDFs) need the real filesystem.
 */
export interface FileExistenceChecker {
  /**
   * Return true if a file exists at `relative` beneath `vaultRoot`.
   * `relative` uses forward slashes regardless of platform.
   */
  exists(vaultRoot: string, relative: string): Promise<boolean>;
}
```

- [ ] **Commit**

```bash
git add src/domain/fs/FileExistenceChecker.ts
git commit -m "feat(fs): add FileExistenceChecker DIP interface"
```

---

### Task 2: NodeFsExistenceChecker

**Files:**

- Create: `src/infrastructure/fs/NodeFsExistenceChecker.ts`
- Create: `tests/unit/infrastructure/fs/NodeFsExistenceChecker.test.ts`

- [ ] **Write failing test**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { makeNodeFsExistenceChecker } from "../../../../src/infrastructure/fs/NodeFsExistenceChecker.js";

let tmp: string;
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-fsc-"));
  await fs.writeFile(path.join(tmp, "image.png"), "fake");
});
afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("NodeFsExistenceChecker", () => {
  const checker = makeNodeFsExistenceChecker();

  it("returns true for existing file", async () => {
    expect(await checker.exists(tmp, "image.png")).toBe(true);
  });

  it("returns false for missing file", async () => {
    expect(await checker.exists(tmp, "missing.png")).toBe(false);
  });

  it("rejects paths escaping the vault", async () => {
    expect(await checker.exists(tmp, "../secrets")).toBe(false);
  });
});
```

- [ ] **Implement `NodeFsExistenceChecker.ts`**

```ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { FileExistenceChecker } from "../../domain/fs/FileExistenceChecker.js";

export function makeNodeFsExistenceChecker(): FileExistenceChecker {
  return {
    async exists(vaultRoot, relative) {
      const normalized = relative.replace(/\\/g, "/");
      const absolute = path.resolve(vaultRoot, normalized);
      const withinRoot = absolute === vaultRoot || absolute.startsWith(vaultRoot + path.sep);
      if (!withinRoot) return false;
      try {
        await fs.access(absolute);
        return true;
      } catch {
        return false;
      }
    },
  };
}
```

- [ ] **Run + Commit**

```bash
git add src/infrastructure/fs/NodeFsExistenceChecker.ts tests/unit/infrastructure/fs/NodeFsExistenceChecker.test.ts
git commit -m "feat(fs): add NodeFsExistenceChecker"
```

---

### Task 3: Extend RuleParams with fsCheck

**Files:**

- Modify: `src/domain/linting/OFMRule.ts`
- Modify: `src/application/LintUseCase.ts`
- Modify: `tests/unit/rules/helpers/runRuleOnSource.ts`

- [ ] **Update `RuleParams`**

```ts
import type { FileExistenceChecker } from "../fs/FileExistenceChecker.js";

export interface RuleParams {
  readonly filePath: string;
  readonly parsed: ParseResult;
  readonly config: LinterConfig;
  readonly vault: VaultIndex | null;
  readonly fsCheck: FileExistenceChecker;
}
```

- [ ] **Update `runRuleOnSource`** to accept a fifth optional `fsCheck` arg. Default to an in-memory checker that always returns `false`. Many rule tests will override this with a simple stub.

```ts
const DEFAULT_FS_CHECK: FileExistenceChecker = {
  exists: async () => false,
};
```

- [ ] **Update `LintUseCase.runLint` deps** and thread through every rule invocation.

- [ ] **Wire `makeNodeFsExistenceChecker()` into `cli/main.ts`**.

- [ ] **Run + Commit**

```bash
git add src/domain/linting/OFMRule.ts src/application/LintUseCase.ts \
        src/cli/main.ts tests/unit/rules/helpers/runRuleOnSource.ts
git commit -m "refactor(rules): thread FileExistenceChecker into RuleParams"
```

---

### Task 4: EmbedConfig + richer CalloutConfig

**Files:**

- Modify: `src/domain/config/LinterConfig.ts`
- Modify: `src/infrastructure/config/defaults.ts`
- Modify: `src/infrastructure/config/ConfigValidator.ts`

- [ ] **Add `EmbedConfig`**

```ts
export interface EmbedConfig {
  readonly allowedExtensions: readonly string[];
  readonly maxWidth: number | null;
  readonly maxHeight: number | null;
  readonly allowRemote: boolean;
}
```

- [ ] **Extend `CalloutConfig`**

```ts
export interface CalloutConfig {
  readonly allowList: readonly string[];
  readonly caseSensitive: boolean;
  readonly requireTitle: boolean;
  readonly allowFold: boolean;
}
```

- [ ] **Update `DEFAULT_CONFIG`**

```ts
embeds: Object.freeze({
  allowedExtensions: Object.freeze([
    "md", "png", "jpg", "jpeg", "gif", "svg", "webp",
    "pdf", "mp4", "webm", "mp3", "wav", "ogg",
  ]),
  maxWidth: null,
  maxHeight: null,
  allowRemote: false,
}),
callouts: Object.freeze({
  allowList: Object.freeze([
    "NOTE", "WARNING", "TIP", "IMPORTANT", "CAUTION",
    "ABSTRACT", "SUMMARY", "INFO", "HINT", "SUCCESS",
    "QUESTION", "FAILURE", "DANGER", "BUG", "EXAMPLE", "QUOTE",
  ]),
  caseSensitive: false,
  requireTitle: false,
  allowFold: true,
}),
```

- [ ] **Update `ConfigValidator.KNOWN_KEYS`** to add `"embeds"`.

- [ ] **Write test** verifying defaults match.

- [ ] **Run + Commit**

```bash
git add src/domain/config/LinterConfig.ts src/infrastructure/config/defaults.ts \
        src/infrastructure/config/ConfigValidator.ts tests/unit/config/
git commit -m "feat(config): add EmbedConfig and extend CalloutConfig"
```

---

### Task 5: EmbedClassifier shared helper

**Files:**

- Create: `src/infrastructure/rules/ofm/embeds/shared/EmbedClassifier.ts`
- Create: `tests/unit/rules/embeds/shared/EmbedClassifier.test.ts`

- [ ] **Implement**

```ts
import type { EmbedNode } from "../../../../../domain/parsing/EmbedNode.js";

export type EmbedKind = "markdown" | "image" | "video" | "audio" | "pdf" | "unknown";

const BY_EXT: Readonly<Record<string, EmbedKind>> = {
  md: "markdown",
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", svg: "image",
  mp4: "video", webm: "video",
  mp3: "audio", wav: "audio", ogg: "audio",
  pdf: "pdf",
};

export function classifyEmbed(embed: EmbedNode): { kind: EmbedKind; extension: string } {
  const dotIdx = embed.target.lastIndexOf(".");
  if (dotIdx === -1) {
    // Treat extensionless targets as markdown (Obsidian's default assumption).
    return { kind: "markdown", extension: "md" };
  }
  const ext = embed.target.slice(dotIdx + 1).toLowerCase();
  return { kind: BY_EXT[ext] ?? "unknown", extension: ext };
}
```

- [ ] **Test** — five rows covering `md`, `png`, `mp4`, `pdf`, and extensionless fallback.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/embeds/shared/ tests/unit/rules/embeds/shared/
git commit -m "feat(rules): add EmbedClassifier helper"
```

---

### Task 6: OFM020 — broken-embed (markdown target)

**Files:**

- Create: `src/infrastructure/rules/ofm/embeds/OFM020-broken-embed.ts`
- Create: `tests/unit/rules/embeds/OFM020.test.ts`

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { classifyEmbed } from "./shared/EmbedClassifier.js";

export const OFM020Rule: OFMRule = {
  names: ["OFM020", "broken-embed"],
  description: "Embed target is a markdown file that does not exist in the vault",
  tags: ["embeds"],
  severity: "error",
  fixable: false,
  run({ parsed, vault }, onError) {
    if (vault === null) return;
    for (const embed of parsed.embeds) {
      const { kind } = classifyEmbed(embed);
      if (kind !== "markdown") continue;
      const match = vault.resolve({ target: embed.target.replace(/\.md$/, "") });
      if (match.kind === "not-found") {
        onError({
          line: embed.position.line,
          column: embed.position.column,
          message: `Broken embed: "${embed.target}" not found in vault`,
        });
      }
    }
  },
};
```

- [ ] **Test** — stub vault with `notes/index.md`, source `![[missing]]` vs `![[notes/index]]`.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/embeds/OFM020-broken-embed.ts \
        tests/unit/rules/embeds/OFM020.test.ts
git commit -m "feat(rules): OFM020 broken-embed (markdown)"
```

---

### Task 7: OFM021 — invalid-embed-syntax

**Files:**

- Create: `src/infrastructure/rules/ofm/embeds/OFM021-invalid-embed-syntax.ts`
- Create: `tests/unit/rules/embeds/OFM021.test.ts`

Detects `![[]]`, `![[target` (unclosed), and `![[` followed by whitespace-only targets.

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

const EMPTY_EMBED = /!\[\[\s*\]\]/g;
const UNCLOSED = /!\[\[[^\]\n]*$/;

export const OFM021Rule: OFMRule = {
  names: ["OFM021", "invalid-embed-syntax"],
  description: "Embed syntax is malformed",
  tags: ["embeds", "syntax"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    parsed.lines.forEach((line, i) => {
      const lineNumber = i + 1;
      for (const m of line.matchAll(EMPTY_EMBED)) {
        onError({
          line: lineNumber,
          column: (m.index ?? 0) + 1,
          message: "Empty embed `![[]]`",
        });
      }
      if (UNCLOSED.test(line) && !line.includes("]]")) {
        onError({
          line: lineNumber, column: 1,
          message: "Unclosed embed — missing `]]`",
        });
      }
    });
  },
};
```

- [ ] **Test** — 4 rows, at least two valid (`![[ok]]`, plain `[[wl]]` ignored).

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/embeds/OFM021-invalid-embed-syntax.ts \
        tests/unit/rules/embeds/OFM021.test.ts
git commit -m "feat(rules): OFM021 invalid-embed-syntax"
```

---

### Task 8: OFM022 — embed-target-missing (non-markdown asset)

**Files:**

- Create: `src/infrastructure/rules/ofm/embeds/OFM022-embed-target-missing.ts`
- Create: `tests/unit/rules/embeds/OFM022.test.ts`

Uses `fsCheck.exists(vault.root, embed.target)` for non-markdown embeds.

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { classifyEmbed } from "./shared/EmbedClassifier.js";

export const OFM022Rule: OFMRule = {
  names: ["OFM022", "embed-target-missing"],
  description: "Embedded asset file does not exist beneath the vault root",
  tags: ["embeds", "assets"],
  severity: "error",
  fixable: false,
  async run({ parsed, vault, fsCheck }, onError) {
    if (vault === null) return;
    for (const embed of parsed.embeds) {
      const { kind } = classifyEmbed(embed);
      if (kind === "markdown" || kind === "unknown") continue;
      const exists = await fsCheck.exists(vault.root, embed.target);
      if (!exists) {
        onError({
          line: embed.position.line,
          column: embed.position.column,
          message: `Embed target "${embed.target}" not found beneath vault root`,
        });
      }
    }
  },
};
```

Because `run` is now `async`, update the `OFMRule` interface to allow `run(params, onError): void | Promise<void>`. Confirm `LintUseCase.runRule` awaits the return value.

- [ ] **Update `OFMRule.ts` interface**

```ts
run(params: RuleParams, onError: OnErrorCallback): void | Promise<void>;
```

- [ ] **Update `LintUseCase`** to `await rule.run(...)` inside the runRule helper.

- [ ] **Test** — vault with `image.png` present; source `![[image.png]]` passes. Source `![[missing.png]]` fails. Source `![[note]]` skipped (markdown, OFM020's job).

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/embeds/OFM022-embed-target-missing.ts \
        tests/unit/rules/embeds/OFM022.test.ts \
        src/domain/linting/OFMRule.ts \
        src/application/LintUseCase.ts
git commit -m "feat(rules): OFM022 embed-target-missing; support async rules"
```

---

### Task 9: OFM023 — embed-size-invalid

**Files:**

- Create: `src/infrastructure/rules/ofm/embeds/OFM023-embed-size-invalid.ts`
- Create: `tests/unit/rules/embeds/OFM023.test.ts`

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM023Rule: OFMRule = {
  names: ["OFM023", "embed-size-invalid"],
  description: "Embed sizing hint exceeds configured limits",
  tags: ["embeds"],
  severity: "warning",
  fixable: false,
  run({ parsed, config }, onError) {
    const { maxWidth, maxHeight } = config.embeds;
    for (const embed of parsed.embeds) {
      if (maxWidth !== null && embed.width !== null && embed.width > maxWidth) {
        onError({
          line: embed.position.line,
          column: embed.position.column,
          message: `Embed width ${embed.width} exceeds maxWidth ${maxWidth}`,
        });
      }
      if (maxHeight !== null && embed.height !== null && embed.height > maxHeight) {
        onError({
          line: embed.position.line,
          column: embed.position.column,
          message: `Embed height ${embed.height} exceeds maxHeight ${maxHeight}`,
        });
      }
    }
  },
};
```

- [ ] **Test** with `maxWidth: 400` and `![[img.png|800]]`.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/embeds/OFM023-embed-size-invalid.ts \
        tests/unit/rules/embeds/OFM023.test.ts
git commit -m "feat(rules): OFM023 embed-size-invalid"
```

---

### Task 10: OFM024 — disallowed-embed-extension / OFM025 — embed-extension-mismatch

**Files:**

- Create: `src/infrastructure/rules/ofm/embeds/OFM024-disallowed-embed-extension.ts`
- Create: `src/infrastructure/rules/ofm/embeds/OFM025-embed-extension-mismatch.ts`
- Create: `tests/unit/rules/embeds/OFM024.test.ts`
- Create: `tests/unit/rules/embeds/OFM025.test.ts`

- [ ] **OFM024 — disallowed-embed-extension**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { classifyEmbed } from "./shared/EmbedClassifier.js";

export const OFM024Rule: OFMRule = {
  names: ["OFM024", "disallowed-embed-extension"],
  description: "Embed extension is not in the allowedExtensions list",
  tags: ["embeds"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    const allowed = new Set(config.embeds.allowedExtensions.map((e) => e.toLowerCase()));
    for (const embed of parsed.embeds) {
      const { extension } = classifyEmbed(embed);
      if (!allowed.has(extension)) {
        onError({
          line: embed.position.line,
          column: embed.position.column,
          message: `Embed extension ".${extension}" is not in allowedExtensions`,
        });
      }
    }
  },
};
```

- [ ] **OFM025 — embed-extension-mismatch** — warns when a text-style sizing hint is applied to a non-image embed (e.g. `![[file.pdf|500]]`).

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { classifyEmbed } from "./shared/EmbedClassifier.js";

export const OFM025Rule: OFMRule = {
  names: ["OFM025", "embed-size-on-non-image"],
  description: "Sizing hint used on an embed type that does not honour it",
  tags: ["embeds", "style"],
  severity: "warning",
  fixable: true,
  run({ parsed }, onError) {
    for (const embed of parsed.embeds) {
      if (embed.width === null && embed.height === null) continue;
      const { kind } = classifyEmbed(embed);
      if (kind !== "image") {
        onError({
          line: embed.position.line,
          column: embed.position.column,
          message: `Sizing hint ignored — ${kind} embeds do not honour width/height`,
        });
      }
    }
  },
};
```

- [ ] **Write valid/invalid tests** for both.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/embeds/OFM02[45]-*.ts \
        tests/unit/rules/embeds/OFM02[45].test.ts
git commit -m "feat(rules): OFM024 disallowed-embed-extension and OFM025 size-on-non-image"
```

---

### Task 11: CalloutTypeRegistry helper

**Files:**

- Create: `src/infrastructure/rules/ofm/callouts/shared/CalloutTypeRegistry.ts`
- Create: `tests/unit/rules/callouts/shared/CalloutTypeRegistry.test.ts`

- [ ] **Implement**

```ts
import type { CalloutConfig } from "../../../../../domain/config/LinterConfig.js";

export interface CalloutTypeRegistry {
  has(type: string): boolean;
}

/**
 * Merge the config allowList with the built-in set, normalising case
 * according to `config.caseSensitive`.
 */
export function buildCalloutTypeRegistry(config: CalloutConfig): CalloutTypeRegistry {
  const set = new Set(
    config.allowList.map((t) => (config.caseSensitive ? t : t.toUpperCase())),
  );
  return {
    has(type: string): boolean {
      const key = config.caseSensitive ? type : type.toUpperCase();
      return set.has(key);
    },
  };
}
```

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/callouts/shared/ \
        tests/unit/rules/callouts/shared/
git commit -m "feat(rules): add CalloutTypeRegistry"
```

---

### Task 12: OFM040 — unknown-callout-type

**Files:**

- Create: `src/infrastructure/rules/ofm/callouts/OFM040-unknown-callout-type.ts`
- Create: `tests/unit/rules/callouts/OFM040.test.ts`

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { buildCalloutTypeRegistry } from "./shared/CalloutTypeRegistry.js";

export const OFM040Rule: OFMRule = {
  names: ["OFM040", "unknown-callout-type"],
  description: "Callout type is not in the allowList",
  tags: ["callouts"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    const registry = buildCalloutTypeRegistry(config.callouts);
    for (const callout of parsed.callouts) {
      if (!registry.has(callout.type)) {
        onError({
          line: callout.position.line,
          column: callout.position.column,
          message: `Unknown callout type "${callout.type}"`,
        });
      }
    }
  },
};
```

- [ ] **Test** — mirror the BDD callout scenarios:
  - `> [!NOTE] x` → pass
  - `> [!CUSTOM] x` with default allowList → fail
  - `> [!CUSTOM] x` with `allowList: ["CUSTOM", "NOTE", ...]` → pass

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/callouts/OFM040-unknown-callout-type.ts \
        tests/unit/rules/callouts/OFM040.test.ts
git commit -m "feat(rules): OFM040 unknown-callout-type"
```

---

### Task 13: OFM041 — malformed-callout

**Files:**

- Create: `src/infrastructure/rules/ofm/callouts/OFM041-malformed-callout.ts`
- Create: `tests/unit/rules/callouts/OFM041.test.ts`

Detects lines that look like a callout header but are missing the `[!TYPE]` form, e.g. `> [!NOTE]Title` (missing space), `> [!] Title`, `> [ NOTE ] Title`.

- [ ] **Implement**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

const LOOKS_LIKE_HEADER = /^>\s*\[/;
const STRICT_HEADER = /^>\s*\[!([A-Za-z][A-Za-z0-9-]*)\][+-]?(\s.*)?$/;

export const OFM041Rule: OFMRule = {
  names: ["OFM041", "malformed-callout"],
  description: "Line looks like a callout header but does not parse",
  tags: ["callouts", "syntax"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    parsed.lines.forEach((line, i) => {
      if (!LOOKS_LIKE_HEADER.test(line)) return;
      if (STRICT_HEADER.test(line)) return;
      onError({
        line: i + 1,
        column: 1,
        message: `Malformed callout header: "${line.trim()}"`,
      });
    });
  },
};
```

- [ ] **Test** — 5 rows: 2 valid, 3 malformed.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/callouts/OFM041-malformed-callout.ts \
        tests/unit/rules/callouts/OFM041.test.ts
git commit -m "feat(rules): OFM041 malformed-callout"
```

---

### Task 14: OFM042 — empty-callout / OFM043 — callout-in-list / OFM044 — callout-fold-on-note

**Files:**

- Create: `src/infrastructure/rules/ofm/callouts/OFM042-empty-callout.ts`
- Create: `src/infrastructure/rules/ofm/callouts/OFM043-callout-in-list.ts`
- Create: `src/infrastructure/rules/ofm/callouts/OFM044-callout-fold-on-note.ts`
- Create: `tests/unit/rules/callouts/OFM04[234].test.ts`

- [ ] **OFM042 empty-callout**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

export const OFM042Rule: OFMRule = {
  names: ["OFM042", "empty-callout"],
  description: "Callout has no title and no body",
  tags: ["callouts"],
  severity: "warning",
  fixable: false,
  run({ parsed, config }, onError) {
    for (const callout of parsed.callouts) {
      const titleEmpty = callout.title.trim().length === 0;
      const bodyEmpty = callout.bodyLines.every((l) => l.trim().length === 0);
      if (titleEmpty && bodyEmpty) {
        onError({
          line: callout.position.line,
          column: callout.position.column,
          message: "Callout has no title and no body content",
        });
      } else if (titleEmpty && config.callouts.requireTitle) {
        onError({
          line: callout.position.line,
          column: callout.position.column,
          message: "Callout title is required by config",
        });
      }
    }
  },
};
```

- [ ] **OFM043 callout-in-list** — OFM requires a blank line before a callout. Warn when the previous line is a list item.

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

const LIST_LINE = /^(\s*[-*+]|\s*\d+\.)/;

export const OFM043Rule: OFMRule = {
  names: ["OFM043", "callout-in-list"],
  description: "Callout directly follows a list item without a blank line",
  tags: ["callouts", "style"],
  severity: "warning",
  fixable: false,
  run({ parsed }, onError) {
    for (const callout of parsed.callouts) {
      const prev = parsed.lines[callout.position.line - 2];
      if (prev !== undefined && LIST_LINE.test(prev)) {
        onError({
          line: callout.position.line,
          column: callout.position.column,
          message: "Callout immediately follows a list item; add a blank line before it",
        });
      }
    }
  },
};
```

- [ ] **OFM044 callout-fold-on-note** — warn when a foldable marker is used on a type from the informational subset (`NOTE`, `INFO`, `TIP`) and `allowFold` is `false`.

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

const INFORMATIONAL = new Set(["NOTE", "INFO", "TIP", "HINT"]);

export const OFM044Rule: OFMRule = {
  names: ["OFM044", "callout-fold-disabled"],
  description: "Foldable marker used on an informational callout",
  tags: ["callouts", "style"],
  severity: "warning",
  fixable: true,
  run({ parsed, config }, onError) {
    if (config.callouts.allowFold) return;
    for (const callout of parsed.callouts) {
      if (callout.foldable === "none") continue;
      if (INFORMATIONAL.has(callout.type)) {
        onError({
          line: callout.position.line,
          column: callout.position.column,
          message: `Informational callout "${callout.type}" should not be foldable`,
        });
      }
    }
  },
};
```

- [ ] **Write valid/invalid tests** for the three.

- [ ] **Run + Commit**

```bash
git add src/infrastructure/rules/ofm/callouts/OFM04[234]-*.ts \
        tests/unit/rules/callouts/OFM04[234].test.ts
git commit -m "feat(rules): OFM042 empty-callout, OFM043 callout-in-list, OFM044 fold-on-note"
```

---

### Task 15: Register embed + callout rules

**Files:**

- Modify: `src/infrastructure/rules/ofm/registerBuiltin.ts`

- [ ] **Append imports for OFM020–025 and OFM040–044**. Extend `ALL`.

- [ ] **Run + Commit**

```bash
npm run test
git add src/infrastructure/rules/ofm/registerBuiltin.ts
git commit -m "feat(rules): register Phase 5 embed and callout rules"
```

---

### Task 16: Integration tests — embeds + callouts

**Files:**

- Create: `tests/fixtures/rules/embeds/image.png` (empty file is fine)
- Create: `tests/fixtures/rules/embeds/valid.md`, `broken.md`, `invalid-size.md`
- Create: `tests/fixtures/rules/callouts/valid.md`, `unknown.md`, `custom.md`
- Create: `tests/integration/rules/embeds-integration.test.ts`
- Create: `tests/integration/rules/callouts-integration.test.ts`

- [ ] **`embeds-integration.test.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

let vault: string;
beforeEach(async () => {
  vault = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-em-int-"));
  await fs.mkdir(path.join(vault, ".obsidian"), { recursive: true });
  await fs.writeFile(path.join(vault, "image.png"), "fake");
});
afterEach(async () => {
  await fs.rm(vault, { recursive: true, force: true });
});

describe("embeds integration", () => {
  it("valid image embed passes", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "![[image.png]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(0);
  });

  it("missing asset reports OFM022", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "![[missing.png]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM022");
  });

  it("disallowed extension reports OFM024", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "![[script.exe]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM024");
  });
});
```

- [ ] **`callouts-integration.test.ts`** — mirrors the 3 BDD callout scenarios via `spawnCli`.

- [ ] **Run + Commit**

```bash
npm run test -- tests/integration/rules/embeds-integration.test.ts tests/integration/rules/callouts-integration.test.ts
git add tests/fixtures/rules/embeds tests/fixtures/rules/callouts tests/integration/rules
git commit -m "test(rules): embed + callout integration tests"
```

---

### Task 17: Green callouts.feature + add embeds.feature

**Files:**

- Modify: `docs/bdd/steps/file-steps.ts`
- Create: `docs/bdd/features/embeds.feature`

- [ ] **Add missing steps**

```ts
Given("the config allowList is {string}", async function (this: OFMWorld, listJson: string) {
  if (!this.vaultDir) await this.initVault();
  const list = JSON.parse(listJson) as string[];
  const cfg = { callouts: { allowList: list, caseSensitive: false, requireTitle: false, allowFold: true } };
  await this.writeFile(".obsidian-linter.jsonc", JSON.stringify(cfg));
});

Given("the config allowList includes {string}", async function (this: OFMWorld, extra: string) {
  if (!this.vaultDir) await this.initVault();
  const defaults = ["NOTE", "WARNING", "TIP", "IMPORTANT", "CAUTION"];
  const cfg = {
    callouts: { allowList: [...defaults, extra], caseSensitive: false, requireTitle: false, allowFold: true },
  };
  await this.writeFile(".obsidian-linter.jsonc", JSON.stringify(cfg));
});
```

- [ ] **Write `embeds.feature`**

```gherkin
Feature: Embed linting

  Scenario: Missing asset reports OFM022
    Given a vault with a file "notes/index.md"
    And a file "notes/index.md" containing "![[missing.png]]"
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 1
    And error OFM022 is reported on line 1

  Scenario: Disallowed extension reports OFM024
    Given a file "notes/index.md" containing "![[script.exe]]"
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 1
    And error OFM024 is reported on line 1

  Scenario: Valid markdown embed passes
    Given a vault with a file "notes/target.md"
    And a file "notes/index.md" containing "![[target]]"
    When I run markdownlint-obsidian on "notes/index.md"
    Then the exit code is 0
```

- [ ] **Run both features**

```bash
npm run test:bdd -- docs/bdd/features/callouts.feature docs/bdd/features/embeds.feature
```

- [ ] **Commit**

```bash
git add docs/bdd/features/embeds.feature docs/bdd/steps/file-steps.ts
git commit -m "feat(bdd): green callouts.feature and add embeds.feature"
```

---

### Task 18: Rule documentation pages

**Files:**

- Create: 11 pages under `docs/rules/embeds/` and `docs/rules/callouts/`
- Modify: `docs/rules/index.md`

- [ ] **Write pages using the Phase 3 template**

- [ ] **Dogfood** `cd docs && node ../bin/markdownlint-obsidian.js "**/*.md"` — fix fresh violations.

- [ ] **Commit**

```bash
git add docs/rules
git commit -m "docs(rules): Phase 5 catalog pages"
```

---

### Task 19: Phase 5 verification

- [ ] **Full run**

```bash
npm run test:all
```

- [ ] **Coverage** — all new layers ≥ 85%.

- [ ] **Final commit**

```bash
git add -A
git commit -m "chore: Phase 5 complete — embeds OFM020-025 and callouts OFM040-044"
```

---

## Phase 5 acceptance criteria

- `FileExistenceChecker` is injected via `RuleParams`; rules never touch `node:fs` directly.
- Rule run signatures may return `Promise<void>`; `LintUseCase` awaits every rule.
- 11 new rules (OFM020–OFM025, OFM040–OFM044) registered. OFM003 stays disabled; OFM025, OFM043, OFM044 are warnings.
- `callouts.feature` and `embeds.feature` both green.
- Embed size hints, extension allowlist, and callout allowlist are all driven from `LinterConfig`.
- Coverage targets met on all new layers.
