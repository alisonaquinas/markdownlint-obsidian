import { describe, it, expect } from "bun:test";
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

  it("emits a fix that deletes the '+' fold marker from a NOTE callout", async () => {
    // "> [!NOTE]+ Title" — '+' is at 0-based index 9, so column 10 (1-based)
    const errors = await runRuleOnSource(
      OFM044Rule,
      "> [!NOTE]+ Title\n> body\n",
      withFoldDisabled(),
    );
    expect(errors[0]?.fix).toBeDefined();
    expect(errors[0]?.fix).toMatchObject({
      lineNumber: 1,
      editColumn: 10,
      deleteCount: 1,
      insertText: "",
    });
  });

  it("emits a fix that deletes the '-' fold marker from a TIP callout", async () => {
    // "> [!TIP]- Title" — '-' is at 0-based index 8, so column 9 (1-based)
    const errors = await runRuleOnSource(
      OFM044Rule,
      "> [!TIP]- Title\n> body\n",
      withFoldDisabled(),
    );
    expect(errors[0]?.fix).toBeDefined();
    expect(errors[0]?.fix).toMatchObject({
      lineNumber: 1,
      editColumn: 9,
      deleteCount: 1,
      insertText: "",
    });
  });
});
