import type { RuleRegistry } from "../../../domain/linting/RuleRegistry.js";
import { frontmatterParseErrorRule } from "./system/FrontmatterParseError.js";

/** Register every built-in OFM rule with a RuleRegistry. */
export function registerBuiltinRules(registry: RuleRegistry): void {
  registry.register(frontmatterParseErrorRule);
}
