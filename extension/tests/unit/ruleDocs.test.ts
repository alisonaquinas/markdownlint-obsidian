import { describe, expect, it } from "bun:test";
import { ruleDocumentationUrl } from "../../src/fixes/ruleDocs.js";

describe("ruleDocumentationUrl", () => {
  it("maps OFM and MD rule codes", () => {
    expect(ruleDocumentationUrl("OFM001")).toContain("/wikilinks/OFM001.md");
    expect(ruleDocumentationUrl("MD013")).toContain("/standard-md/MD013.md");
  });

  it("returns null for unknown custom rules", () => {
    expect(ruleDocumentationUrl("CUSTOM001")).toBeNull();
  });
});
