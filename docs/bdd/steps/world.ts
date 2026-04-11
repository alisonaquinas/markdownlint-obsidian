/**
 * Shared Cucumber World for markdownlint-obsidian BDD scenarios.
 *
 * Provides: temp vault creation, CLI invocation, result capture.
 */
import { setWorldConstructor, World } from "@cucumber/cucumber";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface CLIResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export class OFMWorld extends World {
  vaultDir: string = "";
  cliResult: CLIResult | null = null;

  /** Create a fresh temp vault directory for this scenario. */
  async initVault(): Promise<void> {
    this.vaultDir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-test-"));
    await fs.mkdir(path.join(this.vaultDir, ".obsidian"), { recursive: true });
  }

  /** Write a file relative to vault root. */
  async writeFile(relPath: string, content: string): Promise<void> {
    const abs = path.join(this.vaultDir, relPath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content, "utf8");
  }

  /** Run the CLI against the vault. */
  async runCLI(globs: string, extraArgs: string[] = []): Promise<void> {
    const bin = path.resolve(__dirname, "../../bin/markdownlint-obsidian.js");
    try {
      const { stdout, stderr } = await execFileAsync(
        "node",
        [bin, ...extraArgs, globs],
        { cwd: this.vaultDir }
      );
      this.cliResult = { exitCode: 0, stdout, stderr };
    } catch (err: unknown) {
      const e = err as { code?: number; stdout?: string; stderr?: string };
      this.cliResult = {
        exitCode: e.code ?? 1,
        stdout: e.stdout ?? "",
        stderr: e.stderr ?? "",
      };
    }
  }

  /** Clean up temp vault after scenario. */
  async cleanup(): Promise<void> {
    if (this.vaultDir) {
      await fs.rm(this.vaultDir, { recursive: true, force: true });
    }
  }
}

setWorldConstructor(OFMWorld);
