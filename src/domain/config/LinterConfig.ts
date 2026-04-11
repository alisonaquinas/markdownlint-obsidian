import type { RuleConfig } from "./RuleConfig.js";

/** OFM wikilink resolution behaviour. */
export interface WikilinkConfig {
  readonly caseSensitive: boolean;
  readonly allowAlias: boolean;
}

/** Allowed callout types, matching Obsidian's `> [!NOTE]` syntax. */
export interface CalloutConfig {
  readonly allowList: readonly string[];
}

/** Frontmatter validation options. */
export interface FrontmatterConfig {
  readonly required: readonly string[];
  readonly dateFields: readonly string[];
}

/**
 * Fully merged, validated configuration for one lint run.
 *
 * Instances are immutable and produced by the config loader after cascading
 * file discovery. All optional user-facing fields are either populated with
 * defaults or explicitly marked `null` so downstream code can treat every
 * field as present.
 */
export interface LinterConfig {
  readonly vaultRoot: string | null;
  readonly resolve: boolean;
  readonly wikilinks: WikilinkConfig;
  readonly callouts: CalloutConfig;
  readonly frontmatter: FrontmatterConfig;
  readonly rules: Readonly<Record<string, RuleConfig>>;
  readonly customRules: readonly string[];
  readonly globs: readonly string[];
  readonly ignores: readonly string[];
  readonly fix: boolean;
  readonly outputFormatter: string;
}
