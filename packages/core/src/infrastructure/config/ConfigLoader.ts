/**
 * Purpose: Walks the directory tree upward from a start path, reads and merges every discovered config file into a single validated {@link LinterConfig}.
 *
 * Provides: {@link loadConfig}
 *
 * Role in system: Infrastructure adapter that bridges the filesystem and the domain config
 * model; it reads JSONC/YAML config files, applies precedence-ordered layer merging on top
 * of {@link DEFAULT_CONFIG}, and delegates shape validation to {@link validateConfig} before
 * returning a fully-typed config to the application layer.
 *
 * @module infrastructure/config/ConfigLoader
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { parse as parseJsonc, type ParseError } from "jsonc-parser";
import { load as parseYaml } from "js-yaml";
import { parse as parseToml } from "smol-toml";
import { DEFAULT_CONFIG } from "./defaults.js";
import { validateConfig } from "./ConfigValidator.js";
import type { LinterConfig } from "../../domain/config/LinterConfig.js";

type ConfigKind = "cli2" | "obsidian" | "markdownlint";

const CLI2_CONFIG_FILES: readonly string[] = [
  ".markdownlint-cli2.jsonc",
  ".markdownlint-cli2.yaml",
  ".markdownlint-cli2.cjs",
  ".markdownlint-cli2.mjs",
];

const OBSIDIAN_CONFIG_FILES: readonly string[] = [
  ".obsidian-linter.jsonc",
  ".obsidian-linter.yaml",
];

const MARKDOWNLINT_CONFIG_FILES: readonly string[] = [
  ".markdownlint.jsonc",
  ".markdownlint.json",
  ".markdownlint.yaml",
  ".markdownlint.yml",
  ".markdownlint.cjs",
  ".markdownlint.mjs",
];

const CLI2_OPTION_KEYS: ReadonlySet<string> = new Set([
  "config",
  "customRules",
  "fix",
  "frontMatter",
  "gitignore",
  "globs",
  "ignores",
  "markdownItPlugins",
  "modulePaths",
  "noBanner",
  "noInlineConfig",
  "noProgress",
  "outputFormatter",
  "outputFormatters",
  "showFound",
  "vaultRoot",
  "resolve",
]);

/**
 * Walk upward from `startDir` to the filesystem root, merging every config
 * file discovered along the way.
 *
 * Precedence (highest wins): files nearest `startDir` override files further
 * up the tree, and `DEFAULT_CONFIG` is the lowest layer.
 *
 * `rules` is merged one key at a time rather than replaced wholesale, so a
 * user config that only overrides (say) `MD013` keeps every other entry
 * from `DEFAULT_CONFIG.rules` — notably the Phase 7 OFM conflict disables
 * (`MD033`, `MD034`, etc.). Every other top-level key is still replaced by
 * the last-writing layer, matching markdownlint-cli2's behaviour.
 *
 * @param startDir - Directory to start the walk from.
 * @returns A validated, merged {@link LinterConfig}.
 * @throws Error prefixed `OFM901:` when a discovered layer is malformed.
 */
export async function loadConfig(startDir: string): Promise<LinterConfig> {
  const { discoveryDir, explicitLayer } = await loadExplicitLayerIfFile(startDir);
  const layers = await collectConfigLayers(discoveryDir);
  if (explicitLayer !== null) layers.unshift(explicitLayer);
  const merged = layers.reduce<Record<string, unknown>>((acc, layer) => mergeLayer(acc, layer), {
    ...DEFAULT_CONFIG,
  } as Record<string, unknown>);
  validateConfig(merged);
  return merged as LinterConfig;
}

/**
 * Apply one layer over the accumulated merge result.
 *
 * Top-level keys are spread, except `rules`: a layer's `rules` block is
 * merged key-by-key onto the accumulated rules map. This preserves the
 * invariant that a user flipping one rule does not silently drop every
 * other default.
 */
function mergeLayer(
  acc: Record<string, unknown>,
  layer: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...acc, ...layer };
  if (typeof layer.rules === "object" && layer.rules !== null) {
    const existing = (acc.rules ?? {}) as Record<string, unknown>;
    out.rules = { ...existing, ...(layer.rules as Record<string, unknown>) };
  }
  return out;
}

async function collectConfigLayers(startDir: string): Promise<Record<string, unknown>[]> {
  const layers: Record<string, unknown>[] = [];
  const dirs = collectAncestorDirs(startDir);

  for (const dir of dirs) {
    const cli2 = await tryReadFirstDiscovered(dir, CLI2_CONFIG_FILES, "cli2");
    if (cli2 !== null) layers.push(cli2);

    const obsidian = await tryReadFirstDiscovered(dir, OBSIDIAN_CONFIG_FILES, "obsidian");
    if (obsidian !== null) layers.push(obsidian);

    const markdownlint = await tryReadFirstDiscovered(
      dir,
      MARKDOWNLINT_CONFIG_FILES,
      "markdownlint",
    );
    if (markdownlint !== null) layers.push(markdownlint);
  }

  return layers;
}

