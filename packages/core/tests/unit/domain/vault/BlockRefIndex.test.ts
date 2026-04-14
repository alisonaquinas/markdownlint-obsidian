/**
 * Unit tests for {@link makeBlockRefIndex}.
 *
 * @module tests/unit/domain/vault/BlockRefIndex.test
 */
import { describe, it, expect } from "bun:test";
import { makeBlockRefIndex } from "../../../../src/domain/vault/BlockRefIndex.js";

describe("BlockRefIndex", () => {
  const idx = makeBlockRefIndex(
    new Map([
      ["notes/a.md", new Set(["intro", "summary"])],
      ["notes/b.md", new Set(["top"])],
    ]),
  );

  it("finds a known blockId on a known page", () => {
    expect(idx.has("notes/a", "intro")).toBe(true);
  });

  it("tolerates .md suffix on target", () => {
    expect(idx.has("notes/a.md", "intro")).toBe(true);
  });

  it("reports missing id on known page", () => {
    expect(idx.has("notes/a", "missing")).toBe(false);
  });

  it("reports any id on unknown page", () => {
    expect(idx.has("notes/unknown", "intro")).toBe(false);
  });

  it("enumerates duplicates per page", () => {
    const dupIdx = makeBlockRefIndex(
      new Map([["x.md", new Set(["id1", "id2"])]]),
      new Map([["x.md", ["id1", "id1", "id2"]]]),
    );
    expect(dupIdx.duplicatesIn("x.md")).toEqual(["id1"]);
  });

  it("duplicatesIn() returns empty for pages with no duplicates", () => {
    const clean = makeBlockRefIndex(
      new Map([["a.md", new Set(["one", "two"])]]),
      new Map([["a.md", ["one", "two"]]]),
    );
    expect(clean.duplicatesIn("a")).toEqual([]);
  });

  it("duplicatesIn() tolerates .md suffix", () => {
    const dupIdx = makeBlockRefIndex(
      new Map([["x.md", new Set(["id1"])]]),
      new Map([["x.md", ["id1", "id1"]]]),
    );
    expect(dupIdx.duplicatesIn("x")).toEqual(["id1"]);
    expect(dupIdx.duplicatesIn("x.md")).toEqual(["id1"]);
  });

  it("all() returns the underlying unique map", () => {
    expect(idx.all().get("notes/a.md")?.has("summary")).toBe(true);
  });
});
