/**
 * Purpose: Detect callouts whose type is not present in the configured `callouts.allowList`.
 *
 * Provides: {@link OFM040Rule}
 *
 * Role in system: Infrastructure-layer implementation of OFM040 — flags callouts with unrecognised types that Obsidian silently degrades to plain quote blocks.
 *
 * @module infrastructure/rules/ofm/callouts/OFM040-unknown-callout-type
 */
import type { OFMRule } from "../../../../domain/linting/OFMRule.js";
import { buildCalloutTypeRegistry } from "./shared/CalloutTypeRegistry.js";

/**
 * OFM040 — unknown-callout-type.
 *
 * Emits an error for every callout whose `type` is not in the configured
 * `callouts.allowList`. Obsidian quietly renders unknown types as plain
 * quote blocks, which is usually a typo — this rule surfaces that.
 *
 * @see docs/rules/callouts/OFM040.md
 */
export const OFM040Rule: OFMRule = {
  names: ["OFM040", "unknown-callout-type"],
  description: "Callout type is not in the allowList",
  tags: ["callouts"],
  severity: "error",
  fixable: false,
  run({ parsed, config }, onError) {
    const registry = buildCalloutTypeRegistry(config.callouts);
    for (const callout of parsed.callouts) {
      if (!registry.has(callout.type)) {
        onError({
          line: callout.position.line,
          column: callout.position.column,
          message: `Unknown callout type "${callout.type}"`,
        });
      }
    }
  },
};
