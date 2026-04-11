import type { Command } from "commander";
import { buildProgram } from "./args.js";
import { loadConfig } from "../infrastructure/config/ConfigLoader.js";
import { discoverFiles } from "../infrastructure/discovery/FileDiscovery.js";
import { makeRuleRegistry } from "../domain/linting/RuleRegistry.js";
import { runLint } from "../application/LintUseCase.js";
import { getFormatter } from "../infrastructure/formatters/FormatterRegistry.js";
import type { LinterConfig } from "../domain/config/LinterConfig.js";
import { makeMarkdownItParser } from "../infrastructure/parser/MarkdownItParser.js";
import { readMarkdownFile } from "../infrastructure/io/FileReader.js";
import { registerBuiltinRules } from "../infrastructure/rules/ofm/registerBuiltin.js";
import { bootstrapVault } from "../application/VaultBootstrap.js";
import { makeNodeFsVaultDetector } from "../infrastructure/vault/NodeFsVaultDetector.js";
import { buildFileIndex } from "../infrastructure/vault/FileIndexBuilder.js";

interface ParsedOptions {
  readonly fix: boolean;
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
  const patch: Partial<LinterConfig> = {};
  if (opts.vaultRoot !== undefined) patch.vaultRoot = opts.vaultRoot;
  if (opts.resolve === false) patch.resolve = false;
  return Object.freeze({ ...config, ...patch });
}

async function runPipeline(
  globArgs: readonly string[],
  opts: ParsedOptions,
  rawConfig: LinterConfig,
  cwd: string,
): Promise<number> {
  const config = applyCliOverrides(rawConfig, opts);
  const effectiveGlobs = globArgs.length > 0 ? globArgs : config.globs;
  const files = await discoverFiles(effectiveGlobs, config.ignores, cwd);
  const registry = makeRuleRegistry();
  registerBuiltinRules(registry);
  const parser = makeMarkdownItParser();

  let vault;
  try {
    vault = await bootstrapVault(cwd, config, {
      detector: makeNodeFsVaultDetector(),
      buildIndex: buildFileIndex,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    return EXIT_CODES.TOOL_FAILURE;
  }

  const results = await runLint(files, config, registry, {
    parser,
    readFile: readMarkdownFile,
    vault,
  });

  const formatter = getFormatter(opts.outputFormatter);
  const output = formatter(results);
  if (output) process.stdout.write(output + "\n");

  const hasErrors = results.some((r) => r.hasErrors);
  return hasErrors ? EXIT_CODES.LINT_ERRORS : EXIT_CODES.CLEAN;
}
