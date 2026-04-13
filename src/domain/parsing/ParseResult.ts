import type { WikilinkNode } from "./WikilinkNode.js";
import type { EmbedNode } from "./EmbedNode.js";
import type { CalloutNode } from "./CalloutNode.js";
import type { TagNode } from "./TagNode.js";
import type { BlockRefNode } from "./BlockRefNode.js";
import type { HighlightNode } from "./HighlightNode.js";
import type { CommentNode } from "./CommentNode.js";

/**
 * The fully parsed contents of one Markdown file.
 *
 * `tokens` is the raw markdown-it Token[] kept as `unknown[]` at the domain
 * boundary so the domain layer has zero dependency on markdown-it types.
 * Infrastructure consumers cast to `Token[]` where they need to.
 */
export interface ParseResult {
  readonly filePath: string;
  readonly frontmatter: Readonly<Record<string, unknown>>;
  readonly frontmatterRaw: string | null;
  /** 1-based line number where frontmatter ends; 0 if no frontmatter. */
  readonly frontmatterEndLine: number;
  /** Reserved for Phase 9 autofix: markdown-it token stream, not currently used by rules. */
  readonly tokens: readonly unknown[];
  readonly wikilinks: readonly WikilinkNode[];
  readonly embeds: readonly EmbedNode[];
  readonly callouts: readonly CalloutNode[];
  readonly tags: readonly TagNode[];
  readonly blockRefs: readonly BlockRefNode[];
  readonly highlights: readonly HighlightNode[];
  readonly comments: readonly CommentNode[];
  readonly raw: string;
  readonly lines: readonly string[];
}

export function makeParseResult(fields: ParseResult): ParseResult {
  const rawLineCount = fields.raw === "" ? 0 : fields.raw.split(/\r?\n/).length;
  if (rawLineCount !== fields.lines.length && fields.raw !== "") {
    throw new Error(
      `ParseResult line count mismatch: raw has ${rawLineCount}, lines has ${fields.lines.length}`,
    );
  }
  return Object.freeze({
    ...fields,
    frontmatter: Object.freeze({ ...fields.frontmatter }),
    tokens: Object.freeze([...fields.tokens]),
    wikilinks: Object.freeze([...fields.wikilinks]),
    embeds: Object.freeze([...fields.embeds]),
    callouts: Object.freeze([...fields.callouts]),
    tags: Object.freeze([...fields.tags]),
    blockRefs: Object.freeze([...fields.blockRefs]),
    highlights: Object.freeze([...fields.highlights]),
    comments: Object.freeze([...fields.comments]),
    lines: Object.freeze([...fields.lines]),
  });
}
