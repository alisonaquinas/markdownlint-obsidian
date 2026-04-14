/**
 * Unit tests for {@link extractTags}.
 *
 * @module tests/unit/parser/ofm/TagExtractor.test
 */
import { describe, it, expect } from "bun:test";
import { extractTags } from "../../../../src/infrastructure/parser/ofm/TagExtractor.js";
import { buildCodeRegionMap } from "../../../../src/infrastructure/parser/ofm/CodeRegionMap.js";

function run(src: string): ReturnType<typeof extractTags> {
  const lines = src.split("\n");
  return extractTags(lines, buildCodeRegionMap(lines));
}

describe("TagExtractor", () => {
  it("parses #tag", () => {
    const out = run("Start #project end");
    expect(out).toHaveLength(1);
    expect(out[0]?.value).toBe("project");
  });

  it("parses #nested/tag", () => {
    const out = run("#area/meta");
    expect(out[0]?.value).toBe("area/meta");
  });

  it("rejects pure-number #123", () => {
    const out = run("hashtag #123 here");
    expect(out).toHaveLength(0);
  });

  it("ignores leading # when preceded by a word char", () => {
    const out = run("id#42 should not match");
    expect(out).toHaveLength(0);
  });

  it("skips tags in code blocks", () => {
    const out = run("```\n#ignored\n```");
    expect(out).toHaveLength(0);
  });
});
