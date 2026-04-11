import { describe, it, expect } from "vitest";
import { OFM024Rule } from "../../../../src/infrastructure/rules/ofm/embeds/OFM024-disallowed-embed-extension.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";

describe("OFM024 disallowed-embed-extension", () => {
  it("passes for a png in the default allowList", async () => {
    const errors = await runRuleOnSource(OFM024Rule, "![[photo.png]]");
    expect(errors).toEqual([]);
  });

  it("passes case-insensitively (PNG)", async () => {
    const errors = await runRuleOnSource(OFM024Rule, "![[photo.PNG]]");
    expect(errors).toEqual([]);
  });

  it("flags a .exe embed", async () => {
    const errors = await runRuleOnSource(OFM024Rule, "![[script.exe]]");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM024");
    expect(errors[0]?.message).toContain(".exe");
  });

  it("respects a narrowed allowList", async () => {
    const overrides = {
      embeds: { ...DEFAULT_CONFIG.embeds, allowedExtensions: ["md"] },
    };
    const errors = await runRuleOnSource(OFM024Rule, "![[photo.png]]", overrides);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain(".png");
  });

  it("treats extensionless targets as markdown (allowed)", async () => {
    const errors = await runRuleOnSource(OFM024Rule, "![[notes/index]]");
    expect(errors).toEqual([]);
  });
});
