/**
 * Purpose: Reads a Markdown file from disk as UTF-8 while stripping a leading BOM.
 *
 * Provides: {@link readMarkdownFile}
 *
 * Role in system: Infrastructure I/O adapter that satisfies the `readFile` dependency injected
 * into {@link LintDependencies} and {@link FixDependencies}; it preserves file line endings so
 * autofix can keep the working-tree style stable. The parser normalizes its own input before
 * lint rules run.
 *
 * @module infrastructure/io/FileReader
 */
import * as fs from "node:fs/promises";

/**
 * Read a Markdown file as UTF-8 and strip any leading BOM.
 */
export async function readMarkdownFile(absolutePath: string): Promise<string> {
  const raw = await fs.readFile(absolutePath, "utf8");
  return raw.startsWith("\uFEFF") ? raw.slice(1) : raw;
}
