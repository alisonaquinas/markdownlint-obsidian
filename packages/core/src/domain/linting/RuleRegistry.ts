/**
 * Purpose: Defines the domain service that stores and retrieves registered linting rules by name or code.
 *
 * Provides: {@link RuleRegistry}, {@link makeRuleRegistry}
 *
 * Role in system: The in-memory registry populated at startup by the DI root in `engine/`; the application use case asks it for `all()` rules to run. Rules may register multiple aliases, and the registry enforces uniqueness to catch configuration mistakes early.
 *
 * @module domain/linting/RuleRegistry
 */
import type { OFMRule } from "./OFMRule.js";

/**
 * Domain service that holds the set of active linting rules.
 *
 * Rules may register multiple names (e.g. `["OFM001", "no-broken-wikilinks"]`);
 * lookup by any registered name returns the same rule instance.
 */
export interface RuleRegistry {
  /**
   * Register a rule. Throws if any of the rule's names is already taken.
   *
   * @param rule - Rule to register.
   * @throws Error when a duplicate name is detected.
   */
  register(rule: OFMRule): void;

  /**
   * Look up a rule by code or alias.
   *
   * @param nameOrCode - Either the numeric code or the human-friendly name.
   * @returns The matching rule, or `undefined` if none is registered.
   */
  get(nameOrCode: string): OFMRule | undefined;

  /** Return every registered rule, deduplicated. */
  all(): readonly OFMRule[];
}

/**
 * Build an empty {@link RuleRegistry}.
 *
 * The returned registry is mutable — `register` populates an internal map.
 */
export function makeRuleRegistry(): RuleRegistry {
  const byName = new Map<string, OFMRule>();

  return {
    register(rule: OFMRule): void {
      // Pass 1 — validate all names before touching the map
      for (const name of rule.names) {
        if (byName.has(name)) {
          throw new Error(`Duplicate rule name: ${name}`);
        }
      }
      // Pass 2 — all names are free; safe to insert
      for (const name of rule.names) {
        byName.set(name, rule);
      }
    },
    get(nameOrCode: string): OFMRule | undefined {
      return byName.get(nameOrCode);
    },
    all(): readonly OFMRule[] {
      return [...new Set(byName.values())];
    },
  };
}
