import type { OFMRule } from "../../../../src/domain/linting/OFMRule.js";
import type { LintError } from "../../../../src/domain/linting/LintError.js";
import { makeLintError } from "../../../../src/domain/linting/LintError.js";
import { makeMarkdownItParser } from "../../../../src/infrastructure/parser/MarkdownItParser.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";
import type { LinterConfig } from "../../../../src/domain/config/LinterConfig.js";

/**
 * Parse `source`, run `rule` once against the parsed result, and collect
 * every LintError the rule emits.
 *
 * Config defaults to `DEFAULT_CONFIG`; pass `overrides` to patch specific
 * branches for a single test. This is the canonical entry point for every
 * Phase 3+ rule unit test.
 *
 * @param rule - The rule under test.
 * @param source - Markdown source string (frontmatter optional).
 * @param overrides - Partial config patch merged over `DEFAULT_CONFIG`.
 * @returns LintError instances emitted by the rule, in emission order.
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
        line: 1,
        column: 1,
        message,
        fixable: false,
      }),
    ];
  }

  const config: LinterConfig = Object.freeze({ ...DEFAULT_CONFIG, ...overrides });
  const errors: LintError[] = [];
  rule.run({ filePath: parsed.filePath, parsed, config }, (partial) => {
    errors.push(
      makeLintError({
        ruleCode: rule.names[0] ?? "UNKNOWN",
        ruleName: rule.names[1] ?? rule.names[0] ?? "unknown",
        severity: rule.severity,
        line: partial.line,
        column: partial.column,
        message: partial.message,
        fixable: rule.fixable,
        ...(partial.fix !== undefined ? { fix: partial.fix } : {}),
      }),
    );
  });

  return errors;
}
