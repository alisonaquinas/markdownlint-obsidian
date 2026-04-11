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
    const parsed = matter(source);
    const data = (parsed.data ?? {}) as Record<string, unknown>;
    // gray-matter's `matter` field contains the frontmatter body text,
    // typically prefixed with a leading newline (`\n<body>`). We trim the
    // leading newline so downstream consumers see just the YAML payload and
    // line counting yields the expected line count.
    const trimmedMatter = parsed.matter.startsWith("\n")
      ? parsed.matter.slice(1)
      : parsed.matter;
    const rawFrontmatter = trimmedMatter.length > 0 ? trimmedMatter : null;
    const bodyStartLine = rawFrontmatter === null ? 1 : countLines(rawFrontmatter) + 3;
    return { data, rawFrontmatter, bodyStartLine };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`OFM902: frontmatter parse error — ${message}`);
  }
}

function countLines(text: string): number {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length;
}
