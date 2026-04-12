// Installed-package import (after `npm install markdownlint-obsidian`):
//   import type { OFMRule } from 'markdownlint-obsidian/api';
// Source-tree import (running via tsx from repo root):
import type { OFMRule } from "../../src/public/index.js";

const BANNED = new Set(["wiki/deprecated", "drafts/private"]);

/**
 * Disallow wikilinks to a configured set of target paths.
 *
 * Demonstrates: iterating `parsed.wikilinks`, reading the link target,
 * and emitting a violation with the original source position.
 */
const rule: OFMRule = {
  names: ["CUSTOM002", "banned-wikilink-targets"],
  description: "Disallow wikilinks to banned target paths",
  tags: ["custom", "wikilinks"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    for (const link of parsed.wikilinks) {
      if (BANNED.has(link.target)) {
        onError({
          line: link.position.line,
          column: link.position.column,
          message: `Wikilink target "${link.target}" is banned`,
        });
      }
    }
  },
};

export default rule;
