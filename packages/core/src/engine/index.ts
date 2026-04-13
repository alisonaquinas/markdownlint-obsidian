/**
 * High-level programmatic API for markdownlint-obsidian.
 *
 * Wires the full DI graph internally so callers never touch infrastructure
 * factories directly. All exports satisfy DIP: callers depend on plain
 * interfaces and domain value objects only.
 *
 * @module engine
 */

import * as fs from "node:fs/promises";
import { loadConfig } from "../infrastructure/config/ConfigLoader.js";
import { discoverFiles as discoverFilesRaw } from "../infrastructure/discovery/FileDiscovery.js";
import { makeMarkdownItParser } from "../infrastructure/parser/MarkdownItParser.js";
import { readMarkdownFile } from "../infrastructure/io/FileReader.js";
import { writeMarkdownFile } from "../infrastructure/io/FileWriter.js";
import { makeRuleRegistry } from "../domain/linting/RuleRegistry.js";
import { runLint } from "../application/LintUseCase.js";
import { runFix as runFixUseCase } from "../application/FixUseCase.js";
import { bootstrapVault } from "../application/VaultBootstrap.js";
import { makeNodeFsVaultDetector } from "../infrastructure/vault/NodeFsVaultDetector.js";
import { buildFileIndex } from "../infrastructure/vault/FileIndexBuilder.js";
import { buildBlockRefIndex } from "../infrastructure/vault/BlockRefIndexBuilder.js";
import { makeNodeFsExistenceChecker } from "../infrastructure/fs/NodeFsExistenceChecker.js";
import { registerBuiltinRules } from "../infrastructure/rules/ofm/registerBuiltin.js";
import { loadCustomRules } from "../infrastructure/config/CustomRuleLoader.js";
import { registerCustomRules } from "../infrastructure/rules/registerCustom.js";
import type { LintResult } from "../domain/linting/LintResult.js";
import type { FixOutcome } from "../application/FixUseCase.js";
import type { LinterConfig } from "../domain/config/LinterConfig.js";
import type { Parser } from "../domain/parsing/Parser.js";
import type { RuleRegistry } from "../domain/linting/RuleRegistry.js";
import type { VaultIndex } from "../domain/vault/VaultIndex.js";
import type { BlockRefIndex } from "../domain/vault/BlockRefIndex.js";
export type { Formatter } from "../infrastructure/formatters/FormatterRegistry.js";
export { getFormatter } from "../infrastructure/formatters/FormatterRegistry.js";
export { loadConfig } from "../infrastructure/config/ConfigLoader.js";
export { discoverFiles } from "../infrastructure/discovery/FileDiscovery.js";
export type { LintResult } from "../domain/linting/LintResult.js";
export type { FixOutcome } from "../application/FixUseCase.js";
export type { LinterConfig } from "../domain/config/LinterConfig.js";

/**
 * Options for a lint run.
 */
export interface LintOptions {
  /** Glob patterns to match. Required if config.globs is not set. */
  readonly globs: readonly string[];
  /** Explicit vault root. Auto-detected from .obsidian/ or git root if omitted. */
  readonly vaultRoot?: string;
  /** Explicit path to a config file directory. Defaults to `cwd`. */
  readonly config?: string;
  /** Disable wikilink resolution. Defaults to true (from config). */
  readonly resolve?: boolean;
  /** Working directory for config discovery, vault detection, and glob resolution. Defaults to cwd. */
  readonly cwd?: string;
  /**
   * Called once for each custom rule module that fails to load.
   * If omitted, load errors are silently discarded.
   *
   * @param modulePath - The path string from the config's `customRules` list.
   * @param message    - Human-readable error description.
   */
  readonly onCustomRuleError?: (modulePath: string, message: string) => void;
}

/**
 * Options for a fix run.
 */
