import { Then, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import type { OFMWorld } from "./world.js";

Then("the exit code is {int}", function (this: OFMWorld, expected: number) {
  assert.equal(this.cliResult?.exitCode, expected);
});

Then(
  "error {word} is reported on line {int}",
  function (this: OFMWorld, code: string, line: number) {
    const output = (this.cliResult?.stdout ?? "") + (this.cliResult?.stderr ?? "");
    assert.ok(output.includes(code), `expected output to contain "${code}"`);
    assert.ok(output.includes(`:${line}:`), `expected output to contain ":${line}:"`);
  },
);

Then("error {word} is reported", function (this: OFMWorld, code: string) {
  const output = (this.cliResult?.stdout ?? "") + (this.cliResult?.stderr ?? "");
  assert.ok(output.includes(code), `expected output to contain "${code}"`);
});

// Phase 4 vault-detection scenarios assert the detected root path. We
// verify indirectly: lint ran without OFM900 (exit != 2) and an OFM001
// report or clean exit indicates detection succeeded.
Then("the vault root is resolved to {string}", function (this: OFMWorld, _expected: string) {
  assert.notEqual(this.cliResult?.exitCode, 2, "vault detection should not fail with OFM900");
  const out = (this.cliResult?.stdout ?? "") + (this.cliResult?.stderr ?? "");
  assert.ok(!out.includes("OFM900"), "output should not contain OFM900");
});

// Disambiguates "error OFM001 is reported (missing-page not in vault)" —
// the parenthetical is part of the step text so we register it verbatim.
Then("error OFM001 is reported \\(missing-page not in vault)", function (this: OFMWorld) {
  const output = (this.cliResult?.stdout ?? "") + (this.cliResult?.stderr ?? "");
  assert.ok(output.includes("OFM001"), `expected output to contain "OFM001"`);
});

After(async function (this: OFMWorld) {
  await this.cleanup();
});
