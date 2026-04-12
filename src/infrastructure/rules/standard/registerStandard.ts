import type { RuleRegistry } from "../../../domain/linting/RuleRegistry.js";
import {
  buildStandardRule,
  type StandardRuleDescriptor,
} from "./StandardRuleAdapter.js";
import {
  makeMarkdownLintAdapter,
  type MarkdownLintAdapter,
} from "./MarkdownLintAdapter.js";

/**
 * Exhaustive descriptor table for every MD001–MD049 rule that ships with
 * upstream markdownlint. Each entry is mechanical metadata: the numeric
 * code, the human-friendly alias, the description (borrowed verbatim from
 * the upstream catalog), a `fixable` flag tracking whether markdownlint
 * publishes a `fixInfo` payload for that rule, and our preferred severity.
 *
 * The list is frozen so the infrastructure layer cannot mutate it at
 * runtime. MD002, MD006, MD015, MD016, MD017 were removed from upstream
 * markdownlint before 0.40 and are intentionally absent. MD050+ are
 * Phase 8+ scope once we decide which newer rules fit OFM vaults.
 */
export const STANDARD_RULE_DESCRIPTORS: readonly StandardRuleDescriptor[] =
  Object.freeze([
    {
      code: "MD001",
      name: "heading-increment",
      description:
        "Heading levels should only increment by one level at a time",
      fixable: false,
      severity: "error",
    },
    {
      code: "MD003",
      name: "heading-style",
      description: "Heading style",
      fixable: true,
      severity: "error",
    },
    {
      code: "MD004",
      name: "ul-style",
      description: "Unordered list style",
      fixable: true,
      severity: "error",
    },
    {
      code: "MD005",
      name: "list-indent",
      description: "Inconsistent indentation for list items at the same level",
      fixable: false,
      severity: "error",
    },
    {
      code: "MD007",
      name: "ul-indent",
      description: "Unordered list indentation",
      fixable: true,
      severity: "error",
    },
    {
      code: "MD009",
      name: "no-trailing-spaces",
      description: "Trailing spaces",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD010",
      name: "no-hard-tabs",
      description: "Hard tabs",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD011",
      name: "no-reversed-links",
      description: "Reversed link syntax",
      fixable: false,
      severity: "error",
    },
    {
      code: "MD012",
      name: "no-multiple-blanks",
      description: "Multiple consecutive blank lines",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD013",
      name: "line-length",
      description: "Line length",
      fixable: false,
      severity: "warning",
    },
    {
      code: "MD014",
      name: "commands-show-output",
      description: "Dollar signs used before commands without showing output",
      fixable: false,
      severity: "warning",
    },
    {
      code: "MD018",
      name: "no-missing-space-atx",
      description: "No space after hash on atx-style heading",
      fixable: true,
      severity: "error",
    },
    {
      code: "MD019",
      name: "no-multiple-space-atx",
      description: "Multiple spaces after hash on atx-style heading",
      fixable: true,
      severity: "error",
    },
    {
      code: "MD020",
      name: "no-missing-space-closed-atx",
      description: "No space inside hashes on closed atx-style heading",
      fixable: true,
      severity: "error",
    },
    {
      code: "MD021",
      name: "no-multiple-space-closed-atx",
      description: "Multiple spaces inside hashes on closed atx-style heading",
      fixable: true,
      severity: "error",
    },
    {
      code: "MD022",
      name: "blanks-around-headings",
      description: "Headings should be surrounded by blank lines",
      fixable: true,
      severity: "error",
    },
    {
      code: "MD023",
      name: "heading-start-left",
      description: "Headings must start at the beginning of the line",
      fixable: true,
      severity: "error",
    },
    {
      code: "MD024",
      name: "no-duplicate-heading",
      description: "Multiple headings with the same content",
      fixable: false,
      severity: "error",
    },
    {
      code: "MD025",
      name: "single-title",
      description: "Multiple top-level headings in the same document",
      fixable: false,
      severity: "error",
    },
    {
      code: "MD026",
      name: "no-trailing-punctuation",
      description: "Trailing punctuation in heading",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD027",
      name: "no-multiple-space-blockquote",
      description: "Multiple spaces after blockquote symbol",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD028",
      name: "no-blanks-blockquote",
      description: "Blank line inside blockquote",
      fixable: false,
      severity: "warning",
    },
    {
      code: "MD029",
      name: "ol-prefix",
      description: "Ordered list item prefix",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD030",
      name: "list-marker-space",
      description: "Spaces after list markers",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD031",
      name: "blanks-around-fences",
      description: "Fenced code blocks should be surrounded by blank lines",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD032",
      name: "blanks-around-lists",
      description: "Lists should be surrounded by blank lines",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD033",
      name: "no-inline-html",
      description: "Inline HTML",
      fixable: false,
      severity: "warning",
    },
    {
      code: "MD034",
      name: "no-bare-urls",
      description: "Bare URL used",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD035",
      name: "hr-style",
      description: "Horizontal rule style",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD036",
      name: "no-emphasis-as-heading",
      description: "Emphasis used instead of a heading",
      fixable: false,
      severity: "warning",
    },
    {
      code: "MD037",
      name: "no-space-in-emphasis",
      description: "Spaces inside emphasis markers",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD038",
      name: "no-space-in-code",
      description: "Spaces inside code span elements",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD039",
      name: "no-space-in-links",
      description: "Spaces inside link text",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD040",
      name: "fenced-code-language",
      description: "Fenced code blocks should have a language specified",
      fixable: false,
      severity: "warning",
    },
    {
      code: "MD041",
      name: "first-line-heading",
      description: "First line in a file should be a top-level heading",
      fixable: false,
      severity: "error",
    },
    {
      code: "MD042",
      name: "no-empty-links",
      description: "No empty links",
      fixable: false,
      severity: "error",
    },
    {
      code: "MD043",
      name: "required-headings",
      description: "Required heading structure",
      fixable: false,
      severity: "error",
    },
    {
      code: "MD044",
      name: "proper-names",
      description: "Proper names should have the correct capitalization",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD045",
      name: "no-alt-text",
      description: "Images should have alternate text (alt text)",
      fixable: false,
      severity: "warning",
    },
    {
      code: "MD046",
      name: "code-block-style",
      description: "Code block style",
      fixable: false,
      severity: "warning",
    },
    {
      code: "MD047",
      name: "single-trailing-newline",
      description: "Files should end with a single newline character",
      fixable: true,
      severity: "error",
    },
    {
      code: "MD048",
      name: "code-fence-style",
      description: "Code fence style",
      fixable: true,
      severity: "warning",
    },
    {
      code: "MD049",
      name: "emphasis-style",
      description: "Emphasis style",
      fixable: true,
      severity: "warning",
    },
  ]);

/**
 * Register every MD001–MD049 wrapper with `registry`.
 *
 * One shared {@link MarkdownLintAdapter} is created per invocation so every
 * wrapper runs the upstream library at most once per file per lint pass.
 * An optional adapter override is accepted for tests that want to inject
 * a stub; production callers rely on the default.
 */
export function registerStandardRules(
  registry: RuleRegistry,
  adapter: MarkdownLintAdapter = makeMarkdownLintAdapter(),
): void {
  for (const desc of STANDARD_RULE_DESCRIPTORS) {
    registry.register(buildStandardRule(desc, adapter));
  }
}
