/**
 * Regression test for GitHub issue #28.
 *
 * Markdownlint upstream rules (MD012, MD053) emit `fixInfo.deleteCount = -1`
 * as a sentinel for "delete the entire line". Before this fix our adapter
 * passed the value verbatim to {@link makeFix}, which threw
 * `Fix.deleteCount must be >= 0`. The exception escaped the rule and was
 * caught by {@link LintUseCase}, surfacing as an `OFM901` parser error
 * pinned to line 1 column 1 — exactly what the issue reports.
 *
 * This test exercises the full lint pipeline against a file that triggers
 * MD012 (multiple consecutive blank lines) and pins the expected
 * behaviour: the MD012 violation surfaces, no OFM901 is emitted, and the
 * lint run completes without throwing.
 *
 * Issue URL: https://github.com/alisonaquinas/markdownlint-obsidian/issues/28
 *
 * @module tests/integration/regression/issue-28-delete-count-sentinel.test
 */
import { describe, it, expect } from "bun:test";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";
import { lint } from "../../../src/engine/index.js";

// Two pairs of consecutive blank lines — MD012 fires on the second blank
// of each pair with `fixInfo.deleteCount = -1`.
const MULTI_BLANK = `# Test


paragraph.



another paragraph.
`;

async function makeTmpVaultWith(content: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-issue28-"));
  await fs.mkdir(path.join(dir, ".obsidian"), { recursive: true });
  await fs.writeFile(path.join(dir, "note.md"), content);
  return dir;
}

describe("regression: issue #28 — OFM901 'Fix.deleteCount must be >= 0'", () => {
  it("does not surface OFM901 on a file that triggers MD012", async () => {
    const tmpDir = await makeTmpVaultWith(MULTI_BLANK);
    try {
      const results = await lint({ globs: ["**/*.md"], cwd: tmpDir });
      expect(results).toHaveLength(1);
      const ofm901 = results[0]!.errors.filter((e) => e.ruleCode === "OFM901");
      expect(ofm901).toEqual([]);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("attaches whole-line deletion fixes to the MD012 violations", async () => {
    const tmpDir = await makeTmpVaultWith(MULTI_BLANK);
    try {
      const results = await lint({ globs: ["**/*.md"], cwd: tmpDir });
      const md012 = results[0]!.errors.filter((e) => e.ruleCode === "MD012");
      expect(md012.length).toBeGreaterThan(0);
      // The deleteCount=-1 sentinel maps to the deleteLine fix contract;
      // applyFixes refuses any such fix aimed at a non-blank line.
      expect(md012.every((e) => e.fix?.deleteLine === true)).toBe(true);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
