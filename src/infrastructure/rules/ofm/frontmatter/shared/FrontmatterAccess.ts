/**
 * Traverse an object using a dotted path. Returns `undefined` if any
 * intermediate segment is missing or non-object.
 *
 * @param source - Object to traverse (typically `parsed.frontmatter`).
 * @param dotPath - Dotted key path, e.g. `"author.name"`.
 * @returns The looked-up value, or `undefined` if any segment is missing.
 */
export function getByDotPath(source: unknown, dotPath: string): unknown {
  const parts = dotPath.split(".");
  let cursor: unknown = source;
  for (const part of parts) {
    if (typeof cursor !== "object" || cursor === null) return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
    if (cursor === undefined) return undefined;
  }
  return cursor;
}

/** Distinct frontmatter value categories used by OFM082/OFM083. */
export type FrontmatterValueType =
  | "null"
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | "unknown";

/**
 * Classify an arbitrary frontmatter value into a stable type tag.
 *
 * Arrays are reported as `"array"` (not `"object"`), `null` is reported as
 * `"null"`, and `undefined`/symbols/functions become `"unknown"`.
 *
 * @param value - Any value.
 * @returns A {@link FrontmatterValueType} tag.
 */
export function typeOf(value: unknown): FrontmatterValueType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "object":
      return "object";
    default:
      return "unknown";
  }
}
