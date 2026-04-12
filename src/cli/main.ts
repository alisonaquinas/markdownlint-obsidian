import type { Command } from "commander";
import { buildProgram } from "./args.js";
import { loadConfig } from "../infrastructure/config/ConfigLoader.js";
import { discoverFiles } from "../infrastructure/discovery/FileDiscovery.js";
import { makeRuleRegistry, type RuleRegistry } from "../domain/linting/RuleRegistry.js";
import { runLint } from "../application/LintUseCase.js";
import { runFix } from "../application/FixUseCase.js";
import { writeMarkdownFile } from "../infrastructure/io/FileWriter.js";
import { getFormatter } from "../infrastructure/formatters/FormatterRegistry.js";
import type { LinterConfig } from "../domain/config/LinterConfig.js";
import type { Formatter } from "../infrastructure/formatters/FormatterRegistry.js";
import type { LintResult } from "../domain/linting/LintResult.js";
import { makeMarkdownItParser } from "../infrastructure/parser/MarkdownItParser.js";
import { readMarkdownFile } from "../infrastructure/io/FileReader.js";
import { registerBuiltinRules } from "../infrastructure/rules/ofm/registerBuiltin.js";
import { loadCustomRules } from "../infrastructure/config/CustomRuleLoader.js";
import { registerCustomRules } from "../infrastructure/rules/registerCustom.js";
import { bootstrapVault } from "../application/VaultBootstrap.js";
import { makeNodeFsVaultDetector } from "../infrastructure/vault/NodeFsVaultDetector.js";
import { buildFileIndex } from "../infrastructure/vault/FileIndexBuilder.js";
import { buildBlockRefIndex } from "../infrastructure/vault/BlockRefIndexBuilder.js";
import { makeNodeFsExistenceChecker } from "../infrastructure/fs/NodeFsExistenceChecker.js";

interface ParsedOptions {
  readonly fix: boolean;
  readonly fixCheck: boolean;
  readonly format: boolean;
  readonly vaultRoot?: string;
  /**
   * Commander maps `--no-resolve` to `resolve: false` and leaves the default
   * at `true`. This is a tri-state in practice: `undefined` means the flag
   * was never touched (fall back to config), `false` means `--no-resolve`
   * was supplied.
   */
  readonly resolve?: boolean;
  readonly outputFormatter: string;
  readonly config?: string;
}

/**
 * Exit codes used by every CLI path.
 *
 * 0 = clean, 1 = lint errors, 2 = tool or config failure.
 */
export const EXIT_CODES = Object.freeze({
  CLEAN: 0,
  LINT_ERRORS: 1,
  TOOL_FAILURE: 2,
} as const);

/**
 * Entry point called by `bin/markdownlint-obsidian.js`.
 *
 * Parses arguments, loads config, discovers files, runs the lint use case,
 * prints formatter output, and returns the appropriate exit code.
 *
 * @param argv - Argument vector, typically `process.argv`.
 * @returns Resolved exit code (0, 1, or 2).
 */
export async function main(argv: string[]): Promise<number> {
  const program = buildProgram();
  program.exitOverride();

  const parsed = parseArgv(program, argv);
  if (parsed.terminal !== null) return parsed.terminal;

  const opts = program.opts<ParsedOptions>();
  const cwd = process.cwd();

  const config = await loadConfig(opts.config ?? cwd).catch(() => null);
  if (!config) {
    process.stderr.write("OFM901: failed to load configuration\n");
    return EXIT_CODES.TOOL_FAILURE;
  }

  return runPipeline(program.args, opts, config, cwd);
}

interface ParseResult {
  readonly terminal: number | null;
}

function parseArgv(program: Command, argv: string[]): ParseResult {
  try {
    program.parse(argv);
    return { terminal: null };
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "commander.helpDisplayed" || e.code === "commander.version") {
      return { terminal: EXIT_CODES.CLEAN };
    }
    return { terminal: EXIT_CODES.TOOL_FAILURE };
  }
}

/**
 * Apply CLI-flag overrides to a loaded {@link LinterConfig}.
 *
 * Only the explicit flags we promise to thread — `--vault-root` and
 * `--no-resolve` — participate. Anything else stays on the config value.
 */
function applyCliOverrides(config: LinterConfig, opts: ParsedOptions): LinterConfig {
  const patch: { vaultRoot?: string; resolve?: boolean } = {};
  if (opts.vaultRoot !== undefined) patch.vaultRoot = opts.vaultRoot;
  if (opts.resolve === false) patch.resolve = false;
  return Object.freeze({ ...config, ...patch });
}

