/**
 * Purpose: Lint rule that reports required frontmatter keys that are present but hold no value.
 *
 * Provides: {@link OFM084Rule}
 *
 * Role in system: Complements OFM080 by checking that each required key is not only present
 * but also non-empty (rejecting `null`, empty strings, and empty arrays), ensuring required
 * fields carry meaningful data.
 *
 * @module infrastructure/rules/ofm/frontmatter/OFM084-empty-required-key
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { getByDotPath, typeOf } from "./shared/FrontmatterAccess.js";

/**
 * OFM084 — empty-required-key.
 *
 * For each entry in `frontmatter.required`, fail if the key is present but
 * empty (`null`, `""`, or an empty array). Missing keys are OFM080's
 * responsibility, not ours.
 *
 * @see docs/rules/frontmatter/OFM084.md
 */
export const OFM084Rule: OFMRule = {
  names: ["OFM084", "empty-required-key"],
  description: "Required frontmatter key is present but empty",
  tags: ["frontmatter"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    for (const key of config.frontmatter.required) {
      const value = getByDotPath(parsed.frontmatter, key);
      if (value === undefined) continue;
      if (isEmpty(value)) {
        onError({
          line: 1,
          column: 1,
          message: `Required frontmatter key "${key}" is empty`,
        });
      }
    }
  },
};

function isEmpty(value: unknown): boolean {
  if (value === null || value === "") return true;
  if (typeOf(value) === "array" && (value as unknown[]).length === 0) return true;
  return false;
}
