import { describe, it, expect } from "vitest";
import { OFM022Rule } from "../../../../src/infrastructure/rules/ofm/embeds/OFM022-embed-target-missing.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";
import { stubVault } from "../helpers/stubVault.js";
import type { FileExistenceChecker } from "../../../../src/domain/fs/FileExistenceChecker.js";

function fsCheckWith(existing: readonly string[]): FileExistenceChecker {
  const set = new Set(existing);
  return {
    async exists(_root: string, relative: string): Promise<boolean> {
      return set.has(relative);
    },
  };
}

describe("OFM022 embed-target-missing", () => {
  it("passes when the asset file exists", async () => {
    const vault = stubVault([]);
    const fsCheck = fsCheckWith(["image.png"]);
    const errors = await runRuleOnSource(OFM022Rule, "![[image.png]]", {}, vault, fsCheck);
    expect(errors).toEqual([]);
  });

  it("reports missing asset", async () => {
    const vault = stubVault([]);
    const fsCheck = fsCheckWith([]);
    const errors = await runRuleOnSource(OFM022Rule, "![[missing.png]]", {}, vault, fsCheck);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM022");
    expect(errors[0]?.message).toContain("missing.png");
  });

  it("skips markdown embeds (OFM020's territory)", async () => {
    const vault = stubVault([]);
    const fsCheck = fsCheckWith([]);
    const errors = await runRuleOnSource(OFM022Rule, "![[note]]", {}, vault, fsCheck);
    expect(errors).toEqual([]);
  });

  it("skips unknown extensions (OFM024's territory)", async () => {
    const vault = stubVault([]);
    const fsCheck = fsCheckWith([]);
    const errors = await runRuleOnSource(OFM022Rule, "![[script.exe]]", {}, vault, fsCheck);
    expect(errors).toEqual([]);
  });

  it("no-ops when resolve disabled (vault is null)", async () => {
    const fsCheck = fsCheckWith([]);
    const errors = await runRuleOnSource(OFM022Rule, "![[missing.png]]", {}, null, fsCheck);
    expect(errors).toEqual([]);
  });

  it("handles multiple embeds on one line", async () => {
    const vault = stubVault([]);
    const fsCheck = fsCheckWith(["a.png"]);
    const errors = await runRuleOnSource(
      OFM022Rule,
      "![[a.png]] and ![[b.png]]",
      {},
      vault,
      fsCheck,
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("b.png");
  });
});
