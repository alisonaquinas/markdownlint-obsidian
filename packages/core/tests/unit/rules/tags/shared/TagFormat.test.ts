import { describe, it, expect } from "bun:test";
import fc from "fast-check";
import {
  isValidTag,
  tagDepth,
} from "../../../../../src/infrastructure/rules/ofm/tags/shared/TagFormat.js";

describe("isValidTag", () => {
  it.each(["simple", "nested/tag", "area/meta/deep", "with-dash", "with_us"])("accepts %s", (v) => {
    expect(isValidTag(v)).toBe(true);
  });

  it.each(["", "/leading", "trailing/", "double//slash", "has space", "123", "#hash"])(
    "rejects %s",
    (v) => {
      expect(isValidTag(v)).toBe(false);
    },
  );
});

describe("tagDepth", () => {
  it("returns 1 for a simple tag", () => {
    expect(tagDepth("simple")).toBe(1);
  });

  it("returns 2 for a nested tag", () => {
    expect(tagDepth("a/b")).toBe(2);
  });

  it("counts slash segments (property)", () => {
    fc.assert(
      fc.property(
        fc.array(fc.stringMatching(/^[a-z]+$/), { minLength: 1, maxLength: 5 }),
        (parts) => {
          const tag = parts.join("/");
          expect(tagDepth(tag)).toBe(parts.length);
        },
      ),
    );
  });
});
