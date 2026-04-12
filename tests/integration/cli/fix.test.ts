import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { spawnCli } from "../helpers/spawnCli.js";

// Increase timeout for integration tests that spawn real processes
describe("--fix and --fix-check round-trip", { timeout: 30000 }, () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-fix-test-"));
    // Mark temp dir as vault root so vault detection succeeds
    await fs.mkdir(path.join(tmp, ".obsidian"), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it("--fix rewrites a trailing-slash tag in-place and exits 0", async () => {
    const filePath = path.join(tmp, "test.md");
    await fs.writeFile(filePath, "# Test\n\n#project/\n");

    const result = await spawnCli(["--fix", "**/*.md"], tmp);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Fixed 1 file(s)");
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toBe("# Test\n\n#project\n");
  });

  it("--fix-check reports what would be fixed without touching disk, exits 1", async () => {
    const filePath = path.join(tmp, "test.md");
    const original = "# Test\n\n#project/\n";
    await fs.writeFile(filePath, original);

    const result = await spawnCli(["--fix-check", "**/*.md"], tmp);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Fixed 1 file(s)");
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toBe(original); // file must be unchanged on disk
  });
});
