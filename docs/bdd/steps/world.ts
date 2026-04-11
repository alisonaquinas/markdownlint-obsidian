/**
 * Shared Cucumber World for markdownlint-obsidian BDD scenarios.
 *
 * Provides: temp vault creation, CLI invocation via tsx loader, result capture.
 */
import { setWorldConstructor, World } from "@cucumber/cucumber";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface CLIResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

const BIN_PATH = path.resolve("bin/markdownlint-obsidian.js");
const TSX_LOADER_URL = pathToFileURL(path.resolve("node_modules/tsx/dist/loader.mjs")).href;

export class OFMWorld extends World {
  vaultDir: string = "";
  /**
   * Optional subdirectory of `vaultDir` to use as CLI cwd. When set,
   * `runCLI` changes into that directory before spawning the binary so
   * vault detection walks up from inside the declared structure rather
   * than from the temp root.
   */
  cliCwdSubdir: string | null = null;
  cliResult: CLIResult | null = null;

  /** Create a fresh temp vault directory for this scenario. */
  async initVault(): Promise<void> {
    this.vaultDir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-test-"));
    await fs.mkdir(path.join(this.vaultDir, ".obsidian"), { recursive: true });
  }

  /**
   * Create a bare temp directory with no `.obsidian/` marker. Vault
   * detection steps rely on this to construct ad-hoc directory trees
   * before writing scenario-specific marker files.
   */
  async initBareDir(): Promise<void> {
    this.vaultDir = await fs.mkdtemp(path.join(os.tmpdir(), "ofm-test-"));
  }

  /** Create `.obsidian/` inside a subdirectory (e.g. `"vault/"`). */
  async markObsidianVault(relSubdir: string): Promise<void> {
    const abs = path.join(this.vaultDir, relSubdir, ".obsidian");
    await fs.mkdir(abs, { recursive: true });
  }

  /** Create `.git/` inside a subdirectory (e.g. `"repo/"`). */
  async markGitRepo(relSubdir: string): Promise<void> {
    const abs = path.join(this.vaultDir, relSubdir, ".git");
    await fs.mkdir(abs, { recursive: true });
  }

  /** Write a file relative to vault root. */
  async writeFile(relPath: string, content: string): Promise<void> {
    const abs = path.join(this.vaultDir, relPath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content, "utf8");
  }

  /**
   * Run the CLI against the vault. When `cliCwdSubdir` is set the process
   * runs inside that subdirectory, and the first `cliCwdSubdir` path
   * segment is stripped from the glob argument so vault-relative paths in
   * the feature file continue to resolve.
   */
  async runCLI(globs: string, extraArgs: string[] = []): Promise<void> {
    let cwd = this.vaultDir;
    let effectiveGlob = globs;
    if (this.cliCwdSubdir !== null) {
      cwd = path.join(this.vaultDir, this.cliCwdSubdir);
      const prefix = this.cliCwdSubdir.replace(/[/\\]$/, "");
      if (prefix.length > 0 && effectiveGlob.startsWith(`${prefix}/`)) {
        effectiveGlob = effectiveGlob.slice(prefix.length + 1);
      }
    }
    const nodeArgs = ["--import", TSX_LOADER_URL, BIN_PATH, ...extraArgs, effectiveGlob];
    try {
      const { stdout, stderr } = await execFileAsync("node", nodeArgs, { cwd });
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
    this.cliCwdSubdir = null;
  }
}

setWorldConstructor(OFMWorld);
