/**
 * Unit tests for {@link runRuleOnSource} test helper.
 *
 * @module tests/unit/rules/helpers/runRuleOnSource.test
 */
import { describe, it, expect } from "bun:test";
import { runRuleOnSource } from "./runRuleOnSource.js";
import type { OFMRule } from "../../../../src/domain/linting/OFMRule.js";

const alwaysErrorRule: OFMRule = {
  names: ["TEST001", "always-error"],
  description: "Test double",
  tags: ["test"],
  severity: "error",
  fixable: false,
  run(_params, onError) {
    onError({ line: 1, column: 1, message: "boom" });
  },
};

const noopRule: OFMRule = {
  names: ["TEST002", "noop"],
  description: "Test double",
  tags: ["test"],
  severity: "error",
  fixable: false,
  run() {
    /* no-op */
  },
};

describe("runRuleOnSource", () => {
  it("returns LintErrors emitted by the rule", async () => {
    const errors = await runRuleOnSource(alwaysErrorRule, "# hi");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("TEST001");
    expect(errors[0]?.ruleName).toBe("always-error");
    expect(errors[0]?.message).toBe("boom");
  });

  it("returns empty array when rule emits nothing", async () => {
    const errors = await runRuleOnSource(noopRule, "# hi");
    expect(errors).toEqual([]);
  });

  it("returns OFM902 when frontmatter parsing fails", async () => {
    const errors = await runRuleOnSource(noopRule, "---\n : invalid :\n---\nbody\n");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM902");
  });
});
