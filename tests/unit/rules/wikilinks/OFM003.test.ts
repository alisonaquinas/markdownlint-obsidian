import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { OFM003Rule } from "../../../../src/infrastructure/rules/ofm/wikilinks/OFM003-self-link.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { stubVault } from "../helpers/stubVault.js";

describe("OFM003 self-link", () => {
  it("warns when link resolves to current file", async () => {
    // runRuleOnSource parses with filePath = "test.md"; stubVault uses /v root.
    // Build a stub with a single file at /v/test.md so resolve("test") -> that file.
    const vault = stubVault(["test.md"]);
    // monkey-patch the vault so that the resolved absolute path matches
    // path.resolve("test.md") (the parser's filePath).
    const real = vault.resolve.bind(vault);
    const patched = {
      ...vault,
      resolve: (link: { target: string }) => {
        const r = real(link);
        if (r.kind === "resolved") {
          return {
            ...r,
            path: { ...r.path, absolute: path.resolve("test.md") },
          };
        }
        return r;
      },
    };
    const errors = await runRuleOnSource(OFM003Rule, "[[test]]\n", {}, patched);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM003");
  });

  it("does not warn on link to different file", async () => {
    const vault = stubVault(["other.md"]);
    const errors = await runRuleOnSource(OFM003Rule, "[[other]]\n", {}, vault);
    expect(errors).toEqual([]);
  });

  it("is a no-op when vault is null", async () => {
    const errors = await runRuleOnSource(OFM003Rule, "[[anything]]\n", {}, null);
    expect(errors).toEqual([]);
  });
});
