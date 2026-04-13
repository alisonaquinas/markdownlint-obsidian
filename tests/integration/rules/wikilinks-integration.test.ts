import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

let vault: string;
beforeEach(async () => {
  vault = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-wl-int-"));
  await fs.mkdir(path.join(vault, ".obsidian"), { recursive: true });
  await fs.mkdir(path.join(vault, "notes"), { recursive: true });
  await fs.writeFile(path.join(vault, "notes", "existing.md"), "# existing\n");
});
afterEach(async () => {
  await fs.rm(vault, { recursive: true, force: true });
});

// CLI spawns are slow on Windows under parallel execution; 15s gives the
// runner enough headroom for the slowest cold-start case.
describe("wikilink rules integration", () => {
  it("broken link exits 1 with OFM001", async () => {
    await fs.writeFile(path.join(vault, "notes", "index.md"), "[[missing]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM001");
  });

  it("valid link exits 0", async () => {
    await fs.writeFile(path.join(vault, "notes", "index.md"), "[[existing]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(0);
  });

  it("--no-resolve suppresses OFM001", async () => {
    await fs.writeFile(path.join(vault, "notes", "index.md"), "[[missing]]\n");
    const r = await spawnCli(["--no-resolve", "**/*.md"], vault);
    expect(r.exitCode).toBe(0);
  });

  it("empty wikilink fires OFM002", async () => {
    await fs.writeFile(path.join(vault, "notes", "index.md"), "[[]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM002");
  });

  it("alias wikilink with valid target exits 0", async () => {
    await fs.writeFile(path.join(vault, "notes", "index.md"), "[[existing|display]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(0);
  });
});
