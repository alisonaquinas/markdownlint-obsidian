/**
 * Purpose: Build a registry of allowed callout types from configuration for use by callout rules.
 *
 * Provides: {@link buildCalloutTypeRegistry}, {@link CalloutTypeRegistry}
 *
 * Role in system: Infrastructure-layer shared utility for OFM040-series callout rules — constructs a case-sensitive or case-insensitive lookup set from `CalloutConfig.allowList`.
 *
 * @module infrastructure/rules/ofm/callouts/shared/CalloutTypeRegistry
 */
import type { CalloutConfig } from "../../../../../domain/config/LinterConfig.js";

/**
 * Minimal registry interface the callout rules query against. Kept small
 * so stub implementations in tests can satisfy it with a one-line literal.
 */
export interface CalloutTypeRegistry {
  has(type: string): boolean;
}

/**
 * Build a {@link CalloutTypeRegistry} from a {@link CalloutConfig}.
 *
 * When `config.caseSensitive` is `true`, entries are compared exactly.
 * Otherwise both the stored set and the query string are uppercased,
 * matching the {@link CalloutExtractor}'s own normalisation (the
 * extractor already uppercases the parsed type).
 *
 * Rules hold the registry for the lifetime of a single `run()` call —
 * it is stateless beyond the frozen allowList snapshot, so there is no
 * sharing concern.
 */
export function buildCalloutTypeRegistry(config: CalloutConfig): CalloutTypeRegistry {
  const caseSensitive = config.caseSensitive;
  const set = new Set(config.allowList.map((t) => (caseSensitive ? t : t.toUpperCase())));
  return {
    has(type: string): boolean {
      const key = caseSensitive ? type : type.toUpperCase();
      return set.has(key);
    },
  };
}
