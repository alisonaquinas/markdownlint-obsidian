import { describe, it, expect } from "vitest";
import { OFM044Rule } from "../../../../src/infrastructure/rules/ofm/callouts/OFM044-callout-fold-disabled.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { DEFAULT_CONFIG } from "../../../../src/infrastructure/config/defaults.js";

const withFoldDisabled = (): typeof DEFAULT_CONFIG =>
  ({
    ...DEFAULT_CONFIG,
    callouts: { ...DEFAULT_CONFIG.callouts, allowFold: false },
  }) as typeof DEFAULT_CONFIG;

describe("OFM044 callout-fold-disabled", () => {
  it("no-ops when allowFold is true (default)", async () => {
    const errors = await runRuleOnSource(OFM044Rule, "> [!NOTE]+ Title\n> body\n");
    expect(errors).toEqual([]);
  });

  it("flags foldable NOTE when allowFold is false", async () => {
    const errors = await runRuleOnSource(
      OFM044Rule,
      "> [!NOTE]+ Title\n> body\n",
      withFoldDisabled(),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM044");
  });

  it("flags foldable TIP with closed marker when allowFold is false", async () => {
    const errors = await runRuleOnSource(
      OFM044Rule,
      "> [!TIP]- Title\n> body\n",
      withFoldDisabled(),
    );
    expect(errors).toHaveLength(1);
  });

  it("ignores non-informational callouts (WARNING) even with fold disabled", async () => {
    const errors = await runRuleOnSource(
      OFM044Rule,
      "> [!WARNING]+ Title\n> body\n",
      withFoldDisabled(),
    );
    expect(errors).toEqual([]);
  });

  it("ignores non-foldable informational callouts", async () => {
    const errors = await runRuleOnSource(
      OFM044Rule,
      "> [!NOTE] Title\n> body\n",
      withFoldDisabled(),
    );
    expect(errors).toEqual([]);
  });
});
