/**
 * Purpose: Lint rule that warns when a frontmatter top-level key is not listed in the typeMap.
 *
 * Provides: {@link OFM082Rule}
 *
 * Role in system: Enforces strict frontmatter schemas by comparing each top-level key in the
 * parsed frontmatter against `config.frontmatter.typeMap`; only active when
 * `frontmatter.allowUnknown` is false, making it opt-in for vaults that want a closed schema.
 *
 * @module infrastructure/rules/ofm/frontmatter/OFM082-unknown-top-level-key
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM082 — unknown-top-level-key.
 *
 * Warns when a file's frontmatter contains a top-level key not present in
 * `frontmatter.typeMap`. Only fires when `frontmatter.allowUnknown === false`,
 * so the rule is a no-op for vaults that haven't opted into a strict schema.
 *
 * Disabled by default in `DEFAULT_CONFIG`.
 *
 * @see docs/rules/frontmatter/OFM082.md
 */
export const OFM082Rule: OFMRule = {
  names: ["OFM082", "unknown-top-level-key"],
  description: "Frontmatter contains a key not present in typeMap",
  tags: ["frontmatter", "schema"],
  severity: "warning",
  fixable: false,
  run({ parsed, config }, onError) {
    if (config.frontmatter.allowUnknown) return;
    const known = new Set(Object.keys(config.frontmatter.typeMap));
    for (const key of Object.keys(parsed.frontmatter)) {
      if (!known.has(key)) {
        onError({
          line: 1,
          column: 1,
          message: `Unknown frontmatter key "${key}"`,
        });
      }
    }
  },
};
