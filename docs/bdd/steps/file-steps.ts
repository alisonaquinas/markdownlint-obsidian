import { Given } from "@cucumber/cucumber";
import * as path from "node:path";
import type { OFMWorld } from "./world.js";

Given("a vault with a file {string}", async function (this: OFMWorld, relPath: string) {
  await this.initVault();
  await this.writeFile(relPath, `# ${path.basename(relPath, ".md")}\n`);
});

// ---- Phase 4 wikilink + vault-detection steps ----------------------------

Given("a file {string}", async function (this: OFMWorld, relPath: string) {
  if (!this.vaultDir) await this.initVault();
  await this.writeFile(relPath, `# ${path.basename(relPath, ".md")}\n`);
});

Given(
  "a directory tree with {string} at {string}",
  async function (this: OFMWorld, marker: string, relSubdir: string) {
    if (marker !== ".obsidian/") {
      throw new Error(`unsupported marker: ${marker}`);
    }
    if (!this.vaultDir) await this.initBareDir();
    await this.markObsidianVault(relSubdir);
    // Subsequent CLI calls should run from inside the declared subdir
    // so vault detection walks up and finds the newly created .obsidian/.
    this.cliCwdSubdir = relSubdir;
  },
);

Given(
  "a git repo root at {string} with no {string} directory",
  async function (this: OFMWorld, relSubdir: string, absentMarker: string) {
    if (absentMarker !== ".obsidian/") {
      throw new Error(`unsupported absent marker: ${absentMarker}`);
    }
    if (!this.vaultDir) await this.initBareDir();
    await this.markGitRepo(relSubdir);
    this.cliCwdSubdir = relSubdir;
  },
);

Given(
  "a directory with no {string} and no git repo",
  async function (this: OFMWorld, absentMarker: string) {
    if (absentMarker !== ".obsidian/") {
      throw new Error(`unsupported absent marker: ${absentMarker}`);
    }
    if (!this.vaultDir) await this.initBareDir();
    // No markers created; vault detection should throw OFM900 unless an
    // ancestor of the temp dir happens to contain .git/ (the assertion
    // tolerates that via a conditional check in the feature's Then step).
  },
);

Given(
  "a config file setting vaultRoot to {string}",
  async function (this: OFMWorld, vaultRootPath: string) {
    if (!this.vaultDir) await this.initVault();
    const cfg = { vaultRoot: path.resolve(this.vaultDir, vaultRootPath), resolve: true };
    await this.writeFile(".obsidian-linter.jsonc", JSON.stringify(cfg));
  },
);

Given("a vault with no lint errors", async function (this: OFMWorld) {
  await this.initVault();
  await this.writeFile("notes/clean.md", "# Clean\n");
});

Given(
  "a file {string} containing {string}",
  async function (this: OFMWorld, relPath: string, content: string) {
    if (!this.vaultDir) await this.initVault();
    await this.writeFile(relPath, ensureTrailingNewline(content));
  },
);

Given(
  "a file {string} containing:",
  async function (this: OFMWorld, relPath: string, content: string) {
    if (!this.vaultDir) await this.initVault();
    await this.writeFile(relPath, ensureTrailingNewline(content));
  },
);

/**
 * Ensure a BDD fixture ends with exactly one trailing newline.
 *
 * Without this the Phase 7 MD047 (single-trailing-newline) rule fires on
 * every inline step-string that was written as `"See [[a#^one]]"`, which
 * is not what the wikilink/block-reference feature files are trying to
 * test. Triple-quoted heredocs already end with `\n`, so this helper is a
 * no-op for them.
 */
function ensureTrailingNewline(content: string): string {
  return content.endsWith("\n") ? content : `${content}\n`;
}

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

// ---- Phase 5 callout + embed steps ----------------------------------------

// Matches a step like `the config allowList is ["NOTE", "WARNING", ...]`.
// Cucumber's `{string}` expression would greedily capture each quoted token
// and call the step with N arguments; a regex binds the whole JSON array
// as a single capture group so we can parse it once.
Given(/^the config allowList is (\[.*\])$/, async function (this: OFMWorld, listJson: string) {
  if (!this.vaultDir) await this.initVault();
  const list = JSON.parse(listJson) as string[];
  const cfg = {
    callouts: {
      allowList: list,
      caseSensitive: false,
      requireTitle: false,
      allowFold: true,
    },
  };
  await this.writeFile(".obsidian-linter.jsonc", JSON.stringify(cfg));
});

