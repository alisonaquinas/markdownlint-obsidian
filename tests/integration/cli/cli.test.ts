import { describe, it, expect } from "bun:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import { spawnCli } from "../helpers/spawnCli.js";

const execAsync = promisify(execFile);
const BIN = path.resolve("bin/markdownlint-obsidian.js");

// Under Bun, process.execPath is the Bun binary which executes the TypeScript
// dev entry natively — no --import loader flag needed.
const BUN = process.execPath;

// CLI spawns share the same runner parallelism budget as the wikilink and
// embed integration tests. On Windows the cold-start can blow past the default
// 5s timeout under load, so we give every case the same generous window we use
// for the other integration suites.
describe("CLI", () => {
  it("--help exits 0 and prints usage", async () => {
    const { stdout } = await execAsync(BUN, [BIN, "--help"]);
    expect(stdout).toContain("markdownlint-obsidian");
    expect(stdout).toContain("--fix");
  });

  it("--version exits 0 and prints semver", async () => {
    const { stdout } = await execAsync(BUN, [BIN, "--version"]);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("--output-formatter with unknown value exits 2 and writes OFM901 to stderr", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-cli-test-"));
    await fs.mkdir(path.join(tmp, ".obsidian"), { recursive: true });
    await fs.writeFile(path.join(tmp, "clean.md"), "# Clean\n");
    try {
      await execAsync(BUN, [BIN, "--output-formatter", "bogus", "**/*.md"], {
        cwd: tmp,
      });
      throw new Error("Expected exit code 2 but process succeeded");
    } catch (err: unknown) {
      const e = err as { code?: number; stderr?: string };
      expect(e.code).toBe(2);
      expect(e.stderr).toContain("OFM901");
      expect(e.stderr).toContain("bogus");
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });

  it("OFM905 is written to stderr when a custom rule module cannot be loaded", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-cli-test-"));
    await fs.mkdir(path.join(tmp, ".obsidian"), { recursive: true });
    await fs.writeFile(path.join(tmp, "clean.md"), "# Clean\n");
    await fs.writeFile(
      path.join(tmp, ".obsidian-linter.jsonc"),
      JSON.stringify({ customRules: ["./does-not-exist.mjs"] }),
      "utf8",
    );
    try {
      const result = await spawnCli(["**/*.md"], tmp);
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain("OFM905");
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });

  it("clean directory exits 0 with no output", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-cli-test-"));
    // Phase 4 requires a vault root; mark the temp dir as one so the
    // detector succeeds without escaping the temp tree.
    await fs.mkdir(path.join(tmp, ".obsidian"), { recursive: true });
    await fs.writeFile(path.join(tmp, "clean.md"), "# Clean\n");
    try {
      const { stdout } = await execAsync(BUN, [BIN, "**/*.md"], { cwd: tmp });
      expect(stdout.trim()).toBe("");
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
});