async function bootstrapVaultOrExit(
  cwd: string,
  config: LinterConfig,
): Promise<{ result: Awaited<ReturnType<typeof bootstrapVault>> } | { exitCode: number }> {
  try {
    const parser = makeMarkdownItParser();
    const result = await bootstrapVault(cwd, config, {
      detector: makeNodeFsVaultDetector(),
      buildIndex: buildFileIndex,
      buildBlockRefIndex: (files) =>
        buildBlockRefIndex(files, { parser, readFile: readMarkdownFile }),
    });
    return { result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    return { exitCode: EXIT_CODES.TOOL_FAILURE };
  }
}

interface BootstrapOk {
  readonly result: Awaited<ReturnType<typeof bootstrapVault>>;
}

function buildLintDeps(ok: BootstrapOk): Parameters<typeof runLint>[3] {
  return {
    parser: makeMarkdownItParser(),
    readFile: readMarkdownFile,
    vault: ok.result?.vault ?? null,
    blockRefIndex: ok.result?.blockRefs ?? null,
    fsCheck: makeNodeFsExistenceChecker(),
  };
}

function resolveFormatter(name: string): Formatter | null {
  try {
    return getFormatter(name);
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    return null;
  }
}

function emitAndExit(results: readonly LintResult[], formatterName: string): number {
  const formatter = resolveFormatter(formatterName);
  if (formatter === null) return EXIT_CODES.TOOL_FAILURE;
  const output = formatter(results);
  if (output) process.stdout.write(output + "\n");
  return results.some((r) => r.hasErrors) ? EXIT_CODES.LINT_ERRORS : EXIT_CODES.CLEAN;
}

function fmtRange(col: number, del: number): string {
  return del === 0 ? `col ${col}` : `col ${col}–${col + del - 1}`;
}

async function runPipeline(
  globArgs: readonly string[],
  opts: ParsedOptions,
  rawConfig: LinterConfig,
  cwd: string,
): Promise<number> {
  const config = applyCliOverrides(rawConfig, opts);
  if (opts.fix && opts.fixCheck) {
    process.stderr.write("OFM902: --fix and --fix-check are mutually exclusive\n");
    return EXIT_CODES.TOOL_FAILURE;
  }
  const effectiveGlobs = globArgs.length > 0 ? globArgs : config.globs;
  const files = await discoverFiles(effectiveGlobs, config.ignores, cwd);
  const registry = makeRuleRegistry();
  registerBuiltinRules(registry);

  const { rules: customRules, errors: customErrors } =
    await loadCustomRules(config.customRules, cwd);
  for (const err of customErrors) {
    process.stderr.write(`OFM905: failed to load custom rule module "${err.modulePath}": ${err.message}\n`);
  }
  registerCustomRules(registry, customRules);

  const bootstrapResult = await bootstrapVaultOrExit(cwd, config);
  if ("exitCode" in bootstrapResult) return bootstrapResult.exitCode;

  const lintDeps = buildLintDeps(bootstrapResult);

  if (opts.fix || opts.fixCheck) {
    return runFixPipeline(files, opts, config, registry, lintDeps);
  }

  const results = await runLint(files, config, registry, lintDeps);
  return emitAndExit(results, opts.outputFormatter);
}

async function runFixPipeline(
  files: readonly string[],
  opts: ParsedOptions,
  config: LinterConfig,
  registry: RuleRegistry,
  lintDeps: Parameters<typeof runLint>[3],
): Promise<number> {
  const writeFile = opts.fixCheck
    ? (_path: string, _content: string): Promise<void> => Promise.resolve()
    : writeMarkdownFile;
  const outcome = await runFix(files, config, registry, { ...lintDeps, writeFile });
  if (outcome.filesFixed.length > 0)
    process.stderr.write(
      `${opts.fixCheck ? "Would fix" : "Fixed"} ${outcome.filesFixed.length} file(s)\n`,
    );
  for (const conflict of outcome.conflicts) {
    const colA = fmtRange(conflict.first.editColumn, conflict.first.deleteCount);
    const colB = fmtRange(conflict.second.editColumn, conflict.second.deleteCount);
    process.stderr.write(
      `[fix-conflict] ${conflict.filePath}: ${conflict.reason} (${colA} vs ${colB})\n`,
    );
  }
  return emitAndExit(outcome.finalPass, opts.outputFormatter);
}
