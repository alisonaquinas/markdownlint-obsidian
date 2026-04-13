import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { readMarkdownFile } from "../../../src/infrastructure/io/FileReader.js";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

let tmpDir: string;
beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-reader-"));
});
afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("FileReader", () => {
  it("reads UTF-8 files and strips BOM", async () => {
    const file = path.join(tmpDir, "a.md");
    await fs.writeFile(file, "\uFEFF# Hi");
    expect(await readMarkdownFile(file)).toBe("# Hi");
  });

  it("normalizes CRLF to LF", async () => {
    const file = path.join(tmpDir, "a.md");
    await fs.writeFile(file, "a\r\nb\r\n");
    expect(await readMarkdownFile(file)).toBe("a\nb\n");
  });
});
