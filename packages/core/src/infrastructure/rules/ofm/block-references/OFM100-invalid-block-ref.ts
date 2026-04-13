import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM100 — invalid-block-ref.
 *
 * Reports every `^blockid` whose identifier does not match the regex in
 * `config.blockRefs.idPattern`. Obsidian's own grammar allows letters,
 * digits, and hyphens; the default pattern mirrors that plus an
 * Obsidian-compatible 32-char cap so tests have a stable target.
 *
 * @see docs/rules/block-references/OFM100.md
 */
export const OFM100Rule: OFMRule = {
  names: ["OFM100", "invalid-block-ref"],
  description: "Block reference id does not match the configured pattern",
  tags: ["block-references"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    const pattern = new RegExp(config.blockRefs.idPattern);
    for (const ref of parsed.blockRefs) {
      if (!pattern.test(ref.blockId)) {
        onError({
          line: ref.position.line,
          column: ref.position.column,
          message: `Block reference "^${ref.blockId}" does not match pattern ${config.blockRefs.idPattern}`,
        });
      }
    }
  },
};
