/**
 * Unit tests for {@link loadConfig}.
 *
 * @module tests/unit/config/ConfigLoader.test
 */
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { loadConfig } from "../../../src/infrastructure/config/ConfigLoader.js";
import { DEFAULT_CONFIG } from "../../../src/infrastructure/config/defaults.js";
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

  it("deep-merges the rules block so a user override does not drop defaults", async () => {
    await fs.writeFile(
      path.join(tmpDir, ".obsidian-linter.jsonc"),
      JSON.stringify({
        rules: { MD031: { enabled: false } },
      }),
    );
    const config = await loadConfig(tmpDir);
    // User override applied
    expect(config.rules.MD031?.enabled).toBe(false);
    // Phase 7 default disables preserved
    expect(config.rules.MD013?.enabled).toBe(false);
    expect(config.rules.MD033?.enabled).toBe(false);
    expect(config.rules.MD042?.enabled).toBe(false);
    // Phase 2-6 OFM disables preserved
    expect(config.rules.OFM003?.enabled).toBe(false);
    expect(config.rules.OFM062?.enabled).toBe(false);
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
    expect(config.rules.MD042?.enabled).toBe(false);
  });
});
