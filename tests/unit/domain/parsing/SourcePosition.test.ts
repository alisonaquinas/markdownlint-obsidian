import { describe, it, expect } from "bun:test";
import { makeSourcePosition } from "../../../../src/domain/parsing/SourcePosition.js";

describe("SourcePosition", () => {
  it("creates a frozen 1-based position", () => {
    const p = makeSourcePosition(3, 7);
    expect(p.line).toBe(3);
    expect(p.column).toBe(7);
    expect(Object.isFrozen(p)).toBe(true);
  });

  it("rejects non-positive line or column", () => {
    expect(() => makeSourcePosition(0, 1)).toThrow(/line/);
    expect(() => makeSourcePosition(1, 0)).toThrow(/column/);
    expect(() => makeSourcePosition(-1, 1)).toThrow(/line/);
  });
});
