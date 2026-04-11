import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { discoverFiles } from "../../../src/infrastructure/discovery/FileDiscovery.js";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-disc-test-"));
  await fs.writeFile(path.join(tmpDir, "a.md"), "# A");
  await fs.writeFile(path.join(tmpDir, "b.txt"), "text");
  await fs.mkdir(path.join(tmpDir, "sub"));
  await fs.writeFile(path.join(tmpDir, "sub", "c.md"), "# C");
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("discoverFiles", () => {
  it("finds all .md files matching glob", async () => {
    const files = await discoverFiles(["**/*.md"], [], tmpDir);
    expect(files).toHaveLength(2);
    expect(files.every((f) => f.endsWith(".md"))).toBe(true);
  });

  it("respects ignore patterns", async () => {
    const files = await discoverFiles(["**/*.md"], ["sub/**"], tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain("a.md");
  });
});
