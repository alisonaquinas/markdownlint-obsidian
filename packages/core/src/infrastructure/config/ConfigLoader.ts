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
import { parse as parseJsonc } from "jsonc-parser";
import { DEFAULT_CONFIG } from "./defaults.js";
import { validateConfig } from "./ConfigValidator.js";
import type { LinterConfig } from "../../domain/config/LinterConfig.js";

const CONFIG_FILES: readonly string[] = [
  ".markdownlint-cli2.jsonc",
  ".markdownlint-cli2.yaml",
  ".obsidian-linter.jsonc",
  ".obsidian-linter.yaml",
  ".markdownlint.jsonc",
  ".markdownlint.yaml",
];

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
  const layers = await collectConfigLayers(startDir);
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
  let dir = path.resolve(startDir);

  for (;;) {
    for (const name of CONFIG_FILES) {
      const filePath = path.join(dir, name);
      const layer = await tryReadJsonc(filePath);
      if (layer !== null) layers.unshift(layer);
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return layers;
}

async function tryReadJsonc(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return parseJsonc(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}
