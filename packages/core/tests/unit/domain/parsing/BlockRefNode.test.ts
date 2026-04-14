/**
 * Unit tests for {@link makeBlockRefNode}.
 *
 * @module tests/unit/domain/parsing/BlockRefNode.test
 */
import { describe, it, expect } from "bun:test";
import { makeBlockRefNode } from "../../../../src/domain/parsing/BlockRefNode.js";

describe("BlockRefNode", () => {
  it("creates a frozen block reference", () => {
    const n = makeBlockRefNode({
      blockId: "abc-123",
      position: { line: 7, column: 30 },
    });
    expect(n.blockId).toBe("abc-123");
    expect(Object.isFrozen(n)).toBe(true);
  });

  it("rejects invalid block ids", () => {
    expect(() =>
      makeBlockRefNode({
        blockId: "has space",
        position: { line: 1, column: 1 },
      }),
    ).toThrow(/blockId/);
  });
});
