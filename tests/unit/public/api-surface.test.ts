import { describe, it, expect } from "vitest";
import * as api from "../../../src/public/index.js";
import * as rules from "../../../src/public/rules.js";

describe("public API surface", () => {
  it("exports rule primitive factories", () => {
    expect(typeof api.makeLintError).toBe("function");
    expect(typeof api.makeLintResult).toBe("function");
    expect(typeof api.makeFix).toBe("function");
  });

  it("makeFix validates inputs", () => {
    expect(() => api.makeFix({ lineNumber: 0, editColumn: 1, deleteCount: 0, insertText: "" }))
      .toThrow("lineNumber");
  });

  it("exports every built-in rule constant", () => {
    expect(typeof rules.OFM001Rule).toBe("object");
    expect(typeof rules.OFM080Rule).toBe("object");
    expect(typeof rules.frontmatterParseErrorRule).toBe("object");
    expect(Object.keys(rules).length).toBe(44);
  });
});
