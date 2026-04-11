import type { LinterConfig } from "../../domain/config/LinterConfig.js";

/**
 * Built-in default {@link LinterConfig} used when no configuration files
 * are discovered. Every field is frozen so downstream mutation is impossible.
 *
 * Phase 3 additions:
 * - `frontmatter` gains `typeMap` and `allowUnknown` for OFM082/OFM083.
 * - `tags` is added with `maxDepth: 5` and case-insensitive comparisons.
 * - `rules.OFM082` and `rules.OFM066` are disabled by default; both warn
 *   on stylistic issues most vaults would not opt into without thinking.
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
    typeMap: Object.freeze({}),
    allowUnknown: true,
  }),
  tags: Object.freeze({
    maxDepth: 5,
    caseSensitive: false,
    allowList: null,
    denyList: Object.freeze([]),
  }),
  rules: Object.freeze({
    OFM062: Object.freeze({ enabled: false }),
    OFM066: Object.freeze({ enabled: false }),
    OFM082: Object.freeze({ enabled: false }),
  }),
  customRules: Object.freeze([]),
  globs: Object.freeze(["**/*.md"]),
  ignores: Object.freeze([]),
  fix: false,
  outputFormatter: "default",
});
