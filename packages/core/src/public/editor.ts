/**
 * Editor-oriented public API for linting and fixing in-memory Markdown text.
 *
 * @module public/editor
 */
import * as path from "node:path";
import { loadConfig } from "../infrastructure/config/ConfigLoader.js";
import { discoverFiles as discoverFilesRaw } from "../infrastructure/discovery/FileDiscovery.js";
import { makeMarkdownFlavorGate } from "../infrastructure/flavor/MarkdownFlavorGate.js";
import { makeMarkdownItParser } from "../infrastructure/parser/MarkdownItParser.js";
import { readMarkdownFile } from "../infrastructure/io/FileReader.js";
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
import type { FixOutcome } from "../application/FixUseCase.js";
import type { LinterConfig } from "../domain/config/LinterConfig.js";
import type { LintResult } from "../domain/linting/LintResult.js";
import type { RuleRegistry } from "../domain/linting/RuleRegistry.js";
import type { Parser } from "../domain/parsing/Parser.js";
import type { BlockRefIndex } from "../domain/vault/BlockRefIndex.js";
import type { VaultIndex } from "../domain/vault/VaultIndex.js";
import { makeLintResult } from "../domain/linting/LintResult.js";

export interface LintTextOptions {
  readonly filePath: string;
  readonly text: string;
  readonly vaultRoot?: string;
  readonly config?: string;
  readonly resolve?: boolean;
  readonly cwd?: string;
  readonly allowCustomRules?: boolean;
  readonly onCustomRuleError?: (modulePath: string, message: string) => void;
}

export type FixTextOptions = LintTextOptions;

export interface EditorLintOptions extends Omit<LintTextOptions, "filePath" | "text"> {
  readonly globs: readonly string[];
}

interface RunContext {
  readonly config: LinterConfig;
  readonly parser: Parser;
  readonly registry: RuleRegistry;
  readonly vault: VaultIndex | null;
  readonly blockRefIndex: BlockRefIndex | null;
  readonly shouldLintFile: ReturnType<typeof makeMarkdownFlavorGate>;
}

function applyOverrides(config: LinterConfig, options: LintTextOptions): LinterConfig {
  return {
    ...config,
    ...(options.vaultRoot !== undefined && { vaultRoot: options.vaultRoot }),
    ...(options.resolve !== undefined && { resolve: options.resolve }),
  };
}

async function buildRegistry(
  config: LinterConfig,
  cwd: string,
  allowCustomRules: boolean,
  onError: LintTextOptions["onCustomRuleError"],
): Promise<RuleRegistry> {
  const registry = makeRuleRegistry();
  registerBuiltinRules(registry);
  if (!allowCustomRules) {
    if (config.customRules.length > 0) {
      onError?.("customRules", "custom rules are disabled for this editor run");
    }
    return registry;
  }
  const customRuleResult = await loadCustomRules(config.customRules, cwd);
  for (const err of customRuleResult.errors) onError?.(err.modulePath, err.message);
  registerCustomRules(registry, customRuleResult.rules);
  return registry;
}

async function prepareRunContext(options: LintTextOptions): Promise<RunContext> {
  const cwd = options.cwd ?? process.cwd();
  const config = applyOverrides(await loadConfig(options.config ?? cwd), options);
  const parser = makeMarkdownItParser();
  const registry = await buildRegistry(
    config,
    cwd,
    options.allowCustomRules !== false,
    options.onCustomRuleError,
  );
  const vaultContext = await tryBootstrapVault(cwd, config, parser);
  return {
    config,
    parser,
    registry,
    ...vaultContext,
    shouldLintFile: makeMarkdownFlavorGate(flavorRoot(cwd, config, vaultContext.vault)),
  };
}

function flavorRoot(cwd: string, config: LinterConfig, vault: VaultIndex | null): string {
  if (config.vaultRoot !== null && config.vaultRoot !== undefined) {
    return path.resolve(cwd, config.vaultRoot);
  }
  return vault?.root ?? cwd;
}

async function tryBootstrapVault(
  cwd: string,
  config: LinterConfig,
  parser: Parser,
): Promise<{ readonly vault: VaultIndex | null; readonly blockRefIndex: BlockRefIndex | null }> {
  try {
    const result = await bootstrapVault(cwd, config, {
      detector: makeNodeFsVaultDetector(),
      buildIndex: buildFileIndex,
      buildBlockRefIndex: (files) =>
        buildBlockRefIndex(files, { parser, readFile: readMarkdownFile }),
    });
    return { vault: result?.vault ?? null, blockRefIndex: result?.blockRefs ?? null };
  } catch (err) {
    if (isHardBootstrapError(err)) throw err;
    return { vault: null, blockRefIndex: null };
  }
}

function isHardBootstrapError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.startsWith("OFM9");
}

export async function lintText(options: LintTextOptions): Promise<LintResult> {
  const context = await prepareRunContext(options);
  const [result] = await runLint([options.filePath], context.config, context.registry, {
    parser: context.parser,
    readFile: async () => options.text,
    shouldLintFile: context.shouldLintFile,
    vault: context.vault,
    blockRefIndex: context.blockRefIndex,
    fsCheck: makeNodeFsExistenceChecker(),
  });
  if (result === undefined) return makeLintResult(options.filePath, []);
  return result;
}

export async function fixText(
  options: FixTextOptions,
): Promise<FixOutcome & { readonly text: string }> {
  const context = await prepareRunContext(options);
  let text = options.text;
  const outcome = await runFixUseCase([options.filePath], context.config, context.registry, {
    parser: context.parser,
    readFile: async () => text,
    shouldLintFile: context.shouldLintFile,
    writeFile: async (_path, content) => {
      text = content;
    },
    vault: context.vault,
    blockRefIndex: context.blockRefIndex,
    fsCheck: makeNodeFsExistenceChecker(),
  });
  return { ...outcome, text };
}

export async function lintWorkspace(options: EditorLintOptions): Promise<readonly LintResult[]> {
  const cwd = options.cwd ?? process.cwd();
  const context = await prepareRunContext({ ...options, filePath: "", text: "" });
  const filePaths = await discoverFilesRaw(options.globs, context.config.ignores, cwd);
  if (filePaths.length === 0) return [];
  return runLint(filePaths, context.config, context.registry, {
    parser: context.parser,
    readFile: readMarkdownFile,
    shouldLintFile: context.shouldLintFile,
    vault: context.vault,
    blockRefIndex: context.blockRefIndex,
    fsCheck: makeNodeFsExistenceChecker(),
  });
}
