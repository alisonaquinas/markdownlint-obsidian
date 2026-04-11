import { describe, it, expect } from "vitest";
import {
  getByDotPath,
  typeOf,
} from "../../../../../src/infrastructure/rules/ofm/frontmatter/shared/FrontmatterAccess.js";

describe("getByDotPath", () => {
  it("returns top-level value", () => {
    expect(getByDotPath({ a: 1 }, "a")).toBe(1);
  });

  it("traverses nested object", () => {
    expect(getByDotPath({ a: { b: { c: 42 } } }, "a.b.c")).toBe(42);
  });

  it("returns undefined for missing top key", () => {
    expect(getByDotPath({ a: 1 }, "b")).toBeUndefined();
  });

  it("returns undefined when an intermediate is non-object", () => {
    expect(getByDotPath({ a: 1 }, "a.b")).toBeUndefined();
  });

  it("returns undefined when source is null", () => {
    expect(getByDotPath(null, "a")).toBeUndefined();
  });

  it("returns undefined when source is undefined", () => {
    expect(getByDotPath(undefined, "a")).toBeUndefined();
  });
});

describe("typeOf", () => {
  it.each([
    [null, "null"],
    ["hi", "string"],
    [3, "number"],
    [true, "boolean"],
    [[], "array"],
    [{}, "object"],
    [undefined, "unknown"],
  ] as const)("classifies %s as %s", (value, expected) => {
    expect(typeOf(value)).toBe(expected);
  });
});
