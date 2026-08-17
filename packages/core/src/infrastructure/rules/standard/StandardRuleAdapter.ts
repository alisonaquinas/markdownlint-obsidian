import type { Configuration, FixInfo } from "markdownlint";
import type { OFMRule, OnErrorCallback, RuleParams } from "../../../domain/linting/OFMRule.js";
import type { LinterConfig } from "../../../domain/config/LinterConfig.js";
import type { RuleConfig } from "../../../domain/config/RuleConfig.js";
import type { MarkdownLintAdapter, StandardViolation } from "./MarkdownLintAdapter.js";
import { makeFix, type Fix } from "../../../domain/linting/Fix.js";

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
 * Translate a markdownlint {@link FixInfo} into our domain {@link Fix},
 * filling in defaults for any fields the library left absent.
 *
 * Markdownlint uses `deleteCount: -1` as a sentinel for "delete the
 * entire line, including its trailing newline" (see MD012, MD053). Our
 * column-based {@link applyFixes} machinery cannot represent line
 * removal, so we treat the violation as un-fixable and return
 * `undefined`: the diagnostic still surfaces, but no autofix is
 * attached. Without this guard, `makeFix` would throw and the lint pass
 * would surface as `OFM901: Fix.deleteCount must be >= 0` against the
 * file root — issue #28.
 */
function fixInfoToFix(fi: FixInfo, fallbackLine: number): Fix | undefined {
  const rawDelete = fi.deleteCount ?? 0;
  if (rawDelete < 0) return undefined;
  // markdownlint derives some fixInfo payloads from virtual blockquote
  // lines (markers stripped, lazy continuations renumbered) while the
  // violation lineNumber is raw-file mapped. When the two disagree the
  // fix would splice a neighbouring line — suppress it and keep the
  // violation report-only.
  if (fi.lineNumber !== undefined && fi.lineNumber !== fallbackLine) {
    return undefined;
  }
  return makeFix({
    lineNumber: fallbackLine,
    editColumn: fi.editColumn ?? 1,
    deleteCount: rawDelete,
    insertText: fi.insertText ?? "",
  });
}

/**
 * Rules whose fix semantics are strictly "delete trailing whitespace".
 * markdownlint computes some of their fixInfo payloads against virtual
 * blockquote lines (lazy continuations renumbered), so violation and fix
 * can both point one raw line off — deleting the space after the `>`
 * marker of the NEXT line and corrupting prose. For these rules a fix is
 * only trusted when its deleted span is whitespace running to end of line.
 */
const TRAILING_WHITESPACE_FIX_RULES: ReadonlySet<string> = new Set(["MD009", "MD010", "MD012"]);

/**
 * Translate a {@link StandardViolation} into the payload expected by
 * {@link OnErrorCallback}, attaching a {@link Fix} when `fixInfo` is
 * present **and** translatable. A `fixInfo` whose `deleteCount` cannot
 * be resolved (see {@link fixInfoToFix}) yields a fix-less payload so
 * the violation still reaches the user.
 */
function buildErrorPayload(v: StandardViolation): Parameters<OnErrorCallback>[0] {
  const base = {
    line: v.lineNumber,
    column: v.errorRange?.[0] ?? 1,
    message: v.errorDetail ? `${v.ruleDescription}: ${v.errorDetail}` : v.ruleDescription,
  };
  if (v.fixInfo === undefined) return base;
  const fix = fixInfoToFix(v.fixInfo, v.lineNumber);
  return fix === undefined ? base : { ...base, fix };
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
 * column 1; `fixInfo` is translated to a {@link Fix} when present.
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
        onError(buildErrorPayload(v));
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
