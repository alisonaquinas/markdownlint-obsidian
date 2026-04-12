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
    try {
      const absolute = path.isAbsolute(entry) ? entry : path.resolve(baseDir, entry);
      const fileUrl = pathToFileURL(absolute).toString();
      const mod = (await import(fileUrl)) as Record<string, unknown>;
      const candidate = mod.default ?? mod["rules"];
      if (Array.isArray(candidate)) {
        for (const r of candidate) rules.push(validateRule(r, entry));
      } else {
        rules.push(validateRule(candidate, entry));
      }
    } catch (err) {
      errors.push({
        modulePath: entry,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { rules, errors };
}

function validateRule(candidate: unknown, modulePath: string): OFMRule {
  if (candidate === null || typeof candidate !== "object") {
    throw new Error(`Custom rule module "${modulePath}" does not export a rule object`);
  }
  const rule = candidate as Partial<OFMRule>;
  if (!Array.isArray(rule.names) || rule.names.length === 0) {
    throw new Error(`Custom rule from "${modulePath}" is missing required field "names"`);
  }
  if (typeof rule.description !== "string") {
    throw new Error(`Custom rule from "${modulePath}" is missing required field "description"`);
  }
  if (!Array.isArray(rule.tags)) {
    throw new Error(`Custom rule from "${modulePath}" is missing required field "tags"`);
  }
  if (rule.severity !== "error" && rule.severity !== "warning") {
    throw new Error(`Custom rule from "${modulePath}" has invalid or missing "severity" (must be "error" or "warning")`);
  }
  if (typeof rule.fixable !== "boolean") {
    throw new Error(`Custom rule from "${modulePath}" is missing required field "fixable"`);
  }
  if (typeof rule.run !== "function") {
    throw new Error(`Custom rule from "${modulePath}" is missing required field "run"`);
  }
  return candidate as OFMRule;
}
