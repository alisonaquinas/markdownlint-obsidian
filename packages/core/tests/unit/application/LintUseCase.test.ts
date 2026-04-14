/**
 * Unit tests for {@link runLint}.
 *
 * @module tests/unit/application/LintUseCase.test
 */
import { describe, it, expect } from "bun:test";
import { runLint } from "../../../src/application/LintUseCase.js";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";
import { makeRuleRegistry } from "../../../src/domain/linting/RuleRegistry.js";
import { makeMarkdownItParser } from "../../../src/infrastructure/parser/MarkdownItParser.js";
import type { FileExistenceChecker } from "../../../src/domain/fs/FileExistenceChecker.js";

const stubReadFile = async (): Promise<string> => "# hi\n";
const stubFsCheck: FileExistenceChecker = { exists: async () => false };

describe("LintUseCase", () => {
  it("returns empty results for empty file list", async () => {
    const registry = makeRuleRegistry();
    const parser = makeMarkdownItParser();
    const results = await runLint([], DEFAULT_CONFIG, registry, {
      parser,
      readFile: stubReadFile,
      fsCheck: stubFsCheck,
    });
    expect(results).toHaveLength(0);
  });

  it("returns one clean result per file (no rules registered)", async () => {
    const registry = makeRuleRegistry();
    const parser = makeMarkdownItParser();
    const results = await runLint(["a.md", "b.md"], DEFAULT_CONFIG, registry, {
      parser,
      readFile: stubReadFile,
      fsCheck: stubFsCheck,
    });
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.hasErrors === false)).toBe(true);
  });
});
