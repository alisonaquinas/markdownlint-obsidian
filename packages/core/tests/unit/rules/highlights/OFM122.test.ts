/**
 * Unit tests for {@link OFM122Rule}.
 *
 * @module tests/unit/rules/highlights/OFM122.test
 */
import { describe, it, expect } from "bun:test";
import { OFM122Rule } from "../../../../src/infrastructure/rules/ofm/highlights/OFM122-malformed-highlight.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM122 malformed-highlight", () => {
  it("reports an odd number of `==` on a single line", async () => {
    const errors = await runRuleOnSource(OFM122Rule, "unterminated ==highlight\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM122");
  });

  it("passes on a well-formed highlight", async () => {
    const errors = await runRuleOnSource(OFM122Rule, "value ==one==\n");
    expect(errors).toEqual([]);
  });

  it("passes on two highlights", async () => {
    const errors = await runRuleOnSource(OFM122Rule, "value ==one== and ==two==\n");
    expect(errors).toEqual([]);
  });

  it("ignores `==` markers inside fenced code", async () => {
    const src = "before\n```\nif (a === b) { }\n```\nafter\n";
    const errors = await runRuleOnSource(OFM122Rule, src);
    expect(errors).toEqual([]);
  });

  it("passes on a line without `==`", async () => {
    const errors = await runRuleOnSource(OFM122Rule, "plain prose\n");
    expect(errors).toEqual([]);
  });

  it("ignores `==` inside an indented code block", async () => {
    const src = "intro\n\n    if response.code == 200:\n        pass\n\nafter\n";
    const errors = await runRuleOnSource(OFM122Rule, src);
    expect(errors).toEqual([]);
  });

  it("ignores `==` inside a blockquote-nested fence", async () => {
    const src = "> ```python\n> if a == b:\n>     pass\n> ```\n";
    const errors = await runRuleOnSource(OFM122Rule, src);
    expect(errors).toEqual([]);
  });

  it("ignores `==` on lines a naive fence scanner misclassifies after an unbalanced pasted fence", async () => {
    // A stray fence marker inside a fenced block (e.g. pasted terminal
    // output) desyncs line-based state machines; the token stream does not.
    const src = "```\nPasted output:\n```\n````\nlet eq = a == b;\n````\nafter\n";
    const errors = await runRuleOnSource(OFM122Rule, src);
    expect(errors).toEqual([]);
  });

  it("ignores `==` inside link and image destinations", async () => {
    const src = "![img](data:image/jpeg;base64,AAA/2Q==)\nsee [docs](https://x.io/a==b?y=1)\n";
    const errors = await runRuleOnSource(OFM122Rule, src);
    expect(errors).toEqual([]);
  });

  it("ignores `==` inside wikilink embed targets", async () => {
    const src = "![[attachment_YThkOTY4YmY5Y2JmZWQyMGJiZGY2ODJkNGQxZDQ0NzE4ZWQ==]]\n";
    const errors = await runRuleOnSource(OFM122Rule, src);
    expect(errors).toEqual([]);
  });

  it("still reports unterminated highlights in prose after code", async () => {
    const src = "```\ncode == here\n```\n\nbroken ==highlight\n";
    const errors = await runRuleOnSource(OFM122Rule, src);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.line).toBe(5);
  });
});
