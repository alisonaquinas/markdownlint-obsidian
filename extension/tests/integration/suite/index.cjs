/**
 * VS Code extension-host smoke test entry point.
 *
 * `@vscode/test-electron` loads this CommonJS module inside the Extension
 * Development Host. Keep the suite focused on VS Code integration checks that
 * cannot run in plain Bun unit tests.
 */

const vscode = require("vscode");
const assert = require("node:assert");

/** Verify the development extension installs, activates, and registers commands. */
async function run() {
  const extension = vscode.extensions.getExtension("alisonaquinas.markdownlint-obsidian-vscode");
  assert(extension, "development extension should be installed in the test host");
  await extension.activate();
  assert(extension.isActive, "development extension should activate in the test host");

  const commands = await vscode.commands.getCommands(true);
  assert(
    commands.includes("markdownlintObsidian.openConfig"),
    "openConfig command should be registered",
  );
  assert(
    commands.includes("markdownlintObsidian.previewFixes"),
    "previewFixes command should be registered",
  );

  await vscode.commands.executeCommand("markdownlintObsidian.openConfig");
  const editor = vscode.window.activeTextEditor;
  assert(editor, "openConfig should open a starter configuration document");
  assert.equal(editor.document.languageId, "jsonc");
  assert.match(editor.document.getText(), /"rules": \{\}/);
}

module.exports = { run };
