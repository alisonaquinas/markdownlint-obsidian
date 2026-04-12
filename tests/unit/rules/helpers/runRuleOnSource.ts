import type { OFMRule } from "../../../../src/domain/linting/OFMRule.js";
import type { LintError } from "../../../../src/domain/linting/LintError.js";
import { makeLintError } from "../../../../src/domain/linting/LintError.js";
import { makeMarkdownItParser } from "../../../../src/infrastructure/parser/MarkdownItParser.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";
import type { LinterConfig } from "../../../../src/domain/config/LinterConfig.js";
import type { VaultIndex } from "../../../../src/domain/vault/VaultIndex.js";
import type { BlockRefIndex } from "../../../../src/domain/vault/BlockRefIndex.js";
import type { FileExistenceChecker } from "../../../../src/domain/fs/FileExistenceChecker.js";

/**
 * Default stub {@link FileExistenceChecker} used whenever a rule under test
 * does not supply its own. It reports that nothing exists; rules that need
 * specific files to resolve must pass a custom checker via the `fsCheck`
 * override.
 */
const DEFAULT_FS_CHECK: FileExistenceChecker = {
  async exists(): Promise<boolean> {
    return false;
  },
};

/**
 * Parse `source`, run `rule` once against the parsed result, and collect
 * every LintError the rule emits.
 *
 * Config defaults to `DEFAULT_CONFIG`; pass `overrides` to patch specific
 * branches for a single test. `vault` defaults to `null` so every pre-Phase-4
 * test stays green without modification. Phase 4 rule tests pass a stub
 * {@link VaultIndex} when they need resolution. Phase 5 rule tests may pass
 * a custom {@link FileExistenceChecker} when they need filesystem probes
 * (OFM022); the default checker always reports "not found".
 *
 * `rule.run` may be synchronous or asynchronous; this helper awaits the
 * return value either way, so Phase 5 async rules work without per-test
 * plumbing.
 *
 * @param rule - The rule under test.
 * @param source - Markdown source string (frontmatter optional).
 * @param overrides - Partial config patch merged over `DEFAULT_CONFIG`.
 * @param vault - Optional stub vault index (null disables wikilink resolution).
 * @param fsCheck - Optional stub file existence checker. Defaults to one
 *                  that returns `false` for every probe.
 * @param blockRefIndex - Optional stub {@link BlockRefIndex}. Defaults to
 *                        `null`, matching the `config.resolve === false`
 *                        branch so existing tests stay green.
 * @param filePath - Optional file path to attach to the parsed result.
 *                   Defaults to `"test.md"` so existing tests stay green.
 *                   Rules that care about the path (e.g. OFM120's
 *                   `allowedGlobs` matching) should pass a realistic
 *                   absolute path here.
 * @returns LintError instances emitted by the rule, in emission order.
 */
export async function runRuleOnSource(
  rule: OFMRule,
  source: string,
  overrides: Partial<LinterConfig> = {},
  vault: VaultIndex | null = null,
  fsCheck: FileExistenceChecker = DEFAULT_FS_CHECK,
  blockRefIndex: BlockRefIndex | null = null,
  filePath: string = "test.md",
): Promise<LintError[]> {
  const parseResult = parseOrFallback(filePath, source);
  if (parseResult.kind === "error") return [parseResult.error];

  const config: LinterConfig = Object.freeze({ ...DEFAULT_CONFIG, ...overrides });
  const errors: LintError[] = [];
  await rule.run(
    {
      filePath: parseResult.parsed.filePath,
      parsed: parseResult.parsed,
      config,
      vault,
      fsCheck,
      blockRefIndex,
    },
    (partial) => errors.push(buildError(rule, partial)),
  );

  return errors;
}

type ParseOutcome =
  | { kind: "parsed"; parsed: ReturnType<ReturnType<typeof makeMarkdownItParser>["parse"]> }
  | { kind: "error"; error: LintError };

function parseOrFallback(filePath: string, source: string): ParseOutcome {
  const parser = makeMarkdownItParser();
  try {
    return { kind: "parsed", parsed: parser.parse(filePath, source) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      kind: "error",
      error: makeLintError({
        ruleCode: "OFM902",
        ruleName: "frontmatter-parse-error",
        severity: "error",
        line: 1,
        column: 1,
        message,
        fixable: false,
      }),
    };
  }
}

function buildError(
  rule: OFMRule,
  partial: Parameters<Parameters<OFMRule["run"]>[1]>[0],
): LintError {
  return makeLintError({
    ruleCode: rule.names[0] ?? "UNKNOWN",
    ruleName: rule.names[1] ?? rule.names[0] ?? "unknown",
    severity: rule.severity,
    line: partial.line,
    column: partial.column,
    message: partial.message,
    fixable: rule.fixable,
    ...(partial.fix !== undefined ? { fix: partial.fix } : {}),
  });
}
