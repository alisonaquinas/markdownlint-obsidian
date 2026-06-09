/**
 * Regression coverage for line-ending invariant linting.
 *
 * User reports showed Linux CI diagnostics diverging from local runs after Git
 * changed Markdown files from LF to CRLF. This test keeps the assertion at the
 * lint pipeline boundary: equivalent LF and CRLF strings should produce the
 * same rule codes and locations, while ordinary MD032 behavior stays active.
 *
 * @module tests/integration/regression/issue-line-ending-gitattributes.test
 */
import { describe, it, expect } from "bun:test";
import { runLint } from "../../../src/application/LintUseCase.js";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";
import type { FileExistenceChecker } from "../../../src/domain/fs/FileExistenceChecker.js";
import { makeRuleRegistry } from "../../../src/domain/linting/RuleRegistry.js";
import { makeMarkdownItParser } from "../../../src/infrastructure/parser/MarkdownItParser.js";
import { registerBuiltinRules } from "../../../src/infrastructure/rules/ofm/registerBuiltin.js";

const USER_REPRO = [
  "# Notice",
  "",
  "> [[domain/ubiquitous-language#notification-group|Notification Group]], which is an email",
  "",
  "> [!INFO] Valid callout",
  "> body",
  "",
  "Paragraph before list",
  "- one",
  "- two",
  "",
  "> [!NOTE]Title",
  "",
].join("\n");

const noopFsCheck: FileExistenceChecker = {
  exists: async () => false,
};

describe("regression: line-ending responsive linting", () => {
  it("emits identical diagnostics for equivalent LF and CRLF content", async () => {
    const lf = await lintSource(USER_REPRO);
    const crlf = await lintSource(USER_REPRO.replace(/\n/g, "\r\n"));

    expect(summarize(crlf)).toEqual(summarize(lf));
  });

  it("reports OFM041 only for the genuine malformed callout", async () => {
    const results = await lintSource(USER_REPRO);
    const ofm041 = results[0]!.errors.filter((error) => error.ruleCode === "OFM041");

    expect(ofm041).toHaveLength(1);
    expect(ofm041[0]?.message).toContain("> [!NOTE]Title");
  });

  it("keeps MD032 active for lists without surrounding blank lines", async () => {
    const results = await lintSource(USER_REPRO);
    const md032 = results[0]!.errors.filter((error) => error.ruleCode === "MD032");

    expect(md032.length).toBeGreaterThan(0);
  });
});

async function lintSource(content: string): ReturnType<typeof runLint> {
  const registry = makeRuleRegistry();
  registerBuiltinRules(registry);
  return runLint(["note.md"], DEFAULT_CONFIG, registry, {
    parser: makeMarkdownItParser(),
    readFile: async () => content,
    fsCheck: noopFsCheck,
  });
}

function summarize(results: Awaited<ReturnType<typeof runLint>>): readonly string[] {
  return results.flatMap((result) =>
    result.errors.map((error) => `${error.ruleCode}:${error.line}:${error.column}`),
  );
}
