import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { buildFileIndex } from "../../../../src/infrastructure/vault/FileIndexBuilder.js";

let tmp: string;
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-idx-"));
  await fs.mkdir(path.join(tmp, "a"), { recursive: true });
  await fs.writeFile(path.join(tmp, "a", "one.md"), "# one\n");
  await fs.writeFile(path.join(tmp, "a", "two.md"), "# two\n");
  await fs.writeFile(path.join(tmp, "skip.txt"), "not md\n");
});
afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("buildFileIndex", () => {
  it("indexes every .md file under the vault root", async () => {
    const idx = await buildFileIndex(tmp, { caseSensitive: false });
    expect(
      idx
        .all()
        .map((p) => p.relative)
        .sort(),
    ).toEqual(["a/one.md", "a/two.md"]);
  });

  it("root is the resolved absolute path", async () => {
    const idx = await buildFileIndex(tmp, { caseSensitive: false });
    expect(idx.root).toBe(path.resolve(tmp));
  });

  it("has() answers by relative path", async () => {
    const idx = await buildFileIndex(tmp, { caseSensitive: false });
    expect(idx.has("a/one.md")).toBe(true);
    expect(idx.has("a/missing.md")).toBe(false);
  });

  it("resolves by relative path", async () => {
    const idx = await buildFileIndex(tmp, { caseSensitive: false });
    expect(idx.resolve({ target: "a/one" }).kind).toBe("resolved");
  });

  it("resolves by basename", async () => {
    const idx = await buildFileIndex(tmp, { caseSensitive: false });
    expect(idx.resolve({ target: "two" }).kind).toBe("resolved");
  });

  it("reports not-found for unknown targets", async () => {
    const idx = await buildFileIndex(tmp, { caseSensitive: false });
    expect(idx.resolve({ target: "missing" }).kind).toBe("not-found");
  });

  it("skips .obsidian/ contents", async () => {
    await fs.mkdir(path.join(tmp, ".obsidian"), { recursive: true });
    await fs.writeFile(path.join(tmp, ".obsidian", "workspace.md"), "# hidden\n");
    const idx = await buildFileIndex(tmp, { caseSensitive: false });
    expect(idx.all().map((p) => p.relative)).not.toContain(".obsidian/workspace.md");
  });
});
