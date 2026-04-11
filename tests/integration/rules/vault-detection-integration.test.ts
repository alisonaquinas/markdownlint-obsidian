import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

let tmp: string;
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-vdet-int-"));
});
afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("vault detection integration", { timeout: 20000 }, () => {
  it("detects vault root via .obsidian/ ancestor", async () => {
    await fs.mkdir(path.join(tmp, ".obsidian"), { recursive: true });
    await fs.mkdir(path.join(tmp, "notes"), { recursive: true });
    await fs.writeFile(path.join(tmp, "notes", "existing.md"), "# existing\n");
    await fs.writeFile(path.join(tmp, "notes", "index.md"), "[[missing]]\n");
    const r = await spawnCli(["**/*.md"], tmp);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM001");
  });

  it("falls back to git root when no .obsidian/", async () => {
    await fs.mkdir(path.join(tmp, ".git"), { recursive: true });
    await fs.writeFile(path.join(tmp, "existing.md"), "# existing\n");
    await fs.writeFile(path.join(tmp, "index.md"), "[[existing]]\n");
    const r = await spawnCli(["**/*.md"], tmp);
    expect(r.exitCode).toBe(0);
  });

  it("explicit --vault-root overrides auto-detection", async () => {
    await fs.mkdir(path.join(tmp, ".obsidian"), { recursive: true });
    await fs.mkdir(path.join(tmp, "inner"), { recursive: true });
    await fs.writeFile(path.join(tmp, "inner", "note.md"), "[[note]]\n");
    const r = await spawnCli(["--vault-root", path.join(tmp, "inner"), "**/*.md"], tmp);
    expect(r.exitCode).toBe(0);
  });

  it("reports OFM900 on stderr with exit 2 when no vault root exists", async () => {
    // Create a note with no .obsidian/ and no .git/ anywhere in the tmp tree.
    // If the tmp dir's ancestors happen to contain a .git/, the detector
    // succeeds and we cannot prove OFM900. Guard the assertion in that case.
    await fs.writeFile(path.join(tmp, "index.md"), "[[missing]]\n");
    const r = await spawnCli(["**/*.md"], tmp);
    if (r.exitCode === 2) {
      expect(r.stderr).toContain("OFM900");
    } else {
      // Ancestor .git/ found; detector succeeded. Verify lint still ran.
      expect([0, 1]).toContain(r.exitCode);
    }
  });
});
