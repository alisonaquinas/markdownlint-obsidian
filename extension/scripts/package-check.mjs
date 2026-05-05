import { readFile, stat } from "node:fs/promises";

const manifest = JSON.parse(await readFile("package.json", "utf8"));

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

try {
  await stat("dist/extension.cjs");
} catch {
  fail("dist/extension.cjs is missing; run bun run build first");
}
