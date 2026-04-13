import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { isIsoDate } from "./shared/DateFormat.js";
import { getByDotPath } from "./shared/FrontmatterAccess.js";

/**
 * OFM081 — invalid-date-format.
 *
 * For each key listed in `frontmatter.dateFields`, verify that its value is
 * a parseable ISO-8601 date string. Missing keys are skipped (OFM080's
 * concern, not ours).
 *
 * @see docs/rules/frontmatter/OFM081.md
 */
export const OFM081Rule: OFMRule = {
  names: ["OFM081", "invalid-date-format"],
  description: "Frontmatter date field is not a valid ISO-8601 value",
  tags: ["frontmatter", "dates"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    for (const key of config.frontmatter.dateFields) {
      const value = getByDotPath(parsed.frontmatter, key);
      if (value === undefined) continue;
      if (!isIsoDate(value)) {
        onError({
          line: 1,
          column: 1,
          message: `Frontmatter key "${key}" must be an ISO-8601 date, got ${JSON.stringify(value)}`,
        });
      }
    }
  },
};
