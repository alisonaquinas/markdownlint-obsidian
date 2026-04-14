/**
 * Purpose: Lint rule that fires for every required frontmatter key that is absent from a file.
 *
 * Provides: {@link OFM080Rule}
 *
 * Role in system: Iterates `config.frontmatter.required` and uses {@link getByDotPath} to
 * look up each entry (including dotted paths) in the parsed frontmatter, reporting any
 * that are missing so schema-mandatory metadata is never omitted.
 *
 * @module infrastructure/rules/ofm/frontmatter/OFM080-missing-required-key
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { getByDotPath } from "./shared/FrontmatterAccess.js";

/**
 * OFM080 — missing-required-key.
 *
 * Fires once for every entry in `frontmatter.required` that is absent from
 * the file's parsed frontmatter. Dotted paths are supported via
 * {@link getByDotPath}.
 *
 * @see docs/rules/frontmatter/OFM080.md
 */
export const OFM080Rule: OFMRule = {
  names: ["OFM080", "missing-required-key"],
  description: "Required frontmatter key is missing",
  tags: ["frontmatter"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    for (const key of config.frontmatter.required) {
      if (getByDotPath(parsed.frontmatter, key) === undefined) {
        onError({
          line: 1,
          column: 1,
          message: `Required frontmatter key "${key}" is missing`,
        });
      }
    }
  },
};
