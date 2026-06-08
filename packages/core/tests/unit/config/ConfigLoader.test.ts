/**
 * Unit tests for {@link loadConfig}.
 *
 * @module tests/unit/config/ConfigLoader.test
 */
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { loadConfig } from "../../../src/infrastructure/config/ConfigLoader.js";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";
import type { LinterConfig } from "../../../src/domain/config/LinterConfig.js";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-config-test-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

function expectRuleDisabled(config: LinterConfig, code: string): void {
  expect(config.rules[code]).toEqual({ enabled: false });
}

async function writeConfig(name: string, content: string): Promise<string> {
  const filePath = path.join(tmpDir, name);
  await fs.writeFile(filePath, content);
  return filePath;
}

describe("ConfigLoader", () => {
  it("returns default config when no config file present", async () => {
    const config = await loadConfig(tmpDir);
    expect(config.resolve).toBe(DEFAULT_CONFIG.resolve);
    expect(config.fix).toBe(false);
  });

  it("merges .obsidian-linter.jsonc when present", async () => {
    await fs.writeFile(
      path.join(tmpDir, ".obsidian-linter.jsonc"),
      JSON.stringify({ resolve: false }),
    );
    const config = await loadConfig(tmpDir);
    expect(config.resolve).toBe(false);
  });

  it("loads .obsidian-linter.yaml when present", async () => {
    await writeConfig(".obsidian-linter.yaml", "resolve: false\n");

    const config = await loadConfig(tmpDir);

    expect(config.resolve).toBe(false);
  });

  it("deep-merges the rules block so a user override does not drop defaults", async () => {
    await fs.writeFile(
      path.join(tmpDir, ".obsidian-linter.jsonc"),
      JSON.stringify({
        rules: { MD031: { enabled: false } },
      }),
    );
    const config = await loadConfig(tmpDir);
    // User override applied
    expectRuleDisabled(config, "MD031");
    // Phase 7 default disables preserved
    expectRuleDisabled(config, "MD013");
    expectRuleDisabled(config, "MD028");
    expectRuleDisabled(config, "MD033");
    expectRuleDisabled(config, "MD042");
    // Phase 2-6 OFM disables preserved
    expectRuleDisabled(config, "OFM003");
    expectRuleDisabled(config, "OFM062");
  });

  it("lets a user override replace an individual rule's config without wiping siblings", async () => {
    await fs.writeFile(
      path.join(tmpDir, ".obsidian-linter.jsonc"),
      JSON.stringify({
        rules: {
          MD013: { enabled: true, options: { line_length: 120 } },
        },
      }),
    );
    const config = await loadConfig(tmpDir);
    expect(config.rules.MD013).toEqual({
      enabled: true,
      options: { line_length: 120 },
    });
    // Other conflict disables survive.
    expectRuleDisabled(config, "MD028");
    expectRuleDisabled(config, "MD042");
  });

  it.each([
    [".markdownlint-cli2.jsonc", '{ "resolve": false, "config": { "MD013": false } }'],
    [".markdownlint-cli2.yaml", "resolve: false\nconfig:\n  MD013: false\n"],
    [".markdownlint-cli2.cjs", "module.exports = { resolve: false, config: { MD013: false } };\n"],
    [".markdownlint-cli2.mjs", "export default { resolve: false, config: { MD013: false } };\n"],
  ])("loads discovered CLI2 options file %s", async (name, content) => {
    await writeConfig(name, content);

    const config = await loadConfig(tmpDir);

    expect(config.resolve).toBe(false);
    expectRuleDisabled(config, "MD013");
  });

  it.each([
    [".markdownlint.jsonc", '{ "MD013": false, "MD024": { "siblings_only": true } }'],
    [".markdownlint.json", '{ // parsed as JSONC\n "MD013": false,\n }'],
    [".markdownlint.yaml", "MD013: false\nMD024:\n  siblings_only: true\n"],
    [".markdownlint.yml", "MD013: false\n"],
    [".markdownlint.cjs", "module.exports = { MD013: false, MD024: { siblings_only: true } };\n"],
    [".markdownlint.mjs", "export default { MD013: false, MD024: { siblings_only: true } };\n"],
  ])("maps discovered markdownlint rule file %s into LinterConfig.rules", async (name, content) => {
    await writeConfig(name, content);

    const config = await loadConfig(tmpDir);

    expectRuleDisabled(config, "MD013");
    if (name !== ".markdownlint.json" && name !== ".markdownlint.yml") {
      expect(config.rules.MD024).toEqual({
        enabled: true,
        options: { siblings_only: true },
      });
    }
  });

  it("supports comments and trailing commas in discovered .markdownlint.json", async () => {
    await writeConfig(
      ".markdownlint.json",
      `{
        // markdownlint-cli2 parses .json through JSONC
        "MD013": false,
      }`,
    );

    const config = await loadConfig(tmpDir);

    expectRuleDisabled(config, "MD013");
  });

  it.each([
    ["explicit.jsonc", '{ "resolve": false, "config": { "MD013": false } }'],
    ["explicit.json", '{ // JSONC behavior\n "resolve": false,\n "config": { "MD013": false, }, }'],
    ["explicit.yaml", "resolve: false\nconfig:\n  MD013: false\n"],
    ["explicit.yml", "resolve: false\nconfig:\n  MD013: false\n"],
    ["explicit.toml", "resolve = false\n[config]\nMD013 = false\n"],
    ["explicit.cjs", "module.exports = { resolve: false, config: { MD013: false } };\n"],
    ["explicit.mjs", "export default { resolve: false, config: { MD013: false } };\n"],
  ])("loads explicit config file %s", async (name, content) => {
    const filePath = await writeConfig(name, content);

    const config = await loadConfig(filePath);

    expect(config.resolve).toBe(false);
    expectRuleDisabled(config, "MD013");
  });

  it("reports parser failures with the config source path", async () => {
    const filePath = await writeConfig(".markdownlint-cli2.jsonc", "{");

    await expect(loadConfig(tmpDir)).rejects.toThrow(`OFM901: failed to parse ${filePath}`);
  });
});
