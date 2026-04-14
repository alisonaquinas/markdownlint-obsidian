/**
 * Purpose: Lint rule that reports `==highlight==` spans when highlights are disabled by config.
 *
 * Provides: {@link OFM120Rule}
 *
 * Role in system: Applies a config-driven ban on Obsidian highlights with a per-glob escape
 * hatch via `minimatch`, letting teams enforce a highlights-free style globally while
 * exempting specific directories such as daily notes.
 *
 * @module infrastructure/rules/ofm/highlights/OFM120-disallowed-highlight
 */
import { minimatch } from "minimatch";
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM120 — disallowed-highlight.
 *
 * Config-driven: reports every `==highlight==` when `config.highlights.allow`
 * is `false`. `allowedGlobs` is a per-glob escape hatch — a path matching any
 * listed glob is exempt, which lets teams ban highlights everywhere except
 * (e.g.) `notes/daily/**`.
 *
 * Each glob is prefixed with `**\/` before matching so documented
 * vault-relative patterns like `notes/daily/**` match the absolute file
 * paths that the CLI hands to the parser.
 *
 * Default config keeps the rule disabled (`rules.OFM120.enabled: false`) so
 * vaults that embrace highlights do not need an opt-out; flip
 * `highlights.allow` to `false` in `.obsidian-linter.jsonc` to turn it on.
 *
 * @see docs/rules/highlights/OFM120.md
 */
export const OFM120Rule: OFMRule = {
  names: ["OFM120", "disallowed-highlight"],
  description: "Highlight `==text==` is disabled by config in this file",
  tags: ["highlights"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    if (config.highlights.allow) return;
    const normalizedPath = parsed.filePath.replace(/\\/g, "/");
    const allowedHere = config.highlights.allowedGlobs.some((glob) =>
      minimatch(normalizedPath, prefixGlob(glob)),
    );
    if (allowedHere) return;
    for (const h of parsed.highlights) {
      onError({
        line: h.position.line,
        column: h.position.column,
        message: "Highlight `==...==` is disallowed by config",
      });
    }
  },
};

/**
 * Prepend `**\/` to a vault-relative glob so it can match against an
 * absolute filePath handed in by the CLI. Idempotent: globs that are
 * already absolute (`**\/foo`, `/foo`) pass through unchanged.
 */
function prefixGlob(glob: string): string {
  if (glob.startsWith("**/") || glob.startsWith("/")) return glob;
  return `**/${glob}`;
}
