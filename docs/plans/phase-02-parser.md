# Phase 2: Parser Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the parsing pipeline that turns a `.md` file on disk into a fully typed `ParseResult` holding frontmatter, markdown-it tokens, and all OFM-specific nodes (wikilinks, embeds, tags, callouts, block refs, highlights, comments). Integrate the pipeline into `LintUseCase` so every file is parsed before rules run. Ship one synthetic rule (`OFM902` — frontmatter-parse-error) to prove the pipeline is wired end-to-end, and tag the BDD smoke scenario so a CI gate exists.

**Architecture:** The `domain/parsing/` layer owns the pure value objects: `ParseResult`, `WikilinkNode`, `EmbedNode`, `CalloutNode`, `TagNode`, `BlockRefNode`, `HighlightNode`, `CommentNode`. Parsing itself is an *infrastructure* concern: `MarkdownItParser` adapts `markdown-it` to a `Parser` interface defined in the domain, and `FrontmatterParser` adapts `gray-matter`. OFM syntax (wikilinks, embeds, tags, etc.) is extracted by deterministic line-oriented regex scanners in `infrastructure/parser/ofm/` — this avoids the fragile plugin ecosystem while preserving the `ParseResult` contract from the design spec. The application layer's `LintUseCase` gains a new orchestration step: read → parse → run rules → produce `LintResult`.

**Tech Stack:** `markdown-it` 14, `@types/markdown-it`, `gray-matter` 4, plus the Phase 1 stack. No plugin dependencies.

