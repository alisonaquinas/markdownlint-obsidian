import { formatDefault } from "./DefaultFormatter.js";
import { formatJson } from "./JsonFormatter.js";
import { formatJUnit } from "./JUnitFormatter.js";
import { formatSarif } from "./SarifFormatter.js";
import type { LintResult } from "../../domain/linting/LintResult.js";

/** Function signature every formatter must honour. */
export type Formatter = (results: readonly LintResult[]) => string;

const FORMATTERS: Readonly<Record<string, Formatter>> = Object.freeze({
  default: formatDefault,
  json: formatJson,
  junit: formatJUnit,
  sarif: formatSarif,
});

/**
 * Look up a formatter by name.
 *
 * @param name - Formatter identifier (`"default"`, `"json"`, `"junit"`, `"sarif"`).
 * @returns The matching {@link Formatter}.
 * @throws Error prefixed `OFM901:` when the name is not registered.
 */
export function getFormatter(name: string): Formatter {
  const formatter = FORMATTERS[name];
  if (!formatter) {
    throw new Error(`OFM901: unknown formatter "${name}"`);
  }
  return formatter;
}
