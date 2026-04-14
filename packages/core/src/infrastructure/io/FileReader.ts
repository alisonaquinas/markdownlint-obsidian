/**
 * Purpose: Reads a Markdown file from disk as UTF-8, stripping BOM and normalising line endings.
 *
 * Provides: {@link readMarkdownFile}
 *
 * Role in system: Infrastructure I/O adapter that satisfies the `readFile` dependency injected
 * into {@link LintDependencies} and {@link FixDependencies}; normalising to LF-only ensures
 * every downstream parser and rule operates on a consistent input format regardless of the
 * file's original line endings.
 *
 * @module infrastructure/io/FileReader
 */
import * as fs from "node:fs/promises";

/**
 * Read a Markdown file as UTF-8, strip any leading BOM, and normalize
 * line endings to `\n`. Every parser downstream assumes LF-only input.
 */
export async function readMarkdownFile(absolutePath: string): Promise<string> {
  const raw = await fs.readFile(absolutePath, "utf8");
  const withoutBom = raw.startsWith("\uFEFF") ? raw.slice(1) : raw;
  return withoutBom.replace(/\r\n/g, "\n");
}