Given("the config allowList includes {string}", async function (this: OFMWorld, extra: string) {
  if (!this.vaultDir) await this.initVault();
  const defaults = ["NOTE", "WARNING", "TIP", "IMPORTANT", "CAUTION"];
  const cfg = {
    callouts: {
      allowList: [...defaults, extra],
      caseSensitive: false,
      requireTitle: false,
      allowFold: true,
    },
  };
  await this.writeFile(".obsidian-linter.jsonc", JSON.stringify(cfg));
});

// ---- Phase 6 highlight steps ----------------------------------------------

Given("a config file disabling highlights", async function (this: OFMWorld) {
  if (!this.vaultDir) await this.initVault();
  const cfg = {
    highlights: { allow: false, allowedGlobs: [] },
    rules: { OFM120: { enabled: true } },
  };
  await this.writeFile(".obsidian-linter.jsonc", JSON.stringify(cfg));
});

// ---- Phase 8 CI exit-code steps -------------------------------------------

Given("a vault with a broken wikilink", async function (this: OFMWorld) {
  await this.initVault();
  // Write a file that links to a page that does not exist in the vault.
  // OFM001 (error severity) fires and drives exit code 1.
  await this.writeFile("notes/index.md", "# Index\n\nSee [[no-such-page]]\n");
});

Given("a config file with invalid JSON", async function (this: OFMWorld) {
  await this.initVault();
  // Write a stub markdown file so the glob matches at least one file.
  await this.writeFile("notes/clean.md", "# Clean\n");
  // Write a config with an unknown key — ConfigValidator throws OFM901,
  // loadConfig returns null, and the CLI exits with code 2.
  await this.writeFile(".obsidian-linter.jsonc", JSON.stringify({ __invalid_key__: true }));
});

// ---- Phase 10 custom-rules steps ------------------------------------------

Given("a vault with a custom rule that always fires", async function (this: OFMWorld) {
  await this.initVault();
  // Write the custom rule module — a plain ESM file that always fires DEMO001.
  await this.writeFile(
    "rules/demo-rule.mjs",
    [
      "export default {",
      '  names: ["DEMO001"],',
      '  description: "Demo rule that always fires",',
      '  tags: ["demo"],',
      '  severity: "error",',
      "  fixable: false,",
      "  run(_params, onError) {",
      '    onError({ line: 1, column: 1, message: "demo rule fired" });',
      "  },",
      "};",
    ].join("\n") + "\n",
  );
  // Config pointing at the rule module.
  await this.writeFile(
    ".obsidian-linter.jsonc",
    JSON.stringify({ customRules: ["./rules/demo-rule.mjs"] }),
  );
  // A note file for the linter to process.
  await this.writeFile("notes/note.md", "# Note\n");
});

Given(
  "a vault with a customRules entry pointing to a missing file",
  async function (this: OFMWorld) {
    await this.initVault();
    // Config pointing at a file that does not exist — triggers OFM905 on stderr.
    await this.writeFile(
      ".obsidian-linter.jsonc",
      JSON.stringify({ customRules: ["./does-not-exist.mjs"] }),
    );
    // A clean note file so the linter has something to process.
    await this.writeFile("notes/clean.md", "# Clean\n");
  },
);

Given("a file with a warning-severity rule violation", async function (this: OFMWorld) {
  await this.initVault();
  // OFM005 (wikilink-case-mismatch) has severity "warning". It fires when a
  // wikilink resolves only via case-insensitive fallback. The file
  // "notes/target.md" exists; linking as [[Target]] (capitalised) triggers
  // OFM005. Warnings do not set hasErrors, so the exit code remains 0.
  await this.writeFile("notes/target.md", "# Target\n");
  await this.writeFile("notes/index.md", "# Index\n\nSee [[Target]]\n");
});
