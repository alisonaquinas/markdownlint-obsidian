/**
 * Purpose: Dynamically imports user-supplied custom rule modules and validates each exported rule object.
 *
 * Provides: {@link loadCustomRules}, {@link CustomRuleLoadResult}, {@link CustomRuleLoadError}
 *
 * Role in system: Infrastructure adapter that resolves `customRules` config entries to
 * absolute file URLs, performs ESM dynamic imports at runtime, and validates that each
 * export satisfies the {@link OFMRule} contract — accumulating load errors as non-fatal
 * diagnostics rather than aborting the lint run.
 *
 * @module infrastructure/config/CustomRuleLoader
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import type { OFMRule } from "../../domain/linting/OFMRule.js";

export interface CustomRuleLoadError {
  readonly modulePath: string;
  readonly message: string;
}

export interface CustomRuleLoadResult {
  readonly rules: readonly OFMRule[];
  readonly errors: readonly CustomRuleLoadError[];
}

/**
 * Resolve each `customRules` entry to an absolute path, dynamically import
 * it, and collect every exported rule. Entries may:
 *   - export default an OFMRule object
 *   - export default an OFMRule[]
 *   - export a named `rules` export containing either of the above
 *
 * Import failures and validation errors produce CustomRuleLoadError entries
 * and do NOT crash the run — callers surface them to stderr.
 */
export async function loadCustomRules(
  customRules: readonly string[],
  baseDir: string,
): Promise<CustomRuleLoadResult> {
  const rules: OFMRule[] = [];
  const errors: CustomRuleLoadError[] = [];

  for (const entry of customRules) {
    const result = await loadSingleRuleEntry(entry, baseDir);
    if ("error" in result) {
      errors.push(result.error);
    } else {
      rules.push(...result.rules);
    }
  }

  return { rules, errors };
}

const CONFIG_FILENAMES: readonly string[] = [
  ".markdownlint-cli2.jsonc",
  ".markdownlint-cli2.yaml",
  ".obsidian-linter.jsonc",
  ".obsidian-linter.yaml",
  ".markdownlint.jsonc",
  ".markdownlint.json",
  ".markdownlint.yaml",
  ".markdownlint.yml",
];

async function exists(p: string): Promise<boolean> {
  return fs
    .stat(p)
    .then(() => true)
    .catch(() => false);
}

/**
 * Resolve a customRules entry: absolute entries pass through, relative
 * entries resolve against `baseDir` first. When that file does not exist
 * (the CLI was started from a subdirectory of the vault), walk ancestor
 * directories and anchor on the nearest one holding a known config file —
 * the directory the entry was actually declared relative to.
 */
async function resolveEntry(entry: string, baseDir: string): Promise<string> {
  if (path.isAbsolute(entry)) return entry;
  const direct = path.resolve(baseDir, entry);
  if (await exists(direct)) return direct;
  let dir = baseDir;
  while (true) {
    const parent = path.dirname(dir);
    if (parent === dir) return direct;
    dir = parent;
    let hasConfig = false;
    for (const name of CONFIG_FILENAMES) {
      if (await exists(path.join(dir, name))) {
        hasConfig = true;
        break;
      }
    }
    if (!hasConfig) continue;
    const anchored = path.resolve(dir, entry);
    if (await exists(anchored)) return anchored;
  }
}

async function loadSingleRuleEntry(
  entry: string,
  baseDir: string,
): Promise<{ readonly rules: OFMRule[] } | { readonly error: CustomRuleLoadError }> {
  try {
    const absolute = await resolveEntry(entry, baseDir);
    const fileUrl = pathToFileURL(absolute).toString();
    const mod = (await import(fileUrl)) as Record<string, unknown>;
    const candidate = mod.default ?? mod["rules"];
    const rules: OFMRule[] = [];
    if (Array.isArray(candidate)) {
      for (const r of candidate) rules.push(validateRule(r, entry));
    } else {
      rules.push(validateRule(candidate, entry));
    }
    return { rules };
  } catch (err) {
    return {
      error: {
        modulePath: entry,
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

function validateRule(candidate: unknown, modulePath: string): OFMRule {
  if (candidate === null || typeof candidate !== "object") {
    throw new Error(`Custom rule module "${modulePath}" does not export a rule object`);
  }
  const rule = candidate as Partial<OFMRule>;
  validateNames(rule, modulePath);
  validateDescription(rule, modulePath);
  validateTags(rule, modulePath);
  validateSeverity(rule, modulePath);
  validateFixable(rule, modulePath);
  validateRun(rule, modulePath);
  return candidate as OFMRule;
}

function validateNames(rule: Partial<OFMRule>, modulePath: string): void {
  if (!Array.isArray(rule.names) || rule.names.length === 0) {
    throw new Error(`Custom rule from "${modulePath}" is missing required field "names"`);
  }
}

function validateDescription(rule: Partial<OFMRule>, modulePath: string): void {
  if (typeof rule.description !== "string") {
    const detail = rule.description !== undefined ? ` (got ${typeof rule.description})` : "";
    throw new Error(
      `Custom rule from "${modulePath}" requires "description" to be a string${detail}`,
    );
  }
}

function validateTags(rule: Partial<OFMRule>, modulePath: string): void {
  if (!Array.isArray(rule.tags)) {
    const detail = rule.tags !== undefined ? ` (got ${typeof rule.tags})` : "";
    throw new Error(`Custom rule from "${modulePath}" requires "tags" to be an array${detail}`);
  }
}

function validateSeverity(rule: Partial<OFMRule>, modulePath: string): void {
  if (rule.severity !== "error" && rule.severity !== "warning") {
    throw new Error(
      `Custom rule from "${modulePath}" has invalid or missing "severity" (must be "error" or "warning")`,
    );
  }
}

function validateFixable(rule: Partial<OFMRule>, modulePath: string): void {
  if (typeof rule.fixable !== "boolean") {
    const detail = rule.fixable !== undefined ? ` (got ${typeof rule.fixable})` : "";
    throw new Error(`Custom rule from "${modulePath}" requires "fixable" to be a boolean${detail}`);
  }
}

function validateRun(rule: Partial<OFMRule>, modulePath: string): void {
  if (typeof rule.run !== "function") {
    const detail = rule.run !== undefined ? ` (got ${typeof rule.run})` : "";
    throw new Error(`Custom rule from "${modulePath}" requires "run" to be a function${detail}`);
  }
}
