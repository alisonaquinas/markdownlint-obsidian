import { describe, it, expect } from "vitest";
import { extractCallouts } from "../../../../src/infrastructure/parser/ofm/CalloutExtractor.js";
import { buildCodeRegionMap } from "../../../../src/infrastructure/parser/ofm/CodeRegionMap.js";

function run(src: string) {
  const lines = src.split("\n");
  return extractCallouts(lines, buildCodeRegionMap(lines));
}

describe("CalloutExtractor", () => {
  it("parses NOTE callout with title and body", () => {
    const out = run("> [!NOTE] Heading\n> body line one\n> body line two\n\nafter");
    expect(out).toHaveLength(1);
    expect(out[0]?.type).toBe("NOTE");
    expect(out[0]?.title).toBe("Heading");
    expect(out[0]?.bodyLines).toEqual(["body line one", "body line two"]);
    expect(out[0]?.foldable).toBe("none");
  });

  it("detects foldable + marker", () => {
    const out = run("> [!TIP]+ Title");
    expect(out[0]?.foldable).toBe("open");
  });

  it("detects foldable - marker", () => {
    const out = run("> [!WARNING]-");
    expect(out[0]?.foldable).toBe("closed");
    expect(out[0]?.title).toBe("");
  });

  it("skips callouts inside code blocks", () => {
    const out = run("```\n> [!NOTE] inside\n```");
    expect(out).toHaveLength(0);
  });
});
