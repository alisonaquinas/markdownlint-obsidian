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

After(async function (this: OFMWorld) {
  await this.cleanup();
});
