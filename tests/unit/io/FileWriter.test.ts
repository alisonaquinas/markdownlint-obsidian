import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeMarkdownFile } from "../../../src/infrastructure/io/FileWriter.js";
import { readMarkdownFile } from "../../../src/infrastructure/io/FileReader.js";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

let tmpDir: string;
beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-writer-"));
});
afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("FileWriter", () => {
  it("round-trip: write content and read it back", async () => {
    const file = path.join(tmpDir, "test.md");
    const content = "hello\nworld";
    await writeMarkdownFile(file, content);
    const read = await readMarkdownFile(file);
    expect(read).toBe(content);
  });

  it("temp file is cleaned up after successful write", async () => {
    const file = path.join(tmpDir, "test.md");
    const content = "test content";
    await writeMarkdownFile(file, content);

    // List all files in tmpDir
    const files = await fs.readdir(tmpDir);
    // Only the target file should exist, no .tmp-* files
    expect(files).toEqual(["test.md"]);
  });

  it("overwrites existing file with new content", async () => {
    const file = path.join(tmpDir, "test.md");
    const oldContent = "old content";
    const newContent = "new content";

    // Write initial content
    await writeMarkdownFile(file, oldContent);
    expect(await readMarkdownFile(file)).toBe(oldContent);

    // Overwrite with new content
    await writeMarkdownFile(file, newContent);
    expect(await readMarkdownFile(file)).toBe(newContent);
  });
});
