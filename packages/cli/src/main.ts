/**
 * Purpose: Entry point for the `markdownlint-obsidian` CLI binary.
 *
 * Provides: {@link main}, {@link runCli}, {@link EXIT_CODES}
 *
 * Role in system: Parses arguments via {@link buildProgram}, loads config, selects the
 * lint or fix pipeline branch, formats and prints results, and returns a POSIX exit code
 * (0 = clean, 1 = lint errors, 2 = tool failure) that the bin shim passes to `process.exit`.
 *
 * @module main
 */
import type { Command } from "commander";
import { buildProgram } from "./args.js";
import type {
  Formatter,
  LintResult,
  FixOutcome,
  lint as lintType,
  fix as fixType,
  getFormatter as getFormatterType,
  loadConfig as loadConfigType,
} from "markdownlint-obsidian/engine";

interface EngineModule {
  readonly lint: typeof lintType;
  readonly fix: typeof fixType;
  readonly getFormatter: typeof getFormatterType;
  readonly loadConfig: typeof loadConfigType;
}

const { lint, fix, getFormatter, loadConfig } = await loadEngine();

async function loadEngine(): Promise<EngineModule> {
  if (shouldLoadSourceEngine()) {
    const sourceEngine = new URL("../../core/src/engine/index.ts", import.meta.url).href;
    return (await import(sourceEngine)) as EngineModule;
  }
  return import("markdownlint-obsidian/engine") as Promise<EngineModule>;
}

function shouldLoadSourceEngine(): boolean {
  return (
    process.env["MARKDOWNLINT_OBSIDIAN_SOURCE_ENGINE"] === "1" ||
    new URL(import.meta.url).pathname.endsWith("/packages/cli/src/main.ts")
  );
}

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

export interface CliRunResult {
  /** CLI-compatible exit code: 0 for clean, 1 for lint findings, 2 for tool failure. */
  readonly exitCode: number;
  /** Formatter output that the binary would write to stdout. */
  readonly stdout: string;
  /** Diagnostics that the binary would write to stderr. */
  readonly stderr: string;
  /** Final lint results after the requested lint or fix pipeline completes. */
  readonly results: readonly LintResult[];
  /** Initial lint results before fixes are applied; empty for plain lint runs. */
  readonly firstPass: readonly LintResult[];
  /** Vault-relative files changed, or that would change under `--fix-check`. */
  readonly filesFixed: readonly string[];
  /** Count of final-pass findings with `severity: "error"`. */
  readonly errorCount: number;
  /** Count of final-pass findings with `severity: "warning"`. */
  readonly warningCount: number;
}

export interface RunCliOptions {
  /** Working directory used for config discovery and glob resolution. */
  readonly cwd?: string;
}

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
  const result = await runCli(argv);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.exitCode;
}

/**
 * Programmatic CLI entry point.
 *
 * Uses the same parser, config loading, lint/fix pipeline, formatter output,
 * and exit-code semantics as the binary, but captures stdout/stderr and returns
 * structured results for adapters such as the GitHub Action.
 *
 * @param argv - Full argument vector, including node/script placeholders.
 * @param options.cwd - Optional working directory override for tests/adapters.
 * @returns Captured output, final results, fix metadata, counts, and exit code.
 */
export async function runCli(argv: string[], options: RunCliOptions = {}): Promise<CliRunResult> {
  const sink = makeOutputSink();
  const program = buildProgram();
  program.configureOutput({
    writeOut: sink.writeStdout,
    writeErr: sink.writeStderr,
  });
  program.exitOverride();

  const parsed = parseArgv(program, argv);
  if (parsed.terminal !== null) {
    return makeCliRunResult(parsed.terminal, sink, [], [], []);
  }

  const opts = program.opts<ParsedOptions>();
  const cwd = options.cwd ?? process.cwd();
  const globs = program.args as string[];

  return runPipeline(globs, opts, cwd, sink);
}

interface OutputSink {
  readonly stdout: () => string;
  readonly stderr: () => string;
  readonly writeStdout: (value: string) => void;
  readonly writeStderr: (value: string) => void;
}

function makeOutputSink(): OutputSink {
  let stdout = "";
  let stderr = "";
  return {
    stdout: () => stdout,
    stderr: () => stderr,
    writeStdout: (value: string): void => {
      stdout += value;
    },
    writeStderr: (value: string): void => {
      stderr += value;
    },
  };
}

function makeCliRunResult(
  exitCode: number,
  sink: OutputSink,
  results: readonly LintResult[],
  firstPass: readonly LintResult[],
  filesFixed: readonly string[],
): CliRunResult {
  return {
    exitCode,
    stdout: sink.stdout(),
    stderr: sink.stderr(),
    results,
    firstPass,
    filesFixed,
    errorCount: countSeverity(results, "error"),
    warningCount: countSeverity(results, "warning"),
  };
}

