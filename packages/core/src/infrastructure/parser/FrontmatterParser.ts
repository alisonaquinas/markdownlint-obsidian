/**
 * Purpose: Parses YAML/TOML frontmatter from Markdown source strings using gray-matter.
 *
 * Provides: {@link parseFrontmatter}, {@link FrontmatterParseOutput}
 *
 * Role in system: Serves as the first stage of the infrastructure parsing pipeline,
 * extracting structured frontmatter data and computing the body start line so downstream
 * parsers and OFM extractors operate on the correct line offsets.
 *
 * @module infrastructure/parser/FrontmatterParser
 */
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
  // gray-matter caches parsed results by content string; { cache: false } disables this.
  // Without it, OFM902 (invalid-frontmatter) fails to fire when the same malformed content
  // is parsed twice in the same process (e.g., in test suites or repeated linting).
  // The cast is required because gray-matter's TypeScript types do not expose this option.
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
