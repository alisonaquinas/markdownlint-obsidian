import * as core from "@actions/core";
import { main as runLinter } from "markdownlint-obsidian-cli";

interface ActionInputs {
  readonly globs: readonly string[];
  readonly vaultRoot: string;
  readonly config: string;
  readonly format: string;
  readonly failOnWarnings: boolean;
}

/** Collect and normalise every action input up-front. */
function readInputs(): ActionInputs {
  const rawFailOnWarnings = core.getInput("fail-on-warnings") || "false";
  return {
    globs: core.getInput("globs").split(/\s+/).filter(Boolean),
    vaultRoot: core.getInput("vault-root"),
    config: core.getInput("config"),
    format: core.getInput("format") || "default",
    // `getBooleanInput` throws when the input is missing entirely
    // (e.g. during a local smoke test). We accept the documented
    // defaults without invoking it so the action stays runnable.
    failOnWarnings: /^(true|True|TRUE)$/.test(rawFailOnWarnings),
  };
}

/** Build the argv vector the CLI expects from parsed action inputs. */
function buildArgv(inputs: ActionInputs): string[] {
  const argv = ["node", "markdownlint-obsidian"];
  if (inputs.vaultRoot) argv.push("--vault-root", inputs.vaultRoot);
  if (inputs.config) argv.push("--config", inputs.config);
  argv.push("--output-formatter", inputs.format);
  argv.push(...inputs.globs);
  return argv;
}

/**
 * Entry point for the GitHub Action.
 *
 * Reads action inputs, reassembles them into a CLI argv vector, invokes
 * the existing `runLinter` entrypoint, and surfaces its exit code via
 * {@link core.setFailed} so the action step fails visibly in the UI.
 */
async function run(): Promise<void> {
  const inputs = readInputs();
  const exitCode = (await runLinter(buildArgv(inputs))) as number;
  // `failOnWarnings` is a placeholder input for a future severity-aware
  // summary. The existing exit code already covers the error case.
  void inputs.failOnWarnings;
  if (exitCode !== 0) {
    core.setFailed(`markdownlint-obsidian exited with ${exitCode}`);
  }
}

run().catch((err: unknown) => core.setFailed(err instanceof Error ? err.message : String(err)));