function collectAncestorDirs(startDir: string): string[] {
  const dirs: string[] = [];
  let dir = path.resolve(startDir);

  for (;;) {
    dirs.unshift(dir);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return dirs;
}

async function loadExplicitLayerIfFile(startPath: string): Promise<{
  readonly discoveryDir: string;
  readonly explicitLayer: Record<string, unknown> | null;
}> {
  const resolved = path.resolve(startPath);
  const stat = await fs.stat(resolved).catch(() => null);
  if (stat?.isFile() !== true) {
    return { discoveryDir: resolved, explicitLayer: null };
  }

  const raw = await readConfigObject(resolved);
  const kind = classifyExplicitConfig(resolved, raw);
  return {
    discoveryDir: path.dirname(resolved),
    explicitLayer: normalizeConfigLayer(kind, raw),
  };
}

async function tryReadFirstDiscovered(
  dir: string,
  names: readonly string[],
  kind: ConfigKind,
): Promise<Record<string, unknown> | null> {
  for (const name of names) {
    const filePath = path.join(dir, name);
    if (!(await exists(filePath))) continue;
    const raw = await readConfigObject(filePath);
    return normalizeConfigLayer(kind, raw);
  }
  return null;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readConfigObject(filePath: string): Promise<Record<string, unknown>> {
  try {
    const raw = await parseConfigFile(filePath);
    if (isRecord(raw)) return raw;
    throw new Error("config must be an object");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`OFM901: failed to parse ${filePath}: ${message}`);
  }
}

async function parseConfigFile(filePath: string): Promise<unknown> {
  const ext = path.extname(filePath);
  if (ext === ".cjs" || ext === ".mjs") return importConfig(filePath);

  const raw = await fs.readFile(filePath, "utf8");
  if (ext === ".yaml" || ext === ".yml") return parseYaml(raw);
  if (ext === ".toml") return parseToml(raw);
  return parseJsoncConfig(raw);
}

function parseJsoncConfig(raw: string): unknown {
  const errors: ParseError[] = [];
  const parsed = parseJsonc(raw, errors, { allowTrailingComma: true });
  if (errors.length > 0) {
    const [first] = errors;
    throw new Error(`invalid JSONC at offset ${first?.offset ?? 0}`);
  }
  return parsed;
}

async function importConfig(filePath: string): Promise<unknown> {
  const url = pathToFileURL(filePath);
  url.searchParams.set("mtime", String((await fs.stat(filePath)).mtimeMs));
  const module = (await import(url.href)) as { default?: unknown };
  return module.default;
}

function classifyExplicitConfig(filePath: string, raw: Record<string, unknown>): ConfigKind {
  const name = path.basename(filePath);
  if (CLI2_CONFIG_FILES.includes(name)) return "cli2";
  if (OBSIDIAN_CONFIG_FILES.includes(name)) return "obsidian";
  if (MARKDOWNLINT_CONFIG_FILES.includes(name)) return "markdownlint";
  return hasCli2OptionKey(raw) ? "cli2" : "markdownlint";
}

function hasCli2OptionKey(raw: Record<string, unknown>): boolean {
  return Object.keys(raw).some((key) => CLI2_OPTION_KEYS.has(key));
}

function normalizeConfigLayer(
  kind: ConfigKind,
  raw: Record<string, unknown>,
): Record<string, unknown> {
  if (kind === "markdownlint") return { rules: markdownlintConfigToRules(raw) };
  return normalizeOptionsLayer(raw);
}

function normalizeOptionsLayer(raw: Record<string, unknown>): Record<string, unknown> {
  const { config, rules, ...rest } = raw;
  const normalized: Record<string, unknown> = { ...rest };
  const mergedRules = mergeRuleMaps(
    isRecord(config) ? markdownlintConfigToRules(config) : {},
    isRecord(rules) ? rules : {},
  );
  if (Object.keys(mergedRules).length > 0) normalized.rules = mergedRules;
  return normalized;
}

function markdownlintConfigToRules(raw: Record<string, unknown>): Record<string, unknown> {
  const rules: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === "$schema" || key === "default" || key === "extends") continue;
    if (!key.startsWith("MD")) continue;
    const config = markdownlintRuleValueToRuleConfig(value);
    if (config !== null) rules[key] = config;
  }
  return rules;
}

function markdownlintRuleValueToRuleConfig(value: unknown): Record<string, unknown> | null {
  if (value === false) return { enabled: false };
  if (value === true) return { enabled: true };
  if (isRecord(value)) return { enabled: true, options: value };
  return null;
}

function mergeRuleMaps(
  first: Record<string, unknown>,
  second: Record<string, unknown>,
): Record<string, unknown> {
  return { ...first, ...second };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
