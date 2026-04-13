/**
 * Public API for authoring custom rules for markdownlint-obsidian.
 * Import from "markdownlint-obsidian/api".
 *
 * Stability: semver minor = additive only. Breaking changes require a major.
 */

// Linting primitives
export type { OFMRule, RuleParams, OnErrorCallback } from "../domain/linting/OFMRule.js";
export type { LintError } from "../domain/linting/LintError.js";
export type { LintResult } from "../domain/linting/LintResult.js";
export { makeLintError } from "../domain/linting/LintError.js";
export { makeLintResult } from "../domain/linting/LintResult.js";

// Fix primitives
export type { Fix } from "../domain/linting/Fix.js";
export { makeFix } from "../domain/linting/Fix.js";

// Parse result VOs
export type { ParseResult } from "../domain/parsing/ParseResult.js";
export type { WikilinkNode } from "../domain/parsing/WikilinkNode.js";
export type { EmbedNode } from "../domain/parsing/EmbedNode.js";
export type { CalloutNode } from "../domain/parsing/CalloutNode.js";
export type { TagNode } from "../domain/parsing/TagNode.js";
export type { BlockRefNode } from "../domain/parsing/BlockRefNode.js";
export type { HighlightNode } from "../domain/parsing/HighlightNode.js";
export type { CommentNode } from "../domain/parsing/CommentNode.js";
export type { SourcePosition } from "../domain/parsing/SourcePosition.js";

// Config
export type {
  LinterConfig,
  FrontmatterConfig,
  TagConfig,
  CalloutConfig,
  WikilinkConfig,
  EmbedConfig,
  HighlightConfig,
  CommentConfig,
  BlockRefConfig,
} from "../domain/config/LinterConfig.js";
export type { RuleConfig as RuleConfigEntry } from "../domain/config/RuleConfig.js";

// Vault
export type { VaultIndex } from "../domain/vault/VaultIndex.js";
export type { VaultPath } from "../domain/vault/VaultPath.js";
export type { BlockRefIndex } from "../domain/vault/BlockRefIndex.js";
export type { MatchResult } from "../domain/vault/WikilinkMatcher.js";

// Filesystem boundary (needed to type params.fsCheck in custom rule implementations)
export type { FileExistenceChecker } from "../domain/fs/FileExistenceChecker.js";
