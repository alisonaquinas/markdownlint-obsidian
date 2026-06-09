---
title: "Issue: Line-ending and Git attribute responsive linting"
aliases:
  - "Line-ending and Git attribute responsive linting"
tags:
  - "docs"
  - "docs/plans"
  - "docs/plans/phase-work"
type: "plan"
status: "current"
updated: 2026-06-08
up: "[[roadmap]]"
---

# Issue: Line-ending and Git attribute responsive linting

## Problem

A user reported Linux CI failures after Markdown files that passed locally were
checked out with different line endings. The reported output included:

```text
docs/domain/ubiquitous-language.md:409:1 OFM041 Malformed callout header: "> [[domain/ubiquitous-language#notification-group|Notification Group]], which is an email"
docs/plans/phase-04-notification-data-contract-and-manager/CHORE-019.md:91:1 MD032 Lists should be surrounded by blank lines
docs/sources/notifications planning/Notifications Jira Stories.md:15:1 MD032 Lists should be surrounded by blank lines
```

The user's immediate remediation proposal is to configure Git so Markdown files
use LF endings, then renormalize existing Markdown files.

That proposal is useful, but it is not sufficient by itself. The current repo
already has LF-focused `.gitattributes` and `.editorconfig`. The lint parser
must also canonicalize input to LF so file-backed, editor, and in-memory API
paths behave the same. The reported `OFM041` diagnostic exposes a separate rule
bug: a normal blockquote that starts with a wikilink, such as
`> [[target|Alias]]`, is being treated as a malformed callout candidate.

## Goals

- Make lint results invariant for equivalent LF and CRLF Markdown content.
- Keep Git checkout behavior responsive to `.gitattributes` and contributor
  Git config.
- Document the Git normalization path users should apply in their own repos.
- Fix the `OFM041` false positive for blockquoted wikilinks.
- Preserve existing autofix behavior that keeps file line endings stable when
  possible.

## Non-Goals

- Force every downstream repository to adopt this project's `.gitattributes`.
- Change markdownlint's rule semantics for genuine MD032 list violations.
- Disable MD032 globally.
- Treat all blockquotes as callouts.

## Current Evidence

- `.gitattributes` currently sets `* text=auto eol=lf` and marks Markdown as
  text with markdown diffing.
- `.editorconfig` currently sets `end_of_line = lf`, with Markdown trailing
  whitespace preserved for hard-break workflows.
- `readMarkdownFile` strips BOM and preserves line endings so autofix can keep
  the working-tree style stable.
- `MarkdownItParser` splits input with `/\r?\n/`, but parser callers can still
  pass in-memory CRLF content directly.
- `OFM041` currently sniffs any blockquote line beginning with `[` as a
  malformed callout candidate. That is too broad for Obsidian vaults because
  blockquoted wikilinks are valid prose.

## Plan of Attack

1. Add regression coverage for the user report.

   Create focused tests for equivalent LF and CRLF input containing:

   - a blockquoted wikilink: `> [[domain/page#heading|Alias]], text`;
   - a genuine malformed callout header;
   - a valid callout header;
   - list cases that show MD032 behavior is unchanged except for line-ending
     invariance.

   The tests must prove equivalent LF and CRLF inputs produce identical
   diagnostics.

2. Tighten OFM041 malformed-callout detection.

   Change the loose candidate check so OFM041 only inspects lines that look
   like Obsidian callout attempts, not every blockquote that begins with a
   square bracket. A practical target is a line beginning with a blockquote
   marker followed by `[!`.

   This should keep diagnostics for malformed callout attempts such as:

   ```text
   > [!] Missing type
   > [!NOTE]Title
   ```

   It should stop diagnostics for ordinary blockquoted links such as:

   ```text
   > [[domain/page#heading|Alias]], text
   ```

3. Normalize parser input at the parser boundary.

   Keep `readMarkdownFile` as a byte-preserving text reader after BOM stripping,
   and normalize Markdown content inside `MarkdownItParser` before frontmatter
   parsing, tokenization, line splitting, OFM extraction, and standard
   markdownlint adapter execution.

   This protects:

   - CLI runs that read files through the existing file reader;
   - editor and public API paths that pass in-memory document text;
   - test harnesses that call the parser directly.

4. Keep write and fix behavior deliberate.

   Do not blindly rewrite user files to LF during lint. For autofix, preserve
   the existing behavior covered by `applyFixes` tests unless a separate
   normalization command is added later.

5. Add Git normalization guidance.

   Document the recommended downstream repo policy:

   ```gitattributes
   *.md text eol=lf
   ```

   Then renormalize existing Markdown files:

   ```bash
   git add --renormalize '*.md'
   git commit -m "Normalize Markdown line endings"
   ```

   Git documentation identifies `.gitattributes` `text` and `eol` attributes
   as the repository-level controls for line-ending normalization and
   `git add --renormalize` as the refresh step after attributes change.

6. Document environment responsiveness.

   Add or update user-facing docs to explain:

   - `.gitattributes` controls Git checkout and index normalization;
   - `.editorconfig` helps editors produce expected endings;
   - markdownlint-obsidian normalizes input for linting;
   - Git normalization is still recommended so CI, diffs, editors, and other
     tools agree.

## Acceptance Criteria

- A blockquoted wikilink does not report OFM041.
- Genuine malformed callout attempts still report OFM041.
- LF and CRLF variants of the same Markdown content produce identical lint
  diagnostics.
- MD032 is neither disabled nor weakened; only line-ending instability is
  addressed.
- File-backed autofix preserves CRLF endings when fixing a CRLF Markdown file.
- Docs include a downstream `.gitattributes` and `git add --renormalize`
  remediation path.
- `bun run test:all` passes.

## Verification

Run focused checks first:
```bash
bun test packages/core/tests/unit/rules/callouts/OFM041.test.ts --timeout 30000
bun test packages/core/tests/unit/parser/MarkdownItParser.test.ts --timeout 30000
bun test packages/core/tests/unit/io/FileReader.test.ts --timeout 30000
bun test packages/core/tests/unit/engine/fix.test.ts --timeout 30000
bun test packages/core/tests/integration/regression --timeout 30000
```

Then run the full gate:
```bash
bun run test:all
```
