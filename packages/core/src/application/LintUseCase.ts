/**
 * Purpose: Orchestrates linting by running every active rule against each file path.
 *
 * Provides: {@link runLint}, {@link LintDependencies}
 *
 * Role in system: Application-layer use case that coordinates the parser, rule registry,
 * and infrastructure adapters (file reader, existence checker, vault index) to produce
 * per-file {@link LintResult} lists without performing any direct I/O itself.
 *
 * @module application/LintUseCase
 */
import type { LinterConfig } from "../domain/config/LinterConfig.js";
import type { LintError } from "../domain/linting/LintError.js";
import { makeLintError } from "../domain/linting/LintError.js";
import type { Fix } from "../domain/linting/Fix.js";
import { makeLintResult, type LintResult } from "../domain/linting/LintResult.js";
import type { RuleRegistry } from "../domain/linting/RuleRegistry.js";
import type { Parser } from "../domain/parsing/Parser.js";
import type { ParseResult } from "../domain/parsing/ParseResult.js";
import type { OFMRule } from "../domain/linting/OFMRule.js";
import type { VaultIndex } from "../domain/vault/VaultIndex.js";
import type { BlockRefIndex } from "../domain/vault/BlockRefIndex.js";
import type { FileExistenceChecker } from "../domain/fs/FileExistenceChecker.js";

// Module-level set to suppress repeated warnings per process
const warnedMissingFix = new Set<string>();

function emitDebugFixWarning(ruleName: string): void {
  if (process.env["OFM_DEBUG_FIX"] !== undefined) {
    process.stderr.write(`[OFM internal] Rule ${ruleName} is fixable but emitted no Fix payload\n`);
  }
}

function warnIfMissingFix(rule: OFMRule, fix: unknown): void {
  const name = rule.names[0] ?? "";
  if (!rule.fixable || fix !== undefined || warnedMissingFix.has(name)) return;
  warnedMissingFix.add(name);
  emitDebugFixWarning(rule.names[0] ?? "unknown");
}

export interface LintDependencies {
  readonly parser: Parser;
  readonly readFile: (absolutePath: string) => Promise<string>;
  readonly shouldLintFile?: (absolutePath: string, raw: string) => boolean | Promise<boolean>;
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
    const result = await lintFile(filePath, config, registry, deps, vault, blockRefIndex, fsCheck);
    if (result !== null) results.push(result);
  }
  return results;
}

async function lintFile(
  filePath: string,
  config: LinterConfig,
  registry: RuleRegistry,
  deps: LintDependencies,
  vault: VaultIndex | null,
  blockRefIndex: BlockRefIndex | null,
  fsCheck: FileExistenceChecker,
): Promise<LintResult | null> {
  const errors: LintError[] = [];
  try {
    const raw = await deps.readFile(filePath);
    if (deps.shouldLintFile !== undefined && !(await deps.shouldLintFile(filePath, raw))) {
      return null;
    }
    const parsed = deps.parser.parse(filePath, raw);
    for (const rule of iterateActiveRules(registry, config)) {
      await runRule(rule, parsed, config, vault, blockRefIndex, fsCheck, errors);
    }
  } catch (err) {
    errors.push(buildParserError(err));
  }
  return makeLintResult(filePath, errors);
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

function shiftedFix(fix: Fix, offset: number): Fix {
  return { ...fix, lineNumber: fix.lineNumber + offset };
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
  const offset = rule.coordinateSpace === "absolute" ? 0 : parsed.frontmatterEndLine;
  await rule.run(
    { filePath: parsed.filePath, parsed, config, vault, fsCheck, blockRefIndex },
    (partial) => {
      warnIfMissingFix(rule, partial.fix);
      errors.push(
        makeLintError({
          ruleCode: rule.names[0] ?? "UNKNOWN",
          ruleName: rule.names[1] ?? rule.names[0] ?? "unknown",
          severity: rule.severity,
          line: partial.line + offset,
          column: partial.column,
          message: partial.message,
          fixable: rule.fixable,
          ...(partial.fix !== undefined ? { fix: shiftedFix(partial.fix, offset) } : {}),
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
