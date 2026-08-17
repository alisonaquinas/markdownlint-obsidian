/**
 * Regression test for the frontmatter coordinate offset bug (Bug A).
 *
 * Rules operate on `parsed.lines`/`parsed.raw`, which EXCLUDE frontmatter —
 * so every body-relative rule (tags, wikilinks, block refs, highlights,
 * embeds, callouts, standard MD rules) emits `line`/`fix.lineNumber` values
 * relative to the body start. But two consumers assume ABSOLUTE file
 * coordinates:
 *
 *  1. The CLI formatters display `LintError.line` to users, who count lines
 *     from the top of the file.
 *  2. {@link applyFixes} splices `fix.lineNumber` against the FULL raw file
 *     (including frontmatter) re-read by {@link runFix}.
 *
 * Before this fix a violation at absolute line 9 in a file with 8
 * frontmatter lines was reported AND patched at line 1 — the fix landed
 * frontmatter-length lines too early, silently no-opping (when the splice
 * produced identical content) or corrupting nearby lines.
 *
 * @module tests/integration/regression/frontmatter-coordinate-offset.test
 */
import { describe, it, expect } from "bun:test";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";
import { lint } from "../../../src/engine/index.js";
import { runLint } from "../../../src/application/LintUseCase.js";
import { runFix } from "../../../src/application/FixUseCase.js";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";
import { makeRuleRegistry } from "../../../src/domain/linting/RuleRegistry.js";
import { registerBuiltinRules } from "../../../src/infrastructure/rules/ofm/registerBuiltin.js";
import { makeMarkdownItParser } from "../../../src/infrastructure/parser/MarkdownItParser.js";
import { readMarkdownFile } from "../../../src/infrastructure/io/FileReader.js";
import { writeMarkdownFile } from "../../../src/infrastructure/io/FileWriter.js";
import type { FileExistenceChecker } from "../../../src/domain/fs/FileExistenceChecker.js";

const stubFsCheck: FileExistenceChecker = { exists: async () => false };

const SIX_LINE_FRONTMATTER = `---
title: Demo
aliases:
  - demo
area: test
tags:
  - fm
---
Body #area/ here.
`;

async function makeTmpFile(content: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-coord-"));
  const file = path.join(dir, "note.md");
  await fs.writeFile(file, content);
  return file;
}

describe("regression: frontmatter coordinate offset (Bug A)", () => {
  it("reports body-rule violations at ABSOLUTE line numbers", async () => {
    const file = await makeTmpFile(SIX_LINE_FRONTMATTER);
    try {
      const parser = makeMarkdownItParser();
      const registry = makeRuleRegistry();
      registerBuiltinRules(registry);
      const results = await runLint([file], DEFAULT_CONFIG, registry, {
        parser,
        readFile: readMarkdownFile,
        fsCheck: stubFsCheck,
      });
      const ofm063 = results[0]?.errors.filter((e) => e.ruleCode === "OFM063");
      expect(ofm063).toHaveLength(1);
      expect(ofm063![0]?.line).toBe(9);
      expect(ofm063![0]?.fix?.lineNumber).toBe(9);
      expect(ofm063![0]?.fix?.editColumn).toBe(11);
    } finally {
      await fs.rm(path.dirname(file), { recursive: true, force: true });
    }
  });

  it("applies the fix at the correct absolute line via runFix", async () => {
    const file = await makeTmpFile(SIX_LINE_FRONTMATTER);
    try {
      const parser = makeMarkdownItParser();
      const registry = makeRuleRegistry();
      registerBuiltinRules(registry);
      const outcome = await runFix([file], DEFAULT_CONFIG, registry, {
        parser,
        readFile: readMarkdownFile,
        writeFile: writeMarkdownFile,
        fsCheck: stubFsCheck,
      });
      expect(outcome.filesFixed).toEqual([file]);
      const patched = await readMarkdownFile(file);
      expect(patched).toContain("Body #area here.");
      expect(patched).toContain("title: Demo");
      expect(patched.split("\n").length).toBe(10);
    } finally {
      await fs.rm(path.dirname(file), { recursive: true, force: true });
    }
  });

  it("does not double-offset frontmatter rules (OFM086 emits absolute)", async () => {
    const file = await makeTmpFile(`---
title: "pad  "
area: x
---
body
`);
    try {
      const parser = makeMarkdownItParser();
      const registry = makeRuleRegistry();
      registerBuiltinRules(registry);
      const results = await runLint([file], DEFAULT_CONFIG, registry, {
        parser,
        readFile: readMarkdownFile,
        fsCheck: stubFsCheck,
      });
      const ofm086 = (results[0]?.errors ?? []).filter((e) => e.ruleCode === "OFM086");
      expect(ofm086.length).toBeGreaterThan(0);
      expect(ofm086.every((e) => e.line === 2)).toBe(true);
    } finally {
      await fs.rm(path.dirname(file), { recursive: true, force: true });
    }
  });

  it("leaves no-frontmatter files unchanged (offset zero)", async () => {
    const file = await makeTmpFile("Body #area/ here.\n");
    try {
      const parser = makeMarkdownItParser();
      const registry = makeRuleRegistry();
      registerBuiltinRules(registry);
      const results = await runLint([file], DEFAULT_CONFIG, registry, {
        parser,
        readFile: readMarkdownFile,
        fsCheck: stubFsCheck,
      });
      const ofm063 = results[0]?.errors.filter((e) => e.ruleCode === "OFM063");
      expect(ofm063).toHaveLength(1);
      expect(ofm063![0]?.line).toBe(1);
      expect(ofm063![0]?.fix?.lineNumber).toBe(1);
    } finally {
      await fs.rm(path.dirname(file), { recursive: true, force: true });
    }
  });

  it("offsets standard markdownlint rules (MD009) the same way", async () => {
    const file = await makeTmpFile(`---
title: Demo
---
Body with trailing spaces.   
`);
    try {
      const parser = makeMarkdownItParser();
      const registry = makeRuleRegistry();
      registerBuiltinRules(registry);
      const results = await runLint([file], DEFAULT_CONFIG, registry, {
        parser,
        readFile: readMarkdownFile,
        fsCheck: stubFsCheck,
      });
      const md009 = (results[0]?.errors ?? []).filter((e) => e.ruleCode === "MD009");
      expect(md009.length).toBeGreaterThan(0);
      expect(md009.every((e) => e.line === 4)).toBe(true);
    } finally {
      await fs.rm(path.dirname(file), { recursive: true, force: true });
    }
  });

  it("reports absolute lines through the engine lint entry point", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-coord-engine-"));
    try {
      await fs.mkdir(path.join(dir, ".obsidian"), { recursive: true });
      const file = path.join(dir, "note.md");
      await fs.writeFile(file, SIX_LINE_FRONTMATTER);
      const results = await lint({ globs: ["**/*.md"], cwd: dir });
      expect(results).toHaveLength(1);
      const ofm063 = results[0]!.errors.filter((e) => e.ruleCode === "OFM063");
      expect(ofm063).toHaveLength(1);
      expect(ofm063[0]!.line).toBe(9);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
