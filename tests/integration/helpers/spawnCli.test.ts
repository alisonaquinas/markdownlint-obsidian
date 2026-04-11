import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawnCli } from "./spawnCli.js";

let tmp: string;
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-spawn-"));
  await fs.mkdir(path.join(tmp, ".obsidian"), { recursive: true });
});
afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("spawnCli", () => {
  it("returns exit 0 for a clean vault", async () => {
    await fs.writeFile(path.join(tmp, "ok.md"), "# ok\n");
    const r = await spawnCli(["**/*.md"], tmp);
    expect(r.exitCode).toBe(0);
  });

  it("captures stdout and exit 1 for a vault with violations", async () => {
    await fs.writeFile(path.join(tmp, "bad.md"), "# bad\n\nBody #a//b text.\n");
    const r = await spawnCli(["**/*.md"], tmp);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("OFM060");
  });
});
