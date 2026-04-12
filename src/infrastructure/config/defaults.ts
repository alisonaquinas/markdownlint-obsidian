import type { LinterConfig } from "../../domain/config/LinterConfig.js";
import type { RuleConfig } from "../../domain/config/RuleConfig.js";
import { OFM_MD_CONFLICTS } from "../rules/standard/OFM_MD_CONFLICTS.js";

/**
 * Pre-computed map of every OFM-conflicting markdownlint rule set to
 * `{ enabled: false }`. Lives at module top-level so the frozen object is
 * allocated exactly once and shared across every merge layer.
 */
const MD_CONFLICT_OVERRIDES: Readonly<Record<string, RuleConfig>> = Object.freeze(
  Object.fromEntries(
    OFM_MD_CONFLICTS.map((c) => [c.code, Object.freeze({ enabled: false })]),
  ),
);

/**
 * Built-in default {@link LinterConfig} used when no configuration files
 * are discovered. Every field is frozen so downstream mutation is impossible.
 *
 * Phase 3 additions:
 * - `frontmatter` gains `typeMap` and `allowUnknown` for OFM082/OFM083.
 * - `tags` is added with `maxDepth: 5` and case-insensitive comparisons.
 * - `rules.OFM082` and `rules.OFM066` are disabled by default; both warn
 *   on stylistic issues most vaults would not opt into without thinking.
 *
 * Phase 7 additions:
 * - Every entry in {@link OFM_MD_CONFLICTS} is merged into `rules` with
 *   `enabled: false`. The curated list documents why each rule collides
 *   with OFM syntax; users who want the upstream behaviour back can
 *   re-enable individual rules in their own config.
 */
export const DEFAULT_CONFIG: LinterConfig = Object.freeze({
  vaultRoot: null,
  resolve: true,
  wikilinks: Object.freeze({ caseSensitive: false, allowAlias: true }),
  callouts: Object.freeze({
    allowList: Object.freeze([
      "NOTE",
      "WARNING",
      "TIP",
      "IMPORTANT",
      "CAUTION",
      "ABSTRACT",
      "SUMMARY",
      "INFO",
      "HINT",
      "SUCCESS",
      "QUESTION",
      "FAILURE",
      "DANGER",
      "BUG",
      "EXAMPLE",
      "QUOTE",
    ]),
    caseSensitive: false,
    requireTitle: false,
    allowFold: true,
  }),
  embeds: Object.freeze({
    allowedExtensions: Object.freeze([
      "md",
      "png",
      "jpg",
      "jpeg",
      "gif",
      "svg",
      "webp",
      "pdf",
      "mp4",
      "webm",
      "mp3",
      "wav",
      "ogg",
    ]),
    maxWidth: null,
    maxHeight: null,
    allowRemote: false,
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
  blockRefs: Object.freeze({
    idPattern: "^[A-Za-z0-9-]{1,32}$",
    requireUnique: true,
  }),
  highlights: Object.freeze({
    allow: true,
    allowedGlobs: Object.freeze([]),
  }),
  comments: Object.freeze({
    allow: true,
    disallowMultiline: false,
  }),
  rules: Object.freeze({
    OFM062: Object.freeze({ enabled: false }),
    OFM066: Object.freeze({ enabled: false }),
    OFM082: Object.freeze({ enabled: false }),
    // OFM003 (self-link) is disabled by default; self-links are commonly
    // intentional (sidebars, navigation blocks).
    OFM003: Object.freeze({ enabled: false }),
    // OFM120 / OFM121 are gated on the `highlights` and `comments` config
    // blocks. Disable them by default — the explicit rule flag keeps the
    // registry ordering deterministic while letting teams flip a single
    // config key (`highlights.allow = false`) to opt in.
    OFM120: Object.freeze({ enabled: false }),
    OFM121: Object.freeze({ enabled: false }),
    // Phase 7: disable every MD rule that conflicts with OFM syntax.
    ...MD_CONFLICT_OVERRIDES,
  }),
  customRules: Object.freeze([]),
  globs: Object.freeze(["**/*.md"]),
  ignores: Object.freeze([]),
  fix: false,
  outputFormatter: "default",
});
