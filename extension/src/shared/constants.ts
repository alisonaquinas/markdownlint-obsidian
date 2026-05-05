/**
 * Stable identifiers shared by the VS Code manifest, runtime command
 * registration, tests, and validation scripts.
 *
 * Keep these values synchronized with `extension/package.json`; package smoke
 * tests intentionally fail when the manifest drifts from this runtime contract.
 *
 * @module shared/constants
 */

/** Published VS Code extension identifier. */
export const EXTENSION_ID = "alisonaquinas.markdownlint-obsidian-vscode";

/** Flavor Grenade extension id used for OFMarkdown language detection. */
export const FLAVOR_GRENADE_EXTENSION_ID = "alisonaquinas.flavor-grenade-lsp";

/** VS Code configuration section contributed by this extension. */
export const CONFIG_SECTION = "markdownlintObsidian";

/** Command ids registered by the extension runtime and referenced by code actions. */
export const COMMANDS = Object.freeze({
  lintWorkspace: "markdownlintObsidian.lintWorkspace",
  openConfig: "markdownlintObsidian.openConfig",
  disable: "markdownlintObsidian.disable",
  enable: "markdownlintObsidian.enable",
  fixAll: "markdownlintObsidian.fixAll",
  previewFixes: "markdownlintObsidian.previewFixes",
  openRuleHelp: "markdownlintObsidian.openRuleHelp",
});

/** Config filenames the open-config command searches before creating a draft. */
export const SUPPORTED_CONFIG_FILES = Object.freeze([
  ".obsidian-linter.jsonc",
  ".obsidian-linter.json",
  "obsidian-linter.config.jsonc",
  "obsidian-linter.config.json",
]);
