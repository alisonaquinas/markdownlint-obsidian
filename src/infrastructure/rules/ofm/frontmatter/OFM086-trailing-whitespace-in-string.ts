import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

const TRAILING_WS = /[ \t]+$/;

/**
 * OFM086 — frontmatter-trailing-whitespace.
 *
 * Walks every string value reachable from `parsed.frontmatter` (including
 * nested maps and array elements) and warns if it ends with one or more
 * spaces or tabs. Marked fixable for the future Phase 9 autofix engine,
 * which will rewrite the YAML in place.
 *
 * @see docs/rules/frontmatter/OFM086.md
 */
export const OFM086Rule: OFMRule = {
  names: ["OFM086", "frontmatter-trailing-whitespace"],
  description: "Frontmatter string value has trailing whitespace",
  tags: ["frontmatter", "whitespace"],
  severity: "warning",
  fixable: true,
  run({ parsed }, onError) {
    walk(parsed.frontmatter, [], onError);
  },
};

type Emit = (e: { line: number; column: number; message: string }) => void;

function walk(value: unknown, path: readonly string[], emit: Emit): void {
  if (typeof value === "string") {
    if (TRAILING_WS.test(value)) {
      const where = path.length === 0 ? "(root)" : path.join(".");
      emit({
        line: 1,
        column: 1,
        message: `Frontmatter value at "${where}" has trailing whitespace`,
      });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, [...path, String(i)], emit));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      walk(v, [...path, k], emit);
    }
  }
}
