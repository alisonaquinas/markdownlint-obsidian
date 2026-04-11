import { describe, it, expect } from "vitest";
import { runLint } from "../../../src/application/LintUseCase.js";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";
import { makeRuleRegistry } from "../../../src/domain/linting/RuleRegistry.js";
import { makeMarkdownItParser } from "../../../src/infrastructure/parser/MarkdownItParser.js";

const stubReadFile = async (): Promise<string> => "# hi\n";

describe("LintUseCase", () => {
  it("returns empty results for empty file list", async () => {
    const registry = makeRuleRegistry();
    const parser = makeMarkdownItParser();
    const results = await runLint([], DEFAULT_CONFIG, registry, {
      parser,
      readFile: stubReadFile,
    });
    expect(results).toHaveLength(0);
  });

  it("returns one clean result per file (no rules registered)", async () => {
    const registry = makeRuleRegistry();
    const parser = makeMarkdownItParser();
    const results = await runLint(
      ["a.md", "b.md"],
      DEFAULT_CONFIG,
      registry,
      { parser, readFile: stubReadFile },
    );
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.hasErrors === false)).toBe(true);
  });
});
