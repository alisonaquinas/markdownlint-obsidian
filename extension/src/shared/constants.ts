export const EXTENSION_ID = "alisonaquinas.markdownlint-obsidian-vscode";
export const FLAVOR_GRENADE_EXTENSION_ID = "alisonaquinas.flavor-grenade-lsp";
export const CONFIG_SECTION = "markdownlintObsidian";

export const COMMANDS = Object.freeze({
  lintWorkspace: "markdownlintObsidian.lintWorkspace",
  openConfig: "markdownlintObsidian.openConfig",
  disable: "markdownlintObsidian.disable",
  enable: "markdownlintObsidian.enable",
  fixAll: "markdownlintObsidian.fixAll",
  previewFixes: "markdownlintObsidian.previewFixes",
  openRuleHelp: "markdownlintObsidian.openRuleHelp",
});

export const SUPPORTED_CONFIG_FILES = Object.freeze([
  ".obsidian-linter.jsonc",
  ".obsidian-linter.json",
  "obsidian-linter.config.jsonc",
  "obsidian-linter.config.json",
]);
