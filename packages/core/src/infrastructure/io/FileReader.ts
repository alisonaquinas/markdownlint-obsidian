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
