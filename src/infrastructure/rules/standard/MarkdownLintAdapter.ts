import { lint as lintSync } from "markdownlint/sync";
import type { Configuration, FixInfo } from "markdownlint";

/**
 * Normalised shape of one markdownlint violation.
 *
 * Mirrors the upstream `LintError` but drops nullable fields in favour of
 * `undefined` so the rest of our infrastructure — which never distinguishes
 * "absent" from "null" — consumes a single shape. `fixInfo` is **preserved
 * verbatim** so Phase 9 autofix can replay markdownlint's own fix payload
 * without needing to re-run the library.
 */
export interface StandardViolation {
  readonly ruleNames: readonly string[];
  readonly ruleDescription: string;
  readonly lineNumber: number;
  readonly errorContext?: string;
  readonly errorDetail?: string;
  readonly errorRange?: readonly [number, number];
  readonly fixInfo?: FixInfo;
}

/**
 * Thin adapter over the upstream `markdownlint/sync` export.
 *
 * Every call to {@link MarkdownLintAdapter.runOnce} with the same
 * `(filePath, content)` pair returns the same frozen array reference, so
 * rules sharing a file never re-parse through markdownlint.
 */
export interface MarkdownLintAdapter {
  runOnce(
    filePath: string,
    content: string,
    config: Configuration,
  ): readonly StandardViolation[];
}

/**
 * Build a fresh {@link MarkdownLintAdapter}.
 *
 * The returned adapter owns a private memoization cache keyed by
 * `"<filePath>::<contentHash>"`; callers are expected to allocate a new
 * adapter per lint run so the cache does not leak between runs.
 */
export function makeMarkdownLintAdapter(): MarkdownLintAdapter {
  const cache = new Map<string, readonly StandardViolation[]>();

  return {
    runOnce(filePath, content, config) {
      const key = `${filePath}::${fnv1a(content)}`;
      const cached = cache.get(key);
      if (cached !== undefined) return cached;

      const results = lintSync({
        strings: { [filePath]: content },
        config,
      });
      const raw = results[filePath] ?? [];
      const list: StandardViolation[] = raw.map((r) => ({
        ruleNames: r.ruleNames,
        ruleDescription: r.ruleDescription,
        lineNumber: r.lineNumber,
        errorContext: r.errorContext ?? undefined,
        errorDetail: r.errorDetail ?? undefined,
        errorRange: toRangeTuple(r.errorRange),
        fixInfo: r.fixInfo ?? undefined,
      }));
      const frozen = Object.freeze(list);
      cache.set(key, frozen);
      return frozen;
    },
  };
}

/**
 * Coerce markdownlint's `number[] | null` range to a tuple or undefined.
 *
 * Upstream exposes `errorRange` as `number[] | null`; we want a two-element
 * tuple or `undefined` so consumers can destructure without runtime shape
 * checks. Anything shorter than two numbers is treated as absent.
 */
function toRangeTuple(
  value: number[] | null,
): readonly [number, number] | undefined {
  if (value === null || value.length < 2) return undefined;
  return [value[0]!, value[1]!] as const;
}

/**
 * 32-bit FNV-1a hash of a UTF-16 string.
 *
 * Used as the content portion of the memoization cache key. We deliberately
 * avoid bringing in an extra dependency (e.g. `xxhash-wasm`) for a cache
 * that does not need cryptographic strength — collisions would only ever
 * cause a stale-result bug within a single lint run, and FNV-1a is strong
 * enough that deliberate collisions on user-supplied markdown are not a
 * realistic attack surface.
 */
function fnv1a(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return (h >>> 0).toString(16);
}
