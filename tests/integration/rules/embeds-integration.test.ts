import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

let vault: string;
beforeEach(async () => {
  vault = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-em-int-"));
  await fs.mkdir(path.join(vault, ".obsidian"), { recursive: true });
  await fs.writeFile(path.join(vault, "image.png"), "fake");
});
afterEach(async () => {
  await fs.rm(vault, { recursive: true, force: true });
});

describe("embed rules integration", { timeout: 20000 }, () => {
  it("valid image embed passes", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "![[image.png]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(0);
  });

  it("missing asset reports OFM022", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "![[missing.png]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM022");
  });

  it("disallowed extension reports OFM024", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "![[script.exe]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM024");
  });

  it("broken markdown embed reports OFM020", async () => {
    await fs.writeFile(path.join(vault, "note.md"), "![[missing-note]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM020");
  });

  it("valid markdown embed passes", async () => {
    await fs.writeFile(path.join(vault, "target.md"), "# target\n");
    await fs.writeFile(path.join(vault, "note.md"), "![[target]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(0);
  });
});
