import { When } from "@cucumber/cucumber";
import type { OFMWorld } from "./world.js";

When("I run markdownlint-obsidian on {string}", async function (this: OFMWorld, glob: string) {
  await this.runCLI(glob);
});

When(
  "I run markdownlint-obsidian on {string} with {string}",
  async function (this: OFMWorld, glob: string, extraArgsStr: string) {
    const extraArgs = extraArgsStr.split(" ").filter(Boolean);
    await this.runCLI(glob, extraArgs);
  },
);
