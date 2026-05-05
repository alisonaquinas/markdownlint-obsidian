/**
 * Launch the VS Code Extension Development Host smoke suite.
 *
 * The host loads this checkout's extension package against a fixture workspace
 * and disables unrelated installed extensions so activation behavior stays
 * attributable to the development extension.
 */

import { runTests } from "@vscode/test-electron";
import { resolve } from "node:path";

await runTests({
  extensionDevelopmentPath: resolve("."),
  extensionTestsPath: resolve("tests/integration/suite/index.cjs"),
  launchArgs: [resolve("tests/fixtures/workspace"), "--disable-extensions"],
});
