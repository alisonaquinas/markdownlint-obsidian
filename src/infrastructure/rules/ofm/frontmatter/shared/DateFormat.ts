/**
 * Test whether a value is a parseable ISO-8601 date or datetime string.
 *
 * Accepted shapes:
 *   - `YYYY-MM-DD`
 *   - `YYYY-MM-DDTHH:MM:SS`
 *   - Optional fractional seconds (`.NNN`)
 *   - Optional timezone (`Z` or `+HH:MM` / `-HH:MM`)
 *
 * Returns false for any non-string input or any string that fails the
 * shape regex or `Date.parse`.
 *
 * @param input - Candidate value (any type).
 * @returns true if `input` is a valid ISO-8601 date/datetime string.
 */
const ISO_PATTERN =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/;

export function isIsoDate(input: unknown): boolean {
  if (typeof input !== "string") return false;
  if (!ISO_PATTERN.test(input)) return false;
  const ms = Date.parse(input);
  return Number.isFinite(ms);
}
