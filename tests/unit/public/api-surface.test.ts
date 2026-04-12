import { describe, it, expect } from "vitest";
import * as api from "../../../src/public/index.js";
import * as rules from "../../../src/public/rules.js";
// Compile-time assertion: if FileExistenceChecker is not exported, tsc fails here
import type { FileExistenceChecker as _FEC } from "../../../src/public/index.js";

describe("public API surface", () => {
  it("exports rule primitive factories", () => {
    expect(typeof api.makeLintError).toBe("function");
    expect(typeof api.makeLintResult).toBe("function");
    expect(typeof api.makeFix).toBe("function");
  });

  it("makeFix validates inputs", () => {
    expect(() =>
      api.makeFix({ lineNumber: 0, editColumn: 1, deleteCount: 0, insertText: "" }),
    ).toThrow("lineNumber");
  });

  it("exports every built-in rule constant", () => {
    expect(typeof rules.OFM001Rule).toBe("object");
    expect(typeof rules.OFM080Rule).toBe("object");
    expect(typeof rules.frontmatterParseErrorRule).toBe("object");
    expect(Object.keys(rules).length).toBe(44); // update when new built-in rules are added
  });

  it("OFMRule interface is structurally correct (compile-time smoke)", () => {
    // If the OFMRule interface changes shape, this block fails to compile.
    const _rule = {
      names: ["SMOKE001", "smoke-rule"] as const,
      description: "smoke test",
      tags: ["test"] as const,
      severity: "error" as const,
      fixable: false,
      run(_params: api.RuleParams, _onError: api.OnErrorCallback): void {},
    } satisfies api.OFMRule;
    expect(_rule.names[0]).toBe("SMOKE001");
  });
});