**Design deviations from the spec:** the spec names several `markdown-it-*` plugins. We do not use them. They are unmaintained, type-unfriendly, and their token shapes leak across tests. Instead we use `markdown-it` core for CommonMark tokens (needed for Phase 7's standard-md integration) and custom regex scanners per OFM node type. The public `ParseResult` contract is unchanged. This decision is recorded in `docs/adr/ADR004-ofm-regex-over-plugins.md` as part of Task 1.

---

## File Map

```
docs/
  adr/
    ADR004-ofm-regex-over-plugins.md         New ADR: why regex over plugins
src/
  domain/
    parsing/
      ParseResult.ts                         Aggregate VO: frontmatter, tokens, OFM nodes, raw, lines
      Parser.ts                              Interface (DIP): parse(path, content) -> ParseResult
      WikilinkNode.ts                        VO: target, alias, heading, blockRef, line, col, isEmbed
      EmbedNode.ts                           VO: target, width, height, line, col
      CalloutNode.ts                         VO: type, title, line, column, bodyLines
      TagNode.ts                             VO: value, line, column (e.g. "project/meta")
      BlockRefNode.ts                        VO: blockId, line, column (^blockid)
      HighlightNode.ts                       VO: text, line, column
      CommentNode.ts                         VO: text, line, column (%%...%%)
      SourcePosition.ts                      Shared: { line, column } with 1-based invariant
  infrastructure/
    parser/
      MarkdownItParser.ts                    Adapter: orchestrates frontmatter + tokens + OFM extractors
      FrontmatterParser.ts                   Adapter: gray-matter -> frontmatter + body + bodyOffset
      ofm/
        WikilinkExtractor.ts                 Scan lines for [[target|alias#heading^block]] / ![[embed]]
        EmbedExtractor.ts                    Extract ![[...]] subset with width/height parameters
        CalloutExtractor.ts                  Scan for "> [!TYPE] Title" + follow-on "> " lines
        TagExtractor.ts                      Scan body for #tag / #nested/tag (skip code blocks)
        BlockRefExtractor.ts                 Scan for trailing ^blockid
        HighlightExtractor.ts                Scan for ==highlighted== (skip code/math)
        CommentExtractor.ts                  Scan for %%...%% (multi-line)
        CodeRegionMap.ts                     Precompute fenced/inline code regions to exclude
    rules/
      ofm/
        system/
          FrontmatterParseError.ts           OFM902 rule — fires when FrontmatterParser throws
        registerBuiltin.ts                   Registers all built-in rules with a RuleRegistry
    io/
      FileReader.ts                          Adapter: read file content + line split (BOM, CRLF safe)
  application/
    LintUseCase.ts                           UPDATED: wire Parser + ruleRegistry iteration
tests/
  unit/
    domain/parsing/                          One test file per VO
    parser/                                  Adapter + extractor tests
    rules/FrontmatterParseError.test.ts
    io/FileReader.test.ts
    application/LintUseCase.parser.test.ts   Updated: runs registered rule against parsed file
  integration/parser/full-parse.test.ts      Real .md fixture exercising every OFM node type
  fixtures/parser/
    all-ofm-nodes.md                         One file with every OFM construct
    frontmatter-broken.md                    Malformed YAML frontmatter for OFM902 test
    clean.md                                 No OFM content
docs/
  bdd/features/parser-pipeline.feature       New feature: broken frontmatter -> OFM902
```

---

### Task 1: Record the OFM regex-vs-plugin ADR

**Files:**
- Create: `docs/adr/ADR004-ofm-regex-over-plugins.md`

- [ ] **Write the ADR**

```markdown
# ADR004 — Use regex extractors for OFM syntax instead of markdown-it plugins

**Status:** Accepted
**Date:** 2026-04-11
**Context phase:** Phase 2 (parser pipeline)

## Context

The design spec lists `markdown-it-wikilinks`, `markdown-it-obsidian-tags`,
`markdown-it-callout`, `markdown-it-highlight`, and `markdown-it-comment` as
plugins that produce ParseResult content. These plugins are partially
unmaintained, carry inconsistent type definitions, and emit token shapes that
would leak into every rule's implementation. Phase 7 requires markdown-it for
standard-md rule integration — we cannot drop markdown-it entirely.

## Decision

Use `markdown-it` core (no OFM plugins) for CommonMark tokens. Implement OFM
syntax extraction as a set of deterministic line-oriented scanners under
`infrastructure/parser/ofm/`. Every scanner takes the raw file as a
`readonly string[]` (one entry per line) plus a `CodeRegionMap` (precomputed
set of lines/columns that are inside fenced or inline code and must be
skipped) and returns a `readonly Node[]` of the appropriate domain type.

## Consequences

- **Pro:** Deterministic output; trivially unit-testable against string
  fixtures; no plugin version drift; code/math exclusion handled once for all
  node types.
- **Pro:** The public `ParseResult` contract is unchanged. Rules remain
  unaware of the extraction mechanism.
- **Con:** Any future OFM syntax addition requires a new extractor instead
  of adding a plugin. Acceptable — Obsidian's OFM syntax evolves slowly.
- **Con:** We cannot piggy-back on plugin-provided sourcemap tokens for the
  affected node types. We synthesize `SourcePosition` from regex match
  offsets instead.

## Related

- [[roadmap]]
- [[plans/phase-02-parser]]
- [[superpowers/specs/2026-04-11-markdownlint-obsidian-design]]
```

- [ ] **Commit**

```bash
git add docs/adr/ADR004-ofm-regex-over-plugins.md
git commit -m "docs(adr): record ADR004 OFM regex extractors over plugins"
```

---

### Task 2: Install parser dependencies

**Files:**
- Modify: `package.json`

- [ ] **Install runtime deps**

```bash
npm install markdown-it gray-matter
npm install --save-dev @types/markdown-it
```

- [ ] **Verify `package.json` dependencies block now includes**

```json
"markdown-it": "^14.0.0",
"gray-matter": "^4.0.3"
```

and devDependencies:

```json
"@types/markdown-it": "^14.0.0"
```

- [ ] **Typecheck**

```bash
npm run typecheck
```

Expected: exits 0.

- [ ] **Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add markdown-it and gray-matter"
```

---

### Task 3: SourcePosition shared value object

**Files:**
- Create: `src/domain/parsing/SourcePosition.ts`
- Create: `tests/unit/domain/parsing/SourcePosition.test.ts`

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { makeSourcePosition } from "../../../../src/domain/parsing/SourcePosition.js";

describe("SourcePosition", () => {
  it("creates a frozen 1-based position", () => {
    const p = makeSourcePosition(3, 7);
    expect(p.line).toBe(3);
    expect(p.column).toBe(7);
    expect(Object.isFrozen(p)).toBe(true);
  });

  it("rejects non-positive line or column", () => {
    expect(() => makeSourcePosition(0, 1)).toThrow(/line/);
    expect(() => makeSourcePosition(1, 0)).toThrow(/column/);
    expect(() => makeSourcePosition(-1, 1)).toThrow(/line/);
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `SourcePosition.ts`**

```ts
/**
 * 1-based source position, shared by every OFM parse node.
 * Immutable; both line and column must be positive.
 */
export interface SourcePosition {
  readonly line: number;
  readonly column: number;
}

export function makeSourcePosition(line: number, column: number): SourcePosition {
  if (!Number.isInteger(line) || line < 1) {
    throw new Error(`SourcePosition.line must be a positive integer, got ${line}`);
  }
  if (!Number.isInteger(column) || column < 1) {
    throw new Error(`SourcePosition.column must be a positive integer, got ${column}`);
  }
  return Object.freeze({ line, column });
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/domain/parsing/SourcePosition.ts tests/unit/domain/parsing/SourcePosition.test.ts
git commit -m "feat(domain): add SourcePosition value object"
```

---

### Task 4: WikilinkNode value object

**Files:**
- Create: `src/domain/parsing/WikilinkNode.ts`
- Create: `tests/unit/domain/parsing/WikilinkNode.test.ts`

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { makeWikilinkNode } from "../../../../src/domain/parsing/WikilinkNode.js";

describe("WikilinkNode", () => {
  it("creates a plain wikilink", () => {
    const n = makeWikilinkNode({
      target: "index",
      alias: null,
      heading: null,
      blockRef: null,
      position: { line: 2, column: 5 },
      isEmbed: false,
      raw: "[[index]]",
    });
    expect(n.target).toBe("index");
    expect(n.isEmbed).toBe(false);
    expect(Object.isFrozen(n)).toBe(true);
  });

  it("holds alias, heading, and block reference parts", () => {
    const n = makeWikilinkNode({
      target: "notes/project",
      alias: "display",
      heading: "intro",
      blockRef: "abc123",
      position: { line: 1, column: 1 },
      isEmbed: false,
      raw: "[[notes/project#intro^abc123|display]]",
    });
    expect(n.alias).toBe("display");
    expect(n.heading).toBe("intro");
    expect(n.blockRef).toBe("abc123");
  });

  it("rejects empty target", () => {
    expect(() =>
      makeWikilinkNode({
        target: "",
        alias: null, heading: null, blockRef: null,
        position: { line: 1, column: 1 }, isEmbed: false, raw: "[[]]",
      }),
    ).toThrow(/target/);
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `WikilinkNode.ts`**

```ts
import type { SourcePosition } from "./SourcePosition.js";

/**
 * A parsed wikilink: `[[target]]`, `[[target|alias]]`,
 * `[[target#heading]]`, `[[target#^blockref]]`, `![[embed]]`.
 * Immutable.
 */
export interface WikilinkNode {
  readonly target: string;
  readonly alias: string | null;
  readonly heading: string | null;
  readonly blockRef: string | null;
  readonly position: SourcePosition;
  readonly isEmbed: boolean;
  readonly raw: string;
}

export function makeWikilinkNode(fields: WikilinkNode): WikilinkNode {
  if (fields.target.length === 0) {
    throw new Error("WikilinkNode.target must not be empty");
  }
  return Object.freeze({ ...fields });
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/domain/parsing/WikilinkNode.ts tests/unit/domain/parsing/WikilinkNode.test.ts
git commit -m "feat(domain): add WikilinkNode value object"
```

---

### Task 5: Remaining parse node value objects

**Files:**
- Create: `src/domain/parsing/EmbedNode.ts`
- Create: `src/domain/parsing/CalloutNode.ts`
- Create: `src/domain/parsing/TagNode.ts`
- Create: `src/domain/parsing/BlockRefNode.ts`
- Create: `src/domain/parsing/HighlightNode.ts`
- Create: `src/domain/parsing/CommentNode.ts`
- Create: `tests/unit/domain/parsing/EmbedNode.test.ts`
- Create: `tests/unit/domain/parsing/CalloutNode.test.ts`
- Create: `tests/unit/domain/parsing/TagNode.test.ts`
- Create: `tests/unit/domain/parsing/BlockRefNode.test.ts`
- Create: `tests/unit/domain/parsing/HighlightNode.test.ts`
- Create: `tests/unit/domain/parsing/CommentNode.test.ts`

Each node is a small frozen VO following the same pattern as `WikilinkNode`. Write one failing test per file, run, then implement. Commit after all six pass.

- [ ] **Write `EmbedNode.ts`**

```ts
import type { SourcePosition } from "./SourcePosition.js";

/**
 * Obsidian file transclusion: `![[file]]`, `![[file|500]]`, `![[file|500x300]]`.
 * `width`/`height` hold the pipe-delimited sizing hint when present.
 */
export interface EmbedNode {
  readonly target: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly position: SourcePosition;
  readonly raw: string;
}

export function makeEmbedNode(fields: EmbedNode): EmbedNode {
  if (fields.target.length === 0) {
    throw new Error("EmbedNode.target must not be empty");
  }
  return Object.freeze({ ...fields });
}
```

Test:
```ts
import { describe, it, expect } from "vitest";
import { makeEmbedNode } from "../../../../src/domain/parsing/EmbedNode.js";

describe("EmbedNode", () => {
  it("holds width and height sizing hints", () => {
    const n = makeEmbedNode({
      target: "image.png",
      width: 500, height: 300,
      position: { line: 1, column: 1 }, raw: "![[image.png|500x300]]",
    });
    expect(n.width).toBe(500);
    expect(n.height).toBe(300);
  });
});
```

- [ ] **Write `CalloutNode.ts`**

```ts
import type { SourcePosition } from "./SourcePosition.js";

/**
 * Obsidian admonition block: `> [!TYPE] Title` plus `> ` continuation lines.
 * `type` is stored uppercased; `title` is the trimmed text after the type tag.
 */
export interface CalloutNode {
  readonly type: string;
  readonly title: string;
  readonly position: SourcePosition;
  readonly bodyLines: readonly string[];
  readonly foldable: "none" | "open" | "closed";
}

export function makeCalloutNode(fields: CalloutNode): CalloutNode {
  if (fields.type.length === 0) {
    throw new Error("CalloutNode.type must not be empty");
  }
  return Object.freeze({
    ...fields,
    bodyLines: Object.freeze([...fields.bodyLines]) as readonly string[],
  });
}
```

Test:
```ts
import { describe, it, expect } from "vitest";
import { makeCalloutNode } from "../../../../src/domain/parsing/CalloutNode.js";

describe("CalloutNode", () => {
  it("freezes bodyLines", () => {
    const n = makeCalloutNode({
      type: "NOTE", title: "Heading",
      position: { line: 4, column: 1 },
      bodyLines: ["first", "second"],
      foldable: "none",
    });
    expect(Object.isFrozen(n.bodyLines)).toBe(true);
    expect(n.bodyLines).toHaveLength(2);
  });
});
```

- [ ] **Write `TagNode.ts`**

```ts
import type { SourcePosition } from "./SourcePosition.js";

/**
 * Obsidian tag occurrence in body text: `#tag` or `#nested/tag`.
 * `value` excludes the leading `#`.
 */
export interface TagNode {
  readonly value: string;
  readonly position: SourcePosition;
  readonly raw: string;
}

export function makeTagNode(fields: TagNode): TagNode {
  if (fields.value.length === 0) {
    throw new Error("TagNode.value must not be empty");
  }
  if (fields.value.startsWith("#")) {
    throw new Error("TagNode.value must not include leading #");
  }
  return Object.freeze({ ...fields });
}
```

- [ ] **Write `BlockRefNode.ts`**

```ts
import type { SourcePosition } from "./SourcePosition.js";

/**
 * An anchor block reference definition on a line: `Some content ^blockid`.
 * Obsidian allows one per line at the end of a block.
 */
export interface BlockRefNode {
  readonly blockId: string;
  readonly position: SourcePosition;
}

const BLOCK_ID_PATTERN = /^[A-Za-z0-9-]+$/;

export function makeBlockRefNode(fields: BlockRefNode): BlockRefNode {
  if (!BLOCK_ID_PATTERN.test(fields.blockId)) {
    throw new Error(`BlockRefNode.blockId invalid: ${fields.blockId}`);
  }
  return Object.freeze({ ...fields });
}
```

- [ ] **Write `HighlightNode.ts`**

```ts
import type { SourcePosition } from "./SourcePosition.js";

/** A `==highlighted==` span. `text` excludes the delimiters. */
export interface HighlightNode {
  readonly text: string;
  readonly position: SourcePosition;
}

export function makeHighlightNode(fields: HighlightNode): HighlightNode {
  return Object.freeze({ ...fields });
}
```

- [ ] **Write `CommentNode.ts`**

```ts
import type { SourcePosition } from "./SourcePosition.js";

/** An Obsidian comment region `%%text%%`. May span multiple lines. */
export interface CommentNode {
  readonly text: string;
  readonly position: SourcePosition;
  readonly endPosition: SourcePosition;
}

export function makeCommentNode(fields: CommentNode): CommentNode {
  return Object.freeze({ ...fields });
}
```

Write an analogous `*.test.ts` for each (one to three assertions each — freeze check, happy-path factory, domain invariant rejection).

- [ ] **Run all new domain tests — expect PASS**

```bash
npm run test -- tests/unit/domain/parsing
```

- [ ] **Commit**

```bash
git add src/domain/parsing/ tests/unit/domain/parsing/
git commit -m "feat(domain): add EmbedNode, CalloutNode, TagNode, BlockRefNode, HighlightNode, CommentNode"
```

---

### Task 6: ParseResult aggregate

**Files:**
- Create: `src/domain/parsing/ParseResult.ts`
- Create: `tests/unit/domain/parsing/ParseResult.test.ts`

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { makeParseResult } from "../../../../src/domain/parsing/ParseResult.js";

describe("ParseResult", () => {
  it("freezes every array field", () => {
    const r = makeParseResult({
      filePath: "notes/index.md",
      frontmatter: { tags: ["project"] },
      frontmatterRaw: "tags: [project]",
      frontmatterEndLine: 3,
      tokens: [],
      wikilinks: [],
      embeds: [],
      callouts: [],
      tags: [],
      blockRefs: [],
      highlights: [],
      comments: [],
      raw: "# hi",
      lines: ["# hi"],
    });
    expect(Object.isFrozen(r.wikilinks)).toBe(true);
    expect(Object.isFrozen(r.lines)).toBe(true);
    expect(Object.isFrozen(r)).toBe(true);
  });

  it("rejects line count mismatch vs raw", () => {
    expect(() =>
      makeParseResult({
        filePath: "x.md",
        frontmatter: {},
        frontmatterRaw: null,
        frontmatterEndLine: 0,
        tokens: [],
        wikilinks: [],
        embeds: [],
        callouts: [],
        tags: [],
        blockRefs: [],
        highlights: [],
        comments: [],
        raw: "a\nb\nc",
        lines: ["a", "b"],
      }),
    ).toThrow(/line count/);
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `ParseResult.ts`**

```ts
import type { WikilinkNode } from "./WikilinkNode.js";
import type { EmbedNode } from "./EmbedNode.js";
import type { CalloutNode } from "./CalloutNode.js";
import type { TagNode } from "./TagNode.js";
import type { BlockRefNode } from "./BlockRefNode.js";
import type { HighlightNode } from "./HighlightNode.js";
import type { CommentNode } from "./CommentNode.js";

/**
 * The fully parsed contents of one Markdown file.
 *
 * `tokens` is the raw markdown-it Token[] kept as `unknown[]` at the domain
 * boundary so the domain layer has zero dependency on markdown-it types.
 * Infrastructure consumers cast to `Token[]` where they need to.
 */
export interface ParseResult {
  readonly filePath: string;
  readonly frontmatter: Readonly<Record<string, unknown>>;
  readonly frontmatterRaw: string | null;
  /** 1-based line number where frontmatter ends; 0 if no frontmatter. */
  readonly frontmatterEndLine: number;
  readonly tokens: readonly unknown[];
  readonly wikilinks: readonly WikilinkNode[];
  readonly embeds: readonly EmbedNode[];
  readonly callouts: readonly CalloutNode[];
  readonly tags: readonly TagNode[];
  readonly blockRefs: readonly BlockRefNode[];
  readonly highlights: readonly HighlightNode[];
  readonly comments: readonly CommentNode[];
  readonly raw: string;
  readonly lines: readonly string[];
}

export function makeParseResult(fields: ParseResult): ParseResult {
  const rawLineCount = fields.raw === "" ? 0 : fields.raw.split(/\r?\n/).length;
  if (rawLineCount !== fields.lines.length && fields.raw !== "") {
    throw new Error(
      `ParseResult line count mismatch: raw has ${rawLineCount}, lines has ${fields.lines.length}`,
    );
  }
  return Object.freeze({
    ...fields,
    tokens: Object.freeze([...fields.tokens]),
    wikilinks: Object.freeze([...fields.wikilinks]),
    embeds: Object.freeze([...fields.embeds]),
    callouts: Object.freeze([...fields.callouts]),
    tags: Object.freeze([...fields.tags]),
    blockRefs: Object.freeze([...fields.blockRefs]),
    highlights: Object.freeze([...fields.highlights]),
    comments: Object.freeze([...fields.comments]),
    lines: Object.freeze([...fields.lines]),
  });
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/domain/parsing/ParseResult.ts tests/unit/domain/parsing/ParseResult.test.ts
git commit -m "feat(domain): add ParseResult aggregate"
```

---

### Task 7: Parser interface (DIP boundary)

**Files:**
- Create: `src/domain/parsing/Parser.ts`

- [ ] **Implement `Parser.ts`**

```ts
import type { ParseResult } from "./ParseResult.js";

/**
 * Application-facing parser contract. Implementations live in
 * `infrastructure/parser/`. Domain code depends on this interface only.
 */
export interface Parser {
  /**
   * Parse a file's raw content into a ParseResult.
   * Must never throw for syntactically invalid OFM — the extractors are
   * tolerant. May throw for I/O errors at the caller's layer, not here.
   */
  parse(filePath: string, content: string): ParseResult;
}
```

- [ ] **Typecheck**

```bash
npm run typecheck
```

Expected: exits 0.

- [ ] **Commit**

```bash
git add src/domain/parsing/Parser.ts
git commit -m "feat(domain): add Parser interface (DIP boundary)"
```

---

### Task 8: CodeRegionMap — exclude fenced and inline code

**Files:**
- Create: `src/infrastructure/parser/ofm/CodeRegionMap.ts`
- Create: `tests/unit/parser/ofm/CodeRegionMap.test.ts`

Extractors must not pick up OFM syntax inside fenced code blocks or inline code. `CodeRegionMap` precomputes forbidden line ranges + inline code column spans so each extractor asks one question: "is (line, col) inside code?".

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildCodeRegionMap } from "../../../../src/infrastructure/parser/ofm/CodeRegionMap.js";

describe("CodeRegionMap", () => {
  it("marks fenced block lines as code", () => {
    const lines = [
      "text",
      "```",
      "inside",
      "```",
      "after",
    ];
    const map = buildCodeRegionMap(lines);
    expect(map.isInCode(1, 1)).toBe(false);
    expect(map.isInCode(2, 1)).toBe(true);
    expect(map.isInCode(3, 1)).toBe(true);
    expect(map.isInCode(4, 1)).toBe(true);
    expect(map.isInCode(5, 1)).toBe(false);
  });

  it("marks inline code spans", () => {
    const lines = ["hello `code here` world"];
    const map = buildCodeRegionMap(lines);
    expect(map.isInCode(1, 1)).toBe(false);
    expect(map.isInCode(1, 8)).toBe(true);
    expect(map.isInCode(1, 15)).toBe(true);
    expect(map.isInCode(1, 19)).toBe(false);
  });

  it("handles tilde fences", () => {
    const lines = ["~~~", "code", "~~~"];
    const map = buildCodeRegionMap(lines);
    expect(map.isInCode(2, 1)).toBe(true);
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `CodeRegionMap.ts`**

```ts
/**
 * Precomputes positions covered by fenced code blocks and inline code spans
 * so OFM extractors can skip them in O(1) lookups.
 *
 * The map is permissive: if any heuristic flags a position as code, every
 * extractor treats it as code.
 */
export interface CodeRegionMap {
  isInCode(line: number, column: number): boolean;
}

const FENCE_PATTERN = /^(\s*)(`{3,}|~{3,})/;

interface InlineSpan {
  readonly line: number;
  readonly start: number;
  readonly end: number;
}

export function buildCodeRegionMap(lines: readonly string[]): CodeRegionMap {
  const blockLines = new Set<number>();
  const inline: InlineSpan[] = [];
  let fence: string | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const match = FENCE_PATTERN.exec(line);
    if (fence) {
      blockLines.add(i + 1);
      if (match && line.trim().startsWith(fence)) {
        fence = null;
      }
      continue;
    }
    if (match) {
      fence = match[2] ?? null;
      blockLines.add(i + 1);
      continue;
    }
    collectInlineSpans(line, i + 1, inline);
  }

  return {
    isInCode(line, column) {
      if (blockLines.has(line)) return true;
      for (const span of inline) {
        if (span.line === line && column >= span.start && column <= span.end) {
          return true;
        }
      }
      return false;
    },
  };
}

function collectInlineSpans(line: string, lineNumber: number, out: InlineSpan[]): void {
  let open: number | null = null;
  for (let col = 1; col <= line.length; col += 1) {
    if (line.charAt(col - 1) !== "`") continue;
    if (open === null) {
      open = col;
    } else {
      out.push({ line: lineNumber, start: open, end: col });
      open = null;
    }
  }
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/infrastructure/parser/ofm/CodeRegionMap.ts tests/unit/parser/ofm/CodeRegionMap.test.ts
git commit -m "feat(parser): add CodeRegionMap for fenced + inline code exclusion"
```

---

### Task 9: WikilinkExtractor

**Files:**
- Create: `src/infrastructure/parser/ofm/WikilinkExtractor.ts`
- Create: `tests/unit/parser/ofm/WikilinkExtractor.test.ts`

Grammar implemented:

```
wikilink  := "[[" target ("#" heading)? ("^" block)? ("|" alias)? "]]"
embed     := "!" wikilink
```

- [ ] **Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { extractWikilinks } from "../../../../src/infrastructure/parser/ofm/WikilinkExtractor.js";
import { buildCodeRegionMap } from "../../../../src/infrastructure/parser/ofm/CodeRegionMap.js";

function extract(src: string) {
  const lines = src.split("\n");
  return extractWikilinks(lines, buildCodeRegionMap(lines));
}

describe("WikilinkExtractor", () => {
  it("finds a plain wikilink", () => {
    const out = extract("see [[index]] for more");
    expect(out).toHaveLength(1);
    expect(out[0]?.target).toBe("index");
    expect(out[0]?.isEmbed).toBe(false);
  });

  it("parses alias, heading, and block parts", () => {
    const out = extract("[[notes/project#intro^abc-123|display]]");
    expect(out).toHaveLength(1);
    expect(out[0]?.target).toBe("notes/project");
    expect(out[0]?.heading).toBe("intro");
    expect(out[0]?.blockRef).toBe("abc-123");
    expect(out[0]?.alias).toBe("display");
  });

  it("marks embed links", () => {
    const out = extract("![[image.png]]");
    expect(out).toHaveLength(1);
    expect(out[0]?.isEmbed).toBe(true);
  });

  it("skips wikilinks inside code fences", () => {
    const src = [
      "```",
      "[[ignored]]",
      "```",
      "[[real]]",
    ].join("\n");
    const out = extract(src);
    expect(out).toHaveLength(1);
    expect(out[0]?.target).toBe("real");
  });

  it("skips wikilinks inside inline code", () => {
    const out = extract("`[[in-code]]` then [[outside]]");
    expect(out).toHaveLength(1);
    expect(out[0]?.target).toBe("outside");
  });

  it("silently drops empty wikilinks — OFM002 handles [[]]", () => {
    const out = extract("[[]]");
    expect(out).toHaveLength(0);
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `WikilinkExtractor.ts`**

```ts
import { makeWikilinkNode, type WikilinkNode } from "../../../domain/parsing/WikilinkNode.js";
import { makeSourcePosition } from "../../../domain/parsing/SourcePosition.js";
import type { CodeRegionMap } from "./CodeRegionMap.js";

const WIKILINK_PATTERN = /(!?)\[\[([^\]\n]*?)\]\]/g;

/**
 * Extract every wikilink and embed from a Markdown file.
 * Skips any match whose opening `[[` falls inside a code region.
 * Empty targets are silently dropped — OFM002 detects `[[]]` separately.
 */
export function extractWikilinks(
  lines: readonly string[],
  codeMap: CodeRegionMap,
): readonly WikilinkNode[] {
  const out: WikilinkNode[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const lineNumber = i + 1;
    WIKILINK_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = WIKILINK_PATTERN.exec(line)) !== null) {
      const column = match.index + 1;
      if (codeMap.isInCode(lineNumber, column)) continue;
      const bang = match[1] ?? "";
      const inner = match[2] ?? "";
      if (inner.trim().length === 0) continue;
      const node = parseInner(inner, bang === "!", lineNumber, column, match[0] ?? "");
      if (node !== null) out.push(node);
    }
  }

  return out;
}

function parseInner(
  inner: string,
  isEmbed: boolean,
  line: number,
  column: number,
  raw: string,
): WikilinkNode | null {
  const pipeIdx = inner.indexOf("|");
  const head = pipeIdx === -1 ? inner : inner.slice(0, pipeIdx);
  const alias = pipeIdx === -1 ? null : inner.slice(pipeIdx + 1) || null;

  const caretIdx = head.indexOf("^");
  const headBeforeCaret = caretIdx === -1 ? head : head.slice(0, caretIdx);
  const blockRef = caretIdx === -1 ? null : head.slice(caretIdx + 1) || null;

  const hashIdx = headBeforeCaret.indexOf("#");
  const target = (hashIdx === -1 ? headBeforeCaret : headBeforeCaret.slice(0, hashIdx)).trim();
  const heading = hashIdx === -1 ? null : headBeforeCaret.slice(hashIdx + 1).trim() || null;

  if (target.length === 0) return null;

  return makeWikilinkNode({
    target,
    alias,
    heading,
    blockRef,
    position: makeSourcePosition(line, column),
    isEmbed,
    raw,
  });
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/infrastructure/parser/ofm/WikilinkExtractor.ts tests/unit/parser/ofm/WikilinkExtractor.test.ts
git commit -m "feat(parser): add WikilinkExtractor"
```

---

### Task 10: EmbedExtractor

**Files:**
- Create: `src/infrastructure/parser/ofm/EmbedExtractor.ts`
- Create: `tests/unit/parser/ofm/EmbedExtractor.test.ts`

EmbedExtractor is a thin filter over the wikilink output — anything with `isEmbed: true` becomes an `EmbedNode`, and the `|NNNxMMM` sizing hint (captured in `alias`) is parsed into `width` / `height`.

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { extractEmbeds } from "../../../../src/infrastructure/parser/ofm/EmbedExtractor.js";
import { extractWikilinks } from "../../../../src/infrastructure/parser/ofm/WikilinkExtractor.js";
import { buildCodeRegionMap } from "../../../../src/infrastructure/parser/ofm/CodeRegionMap.js";

function run(src: string) {
  const lines = src.split("\n");
  const map = buildCodeRegionMap(lines);
  return extractEmbeds(extractWikilinks(lines, map));
}

describe("EmbedExtractor", () => {
  it("filters embed wikilinks", () => {
    const out = run("![[image.png]]\n[[link]]");
    expect(out).toHaveLength(1);
    expect(out[0]?.target).toBe("image.png");
  });

  it("parses |500x300 sizing hint", () => {
    const out = run("![[image.png|500x300]]");
    expect(out[0]?.width).toBe(500);
    expect(out[0]?.height).toBe(300);
  });

  it("parses |500 sizing hint as width only", () => {
    const out = run("![[image.png|500]]");
    expect(out[0]?.width).toBe(500);
    expect(out[0]?.height).toBeNull();
  });

  it("non-numeric alias becomes null dimensions", () => {
    const out = run("![[image.png|caption]]");
    expect(out[0]?.width).toBeNull();
    expect(out[0]?.height).toBeNull();
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `EmbedExtractor.ts`**

```ts
import { makeEmbedNode, type EmbedNode } from "../../../domain/parsing/EmbedNode.js";
import type { WikilinkNode } from "../../../domain/parsing/WikilinkNode.js";

const SIZE_PATTERN = /^(\d+)(?:x(\d+))?$/;

export function extractEmbeds(wikilinks: readonly WikilinkNode[]): readonly EmbedNode[] {
  const out: EmbedNode[] = [];
  for (const wl of wikilinks) {
    if (!wl.isEmbed) continue;
    const { width, height } = parseSize(wl.alias);
    out.push(
      makeEmbedNode({
        target: wl.target,
        width,
        height,
        position: wl.position,
        raw: wl.raw,
      }),
    );
  }
  return out;
}

function parseSize(alias: string | null): { width: number | null; height: number | null } {
  if (alias === null) return { width: null, height: null };
  const match = SIZE_PATTERN.exec(alias);
  if (match === null) return { width: null, height: null };
  return {
    width: Number.parseInt(match[1] ?? "0", 10),
    height: match[2] !== undefined ? Number.parseInt(match[2], 10) : null,
  };
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/infrastructure/parser/ofm/EmbedExtractor.ts tests/unit/parser/ofm/EmbedExtractor.test.ts
git commit -m "feat(parser): add EmbedExtractor"
```

---

### Task 11: CalloutExtractor

**Files:**
- Create: `src/infrastructure/parser/ofm/CalloutExtractor.ts`
- Create: `tests/unit/parser/ofm/CalloutExtractor.test.ts`

Callout header pattern:

```
> [!TYPE]       -> foldable "none"
> [!TYPE]+      -> foldable "open"
> [!TYPE]-      -> foldable "closed"
> [!TYPE] Title text
```

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { extractCallouts } from "../../../../src/infrastructure/parser/ofm/CalloutExtractor.js";
import { buildCodeRegionMap } from "../../../../src/infrastructure/parser/ofm/CodeRegionMap.js";

function run(src: string) {
  const lines = src.split("\n");
  return extractCallouts(lines, buildCodeRegionMap(lines));
}

describe("CalloutExtractor", () => {
  it("parses NOTE callout with title and body", () => {
    const out = run("> [!NOTE] Heading\n> body line one\n> body line two\n\nafter");
    expect(out).toHaveLength(1);
    expect(out[0]?.type).toBe("NOTE");
    expect(out[0]?.title).toBe("Heading");
    expect(out[0]?.bodyLines).toEqual(["body line one", "body line two"]);
    expect(out[0]?.foldable).toBe("none");
  });

  it("detects foldable + marker", () => {
    const out = run("> [!TIP]+ Title");
    expect(out[0]?.foldable).toBe("open");
  });

  it("detects foldable - marker", () => {
    const out = run("> [!WARNING]-");
    expect(out[0]?.foldable).toBe("closed");
    expect(out[0]?.title).toBe("");
  });

  it("skips callouts inside code blocks", () => {
    const out = run("```\n> [!NOTE] inside\n```");
    expect(out).toHaveLength(0);
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `CalloutExtractor.ts`**

```ts
import { makeCalloutNode, type CalloutNode } from "../../../domain/parsing/CalloutNode.js";
import { makeSourcePosition } from "../../../domain/parsing/SourcePosition.js";
import type { CodeRegionMap } from "./CodeRegionMap.js";

const HEADER_PATTERN = /^>\s*\[!([A-Za-z][A-Za-z0-9-]*)\]([+-]?)\s*(.*)$/;
const CONTINUATION_PATTERN = /^>\s?(.*)$/;

export function extractCallouts(
  lines: readonly string[],
  codeMap: CodeRegionMap,
): readonly CalloutNode[] {
  const out: CalloutNode[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    if (codeMap.isInCode(lineNumber, 1)) continue;
    const header = HEADER_PATTERN.exec(lines[i] ?? "");
    if (header === null) continue;

    const type = (header[1] ?? "").toUpperCase();
    const foldable: CalloutNode["foldable"] =
      header[2] === "+" ? "open" : header[2] === "-" ? "closed" : "none";
    const title = (header[3] ?? "").trim();

    const bodyLines: string[] = [];
    let j = i + 1;
    while (j < lines.length) {
      const cont = CONTINUATION_PATTERN.exec(lines[j] ?? "");
      if (cont === null) break;
      bodyLines.push(cont[1] ?? "");
      j += 1;
    }

    out.push(
      makeCalloutNode({
        type,
        title,
        position: makeSourcePosition(lineNumber, 1),
        bodyLines,
        foldable,
      }),
    );
    i = j - 1;
  }

  return out;
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/infrastructure/parser/ofm/CalloutExtractor.ts tests/unit/parser/ofm/CalloutExtractor.test.ts
git commit -m "feat(parser): add CalloutExtractor"
```

---

### Task 12: TagExtractor

**Files:**
- Create: `src/infrastructure/parser/ofm/TagExtractor.ts`
- Create: `tests/unit/parser/ofm/TagExtractor.test.ts`

Obsidian tag rules: starts with `#`, then letters/digits/`_`/`-`/`/`, must contain at least one non-digit (so `#12` is not a tag), not preceded by a word character.

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { extractTags } from "../../../../src/infrastructure/parser/ofm/TagExtractor.js";
import { buildCodeRegionMap } from "../../../../src/infrastructure/parser/ofm/CodeRegionMap.js";

function run(src: string) {
  const lines = src.split("\n");
  return extractTags(lines, buildCodeRegionMap(lines));
}

describe("TagExtractor", () => {
  it("parses #tag", () => {
    const out = run("Start #project end");
    expect(out).toHaveLength(1);
    expect(out[0]?.value).toBe("project");
  });

  it("parses #nested/tag", () => {
    const out = run("#area/meta");
    expect(out[0]?.value).toBe("area/meta");
  });

  it("rejects pure-number #123", () => {
    const out = run("hashtag #123 here");
    expect(out).toHaveLength(0);
  });

  it("ignores leading # when preceded by a word char", () => {
    const out = run("id#42 should not match");
    expect(out).toHaveLength(0);
  });

  it("skips tags in code blocks", () => {
    const out = run("```\n#ignored\n```");
    expect(out).toHaveLength(0);
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `TagExtractor.ts`**

```ts
import { makeTagNode, type TagNode } from "../../../domain/parsing/TagNode.js";
import { makeSourcePosition } from "../../../domain/parsing/SourcePosition.js";
import type { CodeRegionMap } from "./CodeRegionMap.js";

const TAG_PATTERN = /(?<![A-Za-z0-9_])#([A-Za-z0-9_/-]+)/g;
const HAS_LETTER = /[A-Za-z_-]/;

export function extractTags(
  lines: readonly string[],
  codeMap: CodeRegionMap,
): readonly TagNode[] {
  const out: TagNode[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const lineNumber = i + 1;
    TAG_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = TAG_PATTERN.exec(line)) !== null) {
      const column = match.index + 1;
      if (codeMap.isInCode(lineNumber, column)) continue;
      const value = match[1] ?? "";
      if (!HAS_LETTER.test(value)) continue;
      out.push(
        makeTagNode({
          value,
          position: makeSourcePosition(lineNumber, column),
          raw: match[0] ?? "",
        }),
      );
    }
  }
  return out;
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/infrastructure/parser/ofm/TagExtractor.ts tests/unit/parser/ofm/TagExtractor.test.ts
git commit -m "feat(parser): add TagExtractor"
```

---

### Task 13: BlockRef, Highlight, Comment extractors

**Files:**
- Create: `src/infrastructure/parser/ofm/BlockRefExtractor.ts`
- Create: `src/infrastructure/parser/ofm/HighlightExtractor.ts`
- Create: `src/infrastructure/parser/ofm/CommentExtractor.ts`
- Create: `tests/unit/parser/ofm/BlockRefExtractor.test.ts`
- Create: `tests/unit/parser/ofm/HighlightExtractor.test.ts`
- Create: `tests/unit/parser/ofm/CommentExtractor.test.ts`

Block reference *definitions* appear at end of line as ` ^blockid`. Block *links* (`[[page#^blockid]]`) are already captured by the wikilink extractor.

- [ ] **Implement `BlockRefExtractor.ts`**

```ts
import { makeBlockRefNode, type BlockRefNode } from "../../../domain/parsing/BlockRefNode.js";
import { makeSourcePosition } from "../../../domain/parsing/SourcePosition.js";
import type { CodeRegionMap } from "./CodeRegionMap.js";

const BLOCK_REF_PATTERN = /(?:^|\s)\^([A-Za-z0-9-]+)\s*$/;

export function extractBlockRefs(
  lines: readonly string[],
  codeMap: CodeRegionMap,
): readonly BlockRefNode[] {
  const out: BlockRefNode[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    if (codeMap.isInCode(lineNumber, 1)) continue;
    const match = BLOCK_REF_PATTERN.exec(lines[i] ?? "");
    if (match === null) continue;
    const id = match[1] ?? "";
    const column = (match.index + (match[0]?.length ?? 0)) - id.length;
    out.push(
      makeBlockRefNode({
        blockId: id,
        position: makeSourcePosition(lineNumber, column),
      }),
    );
  }
  return out;
}
```

- [ ] **Implement `HighlightExtractor.ts`**

```ts
import { makeHighlightNode, type HighlightNode } from "../../../domain/parsing/HighlightNode.js";
import { makeSourcePosition } from "../../../domain/parsing/SourcePosition.js";
import type { CodeRegionMap } from "./CodeRegionMap.js";

const HIGHLIGHT_PATTERN = /==([^=\n]+)==/g;

export function extractHighlights(
  lines: readonly string[],
  codeMap: CodeRegionMap,
): readonly HighlightNode[] {
  const out: HighlightNode[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const lineNumber = i + 1;
    HIGHLIGHT_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = HIGHLIGHT_PATTERN.exec(line)) !== null) {
      const column = match.index + 1;
      if (codeMap.isInCode(lineNumber, column)) continue;
      out.push(
        makeHighlightNode({
          text: match[1] ?? "",
          position: makeSourcePosition(lineNumber, column),
        }),
      );
    }
  }
  return out;
}
```

- [ ] **Implement `CommentExtractor.ts`**

```ts
import { makeCommentNode, type CommentNode } from "../../../domain/parsing/CommentNode.js";
import { makeSourcePosition } from "../../../domain/parsing/SourcePosition.js";

/**
 * Extract %% ... %% comment regions. Multi-line comments are supported by
 * concatenating the raw text with \n.
 */
export function extractComments(lines: readonly string[]): readonly CommentNode[] {
  const raw = lines.join("\n");
  const out: CommentNode[] = [];
  let i = 0;
  while (i < raw.length) {
    const start = raw.indexOf("%%", i);
    if (start === -1) break;
    const end = raw.indexOf("%%", start + 2);
    if (end === -1) break;

    const startPos = offsetToPosition(raw, start);
    const endPos = offsetToPosition(raw, end + 1);
    out.push(
      makeCommentNode({
        text: raw.slice(start + 2, end),
        position: makeSourcePosition(startPos.line, startPos.column),
        endPosition: makeSourcePosition(endPos.line, endPos.column),
      }),
    );
    i = end + 2;
  }
  return out;
}

function offsetToPosition(raw: string, offset: number): { line: number; column: number } {
  let line = 1;
  let col = 1;
  for (let k = 0; k < offset; k += 1) {
    if (raw.charAt(k) === "\n") {
      line += 1;
      col = 1;
    } else {
      col += 1;
    }
  }
  return { line, column: col };
}
```

Write a short failing + passing test for each (happy path, then a code-fence skip for BlockRef and Highlight, then a multi-line case for Comment).

- [ ] **Run all new tests — expect PASS**

```bash
npm run test -- tests/unit/parser/ofm
```

- [ ] **Commit**

```bash
git add src/infrastructure/parser/ofm/BlockRefExtractor.ts \
        src/infrastructure/parser/ofm/HighlightExtractor.ts \
        src/infrastructure/parser/ofm/CommentExtractor.ts \
        tests/unit/parser/ofm/BlockRefExtractor.test.ts \
        tests/unit/parser/ofm/HighlightExtractor.test.ts \
        tests/unit/parser/ofm/CommentExtractor.test.ts
git commit -m "feat(parser): add BlockRef, Highlight, Comment extractors"
```

---

### Task 14: FrontmatterParser adapter

**Files:**
- Create: `src/infrastructure/parser/FrontmatterParser.ts`
- Create: `tests/unit/parser/FrontmatterParser.test.ts`

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { parseFrontmatter } from "../../../src/infrastructure/parser/FrontmatterParser.js";

describe("FrontmatterParser", () => {
  it("parses YAML frontmatter and returns body offset", () => {
    const src = "---\ntags: [project]\n---\n# Hello";
    const r = parseFrontmatter(src);
    expect(r.data).toEqual({ tags: ["project"] });
    expect(r.bodyStartLine).toBe(4);
    expect(r.rawFrontmatter).toBe("tags: [project]");
  });

  it("returns empty data for no frontmatter", () => {
    const r = parseFrontmatter("# Hello");
    expect(r.data).toEqual({});
    expect(r.bodyStartLine).toBe(1);
    expect(r.rawFrontmatter).toBeNull();
  });

  it("throws tagged OFM902 on malformed YAML", () => {
    expect(() => parseFrontmatter("---\n : invalid :\n---\nbody")).toThrowError(/OFM902/);
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `FrontmatterParser.ts`**

```ts
import matter from "gray-matter";

export interface FrontmatterParseOutput {
  readonly data: Readonly<Record<string, unknown>>;
  readonly rawFrontmatter: string | null;
  /** 1-based line number where the body begins (after closing `---`). */
  readonly bodyStartLine: number;
}

/**
 * Parse YAML/TOML frontmatter from a Markdown source string.
 * Throws an Error prefixed with `OFM902:` when the frontmatter cannot be
 * parsed; callers translate this into a LintError.
 */
export function parseFrontmatter(source: string): FrontmatterParseOutput {
  try {
    const parsed = matter(source);
    const data = (parsed.data ?? {}) as Record<string, unknown>;
    const rawFrontmatter = parsed.matter.length > 0 ? parsed.matter : null;
    const bodyStartLine = rawFrontmatter === null ? 1 : countLines(parsed.matter) + 3;
    return { data, rawFrontmatter, bodyStartLine };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`OFM902: frontmatter parse error — ${message}`);
  }
}

function countLines(text: string): number {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length;
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/infrastructure/parser/FrontmatterParser.ts tests/unit/parser/FrontmatterParser.test.ts
git commit -m "feat(parser): add FrontmatterParser adapter over gray-matter"
```

---

### Task 15: MarkdownItParser adapter

**Files:**
- Create: `src/infrastructure/parser/MarkdownItParser.ts`
- Create: `tests/unit/parser/MarkdownItParser.test.ts`

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { makeMarkdownItParser } from "../../../src/infrastructure/parser/MarkdownItParser.js";

describe("MarkdownItParser", () => {
  const parser = makeMarkdownItParser();

  it("returns frontmatter, lines, and raw", () => {
    const src = "---\ntags: [a]\n---\n# Hi\n[[page]]";
    const r = parser.parse("notes/index.md", src);
    expect(r.filePath).toBe("notes/index.md");
    expect(r.frontmatter).toEqual({ tags: ["a"] });
    expect(r.wikilinks).toHaveLength(1);
    expect(r.wikilinks[0]?.target).toBe("page");
    expect(r.lines.length).toBeGreaterThanOrEqual(2);
  });

  it("collects every OFM node type", () => {
    const src = [
      "---",
      "tags: [x]",
      "---",
      "# Heading",
      "See [[other]].",
      "![[image.png|200]]",
      "Body text #tag1 and ==highlight==.",
      "",
      "> [!NOTE] Note",
      "> body",
      "",
      "End ^last",
      "",
      "Side %%todo%% note.",
    ].join("\n");
    const r = parser.parse("x.md", src);
    expect(r.wikilinks.length).toBeGreaterThanOrEqual(1);
    expect(r.embeds).toHaveLength(1);
    expect(r.tags).toHaveLength(1);
    expect(r.highlights).toHaveLength(1);
    expect(r.callouts).toHaveLength(1);
    expect(r.blockRefs).toHaveLength(1);
    expect(r.comments).toHaveLength(1);
    expect(r.tokens.length).toBeGreaterThan(0);
  });

  it("propagates OFM902 on broken frontmatter", () => {
    expect(() => parser.parse("x.md", "---\n : :\n---\nbody")).toThrowError(/OFM902/);
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `MarkdownItParser.ts`**

```ts
import MarkdownIt from "markdown-it";
import type { Parser } from "../../domain/parsing/Parser.js";
import { makeParseResult, type ParseResult } from "../../domain/parsing/ParseResult.js";
import { parseFrontmatter } from "./FrontmatterParser.js";
import { buildCodeRegionMap } from "./ofm/CodeRegionMap.js";
import { extractWikilinks } from "./ofm/WikilinkExtractor.js";
import { extractEmbeds } from "./ofm/EmbedExtractor.js";
import { extractCallouts } from "./ofm/CalloutExtractor.js";
import { extractTags } from "./ofm/TagExtractor.js";
import { extractBlockRefs } from "./ofm/BlockRefExtractor.js";
import { extractHighlights } from "./ofm/HighlightExtractor.js";
import { extractComments } from "./ofm/CommentExtractor.js";

/**
 * Build a Parser that combines gray-matter, markdown-it, and OFM extractors.
 * Creates a fresh markdown-it instance per parser factory call.
 */
export function makeMarkdownItParser(): Parser {
  const md = new MarkdownIt({ html: true, linkify: false });

  return {
    parse(filePath: string, content: string): ParseResult {
      const { data, rawFrontmatter, bodyStartLine } = parseFrontmatter(content);
      const body = rawFrontmatter === null ? content : stripFrontmatter(content);
      const lines = body.split(/\r?\n/);
      const codeMap = buildCodeRegionMap(lines);
      const wikilinks = extractWikilinks(lines, codeMap);
      const embeds = extractEmbeds(wikilinks);
      const tokens = md.parse(body, {});

      return makeParseResult({
        filePath,
        frontmatter: data,
        frontmatterRaw: rawFrontmatter,
        frontmatterEndLine: rawFrontmatter === null ? 0 : bodyStartLine - 1,
        tokens,
        wikilinks,
        embeds,
        callouts: extractCallouts(lines, codeMap),
        tags: extractTags(lines, codeMap),
        blockRefs: extractBlockRefs(lines, codeMap),
        highlights: extractHighlights(lines, codeMap),
        comments: extractComments(lines),
        raw: body,
        lines,
      });
    },
  };
}

function stripFrontmatter(content: string): string {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(content);
  return match === null ? content : content.slice(match[0].length);
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/infrastructure/parser/MarkdownItParser.ts tests/unit/parser/MarkdownItParser.test.ts
git commit -m "feat(parser): add MarkdownItParser orchestrator"
```

---

### Task 16: FileReader adapter

**Files:**
- Create: `src/infrastructure/io/FileReader.ts`
- Create: `tests/unit/io/FileReader.test.ts`

- [ ] **Write failing test**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readMarkdownFile } from "../../../src/infrastructure/io/FileReader.js";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

let tmpDir: string;
beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-reader-"));
});
afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("FileReader", () => {
  it("reads UTF-8 files and strips BOM", async () => {
    const file = path.join(tmpDir, "a.md");
    await fs.writeFile(file, "\uFEFF# Hi");
    expect(await readMarkdownFile(file)).toBe("# Hi");
  });

  it("normalizes CRLF to LF", async () => {
    const file = path.join(tmpDir, "a.md");
    await fs.writeFile(file, "a\r\nb\r\n");
    expect(await readMarkdownFile(file)).toBe("a\nb\n");
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `FileReader.ts`**

```ts
import * as fs from "node:fs/promises";

/**
 * Read a Markdown file as UTF-8, strip any leading BOM, and normalize
 * line endings to `\n`. Every parser downstream assumes LF-only input.
 */
export async function readMarkdownFile(absolutePath: string): Promise<string> {
  const raw = await fs.readFile(absolutePath, "utf8");
  const withoutBom = raw.startsWith("\uFEFF") ? raw.slice(1) : raw;
  return withoutBom.replace(/\r\n/g, "\n");
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/infrastructure/io/FileReader.ts tests/unit/io/FileReader.test.ts
git commit -m "feat(io): add FileReader with BOM + CRLF normalization"
```

---

### Task 17: FrontmatterParseError rule (OFM902)

**Files:**
- Create: `src/infrastructure/rules/ofm/system/FrontmatterParseError.ts`
- Create: `src/infrastructure/rules/ofm/registerBuiltin.ts`
- Create: `tests/unit/rules/FrontmatterParseError.test.ts`

The parser throws on frontmatter failures. `LintUseCase` catches the throw and emits a pre-built `LintError` directly — the rule shape is kept for consistency with the registry API and for `--list-rules` discoverability.

- [ ] **Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { frontmatterParseErrorRule } from "../../../src/infrastructure/rules/ofm/system/FrontmatterParseError.js";

describe("OFM902 frontmatter-parse-error", () => {
  it("has the correct names and severity", () => {
    expect(frontmatterParseErrorRule.names).toContain("OFM902");
    expect(frontmatterParseErrorRule.severity).toBe("error");
    expect(frontmatterParseErrorRule.fixable).toBe(false);
  });

  it("is registered via registerBuiltin", async () => {
    const { makeRuleRegistry } = await import(
      "../../../src/domain/linting/RuleRegistry.js"
    );
    const { registerBuiltinRules } = await import(
      "../../../src/infrastructure/rules/ofm/registerBuiltin.js"
    );
    const reg = makeRuleRegistry();
    registerBuiltinRules(reg);
    expect(reg.get("OFM902")).toBeDefined();
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Implement `FrontmatterParseError.ts`**

```ts
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM902 — frontmatter-parse-error.
 *
 * Runtime behaviour: this rule's `run` is a no-op. The parser throws with
 * `OFM902:` prefix when gray-matter cannot parse frontmatter. LintUseCase
 * catches that, builds a LintError using this rule's metadata, and attaches
 * it to the LintResult directly. The rule is kept as a registry entry for
 * discoverability (`--list-rules`) and for Phase 3's structured frontmatter
 * rule family to share the OFM9xx namespace.
 */
export const frontmatterParseErrorRule: OFMRule = {
  names: ["OFM902", "frontmatter-parse-error"],
  description: "Frontmatter could not be parsed as YAML/TOML",
  tags: ["frontmatter", "parser", "system"],
  severity: "error",
  fixable: false,
  run(): void {
    // No-op — see LintUseCase for actual error emission.
  },
};
```

- [ ] **Implement `registerBuiltin.ts`**

```ts
import type { RuleRegistry } from "../../../domain/linting/RuleRegistry.js";
import { frontmatterParseErrorRule } from "./system/FrontmatterParseError.js";

/** Register every built-in OFM rule with a RuleRegistry. */
export function registerBuiltinRules(registry: RuleRegistry): void {
  registry.register(frontmatterParseErrorRule);
}
```

- [ ] **Run — expect PASS**

- [ ] **Commit**

```bash
git add src/infrastructure/rules/ofm/system/FrontmatterParseError.ts \
        src/infrastructure/rules/ofm/registerBuiltin.ts \
        tests/unit/rules/FrontmatterParseError.test.ts
git commit -m "feat(rules): add OFM902 frontmatter-parse-error and registerBuiltin"
```

---

### Task 18: LintUseCase — wire parser + registry

**Files:**
- Modify: `src/application/LintUseCase.ts`
- Modify: `src/cli/main.ts`
- Create: `tests/unit/application/LintUseCase.parser.test.ts`

- [ ] **Write failing test**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { runLint } from "../../../src/application/LintUseCase.js";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";
import { makeRuleRegistry } from "../../../src/domain/linting/RuleRegistry.js";
import { registerBuiltinRules } from "../../../src/infrastructure/rules/ofm/registerBuiltin.js";
import { makeMarkdownItParser } from "../../../src/infrastructure/parser/MarkdownItParser.js";
import { readMarkdownFile } from "../../../src/infrastructure/io/FileReader.js";

let tmpDir: string;
beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-lintuc-"));
});
afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("LintUseCase (parser-wired)", () => {
  it("returns clean result for valid file", async () => {
    const file = path.join(tmpDir, "a.md");
    await fs.writeFile(file, "# Clean\n");

    const parser = makeMarkdownItParser();
    const registry = makeRuleRegistry();
    registerBuiltinRules(registry);

    const results = await runLint(
      [file],
      DEFAULT_CONFIG,
      registry,
      { parser, readFile: readMarkdownFile },
    );
    expect(results).toHaveLength(1);
    expect(results[0]?.hasErrors).toBe(false);
  });

  it("emits OFM902 on broken frontmatter", async () => {
    const file = path.join(tmpDir, "b.md");
    await fs.writeFile(file, "---\n : invalid :\n---\nbody\n");

    const parser = makeMarkdownItParser();
    const registry = makeRuleRegistry();
    registerBuiltinRules(registry);

    const results = await runLint(
      [file],
      DEFAULT_CONFIG,
      registry,
      { parser, readFile: readMarkdownFile },
    );
    expect(results[0]?.errors[0]?.ruleCode).toBe("OFM902");
    expect(results[0]?.hasErrors).toBe(true);
  });
});
```

- [ ] **Run — expect FAIL**

- [ ] **Replace `src/application/LintUseCase.ts`**

```ts
import type { LinterConfig } from "../domain/config/LinterConfig.js";
import type { LintError } from "../domain/linting/LintError.js";
import { makeLintError } from "../domain/linting/LintError.js";
import { makeLintResult, type LintResult } from "../domain/linting/LintResult.js";
import type { RuleRegistry } from "../domain/linting/RuleRegistry.js";
import type { Parser } from "../domain/parsing/Parser.js";
import type { OFMRule } from "../domain/linting/OFMRule.js";

export interface LintDependencies {
  readonly parser: Parser;
  readonly readFile: (absolutePath: string) => Promise<string>;
}

/**
 * Run every active rule against each file.
 * Parser failures become OFM902 errors; rule exceptions are propagated.
 */
export async function runLint(
  filePaths: readonly string[],
  config: LinterConfig,
  registry: RuleRegistry,
  deps: LintDependencies,
): Promise<LintResult[]> {
  const results: LintResult[] = [];
  for (const filePath of filePaths) {
    const errors: LintError[] = [];
    try {
      const raw = await deps.readFile(filePath);
      const parsed = deps.parser.parse(filePath, raw);
      for (const rule of iterateActiveRules(registry, config)) {
        runRule(rule, parsed, errors);
      }
    } catch (err) {
      errors.push(buildParserError(err));
    }
    results.push(makeLintResult(filePath, errors));
  }
  return results;
}

function iterateActiveRules(
  registry: RuleRegistry,
  config: LinterConfig,
): readonly OFMRule[] {
  return registry.all().filter((rule) => {
    for (const name of rule.names) {
      const cfg = config.rules[name];
      if (cfg !== undefined) return cfg.enabled;
    }
    return true;
  });
}

function runRule(rule: OFMRule, parsed: unknown, errors: LintError[]): void {
  const params = {
    filePath: (parsed as { filePath: string }).filePath,
    lines: (parsed as { lines: readonly string[] }).lines,
    frontmatter: (parsed as { frontmatter: Record<string, unknown> }).frontmatter,
    tokens: (parsed as { tokens: readonly unknown[] }).tokens,
  };
  rule.run(params, (partial) => {
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
  });
}

function buildParserError(err: unknown): LintError {
  const message = err instanceof Error ? err.message : String(err);
  const isOFM902 = message.startsWith("OFM902");
  return makeLintError({
    ruleCode: isOFM902 ? "OFM902" : "OFM901",
    ruleName: isOFM902 ? "frontmatter-parse-error" : "internal-parser-error",
    severity: "error",
    line: 1,
    column: 1,
    message,
    fixable: false,
  });
}
```

- [ ] **Update `src/cli/main.ts` to supply dependencies**

Add imports:

```ts
import { makeMarkdownItParser } from "../infrastructure/parser/MarkdownItParser.js";
import { readMarkdownFile } from "../infrastructure/io/FileReader.js";
import { registerBuiltinRules } from "../infrastructure/rules/ofm/registerBuiltin.js";
```

Replace the existing `runLint(files, config, registry)` call with:

```ts
const registry = makeRuleRegistry();
registerBuiltinRules(registry);
const parser = makeMarkdownItParser();
const results = await runLint(files, config, registry, {
  parser,
  readFile: readMarkdownFile,
});
```

- [ ] **Run — expect PASS**

```bash
npm run test
```

- [ ] **Commit**

```bash
git add src/application/LintUseCase.ts src/cli/main.ts tests/unit/application/LintUseCase.parser.test.ts
git commit -m "feat(application): wire Parser and RuleRegistry into LintUseCase"
```

---

### Task 19: Integration test — full OFM fixture parse

**Files:**
- Create: `tests/fixtures/parser/all-ofm-nodes.md`
- Create: `tests/fixtures/parser/frontmatter-broken.md`
- Create: `tests/fixtures/parser/clean.md`
- Create: `tests/integration/parser/full-parse.test.ts`

- [ ] **Write `tests/fixtures/parser/all-ofm-nodes.md`**

````md
---
tags: [fixture]
created: 2026-04-11
---

# Fixture

Paragraph with [[index]] and [[other|alias]] wikilinks.

Embed: ![[diagram.png|400x250]]

Inline `code` and ==highlight== and #tag1 and #nested/tag.

> [!NOTE] Heading
> Body line one.

Block ref target. ^block-1

Side %%ignore%% note.
````

- [ ] **Write `tests/fixtures/parser/frontmatter-broken.md`**

```md
---
 : invalid :
---

body
```

- [ ] **Write `tests/fixtures/parser/clean.md`**

```md
# Clean

Nothing special.
```

- [ ] **Write `tests/integration/parser/full-parse.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { makeMarkdownItParser } from "../../../src/infrastructure/parser/MarkdownItParser.js";
import { readMarkdownFile } from "../../../src/infrastructure/io/FileReader.js";

const FIXTURES = path.resolve("tests/fixtures/parser");

describe("full parse integration", () => {
  const parser = makeMarkdownItParser();

  it("extracts every OFM node type from the fixture", async () => {
    const src = await readMarkdownFile(path.join(FIXTURES, "all-ofm-nodes.md"));
    const r = parser.parse("all-ofm-nodes.md", src);

    expect(r.frontmatter).toEqual(
      expect.objectContaining({ tags: ["fixture"] }),
    );
    expect(r.wikilinks.length).toBeGreaterThanOrEqual(2);
    expect(r.embeds).toHaveLength(1);
    expect(r.tags.length).toBeGreaterThanOrEqual(2);
    expect(r.highlights).toHaveLength(1);
    expect(r.callouts).toHaveLength(1);
    expect(r.blockRefs).toHaveLength(1);
    expect(r.comments).toHaveLength(1);
  });

  it("clean fixture produces no OFM nodes", async () => {
    const src = await readMarkdownFile(path.join(FIXTURES, "clean.md"));
    const r = parser.parse("clean.md", src);
    expect(r.wikilinks).toHaveLength(0);
    expect(r.tags).toHaveLength(0);
  });

  it("broken fixture throws OFM902", async () => {
    const src = await readMarkdownFile(path.join(FIXTURES, "frontmatter-broken.md"));
    expect(() => parser.parse("frontmatter-broken.md", src)).toThrowError(/OFM902/);
  });
});
```

- [ ] **Run — expect PASS**

```bash
npm run test -- tests/integration/parser
```

- [ ] **Commit**

```bash
git add tests/fixtures/parser tests/integration/parser
git commit -m "test(parser): add full OFM fixture integration test"
```

---

### Task 20: BDD feature — parser pipeline smoke

**Files:**
- Create: `docs/bdd/features/parser-pipeline.feature`
- Modify: `docs/bdd/steps/file-steps.ts` (add docstring form)

- [ ] **Write the feature**

```gherkin
Feature: Parser pipeline smoke

  Scenario: Broken frontmatter produces OFM902
    Given a file "notes/bad.md" containing:
      """
      ---
       : invalid :
      ---
      body
      """
    When I run markdownlint-obsidian on "notes/bad.md"
    Then the exit code is 1
    And error OFM902 is reported on line 1

  Scenario: Clean file with OFM content parses cleanly
    Given a file "notes/ok.md" containing:
      """
      # Hi

      [[target]] and #tag here.
      """
    When I run markdownlint-obsidian on "notes/ok.md"
    Then the exit code is 0
```

- [ ] **Extend `docs/bdd/steps/file-steps.ts`** with the docstring variant

```ts
Given("a file {string} containing:", async function (this: OFMWorld, relPath: string, content: string) {
  if (!this.vaultDir) await this.initVault();
  await this.writeFile(relPath, content);
});
```

- [ ] **Run the new feature**

```bash
npm run test:bdd -- docs/bdd/features/parser-pipeline.feature
```

Expected: both scenarios pass.

- [ ] **Commit**

```bash
git add docs/bdd/features/parser-pipeline.feature docs/bdd/steps/file-steps.ts
git commit -m "feat(bdd): add parser-pipeline smoke feature"
```

---

### Task 21: Phase 2 verification

- [ ] **Run the full test chain**

```bash
npm run test:all
```

Expected: all unit + integration + BDD scenarios pass.

- [ ] **Manual end-to-end smoke**

```bash
node bin/markdownlint-obsidian.js "tests/fixtures/parser/frontmatter-broken.md"
```

Expected: exit 1, OFM902 error on line 1.

```bash
node bin/markdownlint-obsidian.js "tests/fixtures/parser/clean.md"
```

Expected: exit 0, no output.

- [ ] **Dogfood docs/**

```bash
cd docs && node ../bin/markdownlint-obsidian.js "**/*.md"
```

Expected: exit 0 — Phase 2 adds no rules that would fire on our design docs (only OFM902 is active, and our docs have no broken frontmatter).

- [ ] **Final commit**

```bash
git add -A
git commit -m "chore: Phase 2 complete — parser pipeline, OFM extractors, OFM902 wired end-to-end"
```

---

## Phase 2 acceptance criteria

- `ParseResult` is the sole domain-level view of a parsed file.
- Every OFM node type has a domain VO with a frozen factory and a dedicated unit test.
- `CodeRegionMap` prevents every extractor from matching inside fenced or inline code.
- `MarkdownItParser` produces identical output for equivalent CRLF and LF input (covered by `FileReader` normalization).
- `LintUseCase` takes a `Parser` via its dependencies — infrastructure injection, not import.
- `registerBuiltinRules()` is the only place built-in rules enter the registry; Phases 3+ append to the same function.
- One BDD scenario (`parser-pipeline.feature`) proves the full `CLI → LintUseCase → Parser → LintError → DefaultFormatter → exit 1` loop is wired.
- Coverage for `domain/parsing/` ≥ 95%; `infrastructure/parser/` ≥ 90%.
