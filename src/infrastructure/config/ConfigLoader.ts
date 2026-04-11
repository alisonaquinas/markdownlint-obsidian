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
 * @param startDir - Directory to start the walk from.
 * @returns A validated, merged {@link LinterConfig}.
 * @throws Error prefixed `OFM901:` when a discovered layer is malformed.
 */
export async function loadConfig(startDir: string): Promise<LinterConfig> {
  const layers = await collectConfigLayers(startDir);
  const merged = layers.reduce<Record<string, unknown>>(
    (acc, layer) => ({ ...acc, ...layer }),
    { ...DEFAULT_CONFIG } as Record<string, unknown>,
  );
  validateConfig(merged);
  return merged as LinterConfig;
}

async function collectConfigLayers(startDir: string): Promise<Record<string, unknown>[]> {
  const layers: Record<string, unknown>[] = [];
  let dir = path.resolve(startDir);

  for (;;) {
    for (const name of CONFIG_FILES) {
      const filePath = path.join(dir, name);
      // eslint-disable-next-line no-await-in-loop -- sequential on purpose to preserve precedence
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
