import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { runLint } from "../../../src/application/LintUseCase.js";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";
import { makeRuleRegistry } from "../../../src/domain/linting/RuleRegistry.js";
import { registerBuiltinRules } from "../../../src/infrastructure/rules/ofm/registerBuiltin.js";
import { makeMarkdownItParser } from "../../../src/infrastructure/parser/MarkdownItParser.js";
import { readMarkdownFile } from "../../../src/infrastructure/io/FileReader.js";
import type { FileExistenceChecker } from "../../../src/domain/fs/FileExistenceChecker.js";

const stubFsCheck: FileExistenceChecker = { exists: async () => false };

let tmpDir: string;
beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-lintuc-"));
});
afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("LintUseCase (parser-wired)", () => {
  it("returns clean result for valid file", async () => {
    const file = path.join(tmpDir, "a.md");
    await fs.writeFile(file, "# Clean\n");

    const parser = makeMarkdownItParser();
    const registry = makeRuleRegistry();
    registerBuiltinRules(registry);

    const results = await runLint([file], DEFAULT_CONFIG, registry, {
      parser,
      readFile: readMarkdownFile,
      fsCheck: stubFsCheck,
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.hasErrors).toBe(false);
  });

  it("emits OFM902 on broken frontmatter", async () => {
    const file = path.join(tmpDir, "b.md");
    await fs.writeFile(file, "---\n : invalid :\n---\nbody\n");

    const parser = makeMarkdownItParser();
    const registry = makeRuleRegistry();
    registerBuiltinRules(registry);

    const results = await runLint([file], DEFAULT_CONFIG, registry, {
      parser,
      readFile: readMarkdownFile,
      fsCheck: stubFsCheck,
    });
    expect(results[0]?.errors[0]?.ruleCode).toBe("OFM902");
    expect(results[0]?.hasErrors).toBe(true);
  });
});
