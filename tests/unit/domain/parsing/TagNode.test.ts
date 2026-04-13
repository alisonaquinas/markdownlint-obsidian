import { describe, it, expect } from "bun:test";
import { makeTagNode } from "../../../../src/domain/parsing/TagNode.js";

describe("TagNode", () => {
  it("creates a frozen tag without #", () => {
    const n = makeTagNode({
      value: "project/meta",
      position: { line: 1, column: 1 },
      raw: "#project/meta",
    });
    expect(n.value).toBe("project/meta");
    expect(Object.isFrozen(n)).toBe(true);
  });

  it("rejects empty value", () => {
    expect(() =>
      makeTagNode({
        value: "",
        position: { line: 1, column: 1 },
        raw: "#",
      }),
    ).toThrow(/value/);
  });

  it("rejects value starting with #", () => {
    expect(() =>
      makeTagNode({
        value: "#tag",
        position: { line: 1, column: 1 },
        raw: "#tag",
      }),
    ).toThrow(/#/);
  });
});
