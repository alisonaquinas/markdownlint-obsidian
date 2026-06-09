/**
 * Unit coverage for the extension-to-core adapter.
 *
 * The adapter must not force the VS Code workspace root to be the lint vault:
 * nested docs vaults and explicit config files own that decision through the
 * bundled core library.
 */

import { describe, expect, it, mock } from "bun:test";
import type { LintResult } from "markdownlint-obsidian/api";

type CapturedOptions = Record<string, unknown>;

const lintTextCalls: CapturedOptions[] = [];
const fixTextCalls: CapturedOptions[] = [];
const lintWorkspaceCalls: CapturedOptions[] = [];

function result(filePath: string): LintResult {
  return { filePath, errors: [], hasErrors: false };
}

mock.module("markdownlint-obsidian/editor", () => ({
  lintText: mock(async (options: CapturedOptions): Promise<LintResult> => {
    lintTextCalls.push(options);
    return result(String(options.filePath));
  }),
  fixText: mock(
    async (
      options: CapturedOptions,
    ): Promise<{
      readonly firstPass: readonly LintResult[];
      readonly finalPass: readonly LintResult[];
      readonly text: string;
    }> => {
      fixTextCalls.push(options);
      return {
        firstPass: [result(String(options.filePath))],
        finalPass: [],
        text: String(options.text),
      };
    },
  ),
  lintWorkspace: mock(async (options: CapturedOptions): Promise<readonly LintResult[]> => {
    lintWorkspaceCalls.push(options);
    return [];
  }),
}));

const { CoreLibraryAdapter } = await import("../../src/core/coreLibraryAdapter.js");

describe("CoreLibraryAdapter", () => {
  it("lets config own vaultRoot for live document linting", async () => {
    const adapter = new CoreLibraryAdapter();

    await adapter.lintDocument({
      workspaceRoot: "C:/repo",
      configPath: null,
      allowCustomRules: false,
      filePath: "C:/repo/docs/README.md",
      text: "# Docs\n",
    });

    expect(lintTextCalls.at(-1)).toEqual({
      cwd: "C:/repo",
      config: "C:/repo",
      allowCustomRules: false,
      filePath: "C:/repo/docs/README.md",
      text: "# Docs\n",
    });
  });

  it("lets config own vaultRoot for fixes and workspace linting", async () => {
    const adapter = new CoreLibraryAdapter();

    await adapter.fixDocument({
      workspaceRoot: "C:/repo",
      configPath: "C:/repo/docs",
      allowCustomRules: true,
      filePath: "C:/repo/docs/README.md",
      text: "# Docs\n",
    });
    await adapter.lintWorkspace({
      workspaceRoot: "C:/repo",
      configPath: "C:/repo/docs",
      allowCustomRules: true,
      globs: ["docs/**/*.md"],
    });

    expect(fixTextCalls.at(-1)).not.toHaveProperty("vaultRoot");
    expect(lintWorkspaceCalls.at(-1)).not.toHaveProperty("vaultRoot");
    expect(fixTextCalls.at(-1)?.config).toBe("C:/repo/docs");
    expect(lintWorkspaceCalls.at(-1)?.config).toBe("C:/repo/docs");
  });
});
