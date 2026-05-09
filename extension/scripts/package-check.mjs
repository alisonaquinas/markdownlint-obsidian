/**
 * Verify release-critical VS Code extension package invariants.
 *
 * This script is intentionally small and offline so CI, pre-release checks, and
 * local verification all enforce the same manifest and build-output contract.
 */

import { readFile, stat } from "node:fs/promises";

const manifest = JSON.parse(await readFile("package.json", "utf8"));

/** Record a package-check failure without throwing away later findings. */
function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

if (!manifest.extensionDependencies?.includes("alisonaquinas.flavor-grenade-lsp")) {
  fail("manifest must depend on alisonaquinas.flavor-grenade-lsp");
}

if (manifest.dependencies?.["markdownlint-obsidian-cli"] !== undefined) {
  fail("extension must not depend on markdownlint-obsidian-cli");
}

if (manifest.dependencies?.["markdownlint-obsidian"] === undefined) {
  fail("extension must depend on markdownlint-obsidian");
}

if (!manifest.activationEvents?.includes("onLanguage:ofmarkdown")) {
  fail("extension must activate on the ofmarkdown language");
}

if (manifest.icon !== "images/icon.png") {
  fail("extension manifest must use images/icon.png as the Marketplace icon");
}

const contributedCommandIds = new Set(
  (manifest.contributes?.commands ?? []).map((command) => command.command),
);

for (const command of [
  "markdownlintObsidian.lintWorkspace",
  "markdownlintObsidian.openConfig",
  "markdownlintObsidian.disable",
  "markdownlintObsidian.enable",
  "markdownlintObsidian.previewFixes",
  "markdownlintObsidian.fixAll",
]) {
  if (!contributedCommandIds.has(command)) {
    fail(`extension manifest must contribute command ${command}`);
  }
}

const paletteCommands = new Set(
  (manifest.contributes?.menus?.commandPalette ?? []).map((entry) => entry.command),
);

for (const command of contributedCommandIds) {
  if (!paletteCommands.has(command)) {
    fail(`extension manifest must expose ${command} in commandPalette`);
  }
}

if (!Array.isArray(manifest.contributes?.jsonValidation)) {
  fail("extension manifest must contribute JSON validation for supported config files");
}

try {
  await stat("dist/extension.cjs");
} catch {
  fail("dist/extension.cjs is missing; run bun run build first");
}

const bundle = await readFile("dist/extension.cjs", "utf8").catch(() => "");
if (bundle.includes('require("./impl/')) {
  fail("dist/extension.cjs must not contain unresolved jsonc-parser UMD requires");
}

try {
  await stat("schemas/obsidian-linter.schema.json");
} catch {
  fail("schemas/obsidian-linter.schema.json is missing");
}

try {
  const icon = await readFile("images/icon.png");
  const pngSignature = "89504e470d0a1a0a";
  const actualSignature = icon.subarray(0, 8).toString("hex");
  if (actualSignature !== pngSignature) {
    fail("images/icon.png must be a PNG file");
  }
  const width = icon.readUInt32BE(16);
  const height = icon.readUInt32BE(20);
  const colorType = icon.readUInt8(25);
  if (width < 128 || height < 128) {
    fail("images/icon.png must be at least 128x128 pixels");
  }
  if (colorType !== 6) {
    fail("images/icon.png must use RGBA color so transparent edges are preserved");
  }
} catch {
  fail("images/icon.png is missing");
}
