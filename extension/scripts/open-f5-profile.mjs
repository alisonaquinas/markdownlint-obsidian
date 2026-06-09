/**
 * Open the F5 workspace outside the debugger.
 *
 * Use this from the "open F5 workspace" task when you want to inspect the same
 * active VS Code profile that the desktop extensionHost debugger uses.
 */

import { resolveCliArgsFromVSCodeExecutablePath } from "@vscode/test-electron";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const vscodeExecutablePath = process.argv[2];
if (vscodeExecutablePath === undefined) {
  throw new Error("Usage: node scripts/open-f5-profile.mjs <vscode-executable-path>");
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const extensionRoot = resolve(scriptDir, "..");
const workspace = resolve(extensionRoot, "..");
const [cliPath, ...cliArgs] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
const isolatedCliArgs = cliArgs.filter(
  (arg) => !arg.startsWith("--user-data-dir=") && !arg.startsWith("--extensions-dir="),
);
const launch = runCodeCli(cliPath, [...isolatedCliArgs, "--new-window", workspace]);

if (launch.status !== 0) {
  throw new Error("Failed to open installed F5 profile");
}

/** Run VS Code's CLI, accounting for the Windows `.cmd` wrapper. */
function runCodeCli(cliPath, args) {
  if (process.platform !== "win32") {
    return spawnSync(cliPath, args, { encoding: "utf-8", stdio: "inherit" });
  }
  const command = resolveWindowsCodeCommand(cliPath);
  return spawnSync(command.executablePath, [command.cliScriptPath, ...args], {
    encoding: "utf-8",
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", VSCODE_DEV: "" },
    stdio: "inherit",
  });
}

function resolveWindowsCodeCommand(cliPath) {
  const executableName = windowsCodeExecutableName(cliPath);
  const codeRoot = resolve(dirname(cliPath), "..");
  return {
    executablePath: resolve(codeRoot, executableName),
    cliScriptPath: findVSCodeCliScript(codeRoot),
  };
}

function windowsCodeExecutableName(cliPath) {
  switch (basename(cliPath).toLowerCase()) {
    case "code.cmd":
      return "Code.exe";
    case "code-insiders.cmd":
      return "Code - Insiders.exe";
    default:
      throw new Error(`Unsupported VS Code CLI wrapper: ${basename(cliPath)}`);
  }
}

function findVSCodeCliScript(codeRoot) {
  for (const entry of readdirSync(codeRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const cliScriptPath = join(codeRoot, entry.name, "resources", "app", "out", "cli.js");
    if (existsSync(cliScriptPath)) return cliScriptPath;
  }
  throw new Error(`Unable to locate VS Code cli.js under ${codeRoot}`);
}