function countSeverity(results: readonly LintResult[], severity: "error" | "warning"): number {
  return results.reduce(
    (sum, result) => sum + result.errors.filter((error) => error.severity === severity).length,
    0,
  );
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

function resolveFormatter(name: string, sink: OutputSink): Formatter | null {
  try {
    return getFormatter(name);
  } catch (err) {
    sink.writeStderr(`${err instanceof Error ? err.message : String(err)}\n`);
    return null;
  }
}

function emitAndExit(
  results: readonly LintResult[],
  formatterName: string,
  sink: OutputSink,
): number {
  const formatter = resolveFormatter(formatterName, sink);
  if (formatter === null) return EXIT_CODES.TOOL_FAILURE;
  const output = formatter(results);
  if (output) sink.writeStdout(output + "\n");
  return results.some((r) => r.hasErrors) ? EXIT_CODES.LINT_ERRORS : EXIT_CODES.CLEAN;
}

function fmtRange(col: number, del: number): string {
  return del === 0 ? `col ${col}` : `col ${col}–${col + del - 1}`;
}

function writeCustomRuleError(sink: OutputSink, modulePath: string, message: string): void {
  sink.writeStderr(`OFM905: failed to load custom rule module "${modulePath}": ${message}\n`);
}

function buildEngineOptions(
  globArgs: readonly string[],
  config: Awaited<ReturnType<typeof loadConfig>>,
  opts: ParsedOptions,
  cwd: string,
  sink: OutputSink,
): object {
  const effectiveGlobs = globArgs.length > 0 ? [...globArgs] : config.globs;
  return {
    globs: effectiveGlobs,
    cwd,
    ...(opts.vaultRoot !== undefined && { vaultRoot: opts.vaultRoot }),
    ...(opts.resolve === false && { resolve: false }),
    ...(opts.config !== undefined && { config: opts.config }),
    onCustomRuleError: (modulePath: string, message: string): void =>
      writeCustomRuleError(sink, modulePath, message),
  };
}

async function runFixBranch(
  engineOptions: object,
  opts: ParsedOptions,
  sink: OutputSink,
): Promise<FixOutcome | Error> {
  try {
    const outcome = await fix({
      ...(engineOptions as Parameters<typeof fix>[0]),
      check: opts.fixCheck,
    });
    if (outcome.filesFixed.length > 0) {
      const verb = opts.fixCheck ? "Would fix" : "Fixed";
      sink.writeStderr(`${verb} ${outcome.filesFixed.length} file(s)\n`);
    }
    for (const conflict of outcome.conflicts) {
      const colA = fmtRange(conflict.first.editColumn, conflict.first.deleteCount);
      const colB = fmtRange(conflict.second.editColumn, conflict.second.deleteCount);
      sink.writeStderr(
        `[fix-conflict] ${conflict.filePath}: ${conflict.reason} (${colA} vs ${colB})\n`,
      );
    }
    return outcome;
  } catch (err) {
    return err instanceof Error ? err : new Error(String(err));
  }
}

async function runLintBranch(engineOptions: object): Promise<readonly LintResult[] | Error> {
  try {
    return await lint(engineOptions as Parameters<typeof lint>[0]);
  } catch (err) {
    return err instanceof Error ? err : new Error(String(err));
  }
}

function checkMutualExclusion(opts: ParsedOptions, sink: OutputSink): number | null {
  if (opts.fix && opts.fixCheck) {
    sink.writeStderr("OFM902: --fix and --fix-check are mutually exclusive\n");
    return EXIT_CODES.TOOL_FAILURE;
  }
  return null;
}

async function runPipeline(
  globArgs: readonly string[],
  opts: ParsedOptions,
  cwd: string,
  sink: OutputSink,
): Promise<CliRunResult> {
  const exclusionCode = checkMutualExclusion(opts, sink);
  if (exclusionCode !== null) return makeCliRunResult(exclusionCode, sink, [], [], []);

  if (resolveFormatter(opts.outputFormatter, sink) === null) {
    return makeCliRunResult(EXIT_CODES.TOOL_FAILURE, sink, [], [], []);
  }

  const config = await loadConfig(opts.config ?? cwd).catch(() => null);
  if (!config) {
    sink.writeStderr("OFM901: failed to load configuration\n");
    return makeCliRunResult(EXIT_CODES.TOOL_FAILURE, sink, [], [], []);
  }

  const engineOptions = buildEngineOptions(globArgs, config, opts, cwd, sink);
  if (opts.fix || opts.fixCheck) return runFixPipeline(engineOptions, opts, sink);
  return runLintPipeline(engineOptions, opts, sink);
}

async function runFixPipeline(
  engineOptions: object,
  opts: ParsedOptions,
  sink: OutputSink,
): Promise<CliRunResult> {
  const outcome = await runFixBranch(engineOptions, opts, sink);
  if (outcome instanceof Error) return toolFailure(outcome, sink);
  const exitCode = emitAndExit(outcome.finalPass, opts.outputFormatter, sink);
  return makeCliRunResult(exitCode, sink, outcome.finalPass, outcome.firstPass, outcome.filesFixed);
}

async function runLintPipeline(
  engineOptions: object,
  opts: ParsedOptions,
  sink: OutputSink,
): Promise<CliRunResult> {
  const results = await runLintBranch(engineOptions);
  if (results instanceof Error) return toolFailure(results, sink);
  const exitCode = emitAndExit(results, opts.outputFormatter, sink);
  return makeCliRunResult(exitCode, sink, results, [], []);
}

function toolFailure(err: Error, sink: OutputSink): CliRunResult {
  sink.writeStderr(`${err.message}\n`);
  return makeCliRunResult(EXIT_CODES.TOOL_FAILURE, sink, [], [], []);
}
