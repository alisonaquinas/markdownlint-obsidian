/**
 * Unit tests for {@link OFM041Rule}.
 *
 * @module tests/unit/rules/callouts/OFM041.test
 */
import { describe, it, expect } from "bun:test";
import { OFM041Rule } from "../../../../src/infrastructure/rules/ofm/callouts/OFM041-malformed-callout.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM041 malformed-callout", () => {
  it("passes for a well-formed callout", async () => {
    const errors = await runRuleOnSource(OFM041Rule, "> [!NOTE] Title\n> body\n");
    expect(errors).toEqual([]);
  });

  it("passes for a well-formed foldable callout", async () => {
    const errors = await runRuleOnSource(OFM041Rule, "> [!TIP]+ Title\n> body\n");
    expect(errors).toEqual([]);
  });

  it("ignores plain quote blocks", async () => {
    const errors = await runRuleOnSource(OFM041Rule, "> a regular quote\n");
    expect(errors).toEqual([]);
  });

  it("ignores blockquoted wikilinks", async () => {
    const src = "> [[domain/page#heading|Alias]], which is a normal quote\n";
    const errors = await runRuleOnSource(OFM041Rule, src);
    expect(errors).toEqual([]);
  });

  it("reports missing space after type marker", async () => {
    const errors = await runRuleOnSource(OFM041Rule, "> [!NOTE]Title\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM041");
  });

  it("reports empty type marker", async () => {
    const errors = await runRuleOnSource(OFM041Rule, "> [!] Title\n");
    expect(errors).toHaveLength(1);
  });

  it("ignores bracketed blockquotes without the callout sigil", async () => {
    const errors = await runRuleOnSource(OFM041Rule, "> [ NOTE ] Title\n");
    expect(errors).toEqual([]);
  });

  it("ignores standard Markdown links inside blockquotes", async () => {
    const errors = await runRuleOnSource(OFM041Rule, "> [link text](https://example.com)\n");
    expect(errors).toEqual([]);
  });

  it("skips malformed patterns inside a fenced code block", async () => {
    const src = "```md\n> [!NOTE]Title\n```\n";
    const errors = await runRuleOnSource(OFM041Rule, src);
    expect(errors).toEqual([]);
  });
});
