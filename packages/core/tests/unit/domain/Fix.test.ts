import { describe, it, expect } from "bun:test";
import { makeFix } from "../../../src/domain/linting/Fix.js";

describe("Fix", () => {
  it("creates a frozen object with correct fields", () => {
    const fix = makeFix({
      lineNumber: 5,
      editColumn: 10,
      deleteCount: 3,
      insertText: "replacement",
    });

    expect(fix.lineNumber).toBe(5);
    expect(fix.editColumn).toBe(10);
    expect(fix.deleteCount).toBe(3);
    expect(fix.insertText).toBe("replacement");
    expect(Object.isFrozen(fix)).toBe(true);
  });

  it("throws when lineNumber < 1", () => {
    expect(() =>
      makeFix({
        lineNumber: 0,
        editColumn: 1,
        deleteCount: 0,
        insertText: "",
      }),
    ).toThrow("Fix.lineNumber must be >= 1");

    expect(() =>
      makeFix({
        lineNumber: -5,
        editColumn: 1,
        deleteCount: 0,
        insertText: "",
      }),
    ).toThrow("Fix.lineNumber must be >= 1");
  });

  it("throws when editColumn < 1", () => {
    expect(() =>
      makeFix({
        lineNumber: 1,
        editColumn: 0,
        deleteCount: 0,
        insertText: "",
      }),
    ).toThrow("Fix.editColumn must be >= 1");

    expect(() =>
      makeFix({
        lineNumber: 1,
        editColumn: -3,
        deleteCount: 0,
        insertText: "",
      }),
    ).toThrow("Fix.editColumn must be >= 1");
  });

  it("throws when deleteCount < 0", () => {
    expect(() =>
      makeFix({
        lineNumber: 1,
        editColumn: 1,
        deleteCount: -1,
        insertText: "",
      }),
    ).toThrow("Fix.deleteCount must be >= 0");
  });

  it("allows deleteCount: 0 (pure insertion)", () => {
    const fix = makeFix({
      lineNumber: 1,
      editColumn: 5,
      deleteCount: 0,
      insertText: "inserted",
    });

    expect(fix.deleteCount).toBe(0);
    expect(fix.insertText).toBe("inserted");
    expect(Object.isFrozen(fix)).toBe(true);
  });

  it("allows insertText to be empty string (pure deletion)", () => {
    const fix = makeFix({
      lineNumber: 2,
      editColumn: 3,
      deleteCount: 5,
      insertText: "",
    });

    expect(fix.deleteCount).toBe(5);
    expect(fix.insertText).toBe("");
    expect(Object.isFrozen(fix)).toBe(true);
  });
});
