import { describe, it, expect, beforeEach, afterEach } from "vitest";
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
});
