import { Given } from "@cucumber/cucumber";
import * as path from "node:path";
import type { OFMWorld } from "./world.js";

Given("a vault with a file {string}", async function (this: OFMWorld, relPath: string) {
  await this.initVault();
  await this.writeFile(relPath, `# ${path.basename(relPath, ".md")}\n`);
});

Given("a vault with no lint errors", async function (this: OFMWorld) {
  await this.initVault();
  await this.writeFile("notes/clean.md", "# Clean\n");
});

Given(
  "a file {string} containing {string}",
  async function (this: OFMWorld, relPath: string, content: string) {
    if (!this.vaultDir) await this.initVault();
    await this.writeFile(relPath, content);
  },
);

Given(
  "a file {string} containing:",
  async function (this: OFMWorld, relPath: string, content: string) {
    if (!this.vaultDir) await this.initVault();
    await this.writeFile(relPath, content);
  },
);
