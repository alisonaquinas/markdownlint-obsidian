import { describe, it, expect } from "bun:test";

describe("smoke", () => {
  it("vitest is running", () => {
    expect(1 + 1).toBe(2);
  });
});
