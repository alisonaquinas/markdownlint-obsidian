import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { makeNodeFsExistenceChecker } from "../../../../src/infrastructure/fs/NodeFsExistenceChecker.js";

describe("NodeFsExistenceChecker", () => {
  const checker = makeNodeFsExistenceChecker();
  let tmp: string;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-fsc-"));
    await fs.writeFile(path.join(tmp, "image.png"), "fake");
    await fs.mkdir(path.join(tmp, "assets"), { recursive: true });
    await fs.writeFile(path.join(tmp, "assets", "doc.pdf"), "fake");
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it("returns true for an existing file at the vault root", async () => {
    expect(await checker.exists(tmp, "image.png")).toBe(true);
  });

  it("returns true for a nested file under a subdirectory", async () => {
    expect(await checker.exists(tmp, "assets/doc.pdf")).toBe(true);
  });

  it("returns false for a file that does not exist", async () => {
    expect(await checker.exists(tmp, "missing.png")).toBe(false);
  });

  it("returns false for paths that escape the vault root", async () => {
    expect(await checker.exists(tmp, "../secrets")).toBe(false);
    expect(await checker.exists(tmp, "../../etc/passwd")).toBe(false);
  });

  it("returns false for an empty relative path", async () => {
    expect(await checker.exists(tmp, "")).toBe(false);
  });

  it("returns false for an empty vault root", async () => {
    expect(await checker.exists("", "image.png")).toBe(false);
  });

  it("normalises backslashes on Windows-style inputs", async () => {
    expect(await checker.exists(tmp, "assets\\doc.pdf")).toBe(true);
  });
});
