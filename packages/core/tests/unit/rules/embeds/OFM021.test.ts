/**
 * Unit tests for {@link OFM021Rule}.
 *
 * @module tests/unit/rules/embeds/OFM021.test
 */
import { describe, it, expect } from "bun:test";
import { OFM021Rule } from "../../../../src/infrastructure/rules/ofm/embeds/OFM021-invalid-embed-syntax.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM021 invalid-embed-syntax", () => {
  it("passes for a well-formed embed", async () => {
    const errors = await runRuleOnSource(OFM021Rule, "![[ok]]\n");
    expect(errors).toEqual([]);
  });

  it("passes for a plain wikilink (no embed marker)", async () => {
    const errors = await runRuleOnSource(OFM021Rule, "[[wl]]\n");
    expect(errors).toEqual([]);
  });

  it("reports empty embed `![[]]`", async () => {
    const errors = await runRuleOnSource(OFM021Rule, "![[]]\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM021");
    expect(errors[0]?.message).toContain("Empty embed");
  });

  it("reports whitespace-only embed `![[   ]]`", async () => {
    const errors = await runRuleOnSource(OFM021Rule, "![[   ]]\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("Empty embed");
  });

  it("reports unclosed embed on a line", async () => {
    const errors = await runRuleOnSource(OFM021Rule, "![[oops\n");
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.some((e) => e.message.includes("Unclosed"))).toBe(true);
  });

  it("reports two empty embeds on the same line", async () => {
    const errors = await runRuleOnSource(OFM021Rule, "![[]] and ![[]]\n");
    expect(errors).toHaveLength(2);
  });

  it("skips matches inside a fenced code block", async () => {
    const src = "```md\n![[]]\n```\n";
    const errors = await runRuleOnSource(OFM021Rule, src);
    expect(errors).toEqual([]);
  });

  it("skips matches inside inline code spans", async () => {
    const errors = await runRuleOnSource(OFM021Rule, "See `![[]]` for example.\n");
    expect(errors).toEqual([]);
  });
});
