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
