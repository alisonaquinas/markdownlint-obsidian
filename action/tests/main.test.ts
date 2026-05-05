/**
 * Purpose: Unit and smoke tests for the GitHub Action adapter.
 *
 * Provides: runtime-injected tests for outputs, failure semantics, SARIF output,
 * and a Node startup smoke for the committed action bundle.
 *
 * Role in system: Proves the action remains a thin wrapper around CLI invocations
 * while its GitHub-specific contract stays testable without network or npm access.
 *
 * @module action/tests/main.test
 */
import { describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { runAction, type ActionRuntime } from "../src/main.js";

interface Harness {
  readonly outputs: Map<string, string>;
  readonly failures: string[];
  readonly stdout: string[];
  readonly stderr: string[];
  readonly files: Map<string, string>;
  readonly runtime: ActionRuntime;
}

/**
 * Build an injected action runtime that records GitHub Action side effects.
 *
 * @param inputs - Action input values returned by `core.getInput`.
 * @param runs - Ordered fake CLI command results consumed by `runCommand`.
 * @returns Captured outputs, failures, streams, writes, and runtime adapter.
 */
function makeHarness(
  inputs: Record<string, string>,
  runs: readonly { readonly exitCode: number; readonly stdout: string; readonly stderr?: string }[],
): Harness {
  const outputs = new Map<string, string>();
  const failures: string[] = [];
  const stdout: string[] = [];
  const stderr: string[] = [];
  const files = new Map<string, string>();
  const queue = [...runs];
  return {
    outputs,
    failures,
    stdout,
    stderr,
    files,
    runtime: {
      cwd: "C:\\work",
      getInput: (name: string): string => inputs[name] ?? "",
      setOutput: (name: string, value: string): void => {
        outputs.set(name, value);
      },
      setFailed: (message: string): void => {
        failures.push(message);
      },
      writeStdout: (value: string): void => {
        stdout.push(value);
      },
      writeStderr: (value: string): void => {
        stderr.push(value);
      },
      writeFile: async (filePath: string, content: string): Promise<void> => {
        files.set(filePath, content);
      },
      runCommand: async (): Promise<{ exitCode: number; stdout: string; stderr: string }> => {
        const next = queue.shift();
        if (next === undefined) throw new Error("unexpected CLI invocation");
        return { exitCode: next.exitCode, stdout: next.stdout, stderr: next.stderr ?? "" };
      },
    },
  };
}

async function installFakeNpx(dir: string): Promise<void> {
  await Bun.write(path.join(dir, fakeNpxName()), fakeNpxContent());
  if (process.platform !== "win32") {
    await Bun.$`chmod +x ${path.join(dir, "npx")}`;
  }
}

/** Platform-specific executable name used by the action's default npx runner. */
function fakeNpxName(): string {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

/** Minimal `npx` replacement used by the built-bundle smoke test. */
function fakeNpxContent(): string {
  if (process.platform === "win32") return "@echo off\r\necho []\r\nexit /b 0\r\n";
  return "#!/usr/bin/env sh\necho '[]'\nexit 0\n";
}

function nodeSmokeCommand(bundle: string): string[] {
  if (process.platform !== "win32") return ["node", bundle];
  return [process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe", "/d", "/c", "node", bundle];
}

function smokeEnv(tmp: string, output: string): Record<string, string | undefined> {
  const pathValue = tmp + path.delimiter + (process.env.PATH ?? process.env.Path ?? "");
  return {
    ...process.env,
    INPUT_GLOBS: "**/*.md",
    INPUT_FORMAT: "json",
    GITHUB_WORKSPACE: tmp,
    GITHUB_OUTPUT: output,
    PATH: pathValue,
    Path: pathValue,
  };
}

const WARNING_JSON = JSON.stringify([
  {
    filePath: "note.md",
    errors: [{ severity: "warning" }],
    hasErrors: false,
  },
]);

const ERROR_JSON = JSON.stringify([
  {
    filePath: "note.md",
    errors: [{ severity: "error" }],
    hasErrors: true,
  },
]);

describe("GitHub Action wrapper", () => {
  it("sets error and warning counts", async () => {
    const harness = makeHarness({ globs: "**/*.md", format: "json" }, [
      { exitCode: 1, stdout: ERROR_JSON },
    ]);
    await runAction(harness.runtime);
    expect(harness.outputs.get("error-count")).toBe("1");
    expect(harness.outputs.get("warning-count")).toBe("0");
    expect(harness.failures[0]).toContain("exited with 1");
  });

  it("fails warning-only runs when fail-on-warnings is true", async () => {
    const harness = makeHarness({ globs: "**/*.md", format: "json", "fail-on-warnings": "true" }, [
      { exitCode: 0, stdout: WARNING_JSON },
    ]);
    await runAction(harness.runtime);
    expect(harness.outputs.get("warning-count")).toBe("1");
    expect(harness.failures[0]).toContain("1 warning");
  });

  it("writes SARIF output and sets sarif-path", async () => {
    const harness = makeHarness({ globs: "**/*.md", format: "sarif" }, [
      { exitCode: 0, stdout: "[]" },
      { exitCode: 0, stdout: '{"version":"2.1.0"}' },
    ]);
    await runAction(harness.runtime);
    const sarifPath = harness.outputs.get("sarif-path");
    expect(sarifPath).toBe(path.join("C:\\work", "markdownlint-obsidian.sarif"));
    expect(harness.files.get(sarifPath!)).toContain("2.1.0");
  });

  it("built action bundle starts under Node", async () => {
    if (process.platform === "win32") {
      // Bun's Windows spawn cannot reliably launch node/cmd from this test
      // harness. CI runs this smoke on Linux; local Windows uses shell smoke.
      return;
    }
    const tmp = await mkdtemp(path.join(os.tmpdir(), "ofm-action-smoke-"));
    const output = path.join(tmp, "github-output.txt");
    try {
      await installFakeNpx(tmp);
      const bundle = path.resolve("action", "dist", "main.mjs");
      const proc = Bun.spawn({
        cmd: nodeSmokeCommand(bundle),
        cwd: path.resolve("action"),
        env: smokeEnv(tmp, output),
        stdout: "pipe",
        stderr: "pipe",
      });
      const exitCode = await proc.exited;
      const outputText = await readFile(output, "utf8");
      expect(exitCode).toBe(0);
      expect(outputText).toContain("error-count");
      expect(outputText).toContain("warning-count");
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
