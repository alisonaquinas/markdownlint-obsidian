import { describe, it, expect } from "vitest";
import { makeFixPlan } from "../../../src/domain/linting/FixPlan.js";
import { makeFix } from "../../../src/domain/linting/Fix.js";

describe("FixPlan", () => {
  it("returns a frozen object", () => {
    const fix = makeFix({
      lineNumber: 1,
      editColumn: 1,
      deleteCount: 0,
      insertText: "test",
    });
    const plan = makeFixPlan("test.md", [fix]);

    expect(Object.isFrozen(plan)).toBe(true);
  });

  it("makes a defensive copy of the fixes array", () => {
    const fixArray = [
      makeFix({
        lineNumber: 1,
        editColumn: 1,
        deleteCount: 0,
        insertText: "first",
      }),
    ];

    const plan = makeFixPlan("test.md", fixArray);

    fixArray.push(
      makeFix({
        lineNumber: 2,
        editColumn: 1,
        deleteCount: 0,
        insertText: "second",
      }),
    );

    expect(plan.fixes.length).toBe(1);
  });

  it("freezes the inner fixes array", () => {
    const fix = makeFix({
      lineNumber: 1,
      editColumn: 1,
      deleteCount: 0,
      insertText: "test",
    });
    const plan = makeFixPlan("test.md", [fix]);

    expect(Object.isFrozen(plan.fixes)).toBe(true);
  });

  it("works with empty fixes array", () => {
    const plan = makeFixPlan("test.md", []);

    expect(plan.filePath).toBe("test.md");
    expect(plan.fixes.length).toBe(0);
    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.fixes)).toBe(true);
  });
});
