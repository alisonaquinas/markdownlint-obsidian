import type { Command } from "commander";
import { buildProgram } from "./args.js";
import {
  lint,
  fix,
  getFormatter,
  loadConfig,
  type Formatter,
  type LintResult,
} from "markdownlint-obsidian/engine";

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
 * Parses arguments, runs the linting pipeline via the engine API,
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
  const globs = program.args as string[];

  return runPipeline(globs, opts, cwd);
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

function onCustomRuleError(modulePath: string, message: string): void {
  process.stderr.write(`OFM905: failed to load custom rule module "${modulePath}": ${message}\n`);
}

function buildEngineOptions(
  globArgs: readonly string[],
  config: Awaited<ReturnType<typeof loadConfig>>,
  opts: ParsedOptions,
  cwd: string,
): object {
  const effectiveGlobs = globArgs.length > 0 ? [...globArgs] : config.globs;
  return {
    globs: effectiveGlobs,
    cwd,
    ...(opts.vaultRoot !== undefined && { vaultRoot: opts.vaultRoot }),
    ...(opts.resolve === false && { resolve: false }),
    ...(opts.config !== undefined && { config: opts.config }),
    onCustomRuleError,
  };
}

async function runFixBranch(engineOptions: object, opts: ParsedOptions): Promise<number> {
  try {
    const outcome = await fix({
      ...(engineOptions as Parameters<typeof fix>[0]),
      check: opts.fixCheck,
    });
    if (outcome.filesFixed.length > 0) {
      const verb = opts.fixCheck ? "Would fix" : "Fixed";
      process.stderr.write(`${verb} ${outcome.filesFixed.length} file(s)\n`);
    }
    for (const conflict of outcome.conflicts) {
      const colA = fmtRange(conflict.first.editColumn, conflict.first.deleteCount);
      const colB = fmtRange(conflict.second.editColumn, conflict.second.deleteCount);
      process.stderr.write(
        `[fix-conflict] ${conflict.filePath}: ${conflict.reason} (${colA} vs ${colB})\n`,
      );
    }
    return emitAndExit(outcome.finalPass, opts.outputFormatter);
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    return EXIT_CODES.TOOL_FAILURE;
  }
}

async function runLintBranch(engineOptions: object, opts: ParsedOptions): Promise<number> {
  try {
    const results = await lint(engineOptions as Parameters<typeof lint>[0]);
    return emitAndExit(results, opts.outputFormatter);
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    return EXIT_CODES.TOOL_FAILURE;
  }
}

function checkMutualExclusion(opts: ParsedOptions): number | null {
  if (opts.fix && opts.fixCheck) {
    process.stderr.write("OFM902: --fix and --fix-check are mutually exclusive\n");
    return EXIT_CODES.TOOL_FAILURE;
  }
  return null;
}

async function runPipeline(
  globArgs: readonly string[],
  opts: ParsedOptions,
  cwd: string,
): Promise<number> {
  const exclusionCode = checkMutualExclusion(opts);
  if (exclusionCode !== null) return exclusionCode;

  if (resolveFormatter(opts.outputFormatter) === null) return EXIT_CODES.TOOL_FAILURE;

  const config = await loadConfig(opts.config ?? cwd).catch(() => null);
  if (!config) {
    process.stderr.write("OFM901: failed to load configuration\n");
    return EXIT_CODES.TOOL_FAILURE;
  }

  const engineOptions = buildEngineOptions(globArgs, config, opts, cwd);
  return opts.fix || opts.fixCheck
    ? runFixBranch(engineOptions, opts)
    : runLintBranch(engineOptions, opts);
}
