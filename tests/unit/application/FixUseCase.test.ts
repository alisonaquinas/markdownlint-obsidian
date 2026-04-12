import { describe, it, expect } from "vitest";
import { runFix } from "../../../src/application/FixUseCase.js";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";
import { makeRuleRegistry } from "../../../src/domain/linting/RuleRegistry.js";
import { makeFix } from "../../../src/domain/linting/Fix.js";
import type { OFMRule, RuleParams, OnErrorCallback } from "../../../src/domain/linting/OFMRule.js";
import type { Parser } from "../../../src/domain/parsing/Parser.js";
import type { ParseResult } from "../../../src/domain/parsing/ParseResult.js";
import type { FileExistenceChecker } from "../../../src/domain/fs/FileExistenceChecker.js";
import type { FixDependencies } from "../../../src/application/FixUseCase.js";

// ---------------------------------------------------------------------------
// Stub helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid ParseResult for a given filePath and raw content. */
function makeStubParseResult(filePath: string, raw: string): ParseResult {
  const lines = raw === "" ? [] : raw.split("\n");
  return Object.freeze({
    filePath,
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
    raw,
    lines: Object.freeze(lines),
  });
}

/** Stub parser — always returns a minimal valid ParseResult. */
const stubParser: Parser = {
  parse(filePath: string, content: string): ParseResult {
    return makeStubParseResult(filePath, content);
  },
};

/** Stub FileExistenceChecker — always returns false. */
const stubFsCheck: FileExistenceChecker = { exists: async () => false };

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const FAKE_FILE = "/fake/file.md";
// Original content: "ABCrest of line"
// The stub rule emits a fix: replace col 1-3 ("ABC") with "NEW"
// Expected patched content: "NEWrest of line"
const ORIGINAL_CONTENT = "ABCrest of line";
const PATCHED_CONTENT = "NEWrest of line";

// ---------------------------------------------------------------------------
// Stub rule — emits one fixable error with a concrete Fix payload.
// After the fix is applied, re-parsing the patched content should be clean
// because the rule only fires when the line starts with "ABC".
// ---------------------------------------------------------------------------
const stubFixableRule: OFMRule = {
  names: ["TEST001", "stub-fixable"],
  description: "Stub rule that replaces 'ABC' at start of first line with 'NEW'",
  tags: ["test"],
  severity: "error",
  fixable: true,
  run(params: RuleParams, onError: OnErrorCallback): void {
    const firstLine = params.parsed.lines[0] ?? "";
    if (firstLine.startsWith("ABC")) {
      onError({
        line: 1,
        column: 1,
        message: "Line starts with ABC",
        fix: makeFix({ lineNumber: 1, editColumn: 1, deleteCount: 3, insertText: "NEW" }),
      });
    }
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FixUseCase", () => {
  it("fixes a file: first pass has errors, final pass is clean, filesFixed is populated", async () => {
    // Track writes
    const writes: Array<{ path: string; content: string }> = [];

    // Reader: first call returns the original, second call returns the patched version.
    // runLint (first pass) reads once, then after writing we re-run runLint (final pass)
    // which reads a second time.
    let readCount = 0;
    const stubReadFile = async (_path: string): Promise<string> => {
      readCount += 1;
      // Odd reads → original content (first pass lint + first pass fix-read)
      // Even reads → patched content (final pass lint)
      //
      // runLint calls readFile once per file.
      // runFix also calls readFile once after the first lint pass to apply fixes.
      // So call order is:
      //   1st: runLint (firstPass) → readFile → original
      //   2nd: runFix inline readFile to get raw before patching → original
      //   3rd: runLint (finalPass) → readFile → patched
      if (readCount <= 2) return ORIGINAL_CONTENT;
      return PATCHED_CONTENT;
    };

    const stubWriteFile = async (path: string, content: string): Promise<void> => {
      writes.push({ path, content });
    };

    const registry = makeRuleRegistry();
    registry.register(stubFixableRule);

    const deps: FixDependencies = {
      parser: stubParser,
      readFile: stubReadFile,
      fsCheck: stubFsCheck,
      writeFile: stubWriteFile,
    };

    const outcome = await runFix([FAKE_FILE], DEFAULT_CONFIG, registry, deps);

    // 1. First pass found violations
    expect(outcome.firstPass).toHaveLength(1);
    expect(outcome.firstPass[0]!.errors.length).toBeGreaterThan(0);

    // 2. Final pass is clean (patched content no longer starts with "ABC")
    expect(outcome.finalPass).toHaveLength(1);
    expect(outcome.finalPass[0]!.errors.length).toBe(0);

    // 3. filesFixed contains the file path
    expect(outcome.filesFixed).toContain(FAKE_FILE);

    // 4. Writer was called with the patched content
    expect(writes).toHaveLength(1);
    expect(writes[0]!.path).toBe(FAKE_FILE);
    expect(writes[0]!.content).toBe(PATCHED_CONTENT);

    // 5. No conflicts expected with non-overlapping fixes
    expect(outcome.conflicts).toEqual([]);
  });

  it("does not write or add to filesFixed when no fixes are present", async () => {
    const writes: Array<{ path: string; content: string }> = [];

    // A registry with no rules → no errors, no fixes
    const registry = makeRuleRegistry();

    const stubReadFile = async (): Promise<string> => ORIGINAL_CONTENT;
    const stubWriteFile = async (path: string, content: string): Promise<void> => {
      writes.push({ path, content });
    };

    const deps: FixDependencies = {
      parser: stubParser,
      readFile: stubReadFile,
      fsCheck: stubFsCheck,
      writeFile: stubWriteFile,
    };

    const outcome = await runFix([FAKE_FILE], DEFAULT_CONFIG, registry, deps);

    expect(outcome.firstPass[0]!.errors.length).toBe(0);
    expect(outcome.filesFixed).toHaveLength(0);
    expect(writes).toHaveLength(0);
  });
});
