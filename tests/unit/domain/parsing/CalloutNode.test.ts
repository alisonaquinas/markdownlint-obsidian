import { describe, it, expect } from "vitest";
import { makeCalloutNode } from "../../../../src/domain/parsing/CalloutNode.js";

describe("CalloutNode", () => {
  it("freezes bodyLines", () => {
    const n = makeCalloutNode({
      type: "NOTE",
      title: "Heading",
      position: { line: 4, column: 1 },
      bodyLines: ["first", "second"],
      foldable: "none",
    });
    expect(Object.isFrozen(n.bodyLines)).toBe(true);
    expect(n.bodyLines).toHaveLength(2);
    expect(Object.isFrozen(n)).toBe(true);
  });

  it("rejects empty type", () => {
    expect(() =>
      makeCalloutNode({
        type: "",
        title: "",
        position: { line: 1, column: 1 },
        bodyLines: [],
        foldable: "none",
      }),
    ).toThrow(/type/);
  });
});
