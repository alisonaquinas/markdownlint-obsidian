/**
 * Purpose: Lint rule that detects identical `^blockid` declarations within a single file.
 *
 * Provides: {@link OFM101Rule}
 *
 * Role in system: Tracks seen block ids in a map and reports duplicates so that wikilink
 * anchors (`[[page#^id]]`) always resolve to an unambiguous target; controlled by
 * `config.blockRefs.requireUnique`.
 *
 * @module infrastructure/rules/ofm/block-references/OFM101-duplicate-block-id
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM101 — duplicate-block-id.
 *
 * Detects identical `^blockid` declarations inside a single file. Obsidian
 * renders every duplicate as a single target, so wikilinks to `page#^id`
 * silently pick the first occurrence — a subtle bug that only surfaces when
 * readers notice the wrong anchor scrolls into view.
 *
 * Controlled by `config.blockRefs.requireUnique`. When `false`, the rule is
 * a no-op even if it is enabled in `rules`.
 *
 * @see docs/rules/block-references/OFM101.md
 */
export const OFM101Rule: OFMRule = {
  names: ["OFM101", "duplicate-block-id"],
  description: "Same block id declared twice in the same file",
  tags: ["block-references"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    if (!config.blockRefs.requireUnique) return;
    const seen = new Map<string, { line: number; column: number }>();
    for (const ref of parsed.blockRefs) {
      const prior = seen.get(ref.blockId);
      if (prior !== undefined) {
        onError({
          line: ref.position.line,
          column: ref.position.column,
          message: `Duplicate block id "^${ref.blockId}" (first on line ${prior.line})`,
        });
      } else {
        seen.set(ref.blockId, { line: ref.position.line, column: ref.position.column });
      }
    }
  },
};
