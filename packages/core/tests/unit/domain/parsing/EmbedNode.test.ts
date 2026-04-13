import { describe, it, expect } from "bun:test";
import { makeEmbedNode } from "../../../../src/domain/parsing/EmbedNode.js";

describe("EmbedNode", () => {
  it("holds width and height sizing hints", () => {
    const n = makeEmbedNode({
      target: "image.png",
      width: 500,
      height: 300,
      position: { line: 1, column: 1 },
      raw: "![[image.png|500x300]]",
    });
    expect(n.width).toBe(500);
    expect(n.height).toBe(300);
    expect(Object.isFrozen(n)).toBe(true);
  });

  it("rejects empty target", () => {
    expect(() =>
      makeEmbedNode({
        target: "",
        width: null,
        height: null,
        position: { line: 1, column: 1 },
        raw: "![[]]",
      }),
    ).toThrow(/target/);
  });
});
