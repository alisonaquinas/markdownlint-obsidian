/**
 * Integration smoke coverage for package manifest contracts.
 *
 * These assertions keep the VS Code contribution metadata aligned with the
 * extension architecture: Flavor Grenade supplies OFMarkdown classification and
 * the bundled library supplies lint behavior.
 */

import { describe, expect, it } from "bun:test";
import manifest from "../../package.json" with { type: "json" };

describe("extension manifest", () => {
  it("declares Flavor Grenade and OFMarkdown activation", () => {
    expect(manifest.extensionDependencies).toContain("alisonaquinas.flavor-grenade-lsp");
    expect(manifest.activationEvents).toContain("onLanguage:ofmarkdown");
  });

  it("depends on the library and not the CLI", () => {
    const dependencies = manifest.dependencies as Record<string, string | undefined>;
    expect(dependencies["markdownlint-obsidian"]).toBeDefined();
    expect(dependencies["markdownlint-obsidian-cli"]).toBeUndefined();
  });
});
