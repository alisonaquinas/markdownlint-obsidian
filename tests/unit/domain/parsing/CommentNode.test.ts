import { describe, it, expect } from "bun:test";
import { makeCommentNode } from "../../../../src/domain/parsing/CommentNode.js";

describe("CommentNode", () => {
  it("creates a frozen comment with start and end positions", () => {
    const n = makeCommentNode({
      text: "todo",
      position: { line: 1, column: 5 },
      endPosition: { line: 1, column: 13 },
    });
    expect(n.text).toBe("todo");
    expect(n.endPosition.column).toBe(13);
    expect(Object.isFrozen(n)).toBe(true);
  });
});
