import { describe, it, expect } from "vitest";
import { isIsoDate } from "../../../../../src/infrastructure/rules/ofm/frontmatter/shared/DateFormat.js";

describe("isIsoDate", () => {
  it.each([
    "2026-04-11",
    "2026-04-11T12:00:00",
    "2026-04-11T12:00:00Z",
    "1999-12-31T23:59:59.999Z",
    "2026-04-11T12:00:00+02:00",
    "2026-04-11T12:00:00-05:00",
  ])("accepts %s", (input) => {
    expect(isIsoDate(input)).toBe(true);
  });

  it.each([
    "2026/04/11",
    "04-11-2026",
    "not-a-date",
    "",
    "2026-13-40",
    "2026-04-11 12:00:00",
  ])("rejects %s", (input) => {
    expect(isIsoDate(input)).toBe(false);
  });

  it.each([null, undefined, 42, true, [], {}])("rejects non-string %s", (input) => {
    expect(isIsoDate(input)).toBe(false);
  });

  it("accepts a valid Date instance (gray-matter coerces unquoted YAML dates)", () => {
    expect(isIsoDate(new Date("2026-04-11"))).toBe(true);
  });

  it("rejects an Invalid Date instance", () => {
    expect(isIsoDate(new Date("not-a-date"))).toBe(false);
  });
});
