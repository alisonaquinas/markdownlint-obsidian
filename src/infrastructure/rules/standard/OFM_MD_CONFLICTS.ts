/**
 * Metadata describing one MD rule that conflicts with Obsidian Flavored
 * Markdown syntax and therefore ships disabled-by-default.
 *
 * `code` is the upstream markdownlint identifier (`"MD013"` etc.);
 * `reason` is a one-line justification shown in user-facing docs;
 * `docPage` is the repo-relative path to the long-form explainer under
 * `docs/rules/standard-md/`. Every entry must have a matching page on disk —
 * the Phase 7 docs task verifies the mapping.
 */
export interface MdConflict {
  readonly code: string;
  readonly reason: string;
  readonly docPage: string;
}

/**
 * Curated, authoritative list of markdownlint rules disabled by default.
 *
 * Adding a new conflict is a three-step change:
 * 1. Add an entry here with the rationale.
 * 2. Create `docs/rules/standard-md/<MDxxx>.md` with the detailed
 *    explanation and any user-facing workaround snippet.
 * 3. Update `docs/rules/standard-md/index.md` so the catalog reflects
 *    the new disabled status.
 *
 * The entries are intentionally conservative — we only disable MD rules
 * that collide with genuine OFM features. Anything stylistic stays enabled
 * so users opt in explicitly by flipping it off in their own config.
 */
export const OFM_MD_CONFLICTS: readonly MdConflict[] = Object.freeze([
  Object.freeze({
    code: "MD013",
    reason:
      "line-length — wikilinks and embeds routinely exceed column limits",
    docPage: "rules/standard-md/MD013.md",
  }),
  Object.freeze({
    code: "MD033",
    reason:
      "no-inline-html — OFM callouts and embeds render as HTML elements",
    docPage: "rules/standard-md/MD033.md",
  }),
  Object.freeze({
    code: "MD034",
    reason: "no-bare-urls — Obsidian auto-links bare URLs by default",
    docPage: "rules/standard-md/MD034.md",
  }),
  Object.freeze({
    code: "MD041",
    reason:
      "first-line-heading — frontmatter-only notes are common in Obsidian",
    docPage: "rules/standard-md/MD041.md",
  }),
  Object.freeze({
    code: "MD042",
    reason: "no-empty-links — does not understand `[[]]` wikilink syntax",
    docPage: "rules/standard-md/MD042.md",
  }),
  Object.freeze({
    code: "MD018",
    reason:
      "no-missing-space-atx — Obsidian tags starting a line (`#project`) " +
      "look like malformed ATX headings to markdownlint",
    docPage: "rules/standard-md/MD018.md",
  }),
]);
