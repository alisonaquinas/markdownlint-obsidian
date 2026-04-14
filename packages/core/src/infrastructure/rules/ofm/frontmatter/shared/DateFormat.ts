/**
 * Purpose: Shared utility for testing whether a value is a parseable ISO-8601 date.
 *
 * Provides: {@link isIsoDate}
 *
 * Role in system: Centralises ISO-8601 validation logic reused by OFM081 and OFM083,
 * handling both raw string dates and `Date` objects coerced by gray-matter so the two
 * rules stay in sync without duplicating the regex or parse logic.
 *
 * @module infrastructure/rules/ofm/frontmatter/shared/DateFormat
 */
/**
 * Test whether a value is a parseable ISO-8601 date.
 *
 * Accepts:
 *   - A `Date` instance whose timestamp is finite (gray-matter coerces
 *     unquoted YAML dates such as `2026-04-11` into `Date` objects, so
 *     accepting them here mirrors what authors actually wrote on disk).
 *   - A string matching `YYYY-MM-DD`, `YYYY-MM-DDTHH:MM:SS`, with optional
 *     fractional seconds and `Z` / `+HH:MM` / `-HH:MM` offset.
 *
 * Rejects every other input.
 *
 * @param input - Candidate value (any type).
 * @returns true if `input` is a valid ISO-8601 date or `Date` instance.
 */
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/;

export function isIsoDate(input: unknown): boolean {
  if (input instanceof Date) {
    return Number.isFinite(input.getTime());
  }
  if (typeof input !== "string") return false;
  if (!ISO_PATTERN.test(input)) return false;
  const ms = Date.parse(input);
  return Number.isFinite(ms);
}
