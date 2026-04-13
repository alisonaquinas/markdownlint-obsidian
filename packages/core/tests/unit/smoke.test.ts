import { describe, it, expect } from "bun:test";

describe("smoke", () => {
  it("bun:test is running", () => {
    expect(1 + 1).toBe(2);
  });
});
