import { describe, it, expect } from "vitest";
import { makeLintError } from "../../../src/domain/linting/LintError.js";

describe("LintError", () => {
  it("creates a valid error with required fields", () => {
    const e = makeLintError({
      ruleCode: "OFM001",
      ruleName: "no-broken-wikilinks",
      severity: "error",
      line: 3,
      column: 1,
      message: "Wikilink target 'missing' not found in vault",
      fixable: false,
    });
    expect(e.ruleCode).toBe("OFM001");
    expect(e.line).toBe(3);
    expect(e.fixable).toBe(false);
  });

  it("is frozen (immutable)", () => {
    const e = makeLintError({
      ruleCode: "OFM001",
      ruleName: "no-broken-wikilinks",
      severity: "error",
      line: 1,
      column: 1,
      message: "msg",
      fixable: false,
    });
    expect(Object.isFrozen(e)).toBe(true);
  });
});
