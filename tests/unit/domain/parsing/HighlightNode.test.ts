import { describe, it, expect } from "vitest";
import { makeHighlightNode } from "../../../../src/domain/parsing/HighlightNode.js";

describe("HighlightNode", () => {
  it("creates a frozen highlight", () => {
    const n = makeHighlightNode({
      text: "important",
      position: { line: 3, column: 12 },
    });
    expect(n.text).toBe("important");
    expect(Object.isFrozen(n)).toBe(true);
  });
});
