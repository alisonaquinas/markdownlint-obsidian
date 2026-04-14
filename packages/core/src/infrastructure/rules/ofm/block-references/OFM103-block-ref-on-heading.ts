/**
 * Purpose: Lint rule that warns when a block reference is attached to a heading line.
 *
 * Provides: {@link OFM103Rule}
 *
 * Role in system: Detects the common mistake of appending `^blockid` to an ATX heading,
 * which Obsidian silently ignores in favour of the heading's own navigation target,
 * guiding authors toward proper paragraph anchors or heading links.
 *
 * @module infrastructure/rules/ofm/block-references/OFM103-block-ref-on-heading
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

const HEADING_PREFIX = /^#{1,6}\s/;

/**
 * OFM103 — block-ref-on-heading.
 *
 * Warns when `^blockid` appears on a line that starts with a heading
 * marker. Obsidian renders headings as their own navigation targets, and
 * a trailing block id on a heading line is silently ignored — authors
 * almost always wanted a normal paragraph anchor or a heading link
 * (`[[page#Heading]]`).
 *
 * @see docs/rules/block-references/OFM103.md
 */
export const OFM103Rule: OFMRule = {
  names: ["OFM103", "block-ref-on-heading"],
  description: "Block reference attached to a heading line",
  tags: ["block-references"],
  severity: "warning",
  fixable: false,
  run({ parsed }, onError) {
    for (const ref of parsed.blockRefs) {
      const line = parsed.lines[ref.position.line - 1] ?? "";
      if (HEADING_PREFIX.test(line)) {
        onError({
          line: ref.position.line,
          column: ref.position.column,
          message: "Block reference cannot be attached to a heading line",
        });
      }
    }
  },
};
