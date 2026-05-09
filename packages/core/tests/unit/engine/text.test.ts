/**
 * Unit tests for in-memory engine entry points.
 *
 * @module tests/unit/engine/text.test
 */
import { describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { fixText, lintText } from "../../../src/engine/index.js";

async function makeTmpVault(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-engine-text-test-"));
  await fs.mkdir(path.join(dir, ".obsidian"), { recursive: true });
  return dir;
}

describe("engine text APIs", () => {
  it("lints unsaved in-memory document text", async () => {
    const tmpDir = await makeTmpVault();
    try {
      const filePath = path.join(tmpDir, "note.md");
      const result = await lintText({
        cwd: tmpDir,
        vaultRoot: tmpDir,
        filePath,
        text: "# Bad tag\n\n#topic/\n",
      });

      expect(result.filePath).toBe(filePath);
      expect(result.errors.some((error) => error.ruleCode === "OFM063")).toBe(true);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("fixes in-memory document text without writing a file", async () => {
    const tmpDir = await makeTmpVault();
    try {
      const filePath = path.join(tmpDir, "note.md");
      const outcome = await fixText({
        cwd: tmpDir,
        vaultRoot: tmpDir,
        filePath,
        text: "# Bad tag\n\n#topic/\n",
      });

      expect(outcome.text).toContain("#topic\n");
      await expect(fs.stat(filePath)).rejects.toThrow();
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
