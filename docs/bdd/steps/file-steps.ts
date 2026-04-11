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

// ---- Phase 3 frontmatter steps ---------------------------------------------

Given(
  "a file {string} with frontmatter missing {string}",
  async function (this: OFMWorld, relPath: string, missingKey: string) {
    if (!this.vaultDir) await this.initVault();
    if (missingKey === "") throw new Error("missing key must be non-empty");
    await this.writeFile(relPath, "---\nauthor: Someone\n---\n\nbody\n");
  },
);

Given("the config requires frontmatter key {string}", async function (this: OFMWorld, key: string) {
  if (!this.vaultDir) await this.initVault();
  const cfg = {
    frontmatter: {
      required: [key],
      dateFields: [],
      typeMap: {},
      allowUnknown: true,
    },
  };
  await this.writeFile(".obsidian-linter.jsonc", JSON.stringify(cfg));
});

Given(
  "a file {string} with frontmatter {string}",
  async function (this: OFMWorld, relPath: string, yamlLine: string) {
    if (!this.vaultDir) await this.initVault();
    await this.writeFile(relPath, `---\n${yamlLine}\n---\n\nbody\n`);
  },
);

Given("the config declares {string} as a date field", async function (this: OFMWorld, key: string) {
  if (!this.vaultDir) await this.initVault();
  const cfg = {
    frontmatter: {
      required: [],
      dateFields: [key],
      typeMap: {},
      allowUnknown: true,
    },
  };
  await this.writeFile(".obsidian-linter.jsonc", JSON.stringify(cfg));
});

Given(
  "a file {string} with frontmatter {string} and {string}",
  async function (this: OFMWorld, relPath: string, a: string, b: string) {
    if (!this.vaultDir) await this.initVault();
    await this.writeFile(relPath, `---\n${a}\n${b}\n---\n\nbody\n`);
  },
);

Given(
  "the config requires frontmatter key {string} and declares {string} as a date field",
  async function (this: OFMWorld, key: string, dateKey: string) {
    if (!this.vaultDir) await this.initVault();
    const cfg = {
      frontmatter: {
        required: [key],
        dateFields: [dateKey],
        typeMap: {},
        allowUnknown: true,
      },
    };
    await this.writeFile(".obsidian-linter.jsonc", JSON.stringify(cfg));
  },
);

// ---- Phase 3 tag steps -----------------------------------------------------

Given(
  "a config file with {string} set to {int}",
  async function (this: OFMWorld, dotKey: string, value: number) {
    if (!this.vaultDir) await this.initVault();
    const cfg: Record<string, unknown> = {};
    const parts = dotKey.split(".");
    let cursor: Record<string, unknown> = cfg;
    for (let i = 0; i < parts.length - 1; i += 1) {
      cursor[parts[i]!] = {};
      cursor = cursor[parts[i]!] as Record<string, unknown>;
    }
    cursor[parts.at(-1)!] = value;
    await this.writeFile(".obsidian-linter.jsonc", JSON.stringify(cfg));
  },
);
