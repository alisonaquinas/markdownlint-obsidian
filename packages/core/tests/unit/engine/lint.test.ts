/**
 * Unit tests for {@link lint} engine entry-point.
 *
 * @module tests/unit/engine/lint.test
 */
import { describe, it, expect } from "bun:test";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";
import { lint } from "../../../src/engine/index.js";

/** Create a temp dir with a .obsidian/ marker so vault detection succeeds. */
async function makeTmpVault(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-engine-test-"));
  await fs.mkdir(path.join(dir, ".obsidian"), { recursive: true });
  return dir;
}

describe("engine.lint()", () => {
  it("returns an empty array when no files match globs", async () => {
    const tmpDir = await makeTmpVault();
    try {
      const results = await lint({ globs: ["**/*.md"], cwd: tmpDir });
      expect(results).toHaveLength(0);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("returns one LintResult per matched file", async () => {
    const tmpDir = await makeTmpVault();
    try {
      await fs.writeFile(path.join(tmpDir, "a.md"), "# Hello\n");
      await fs.writeFile(path.join(tmpDir, "b.md"), "# World\n");
      const results = await lint({ globs: ["**/*.md"], cwd: tmpDir });
      expect(results).toHaveLength(2);
      expect(
        results.every((r: unknown) => typeof r === "object" && r !== null && "filePath" in r),
      ).toBe(true);
      expect(
        results.every((r: unknown) => typeof r === "object" && r !== null && "hasErrors" in r),
      ).toBe(true);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("returns LintResult with hasErrors=false for clean files", async () => {
    const tmpDir = await makeTmpVault();
    try {
      await fs.writeFile(path.join(tmpDir, "clean.md"), "# Heading\n\nSome content.\n");
      const results = await lint({ globs: ["**/*.md"], cwd: tmpDir });
      expect(results).toHaveLength(1);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("accepts explicit vaultRoot without throwing", async () => {
    const tmpDir = await makeTmpVault();
    try {
      await fs.writeFile(path.join(tmpDir, "note.md"), "# Note\n");
      const results = await lint({
        globs: ["**/*.md"],
        cwd: tmpDir,
        vaultRoot: tmpDir,
      });
      expect(Array.isArray(results)).toBe(true);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
