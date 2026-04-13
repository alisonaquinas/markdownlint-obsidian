import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

let vault: string;
beforeEach(async () => {
  vault = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-brefs-int-"));
  await fs.mkdir(path.join(vault, ".obsidian"), { recursive: true });
  await fs.mkdir(path.join(vault, "notes"), { recursive: true });
});
afterEach(async () => {
  await fs.rm(vault, { recursive: true, force: true });
});

// Cold-start CLI + temp vault → keep the timeout generous for the slower
// Windows CI lanes.
describe("block-reference rules integration", () => {
  it("valid [[a#^one]] exits 0", async () => {
    await fs.writeFile(path.join(vault, "notes", "a.md"), "# A\n\nParagraph ^one\n");
    await fs.writeFile(path.join(vault, "notes", "b.md"), "See [[a#^one]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(0);
  });

  it("missing block id reports OFM102", async () => {
    await fs.writeFile(path.join(vault, "notes", "a.md"), "# A\n\nParagraph ^one\n");
    await fs.writeFile(path.join(vault, "notes", "b.md"), "See [[a#^missing]]\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM102");
  });

  it("duplicate block id reports OFM101", async () => {
    await fs.writeFile(path.join(vault, "notes", "dup.md"), "first ^same\n\nsecond ^same\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM101");
  });
});
