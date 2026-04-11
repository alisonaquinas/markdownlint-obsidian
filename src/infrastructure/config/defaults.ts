import type { LinterConfig } from "../../domain/config/LinterConfig.js";

/**
 * Built-in default {@link LinterConfig} used when no configuration files
 * are discovered. Every field is frozen so downstream mutation is impossible.
 */
export const DEFAULT_CONFIG: LinterConfig = Object.freeze({
  vaultRoot: null,
  resolve: true,
  wikilinks: Object.freeze({ caseSensitive: false, allowAlias: true }),
  callouts: Object.freeze({
    allowList: Object.freeze(["NOTE", "WARNING", "TIP", "IMPORTANT", "CAUTION"]),
  }),
  frontmatter: Object.freeze({
    required: Object.freeze([]),
    dateFields: Object.freeze([]),
  }),
  rules: Object.freeze({}),
  customRules: Object.freeze([]),
  globs: Object.freeze(["**/*.md"]),
  ignores: Object.freeze([]),
  fix: false,
  outputFormatter: "default",
});
