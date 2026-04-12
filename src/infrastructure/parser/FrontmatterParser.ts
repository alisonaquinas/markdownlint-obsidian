import matter from "gray-matter";

export interface FrontmatterParseOutput {
  readonly data: Readonly<Record<string, unknown>>;
  readonly rawFrontmatter: string | null;
  /** 1-based line number where the body begins (after closing `---`). */
  readonly bodyStartLine: number;
}

/**
 * Parse YAML/TOML frontmatter from a Markdown source string.
 * Throws an Error prefixed with `OFM902:` when the frontmatter cannot be
 * parsed; callers translate this into a LintError.
 */
export function parseFrontmatter(source: string): FrontmatterParseOutput {
  try {
    return parseInternal(source);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`OFM902: frontmatter parse error — ${message}`);
  }
}

function parseInternal(source: string): FrontmatterParseOutput {
  // gray-matter mutates a cached `File` object when called with the same
  // raw string twice, sometimes leaving `matter` undefined on subsequent
  // invocations. Passing a fresh object reduces the hit rate, but the
  // engine additionally keeps a content-keyed cache: after a parse error
  // the second call returns an empty result instead of re-throwing, which
  // broke the Phase 6 pipeline once BlockRefIndexBuilder started parsing
  // every file before the lint pass. `cache: false` opts out of that
  // cache entirely so OFM902 fires deterministically on every invocation.
  // The `cache` option is not in gray-matter's upstream typings, so we
  // pass it via a loose options bag and accept the typing cost.
  const options = { cache: false } as unknown as Parameters<typeof matter>[1];
  const parsed = matter({ content: source }, options);
  const data = (parsed.data ?? {}) as Record<string, unknown>;
  const rawFrontmatter = normalizeMatter(parsed.matter);
  const bodyStartLine = rawFrontmatter === null ? 1 : countLines(rawFrontmatter) + 3;
  return { data, rawFrontmatter, bodyStartLine };
}

function normalizeMatter(rawMatter: string | undefined): string | null {
  const value = rawMatter ?? "";
  // gray-matter's `matter` field is typically prefixed with a leading newline.
  const trimmed = value.startsWith("\n") ? value.slice(1) : value;
  return trimmed.length > 0 ? trimmed : null;
}

function countLines(text: string): number {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length;
}
