/**
 * Purpose: Defines the per-rule configuration value object and its default value.
 *
 * Provides: {@link RuleConfig}, {@link DEFAULT_RULE_CONFIG}
 *
 * Role in system: The smallest unit of configuration in the domain — each entry in {@link LinterConfig.rules} is a RuleConfig. Infrastructure layers read these to decide whether to run a rule, at what severity, and with which options.
 *
 * @module domain/config/RuleConfig
 */

/**
 * Immutable value object describing a single rule's configuration.
 *
 * `enabled` controls whether the rule runs. `severity` allows overriding
 * the rule's default severity at config time. `options` is an opaque map
 * consumed by the rule implementation.
 */
export interface RuleConfig {
  readonly enabled: boolean;
  readonly severity?: "error" | "warning";
  readonly options?: Readonly<Record<string, unknown>>;
}

/**
 * Default per-rule configuration used when a rule is not explicitly
 * configured in any `.obsidian-linter.jsonc` or `.markdownlint.jsonc` layer.
 */
export const DEFAULT_RULE_CONFIG: RuleConfig = Object.freeze({ enabled: true });
