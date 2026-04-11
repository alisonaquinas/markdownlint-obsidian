import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

let tmp: string;
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-tag-int-"));
  await fs.mkdir(path.join(tmp, ".obsidian"), { recursive: true });
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

// CLI spawns are slow on Windows under parallel execution; 15s gives the
// runner enough headroom for the slowest cold-start case.
describe("tag rules integration", { timeout: 15000 }, () => {
  it("fails with OFM060 on a malformed tag", async () => {
    await fs.copyFile(
      path.resolve("tests/fixtures/rules/tags/bad-format.md"),
      path.join(tmp, "note.md"),
    );
    const r = await spawnCli(["**/*.md"], tmp);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM060");
  });

  it("passes for clean tags (warnings do not change exit code)", async () => {
    await fs.copyFile(
      path.resolve("tests/fixtures/rules/tags/valid.md"),
      path.join(tmp, "note.md"),
    );
    const r = await spawnCli(["**/*.md"], tmp);
    expect(r.exitCode).toBe(0);
  });

  it("reports OFM064 (warning) but exits 0 for case-insensitive duplicates", async () => {
    await fs.copyFile(
      path.resolve("tests/fixtures/rules/tags/duplicate.md"),
      path.join(tmp, "note.md"),
    );
    const r = await spawnCli(["**/*.md"], tmp);
    // OFM064 is a warning -> exitCode logic counts errors only, so warnings
    // should not bump exit to 1.
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("OFM064");
  });
});
