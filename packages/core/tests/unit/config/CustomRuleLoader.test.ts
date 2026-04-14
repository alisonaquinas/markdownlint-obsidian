/**
 * Unit tests for {@link loadCustomRules}.
 *
 * @module tests/unit/config/CustomRuleLoader.test
 */
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs/promises";
import { loadCustomRules } from "../../../src/infrastructure/config/CustomRuleLoader.js";

const VALID_RULE_SRC = `
export default {
  names: ["UNIT001", "unit-test-rule"],
  description: "test",
  tags: ["test"],
  severity: "error",
  fixable: false,
  run(_p, onError) { onError({ line: 1, column: 1, message: "test" }); },
};
`;

const ARRAY_RULE_SRC = `
const r1 = {
  names: ["UNIT002"], description: "r2", tags: [], severity: "error", fixable: false,
  run(_p, _e) {},
};
const r2 = {
  names: ["UNIT003"], description: "r3", tags: [], severity: "warning", fixable: false,
  run(_p, _e) {},
};
export default [r1, r2];
`;

const MISSING_RUN_SRC = `
export default { names: ["BAD001"], description: "bad", tags: [], severity: "error", fixable: false };
`;

const NAMED_EXPORT_SRC = `
export const rules = [
  { names: ["UNIT004"], description: "named-export-rule", tags: [], severity: "error", fixable: false, run(_p, _e) {} },
];
`;

let tmp: string;

async function writeTmp(name: string, src: string): Promise<string> {
  const p = path.join(tmp, name);
  await fs.writeFile(p, src, "utf8");
  return p;
}

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-crloader-"));
});
afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("loadCustomRules", () => {
  it("loads a valid default-export rule", async () => {
    const p = await writeTmp("valid.mjs", VALID_RULE_SRC);
    const { rules, errors } = await loadCustomRules([p], tmp);
    expect(errors).toHaveLength(0);
    expect(rules).toHaveLength(1);
    expect(rules[0]?.names[0]).toBe("UNIT001");
  });

  it("loads a default-export array of rules", async () => {
    const p = await writeTmp("array.mjs", ARRAY_RULE_SRC);
    const { rules, errors } = await loadCustomRules([p], tmp);
    expect(errors).toHaveLength(0);
    expect(rules).toHaveLength(2);
  });

  it("produces a load error when module is unresolvable", async () => {
    const { rules, errors } = await loadCustomRules(["./nonexistent.mjs"], tmp);
    expect(rules).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.modulePath).toBe("./nonexistent.mjs");
  });

  it("produces a load error when rule is missing run()", async () => {
    const p = await writeTmp("bad.mjs", MISSING_RUN_SRC);
    const { rules, errors } = await loadCustomRules([p], tmp);
    expect(rules).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("run");
  });

  it("loads a named 'rules' export", async () => {
    const p = await writeTmp("named.mjs", NAMED_EXPORT_SRC);
    const { rules, errors } = await loadCustomRules([p], tmp);
    expect(errors).toHaveLength(0);
    expect(rules).toHaveLength(1);
    expect(rules[0]?.names[0]).toBe("UNIT004");
  });

  const EMPTY_ARRAY_SRC = `export default [];`;

  it("returns zero rules and zero errors when default export is an empty array", async () => {
    const p = await writeTmp("empty-array.mjs", EMPTY_ARRAY_SRC);
    const { rules, errors } = await loadCustomRules([p], tmp);
    expect(errors).toHaveLength(0);
    expect(rules).toHaveLength(0);
  });

  const NO_EXPORT_SRC = `export const unrelated = 42;`;

  it("produces a load error when module exports neither default nor rules", async () => {
    const p = await writeTmp("no-export.mjs", NO_EXPORT_SRC);
    const { rules, errors } = await loadCustomRules([p], tmp);
    expect(rules).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("does not export a rule object");
  });

  const FUNCTION_EXPORT_SRC = `
export default function makeRule() {
  return { names: ["FN001"], description: "test", tags: [], severity: "error", fixable: false,
           run(_p, _e) {} };
}
`;

  it("produces a load error when default export is a function (factory not called)", async () => {
    const p = await writeTmp("fn-export.mjs", FUNCTION_EXPORT_SRC);
    const { rules, errors } = await loadCustomRules([p], tmp);
    expect(rules).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("does not export a rule object");
  });
});
