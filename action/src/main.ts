import * as core from "@actions/core";
// eslint-disable-next-line import/no-unresolved -- resolved at bundle time by esbuild via file:..
import { main as runLinter } from "markdownlint-obsidian/src/cli/main.js";

/**
 * Entry point for the GitHub Action.
 *
 * Reads action inputs, reassembles them into a CLI argv vector, invokes
 * the existing `runLinter` entrypoint, and surfaces its exit code via
 * {@link core.setFailed} so the action step fails visibly in the UI.
 */
async function run(): Promise<void> {
  const globs = core.getInput("globs").split(/\s+/).filter(Boolean);
  const vaultRoot = core.getInput("vault-root");
  const config = core.getInput("config");
  const format = core.getInput("format") || "default";
  const failOnWarnings = core.getBooleanInput("fail-on-warnings");

  const argv = ["node", "markdownlint-obsidian"];
  if (vaultRoot) argv.push("--vault-root", vaultRoot);
  if (config) argv.push("--config", config);
  argv.push("--output-formatter", format);
  argv.push(...globs);

  const exitCode = await runLinter(argv);

  if (failOnWarnings && exitCode === 0) {
    // Placeholder: a future revision will parse structured output to
    // detect warnings. For now `--output-formatter json` + the existing
    // exit code is authoritative.
  }

  if (exitCode !== 0) {
    core.setFailed(`markdownlint-obsidian exited with ${exitCode}`);
  }
}

run().catch((err: unknown) =>
  core.setFailed(err instanceof Error ? err.message : String(err)),
);
