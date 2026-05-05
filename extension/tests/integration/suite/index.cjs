/**
 * VS Code extension-host smoke test entry point.
 *
 * `@vscode/test-electron` loads this CommonJS module inside the Extension
 * Development Host. Keep the suite focused on VS Code integration checks that
 * cannot run in plain Bun unit tests.
 */

const vscode = require("vscode");
const assert = require("node:assert");

/** Verify the development extension is installed in the launched host. */
async function run() {
  const extension = vscode.extensions.getExtension("alisonaquinas.markdownlint-obsidian-vscode");
  assert(extension, "development extension should be installed in the test host");
}

module.exports = { run };
