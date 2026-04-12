import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Atomically write `content` to `absolutePath`. Uses a sibling temp file
 * + rename so a crash mid-write never leaves a partially written file.
 */
export async function writeMarkdownFile(absolutePath: string, content: string): Promise<void> {
  const dir = path.dirname(absolutePath);
  const tmp = path.join(dir, `.${path.basename(absolutePath)}.tmp-${process.pid}-${Date.now()}`);
  await fs.writeFile(tmp, content, "utf8");
  try {
    await fs.rename(tmp, absolutePath);
  } catch (err) {
    await fs.unlink(tmp).catch(() => undefined); // best-effort cleanup on failed rename
    throw err;
  }
}
