/**
 * Prepare the isolated VS Code profile used by extension/.vscode/launch.json.
 *
 * The desktop `extensionHost` debugger launches with the active VS Code
 * profile, so this script installs the real Flavor Grenade dependency plus
 * this extension's VSIX into that profile before F5 starts the host.
 */

import { resolveCliArgsFromVSCodeExecutablePath } from "@vscode/test-electron";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const vscodeExecutablePath = process.argv[2];
if (vscodeExecutablePath === undefined) {
  throw new Error("Usage: node scripts/prepare-f5-profile.mjs <vscode-executable-path>");
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const extensionRoot = resolve(scriptDir, "..");
const repoRoot = resolve(extensionRoot, "..");
const profileRoot = resolve(extensionRoot, ".vscode-test", "f5");
mkdirSync(profileRoot, { recursive: true });

const [cliPath, ...cliArgs] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
const isolatedCliArgs = cliArgs.filter(
  (arg) => !arg.startsWith("--user-data-dir=") && !arg.startsWith("--extensions-dir="),
);
const extensionVsix = packageCurrentExtension(profileRoot);
const flavorGrenadeInstall = runCodeCli(cliPath, [
  ...isolatedCliArgs,
  "--install-extension",
  "alisonaquinas.flavor-grenade-lsp",
  "--force",
]);

if (flavorGrenadeInstall.status !== 0) {
  throw new Error("Failed to install Flavor Grenade for F5 debugging");
}

const extensionInstall = runCodeCli(cliPath, [
  ...isolatedCliArgs,
  "--install-extension",
  extensionVsix,
  "--force",
]);

if (extensionInstall.status !== 0) {
  throw new Error("Failed to install markdownlint Obsidian VSIX for F5 debugging");
}

const installedExtensions = listInstalledExtensions(cliPath, isolatedCliArgs);
for (const id of [
  "alisonaquinas.flavor-grenade-lsp",
  "alisonaquinas.markdownlint-obsidian-vscode",
]) {
  if (!installedExtensions.includes(id)) {
    throw new Error(`Expected ${id} to be installed in the active VS Code profile`);
  }
}

writeFileSync(
  resolve(extensionRoot, "F5_DEBUG_SESSION.md"),
  [
    "# F5 Debug Session",
    "",
    `Prepared: ${new Date().toISOString()}`,
    "",
    "Expected debug workspace:",
    "",
    `- ${repoRoot}`,
    "",
    "Installed into the active VS Code profile used by the extensionHost debugger:",
    "",
    "- alisonaquinas.flavor-grenade-lsp",
    "- alisonaquinas.markdownlint-obsidian-vscode",
    "",
    "Use the `Run Extension` launch config when opening the extension folder.",
    "Use the `Extension: Run` launch config when opening the repository root.",
    "",
  ].join("\n"),
);

process.stdout.write(
  [
    "",
    "F5 debug profile prepared:",
    "  profile: active VS Code profile used by the extensionHost debugger",
    `  workspace: ${repoRoot}`,
    "  installed: alisonaquinas.flavor-grenade-lsp",
    "  installed: alisonaquinas.markdownlint-obsidian-vscode",
    "  verified with: code --list-extensions",
    "",
  ].join("\n"),
);

/** Package the local extension so it appears in the test host's Extensions view. */
function packageCurrentExtension(parentDir) {
  const vsce = resolve(
    repoRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "vsce.exe" : "vsce",
  );
  const vsixPath = join(parentDir, "markdownlint-obsidian-vscode.vsix");
  const packaged = spawnSync(vsce, ["package", "--no-dependencies", "--out", vsixPath], {
    cwd: extensionRoot,
    encoding: "utf-8",
    stdio: "inherit",
  });
  if (packaged.status !== 0) throw new Error("Failed to package markdownlint Obsidian VSIX");
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

function listInstalledExtensions(cliPath, args) {
  const result =
    process.platform === "win32"
      ? spawnSync(
          process.env.ComSpec ?? "cmd.exe",
          ["/d", "/s", "/c", basename(cliPath), ...args, "--list-extensions"],
          {
            cwd: dirname(cliPath),
            encoding: "utf-8",
          },
        )
      : spawnSync(cliPath, [...args, "--list-extensions"], { encoding: "utf-8" });
  if (result.status !== 0) {
    throw new Error("Failed to list active VS Code profile extensions");
  }
  return result.stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}
