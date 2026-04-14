/**
 * Unit tests for {@link OFM023Rule}.
 *
 * @module tests/unit/rules/embeds/OFM023.test
 */
import { describe, it, expect } from "bun:test";
import { OFM023Rule } from "../../../../src/infrastructure/rules/ofm/embeds/OFM023-embed-size-invalid.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";

const withCap = (maxWidth: number | null, maxHeight: number | null = null): typeof DEFAULT_CONFIG =>
  ({
    ...DEFAULT_CONFIG,
    embeds: { ...DEFAULT_CONFIG.embeds, maxWidth, maxHeight },
  }) as typeof DEFAULT_CONFIG;

describe("OFM023 embed-size-invalid", () => {
  it("silent when both caps are null", async () => {
    const errors = await runRuleOnSource(OFM023Rule, "![[img.png|800]]");
    expect(errors).toEqual([]);
  });

  it("flags embed wider than maxWidth", async () => {
    const errors = await runRuleOnSource(OFM023Rule, "![[img.png|800]]", withCap(400));
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("maxWidth 400");
  });

  it("passes when width equals maxWidth", async () => {
    const errors = await runRuleOnSource(OFM023Rule, "![[img.png|400]]", withCap(400));
    expect(errors).toEqual([]);
  });

  it("flags embed taller than maxHeight", async () => {
    const errors = await runRuleOnSource(OFM023Rule, "![[img.png|800x600]]", withCap(null, 300));
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("maxHeight 300");
  });

  it("flags both axes when both caps are exceeded", async () => {
    const errors = await runRuleOnSource(OFM023Rule, "![[img.png|800x600]]", withCap(400, 300));
    expect(errors).toHaveLength(2);
  });

  it("ignores embeds without a sizing hint", async () => {
    const errors = await runRuleOnSource(OFM023Rule, "![[img.png]]", withCap(400));
    expect(errors).toEqual([]);
  });
});
