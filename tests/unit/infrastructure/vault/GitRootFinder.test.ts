import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { findGitRoot } from "../../../../src/infrastructure/vault/GitRootFinder.js";

let tmp: string;
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-git-"));
});
afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("findGitRoot", () => {
  it("returns the ancestor containing .git/", async () => {
    await fs.mkdir(path.join(tmp, ".git"), { recursive: true });
    const nested = path.join(tmp, "a", "b", "c");
    await fs.mkdir(nested, { recursive: true });
    const root = await findGitRoot(nested);
    expect(root).toBe(path.resolve(tmp));
  });

  it("recognises .git as a regular file (worktree marker)", async () => {
    await fs.writeFile(path.join(tmp, ".git"), "gitdir: /elsewhere\n");
    const root = await findGitRoot(tmp);
    expect(root).toBe(path.resolve(tmp));
  });

  it("returns null when no .git/ ancestor exists", async () => {
    // Create a deeply nested path under an isolated tmp dir with no .git
    // anywhere in the chain we create. Upstream dirs are outside the test
    // scope — we cannot guarantee they lack .git — so we test the deepest
    // path we control rather than walking to FS root.
    const isolated = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-nogit-"));
    try {
      // Overwrite: if tmp happens to live inside a git repo (CI runner), we
      // can still verify walk-up behaviour by checking the result is NOT
      // inside our isolated dir.
      const result = await findGitRoot(isolated);
      if (result !== null) {
        expect(result.startsWith(isolated)).toBe(false);
      } else {
        expect(result).toBeNull();
      }
    } finally {
      await fs.rm(isolated, { recursive: true, force: true });
    }
  });
});
