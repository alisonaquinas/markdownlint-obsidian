import type { LinterConfig } from "../domain/config/LinterConfig.js";
import type { LintError } from "../domain/linting/LintError.js";
import { makeLintError } from "../domain/linting/LintError.js";
import { makeLintResult, type LintResult } from "../domain/linting/LintResult.js";
import type { RuleRegistry } from "../domain/linting/RuleRegistry.js";
import type { Parser } from "../domain/parsing/Parser.js";
import type { ParseResult } from "../domain/parsing/ParseResult.js";
import type { OFMRule } from "../domain/linting/OFMRule.js";
import type { VaultIndex } from "../domain/vault/VaultIndex.js";
import type { BlockRefIndex } from "../domain/vault/BlockRefIndex.js";
import type { FileExistenceChecker } from "../domain/fs/FileExistenceChecker.js";

export interface LintDependencies {
  readonly parser: Parser;
  readonly readFile: (absolutePath: string) => Promise<string>;
  readonly vault?: VaultIndex | null;
  readonly blockRefIndex?: BlockRefIndex | null;
  readonly fsCheck: FileExistenceChecker;
}

/**
 * Run every active rule against each file.
 * Parser failures become OFM902 errors; rule exceptions are propagated.
 *
 * @param filePaths - Absolute paths of files to lint.
 * @param config - Merged configuration for this run.
 * @param registry - Rule registry (populated via registerBuiltinRules).
 * @param deps - Infrastructure adapters (parser + file reader).
 * @returns One {@link LintResult} per input file.
 */
export async function runLint(
  filePaths: readonly string[],
  config: LinterConfig,
  registry: RuleRegistry,
  deps: LintDependencies,
): Promise<LintResult[]> {
  const results: LintResult[] = [];
  const vault = deps.vault ?? null;
  const blockRefIndex = deps.blockRefIndex ?? null;
  const fsCheck = deps.fsCheck;
  for (const filePath of filePaths) {
    const errors: LintError[] = [];
    try {
      const raw = await deps.readFile(filePath);
      const parsed = deps.parser.parse(filePath, raw);
      for (const rule of iterateActiveRules(registry, config)) {
        await runRule(rule, parsed, config, vault, blockRefIndex, fsCheck, errors);
      }
    } catch (err) {
      errors.push(buildParserError(err));
    }
    results.push(makeLintResult(filePath, errors));
  }
  return results;
}

function iterateActiveRules(registry: RuleRegistry, config: LinterConfig): readonly OFMRule[] {
  return registry.all().filter((rule) => {
    for (const name of rule.names) {
      const cfg = config.rules[name];
      if (cfg !== undefined) return cfg.enabled;
    }
    return true;
  });
}

async function runRule(
  rule: OFMRule,
  parsed: ParseResult,
  config: LinterConfig,
  vault: VaultIndex | null,
  blockRefIndex: BlockRefIndex | null,
  fsCheck: FileExistenceChecker,
  errors: LintError[],
): Promise<void> {
  await rule.run(
    { filePath: parsed.filePath, parsed, config, vault, fsCheck, blockRefIndex },
    (partial) => {
      errors.push(
        makeLintError({
          ruleCode: rule.names[0] ?? "UNKNOWN",
          ruleName: rule.names[1] ?? rule.names[0] ?? "unknown",
          severity: rule.severity,
          line: partial.line,
          column: partial.column,
          message: partial.message,
          fixable: rule.fixable,
          ...(partial.fix !== undefined ? { fix: partial.fix } : {}),
        }),
      );
    },
  );
}

function buildParserError(err: unknown): LintError {
  const message = err instanceof Error ? err.message : String(err);
  const isOFM902 = message.startsWith("OFM902");
  return makeLintError({
    ruleCode: isOFM902 ? "OFM902" : "OFM901",
    ruleName: isOFM902 ? "frontmatter-parse-error" : "internal-parser-error",
    severity: "error",
    line: 1,
    column: 1,
    message,
    fixable: false,
  });
}