export interface FixOptions extends LintOptions {
  /** If true, report what would be fixed without writing files. */
  readonly check?: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function applyOverrides(config: LinterConfig, options: LintOptions): LinterConfig {
  return {
    ...config,
    ...(options.vaultRoot !== undefined && { vaultRoot: options.vaultRoot }),
    ...(options.resolve !== undefined && { resolve: options.resolve }),
  };
}

async function buildRegistry(
  config: LinterConfig,
  cwd: string,
  onError: LintOptions["onCustomRuleError"],
): Promise<RuleRegistry> {
  const registry = makeRuleRegistry();
  registerBuiltinRules(registry);
  const customRuleResult = await loadCustomRules(config.customRules, cwd);
  for (const err of customRuleResult.errors) {
    onError?.(err.modulePath, err.message);
  }
  registerCustomRules(registry, customRuleResult.rules);
  return registry;
}

interface VaultContext {
  readonly vault: VaultIndex | null;
  readonly blockRefIndex: BlockRefIndex | null;
}

async function tryBootstrapVault(
  cwd: string,
  config: LinterConfig,
  parser: Parser,
): Promise<VaultContext> {
  try {
    const result = await bootstrapVault(cwd, config, {
      detector: makeNodeFsVaultDetector(),
      buildIndex: buildFileIndex,
      buildBlockRefIndex: (files) =>
        buildBlockRefIndex(files, { parser, readFile: readMarkdownFile }),
    });
    return { vault: result?.vault ?? null, blockRefIndex: result?.blockRefs ?? null };
  } catch {
    // vault bootstrap failure is non-fatal; rules that need vault context
    // will degrade gracefully
    return { vault: null, blockRefIndex: null };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the linting pipeline and return one {@link LintResult} per matched file.
 *
 * Wires internally: ConfigLoader → FileDiscovery → MarkdownItParser →
 * VaultBootstrap → RuleRegistry → LintUseCase.
 *
 * @param options - Lint options.
 * @returns Array of lint results, one per matched file.
 */
export async function lint(options: LintOptions): Promise<LintResult[]> {
  const cwd = options.cwd ?? process.cwd();
  const config = await loadConfig(options.config ?? cwd);
  const effectiveConfig = applyOverrides(config, options);

  const effectiveGlobs = options.globs.length > 0 ? options.globs : effectiveConfig.globs;
  const filePaths = await discoverFilesRaw(effectiveGlobs, effectiveConfig.ignores, cwd);
  if (filePaths.length === 0) return [];

  const parser = makeMarkdownItParser();
  const registry = await buildRegistry(effectiveConfig, cwd, options.onCustomRuleError);
  const { vault, blockRefIndex } = await tryBootstrapVault(cwd, effectiveConfig, parser);

  return runLint(filePaths, effectiveConfig, registry, {
    parser,
    readFile: readMarkdownFile,
    vault,
    blockRefIndex,
    fsCheck: makeNodeFsExistenceChecker(),
  });
}

/**
 * Run the fix pipeline, applying auto-fixes to matched files.
 *
 * When `options.check` is true, no files are written; the return value still
 * shows what would have been fixed.
 *
 * @param options - Fix options.
 * @returns A {@link FixOutcome} with first-pass results, final-pass results,
 *   files fixed, and any fix conflicts.
 */
export async function fix(options: FixOptions): Promise<FixOutcome> {
  const cwd = options.cwd ?? process.cwd();
  const config = await loadConfig(options.config ?? cwd);
  const effectiveConfig = applyOverrides(config, options);

  const effectiveGlobs = options.globs.length > 0 ? options.globs : effectiveConfig.globs;
  const filePaths = await discoverFilesRaw(effectiveGlobs, effectiveConfig.ignores, cwd);
  if (filePaths.length === 0) {
    return { firstPass: [], finalPass: [], filesFixed: [], conflicts: [] };
  }

  const parser = makeMarkdownItParser();
  const registry = await buildRegistry(effectiveConfig, cwd, options.onCustomRuleError);
  const { vault, blockRefIndex } = await tryBootstrapVault(cwd, effectiveConfig, parser);

  const noOpWrite = async (_path: string, _content: string): Promise<void> => {};
  const deps = {
    parser,
    readFile: readMarkdownFile,
    writeFile: options.check ? noOpWrite : writeMarkdownFile,
    vault,
    blockRefIndex,
    fsCheck: makeNodeFsExistenceChecker(),
  };

  return runFixUseCase(filePaths, effectiveConfig, registry, deps);
}

// Ensure node:fs/promises is available in this module's environment
void fs;
