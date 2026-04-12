import type { RuleRegistry } from "../../domain/linting/RuleRegistry.js";
import type { OFMRule } from "../../domain/linting/OFMRule.js";

/**
 * Register each custom rule with the registry. If a rule name clashes with an
 * already-registered rule (built-in or earlier custom), skip it and write
 * OFM904 to stderr rather than crashing the run.
 */
export function registerCustomRules(registry: RuleRegistry, rules: readonly OFMRule[]): void {
  for (const rule of rules) {
    try {
      registry.register(rule);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Extract the conflicting name from "Duplicate rule name: <name>" if possible,
      // otherwise fall back to the rule's primary name.
      const match = message.match(/Duplicate rule name: (.+)$/);
      const conflictLabel = match?.[1] ?? rule.names[0];
      process.stderr.write(
        `OFM904: skipped duplicate custom rule "${conflictLabel}": ${message}\n`,
      );
    }
  }
}
