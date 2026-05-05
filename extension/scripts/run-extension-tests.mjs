import { runTests } from "@vscode/test-electron";
import { resolve } from "node:path";

await runTests({
  extensionDevelopmentPath: resolve("."),
  extensionTestsPath: resolve("tests/integration/suite/index.cjs"),
  launchArgs: [resolve("tests/fixtures/workspace"), "--disable-extensions"],
});
