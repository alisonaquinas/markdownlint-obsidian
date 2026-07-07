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

export interface MarkdownFlavorGateOptions {
  /**
   * Preserve CLI compatibility for repositories that have no explicit flavor
   * assignment. Users already opted into OFM linting by passing matched files
   * to markdownlint-obsidian, so CommonMark/GFM syntax inference should not
   * silently erase the run.
   */
  readonly allowUnassignedMarkdown?: boolean;
}

/**
 * Create a per-run gate that allows linting only for files detected as
 * Obsidian-flavored Markdown.
 *
 * @param root - Vault/workspace root used for `.mdfignore` and `.mdfattributes` lookup.
 * @returns Predicate consumed by the lint use case.
 */
export function makeMarkdownFlavorGate(
  root: string,
  options: MarkdownFlavorGateOptions = {},
): MarkdownFlavorGate {
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

    if (resolution.kind !== "active") return false;
    if (resolution.effective === "obsidian") return true;

    return options.allowUnassignedMarkdown === true && config.attributes.flavor === undefined;
  };
}
