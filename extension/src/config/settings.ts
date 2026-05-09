/**
 * Converts raw VS Code configuration values into the extension's strict runtime
 * settings shape.
 *
 * The reader interface keeps this module testable without importing VS Code and
 * gives invalid user settings conservative defaults instead of throwing during
 * editor activation.
 *
 * @module config/settings
 */

import type { ExtensionSettings, RunMode } from "../shared/types.js";

/** Minimal subset of VS Code's configuration reader used by this adapter. */
export interface ConfigurationReader {
  get<T>(key: string, defaultValue: T): T;
}

function normalizeRunMode(value: unknown): RunMode {
  return value === "onSave" ? "onSave" : "onType";
}

function normalizeDebounce(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 250;
  return Math.min(5000, Math.max(0, Math.trunc(value)));
}

function normalizeConfigPath(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function normalizeGlobs(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return ["**/*.md"];
  const globs = value.filter((entry): entry is string => typeof entry === "string");
  return globs.length > 0 ? globs : ["**/*.md"];
}

export function readExtensionSettings(reader: ConfigurationReader): ExtensionSettings {
  return {
    enabled: reader.get("enabled", true) === true,
    runMode: normalizeRunMode(reader.get("runMode", "onType")),
    debounceMs: normalizeDebounce(reader.get("debounceMs", 250)),
    configPath: normalizeConfigPath(reader.get("configPath", null)),
    workspaceGlobs: normalizeGlobs(reader.get("workspaceGlobs", ["**/*.md"])),
  };
}
