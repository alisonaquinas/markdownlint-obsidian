/**
 * Purpose: Lint rule that validates each frontmatter key has the type declared in typeMap.
 *
 * Provides: {@link OFM083Rule}
 *
 * Role in system: For every entry in `config.frontmatter.typeMap`, fetches the value via
 * {@link getByDotPath} and checks it against the expected type using {@link typeOf} (or
 * {@link isIsoDate} for date fields), ensuring structured frontmatter conforms to the
 * vault's declared schema.
 *
 * @module infrastructure/rules/ofm/frontmatter/OFM083-invalid-value-type
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { getByDotPath, typeOf } from "./shared/FrontmatterAccess.js";
import { isIsoDate } from "./shared/DateFormat.js";

/**
 * OFM083 — invalid-value-type.
 *
 * Verify each key listed in `frontmatter.typeMap` against its expected JSON
 * type. Missing keys are skipped (OFM080's job). For `expected === "date"`
 * the rule defers to {@link isIsoDate} so YAML-coerced `Date` objects and
 * ISO strings both pass.
 *
 * @see docs/rules/frontmatter/OFM083.md
 */
export const OFM083Rule: OFMRule = {
  names: ["OFM083", "invalid-value-type"],
  description: "Frontmatter key has the wrong type per typeMap",
  tags: ["frontmatter", "schema"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    for (const [key, expected] of Object.entries(config.frontmatter.typeMap)) {
      const value = getByDotPath(parsed.frontmatter, key);
      if (value === undefined) continue;
      if (expected === "date") {
        if (!isIsoDate(value)) {
          onError({
            line: 1,
            column: 1,
            message: `Frontmatter key "${key}" must be date, got ${typeOf(value)}`,
          });
        }
        continue;
      }
      const actual = typeOf(value);
      if (actual !== expected) {
        onError({
          line: 1,
          column: 1,
          message: `Frontmatter key "${key}" must be ${expected}, got ${actual}`,
        });
      }
    }
  },
};
