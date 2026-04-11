/**
 * Validate Obsidian tag syntax against a value with no leading `#`.
 *
 * Allowed characters: A-Z, a-z, 0-9, `_`, `-`, `/`.
 * Must not start or end with `/`, must not contain `//`, and must contain
 * at least one letter (or `_`/`-`) so that pure-numeric tags are rejected.
 *
 * @param value - Candidate tag string (without leading `#`).
 * @returns true if the tag conforms to Obsidian's syntax rules.
 */
const ALLOWED = /^[A-Za-z0-9_/-]+$/;
const HAS_LETTER = /[A-Za-z_-]/;

export function isValidTag(value: string): boolean {
  if (value.length === 0) return false;
  if (!ALLOWED.test(value)) return false;
  if (value.startsWith("/") || value.endsWith("/")) return false;
  if (value.includes("//")) return false;
  if (!HAS_LETTER.test(value)) return false;
  return true;
}

/**
 * Count the number of `/`-separated segments in a tag value.
 *
 * `simple` -> 1, `nested/tag` -> 2, `a/b/c` -> 3.
 *
 * @param value - Tag string (without leading `#`).
 * @returns Segment count, always >= 1 for non-empty input.
 */
export function tagDepth(value: string): number {
  return value.split("/").length;
}
