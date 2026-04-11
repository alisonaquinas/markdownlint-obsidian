import type { RuleConfig } from "./RuleConfig.js";

/** OFM wikilink resolution behaviour. */
export interface WikilinkConfig {
  readonly caseSensitive: boolean;
  readonly allowAlias: boolean;
}

/**
 * Callout-family options. `allowList` drives OFM040; the remaining flags
 * control OFM042 (`requireTitle`) and OFM044 (`allowFold`). `caseSensitive`
 * determines whether `> [!note]` and `> [!NOTE]` are treated as the same
 * entry when matching against `allowList`.
 */
export interface CalloutConfig {
  readonly allowList: readonly string[];
  readonly caseSensitive: boolean;
  readonly requireTitle: boolean;
  readonly allowFold: boolean;
}

/**
 * Embed-family options. `allowedExtensions` is the closed set of file
 * extensions permitted as embed targets (OFM024). `maxWidth` and `maxHeight`
 * cap the sizing hints on an embed (OFM023); `null` disables the limit.
 * `allowRemote` reserved for future OFM02x rules that distinguish vault-local
 * assets from URLs.
 */
export interface EmbedConfig {
  readonly allowedExtensions: readonly string[];
  readonly maxWidth: number | null;
  readonly maxHeight: number | null;
  readonly allowRemote: boolean;
}

/**
 * Frontmatter validation options.
 *
 * `required` is the set of dotted keys that must exist in every file's
 * frontmatter. `dateFields` is the subset that must additionally parse as
 * ISO-8601. `typeMap` declares an expected JSON type for each named key
 * (used by OFM082 and OFM083). `allowUnknown=false` makes OFM082 fail on
 * any key not present in `typeMap`.
 */
export interface FrontmatterConfig {
  readonly required: readonly string[];
  readonly dateFields: readonly string[];
  readonly typeMap: Readonly<Record<string, "string" | "number" | "boolean" | "array" | "date">>;
  readonly allowUnknown: boolean;
}

/** Tag validation options. */
export interface TagConfig {
  readonly maxDepth: number;
  readonly caseSensitive: boolean;
  readonly allowList: readonly string[] | null;
  readonly denyList: readonly string[];
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
  readonly embeds: EmbedConfig;
  readonly frontmatter: FrontmatterConfig;
  readonly tags: TagConfig;
  readonly rules: Readonly<Record<string, RuleConfig>>;
  readonly customRules: readonly string[];
  readonly globs: readonly string[];
  readonly ignores: readonly string[];
  readonly fix: boolean;
  readonly outputFormatter: string;
}
