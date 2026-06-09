/**
 * Launch the VS Code Extension Development Host smoke suite.
 *
 * The host loads this checkout's extension package against an isolated fixture
 * workspace and installs a lightweight Flavor Grenade stub so VS Code can
 * satisfy the declared extension dependency without starting the real LSP.
 */

import {
  downloadAndUnzipVSCode,
  resolveCliArgsFromVSCodeExecutablePath,
  runTests,
} from "@vscode/test-electron";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { resolve } from "node:path";

const flavorGrenadeExtensionId = "flavor-grenade-lsp";
const profileRoot = mkdtempSync(join(tmpdir(), "markdownlint-obsidian-vscode-"));
const userDataDir = join(profileRoot, "user-data");
const extensionsDir = join(profileRoot, "extensions");

try {
  const vscodeExecutablePath = await downloadAndUnzipVSCode();
  const [cliPath, ...cliArgs] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
  const isolatedCliArgs = cliArgs.filter(
    (arg) => !arg.startsWith("--user-data-dir=") && !arg.startsWith("--extensions-dir="),
  );
  const flavorGrenadeVsix = createFlavorGrenadeStubVsix(profileRoot);
  const install = runCodeCli(cliPath, [
    ...isolatedCliArgs,
    "--user-data-dir",
    userDataDir,
    "--extensions-dir",
    extensionsDir,
    "--install-extension",
    flavorGrenadeVsix,
  ]);
  if (install.status !== 0)
    throw new Error(`Failed to install ${flavorGrenadeExtensionId} for extension-host tests`);

  await runTests({
    vscodeExecutablePath,
    extensionDevelopmentPath: resolve("."),
    extensionTestsPath: resolve("tests/integration/suite/index.cjs"),
    launchArgs: [
      resolve("tests/fixtures/workspace"),
      "--user-data-dir",
      userDataDir,
      "--extensions-dir",
      extensionsDir,
    ],
  });
} finally {
  rmSync(profileRoot, { force: true, maxRetries: 5, recursive: true, retryDelay: 200 });
}

/** Package a minimal extension that satisfies VS Code's dependency graph. */
function createFlavorGrenadeStubVsix(parentDir) {
  const extensionDir = join(parentDir, "flavor-grenade-stub");
  mkdirSync(extensionDir);
  writeFileSync(
    join(extensionDir, "package.json"),
    JSON.stringify(
      {
        name: flavorGrenadeExtensionId,
        displayName: "Flavor Grenade LSP - Obsidian Markdown Support",
        publisher: "alisonaquinas",
        version: "0.0.0",
        license: "MIT",
        repository: {
          type: "git",
          url: "https://github.com/alisonaquinas/flavor-grenade-lsp.git",
        },
        engines: { vscode: "^1.118.0" },
        main: "./extension.cjs",
        activationEvents: ["onStartupFinished"],
        categories: ["Other"],
        files: ["extension.cjs", "README.md", "LICENSE"],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(extensionDir, "extension.cjs"),
    "exports.activate = function activate() {}; exports.deactivate = function deactivate() {};\n",
  );
  writeFileSync(join(extensionDir, "README.md"), "# Flavor Grenade LSP test stub\n");
  writeFileSync(join(extensionDir, "LICENSE"), "MIT\n");

  const vsce = resolve("node_modules", "@vscode", "vsce", "vsce");
  const vsixPath = join(parentDir, "flavor-grenade-stub.vsix");
  const packaged = spawnSync(
    process.execPath,
    [vsce, "package", "--no-dependencies", "--out", vsixPath],
    {
      cwd: extensionDir,
      encoding: "utf-8",
      stdio: "inherit",
    },
  );
  if (packaged.status !== 0) throw new Error("Failed to package Flavor Grenade test stub");
  return vsixPath;
}

/** Run VS Code's CLI, accounting for the Windows `.cmd` wrapper. */
function runCodeCli(cliPath, args) {
  if (process.platform !== "win32") {
    return spawnSync(cliPath, args, { encoding: "utf-8", stdio: "inherit" });
  }
  return spawnSync(
    process.env.ComSpec ?? "cmd.exe",
    ["/d", "/s", "/c", basename(cliPath), ...args],
    {
      cwd: dirname(cliPath),
      encoding: "utf-8",
      stdio: "inherit",
    },
  );
}
