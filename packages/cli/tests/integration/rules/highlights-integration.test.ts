import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "../helpers/spawnCli.js";

let vault: string;
beforeEach(async () => {
  vault = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-hl-int-"));
  await fs.mkdir(path.join(vault, ".obsidian"), { recursive: true });
  await fs.mkdir(path.join(vault, "notes"), { recursive: true });
});
afterEach(async () => {
  await fs.rm(vault, { recursive: true, force: true });
});

describe("highlight rules integration", () => {
  it("default config allows highlights", async () => {
    await fs.writeFile(path.join(vault, "notes", "x.md"), "value ==one==\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(0);
  });

  it("`highlights.allow=false` reports OFM120", async () => {
    await fs.writeFile(
      path.join(vault, ".obsidian-linter.jsonc"),
      JSON.stringify({
        highlights: { allow: false, allowedGlobs: [] },
        rules: { OFM120: { enabled: true } },
      }),
    );
    await fs.writeFile(path.join(vault, "notes", "x.md"), "value ==one==\n");
    const r = await spawnCli(["**/*.md"], vault);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM120");
  });
});
