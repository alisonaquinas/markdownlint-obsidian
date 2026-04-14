/**
 * Unit tests for {@link makeWikilinkNode}.
 *
 * @module tests/unit/domain/parsing/WikilinkNode.test
 */
import { describe, it, expect } from "bun:test";
import { makeWikilinkNode } from "../../../../src/domain/parsing/WikilinkNode.js";

describe("WikilinkNode", () => {
  it("creates a plain wikilink", () => {
    const n = makeWikilinkNode({
      target: "index",
      alias: null,
      heading: null,
      blockRef: null,
      position: { line: 2, column: 5 },
      isEmbed: false,
      raw: "[[index]]",
    });
    expect(n.target).toBe("index");
    expect(n.isEmbed).toBe(false);
    expect(Object.isFrozen(n)).toBe(true);
  });

  it("holds alias, heading, and block reference parts", () => {
    const n = makeWikilinkNode({
      target: "notes/project",
      alias: "display",
      heading: "intro",
      blockRef: "abc123",
      position: { line: 1, column: 1 },
      isEmbed: false,
      raw: "[[notes/project#intro^abc123|display]]",
    });
    expect(n.alias).toBe("display");
    expect(n.heading).toBe("intro");
    expect(n.blockRef).toBe("abc123");
  });

  it("rejects empty target", () => {
    expect(() =>
      makeWikilinkNode({
        target: "",
        alias: null,
        heading: null,
        blockRef: null,
        position: { line: 1, column: 1 },
        isEmbed: false,
        raw: "[[]]",
      }),
    ).toThrow(/target/);
  });
});
