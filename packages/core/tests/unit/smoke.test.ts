/**
 * Smoke test verifying the bun:test runner is operational.
 *
 * @module tests/unit/smoke.test
 */
import { describe, it, expect } from "bun:test";

describe("smoke", () => {
  it("bun:test is running", () => {
    expect(1 + 1).toBe(2);
  });
});
