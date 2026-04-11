import { describe, it, expect } from "vitest";
import { OFM025Rule } from "../../../../src/infrastructure/rules/ofm/embeds/OFM025-embed-size-on-non-image.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM025 embed-size-on-non-image", () => {
  it("allows sizing hint on an image", async () => {
    const errors = await runRuleOnSource(OFM025Rule, "![[photo.png|400]]");
    expect(errors).toEqual([]);
  });

  it("allows embeds with no sizing hint", async () => {
    const errors = await runRuleOnSource(OFM025Rule, "![[doc.pdf]]");
    expect(errors).toEqual([]);
  });

  it("flags sizing hint on a PDF", async () => {
    const errors = await runRuleOnSource(OFM025Rule, "![[doc.pdf|500]]");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM025");
    expect(errors[0]?.message).toContain("pdf");
  });

  it("flags sizing hint on a video", async () => {
    const errors = await runRuleOnSource(OFM025Rule, "![[clip.mp4|800x600]]");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("video");
  });

  it("flags sizing hint on an audio file", async () => {
    const errors = await runRuleOnSource(OFM025Rule, "![[beep.mp3|200]]");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("audio");
  });
});
