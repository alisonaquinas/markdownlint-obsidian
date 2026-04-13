import type { OFMRule } from "../../../../domain/linting/OFMRule.js";

/**
 * OFM902 — frontmatter-parse-error.
 *
 * Runtime behaviour: this rule's `run` is a no-op. The parser throws with
 * `OFM902:` prefix when gray-matter cannot parse frontmatter. LintUseCase
 * catches that, builds a LintError using this rule's metadata, and attaches
 * it to the LintResult directly. The rule is kept as a registry entry for
 * discoverability (`--list-rules`) and for Phase 3's structured frontmatter
 * rule family to share the OFM9xx namespace.
 */
export const frontmatterParseErrorRule: OFMRule = {
  names: ["OFM902", "frontmatter-parse-error"],
  description: "Frontmatter could not be parsed as YAML/TOML",
  tags: ["frontmatter", "parser", "system"],
  severity: "error",
  fixable: false,
  run(): void {
    // No-op — see LintUseCase for actual error emission.
  },
};
