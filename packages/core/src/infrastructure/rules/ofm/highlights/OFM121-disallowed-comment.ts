import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM121 — disallowed-comment.
 *
 * Two independent switches on `config.comments`:
 *   - `allow: false`           → every `%%…%%` reports.
 *   - `disallowMultiline: true`→ only multi-line comments report.
 *
 * Default config keeps the rule disabled (`rules.OFM121.enabled: false`)
 * so flipping either flag is enough to opt in without also touching the
 * rules table.
 *
 * @see docs/rules/highlights/OFM121.md
 */
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
