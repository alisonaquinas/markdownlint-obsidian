const vscode = require("vscode");
const assert = require("node:assert");

async function run() {
  const extension = vscode.extensions.getExtension("alisonaquinas.markdownlint-obsidian-vscode");
  assert(extension, "development extension should be installed in the test host");
}

module.exports = { run };
