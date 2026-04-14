/**
 * Purpose: Lint rule that reports tags whose nesting depth exceeds the configured maximum.
 *
 * Provides: {@link OFM061Rule}
 *
 * Role in system: Counts the `/`-separated segments of each body-text tag via
 * {@link tagDepth} and fires when the count exceeds `config.tags.maxDepth`, enforcing
 * vault-level tag hierarchy limits.
 *
 * @module infrastructure/rules/ofm/tags/OFM061-tag-depth-exceeded
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { tagDepth } from "./shared/TagFormat.js";

/**
 * OFM061 — tag-depth-exceeded.
 *
 * Fails when any body-text tag has more `/`-separated segments than
 * `tags.maxDepth` permits. The default ceiling is 5.
 *
 * @see docs/rules/tags/OFM061.md
 */
export const OFM061Rule: OFMRule = {
  names: ["OFM061", "tag-depth-exceeded"],
  description: "Nested tag exceeds the configured maxDepth",
  tags: ["tags"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    const max = config.tags.maxDepth;
    for (const tag of parsed.tags) {
      const depth = tagDepth(tag.value);
      if (depth > max) {
        onError({
          line: tag.position.line,
          column: tag.position.column,
          message: `Tag "${tag.raw}" has depth ${depth} (max ${max})`,
        });
      }
    }
  },
};
