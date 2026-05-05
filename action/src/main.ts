import * as core from "@actions/core";
import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

interface ActionInputs {
  readonly globs: readonly string[];
  readonly vaultRoot: string;
  readonly config: string;
  readonly format: string;
  readonly failOnWarnings: boolean;
}

interface CommandResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface ActionRuntime {
  readonly cwd: string;
  readonly getInput: (name: string) => string;
  readonly setOutput: (name: string, value: string) => void;
  readonly setFailed: (message: string) => void;
  readonly writeStdout: (value: string) => void;
  readonly writeStderr: (value: string) => void;
  readonly writeFile: (filePath: string, content: string) => Promise<void>;
  readonly runCommand: (args: readonly string[], cwd: string) => Promise<CommandResult>;
}

interface Counts {
  readonly errors: number;
  readonly warnings: number;
}

/** Collect and normalise every action input up-front. */
function readInputs(getInput: ActionRuntime["getInput"]): ActionInputs {
  const rawFailOnWarnings = getInput("fail-on-warnings") || "false";
  return {
    globs: getInput("globs").split(/\s+/).filter(Boolean),
    vaultRoot: getInput("vault-root"),
    config: getInput("config"),
    format: getInput("format") || "default",
    failOnWarnings: /^(true|True|TRUE)$/.test(rawFailOnWarnings),
  };
}

function buildCliArgs(inputs: ActionInputs, formatter: string): string[] {
  const argv: string[] = ["--output-formatter", formatter];
  if (inputs.vaultRoot) argv.push("--vault-root", inputs.vaultRoot);
  if (inputs.config) argv.push("--config", inputs.config);
  argv.push(...inputs.globs);
  return argv;
}

function countJsonResults(stdout: string): Counts {
  const parsed = JSON.parse(stdout) as Array<{
    readonly errors?: Array<{ readonly severity?: string }>;
  }>;
  return parsed.reduce(
    (counts, result) => {
      const errors = result.errors ?? [];
      return {
        errors: counts.errors + errors.filter((error) => error.severity === "error").length,
        warnings: counts.warnings + errors.filter((error) => error.severity === "warning").length,
      };
    },
    { errors: 0, warnings: 0 },
  );
}

async function runCli(
  runtime: ActionRuntime,
  inputs: ActionInputs,
  formatter: string,
): Promise<CommandResult> {
  return runtime.runCommand(buildCliArgs(inputs, formatter), runtime.cwd);
}

/**
 * Entry point for the GitHub Action.
 *
 * Runs the npm-distributed CLI through `npx`; a JSON pass supplies structured
 * counts, while the requested formatter preserves user-facing output.
 */
export async function runAction(runtime: ActionRuntime = makeDefaultRuntime()): Promise<void> {
  const inputs = readInputs(runtime.getInput);
  const counted = await runCountPass(runtime, inputs);
  if (counted === null) return;
  const displayRun = await runDisplayPass(runtime, inputs, counted.jsonRun);
  const counts = counted.counts;
  runtime.setOutput("error-count", String(counts.errors));
  runtime.setOutput("warning-count", String(counts.warnings));
  await emitDisplay(runtime, inputs, displayRun);
  failWhenNeeded(runtime, inputs, displayRun, counted.counts);
}

async function runCountPass(
  runtime: ActionRuntime,
  inputs: ActionInputs,
): Promise<{ readonly counts: Counts; readonly jsonRun: CommandResult } | null> {
  const jsonRun = await runCli(runtime, inputs, "json");
  if (jsonRun.exitCode === 2) {
    if (jsonRun.stderr) runtime.writeStderr(jsonRun.stderr);
    runtime.setFailed("markdownlint-obsidian failed before producing lint results");
    return null;
  }
  try {
    return { counts: countJsonResults(jsonRun.stdout), jsonRun };
  } catch (err) {
    runtime.setFailed(`Failed to parse markdownlint-obsidian JSON output: ${formatError(err)}`);
    return null;
  }
}

async function runDisplayPass(
  runtime: ActionRuntime,
  inputs: ActionInputs,
  jsonRun: CommandResult,
): Promise<CommandResult> {
  return inputs.format === "json" ? jsonRun : runCli(runtime, inputs, inputs.format);
}

async function emitDisplay(
  runtime: ActionRuntime,
  inputs: ActionInputs,
  displayRun: CommandResult,
): Promise<void> {
  if (inputs.format === "sarif") {
    const sarifPath = path.join(runtime.cwd, "markdownlint-obsidian.sarif");
    await runtime.writeFile(sarifPath, displayRun.stdout);
    runtime.setOutput("sarif-path", sarifPath);
  } else if (displayRun.stdout) {
    runtime.writeStdout(displayRun.stdout);
  }

  if (displayRun.stderr) runtime.writeStderr(displayRun.stderr);
}

function failWhenNeeded(
  runtime: ActionRuntime,
  inputs: ActionInputs,
  displayRun: CommandResult,
  counts: Counts,
): void {
  if (displayRun.exitCode !== 0) {
    runtime.setFailed(`markdownlint-obsidian exited with ${displayRun.exitCode}`);
    return;
  }
  if (inputs.failOnWarnings && counts.warnings > 0) {
    runtime.setFailed(`markdownlint-obsidian found ${counts.warnings} warning(s)`);
  }
}

function makeDefaultRuntime(): ActionRuntime {
  return {
    cwd: process.env.GITHUB_WORKSPACE ?? process.cwd(),
    getInput: core.getInput,
    setOutput: core.setOutput,
    setFailed: core.setFailed,
    writeStdout: (value: string): void => {
      process.stdout.write(value);
    },
    writeStderr: (value: string): void => {
      process.stderr.write(value);
    },
    writeFile: fs.writeFile,
    runCommand: runNpxCli,
  };
}

function runNpxCli(args: readonly string[], cwd: string): Promise<CommandResult> {
  return new Promise((resolve) => {
    const baseArgs = ["-y", "markdownlint-obsidian-cli@latest", ...args];
    const command = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "npx";
    const finalArgs =
      process.platform === "win32" ? ["/d", "/c", "npx.cmd", ...baseArgs] : baseArgs;
    const child = spawn(command, finalArgs, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("close", (code) => {
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });
  });
}

function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runAction().catch((err: unknown) => core.setFailed(formatError(err)));
}
