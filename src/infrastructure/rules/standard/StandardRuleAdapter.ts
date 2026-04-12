import type { Configuration } from "markdownlint";
import type { OFMRule, OnErrorCallback, RuleParams } from "../../../domain/linting/OFMRule.js";
import type { LinterConfig } from "../../../domain/config/LinterConfig.js";
import type { RuleConfig } from "../../../domain/config/RuleConfig.js";
import type { MarkdownLintAdapter } from "./MarkdownLintAdapter.js";

/**
 * Minimal metadata needed to expose one upstream markdownlint rule as an
 * {@link OFMRule}.
 *
 * `code` is the `MDxxx` identifier markdownlint uses internally and is
 * paired with the human-friendly `name` (e.g. `"line-length"`) so users can
 * look the rule up by either spelling. `fixable` tracks whether markdownlint
 * publishes a `fixInfo` payload for the rule — Phase 9 will honour that flag
 * when wiring autofix; Phase 7 only records it for documentation.
 */
export interface StandardRuleDescriptor {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly fixable: boolean;
  readonly severity: "error" | "warning";
}

/**
 * Wrap a single markdownlint rule descriptor as an {@link OFMRule}.
 *
 * The returned rule defers execution to the shared
 * {@link MarkdownLintAdapter}, filters violations by `desc.code`, and emits
 * one `onError` per matching violation. Because every wrapper shares the
 * same adapter instance the upstream markdownlint library runs at most once
 * per file per lint pass, regardless of how many MD rules fire.
 *
 * Violations that markdownlint returns without an `errorRange` fall back to
 * column 1; any richer range handling is deferred to the Phase 9 autofix
 * work that consumes `fixInfo` directly.
 */
export function buildStandardRule(
  desc: StandardRuleDescriptor,
  adapter: MarkdownLintAdapter,
): OFMRule {
  return {
    names: [desc.code, desc.name],
    description: desc.description,
    tags: ["markdownlint", "standard"],
    severity: desc.severity,
    fixable: desc.fixable,
    run({ filePath, parsed, config }: RuleParams, onError: OnErrorCallback): void {
      const mdConfig = extractMdConfig(config);
      const violations = adapter.runOnce(filePath, parsed.raw, mdConfig);
      for (const v of violations) {
        if (!v.ruleNames.includes(desc.code)) continue;
        onError({
          line: v.lineNumber,
          column: v.errorRange?.[0] ?? 1,
          message: v.errorDetail ? `${v.ruleDescription}: ${v.errorDetail}` : v.ruleDescription,
        });
      }
    },
  };
}

/**
 * Translate our {@link LinterConfig.rules} map into a markdownlint
 * {@link Configuration} object.
 *
 * We always start from `{ default: true }` (markdownlint's "every MD rule
 * enabled" baseline) and then overlay any `MDxxx` keys the user supplied.
 * A rule entry with `enabled: false` maps to `false`; otherwise the
 * `options` map (if present) is forwarded as markdownlint's per-rule
 * configuration, falling back to plain `true` when no options are set.
 *
 * Non-MD rule keys (OFM001 etc.) are ignored — markdownlint would reject
 * unknown rule names otherwise.
 */
export function extractMdConfig(config: LinterConfig): Configuration {
  const out: Configuration = { default: true };
  for (const [key, rawValue] of Object.entries(config.rules)) {
    if (!key.startsWith("MD")) continue;
    const rc = rawValue as RuleConfig;
    if (rc.enabled === false) {
      out[key] = false;
      continue;
    }
    out[key] = rc.options !== undefined ? { ...rc.options } : true;
  }
  return out;
}
