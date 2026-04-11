import type { LinterConfig } from "../../domain/config/LinterConfig.js";

const KNOWN_KEYS: ReadonlySet<string> = new Set([
  // markdownlint-obsidian extensions
  "vaultRoot",
  "resolve",
  "wikilinks",
  "callouts",
  "embeds",
  "frontmatter",
  "tags",
  // markdownlint-cli2 compatible keys
  "config",
  "rules",
  "customRules",
  "globs",
  "ignores",
  "fix",
  "outputFormatter",
  "outputFormatters",
  "gitignore",
  "noBanner",
  "noInlineConfig",
  "noProgress",
  "showFound",
  "modulePaths",
]);

/**
 * Validate the shape of a raw configuration object.
 *
 * Phase 1 only checks for unknown top-level keys; schema validation of
 * nested options is deferred to later phases once the rule set stabilises.
 *
 * @param raw - Unknown object produced by a JSONC/YAML parser.
 * @throws Error prefixed with `OFM901:` when the object is malformed.
 */
export function validateConfig(raw: unknown): asserts raw is LinterConfig {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("OFM901: config must be an object");
  }
  for (const key of Object.keys(raw as Record<string, unknown>)) {
    if (!KNOWN_KEYS.has(key)) {
      throw new Error(`OFM901: unknown config key "${key}"`);
    }
  }
}
