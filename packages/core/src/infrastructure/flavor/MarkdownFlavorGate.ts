/**
 * Shared Markdown flavor gate used before core lint rules run.
 *
 * The detector comes from Flavor Grenade's reusable `markdown-flavor-detection`
 * package so CLI, action, and editor paths use the same flavor resolution
 * semantics.
 *
 * @module infrastructure/flavor/MarkdownFlavorGate
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { NodeFlavorConfigResolver, resolveMarkdownFlavor } from "markdown-flavor-detection/node";

export type MarkdownFlavorGate = (absolutePath: string, raw: string) => boolean;

/**
 * Create a per-run gate that allows linting only for files detected as
 * Obsidian-flavored Markdown.
 *
 * @param root - Vault/workspace root used for `.mdfignore` and `.mdfattributes` lookup.
 * @returns Predicate consumed by the lint use case.
 */
export function makeMarkdownFlavorGate(root: string): MarkdownFlavorGate {
  const resolvedRoot = path.resolve(root);
  const resolver = new NodeFlavorConfigResolver();
  const hasObsidianMarker = fs.existsSync(path.join(resolvedRoot, ".obsidian"));

  return (resourcePath, raw): boolean => {
    const absolutePath = path.isAbsolute(resourcePath)
      ? resourcePath
      : path.resolve(resolvedRoot, resourcePath);
    const config = resolver.resolveForFile(resolvedRoot, absolutePath);
    const resolution = resolveMarkdownFlavor({
      path: absolutePath,
      languageId: "markdown",
      ignored: config.ignored,
      mdfAttributes: config.attributes,
      hasObsidianMarker,
      syntaxText: raw,
    });

    return resolution.kind === "active" && resolution.effective === "obsidian";
  };
}
