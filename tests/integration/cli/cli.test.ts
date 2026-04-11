import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";

const execAsync = promisify(execFile);
const BIN = path.resolve("bin/markdownlint-obsidian.js");
const TSX_URL = pathToFileURL(path.resolve("node_modules/tsx/dist/loader.mjs")).href;
const NODE_ARGS = ["--import", TSX_URL, BIN];

describe("CLI", () => {
  it("--help exits 0 and prints usage", async () => {
    const { stdout } = await execAsync("node", [...NODE_ARGS, "--help"]);
    expect(stdout).toContain("markdownlint-obsidian");
    expect(stdout).toContain("--fix");
  });

  it("--version exits 0 and prints semver", async () => {
    const { stdout } = await execAsync("node", [...NODE_ARGS, "--version"]);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("clean directory exits 0 with no output", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-cli-test-"));
    await fs.writeFile(path.join(tmp, "clean.md"), "# Clean\n");
    try {
      const { stdout } = await execAsync("node", [...NODE_ARGS, "**/*.md"], { cwd: tmp });
      expect(stdout.trim()).toBe("");
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
});
