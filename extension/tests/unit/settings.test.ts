/**
 * Unit coverage for configuration normalization.
 *
 * Invalid VS Code settings should collapse to conservative runtime defaults so
 * extension activation remains predictable.
 */

import { describe, expect, it } from "bun:test";
import { readExtensionSettings } from "../../src/config/settings.js";

describe("readExtensionSettings", () => {
  it("normalizes invalid settings to safe defaults", () => {
    const settings = readExtensionSettings({
      get: <T>(key: string, fallback: T): T => {
        const values: Record<string, unknown> = {
          enabled: true,
          runMode: "bad",
          debounceMs: 99999,
          configPath: "",
          workspaceGlobs: [],
        };
        return (values[key] ?? fallback) as T;
      },
    });

    expect(settings.runMode).toBe("onType");
    expect(settings.debounceMs).toBe(5000);
    expect(settings.configPath).toBeNull();
    expect(settings.workspaceGlobs).toEqual(["**/*.md"]);
  });
});
