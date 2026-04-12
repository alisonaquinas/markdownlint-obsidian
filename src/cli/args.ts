import { Command } from "commander";

/**
 * Parsed CLI options returned by commander.
 *
 * Fields mirror markdownlint-cli2's flag set so downstream users can reuse
 * existing muscle memory and automation.
 */
export interface CLIArgs {
  readonly globs: string[];
  readonly config?: string;
  readonly configPointer?: string;
  readonly fix: boolean;
  readonly format: boolean;
  readonly noGlobs: boolean;
  readonly vaultRoot?: string;
  /**
   * Commander maps `--no-resolve` to `resolve: false`. Left `undefined`
   * when the flag is not supplied so config-level `resolve` can win.
   */
  readonly resolve?: boolean;
  readonly outputFormatter: string;
}

/**
 * Build the top-level commander {@link Command} for the CLI.
 *
 * The returned program has `exitOverride()` configured by the caller so
 * `--help` and `--version` can be caught in tests without terminating the
 * process.
 *
 * @returns A fully wired commander `Command`.
 */
export function buildProgram(): Command {
  const program = new Command();
  program
    .name("markdownlint-obsidian")
    .description("Obsidian Flavored Markdown linter for CI pipelines")
    .version("0.8.0")
    .argument("[globs...]", "Glob patterns for files to lint")
    .option("--config <path>", "Explicit config file path")
    .option("--config-pointer <ptr>", "JSON Pointer into config (e.g. #/markdownlint)")
    .option("--fix", "Auto-fix fixable errors in-place", false)
    .option("--format", "Read stdin, write linted content to stdout", false)
    .option("--no-globs", "Ignore globs property in config file")
    .option("--vault-root <path>", "Override auto-detected vault root")
    .option("--no-resolve", "Disable wikilink resolution")
    .option(
      "--output-formatter <name>",
      "Output formatter (default, json, junit, sarif)",
      "default",
    );
  return program;
}
