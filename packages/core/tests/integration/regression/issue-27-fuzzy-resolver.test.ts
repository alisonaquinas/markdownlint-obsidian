/**
 * Integration test for GitHub issue #27.
 *
 * Verifies the new `wikilinks.resolveMode: "obsidian-fuzzy"` config option
 * end-to-end through the lint engine: a folder-implicit wikilink
 * (`[[sources/foo]]`) inside a vault that mixes vault-absolute and
 * folder-implicit link styles should resolve by default under fuzzy mode and
 * break (OFM001 broken-wikilink) only when explicitly forced to legacy
 * path-relative mode.
 *
 * Issue URL: https://github.com/alisonaquinas/markdownlint-obsidian/issues/27
 *
 * @module tests/integration/regression/issue-27-fuzzy-resolver.test
 */
import { describe, it, expect } from "bun:test";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";
import { lint } from "../../../src/engine/index.js";

/**
 * Build a temp vault that mimics the Karpathy-style layout from issue #27:
 * a `wiki/` folder of synthesis pages plus a `raw/` folder, with one note
 * that uses both vault-absolute (`[[raw/upnote/Some Note]]`) and
 * folder-implicit (`[[sources/foo]]`) wikilink styles.
 */
async function makeMixedVault(configBody: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-issue27-"));
  await fs.mkdir(path.join(dir, ".obsidian"), { recursive: true });
  await fs.mkdir(path.join(dir, "wiki", "sources"), { recursive: true });
  await fs.mkdir(path.join(dir, "raw", "upnote"), { recursive: true });
  await fs.writeFile(path.join(dir, "wiki", "sources", "foo.md"), "# foo\n");
  await fs.writeFile(path.join(dir, "raw", "upnote", "Some Note.md"), "# some note\n");
  await fs.writeFile(
    path.join(dir, "wiki", "index.md"),
    "# index\n\nSee [[raw/upnote/Some Note]] and [[sources/foo]].\n",
  );
  await fs.writeFile(path.join(dir, ".obsidian-linter.jsonc"), configBody);
  return dir;
}

describe("regression: issue #27 — obsidian-fuzzy wikilink resolution", () => {
  it("path-relative mode breaks the folder-implicit link", async () => {
    const cfg = JSON.stringify({
      wikilinks: { caseSensitive: false, allowAlias: true, resolveMode: "path-relative" },
    });
    const tmpDir = await makeMixedVault(cfg);
    try {
      const results = await lint({ globs: ["wiki/**/*.md"], cwd: tmpDir });
      const all = results.flatMap((r) => r.errors);
      const ofm001 = all.filter((e) => e.ruleCode === "OFM001");
      expect(ofm001.some((e) => e.message.includes("sources/foo"))).toBe(true);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("default obsidian-fuzzy mode resolves both link styles", async () => {
    const cfg = "{}";
    const tmpDir = await makeMixedVault(cfg);
    try {
      const results = await lint({ globs: ["wiki/**/*.md"], cwd: tmpDir });
      const all = results.flatMap((r) => r.errors);
      const ofm001 = all.filter((e) => e.ruleCode === "OFM001");
      expect(ofm001).toEqual([]);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
