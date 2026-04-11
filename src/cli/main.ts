import type { Command } from "commander";
import { buildProgram } from "./args.js";
import { loadConfig } from "../infrastructure/config/ConfigLoader.js";
import { discoverFiles } from "../infrastructure/discovery/FileDiscovery.js";
import { makeRuleRegistry } from "../domain/linting/RuleRegistry.js";
import { runLint } from "../application/LintUseCase.js";
import { getFormatter } from "../infrastructure/formatters/FormatterRegistry.js";
import type { LinterConfig } from "../domain/config/LinterConfig.js";

interface ParsedOptions {
  readonly fix: boolean;
  readonly format: boolean;
  readonly vaultRoot?: string;
  readonly noResolve: boolean;
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

async function runPipeline(
  globArgs: readonly string[],
  opts: ParsedOptions,
  config: LinterConfig,
  cwd: string,
): Promise<number> {
  const effectiveGlobs = globArgs.length > 0 ? globArgs : config.globs;
  const files = await discoverFiles(effectiveGlobs, config.ignores, cwd);
  const registry = makeRuleRegistry();
  const results = await runLint(files, config, registry);

  const formatter = getFormatter(opts.outputFormatter);
  const output = formatter(results);
  if (output) process.stdout.write(output + "\n");

  const hasErrors = results.some((r) => r.hasErrors);
  return hasErrors ? EXIT_CODES.LINT_ERRORS : EXIT_CODES.CLEAN;
}
