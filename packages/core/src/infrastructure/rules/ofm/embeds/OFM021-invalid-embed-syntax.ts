/**
 * Purpose: Detect malformed embed syntax patterns such as empty `![[]]` and unclosed `![[` that the parser never materialises as nodes.
 *
 * Provides: {@link OFM021Rule}
 *
 * Role in system: Infrastructure-layer implementation of OFM021 — flags embed syntax errors including whitespace-only bodies and missing closing brackets.
 *
 * @module infrastructure/rules/ofm/embeds/OFM021-invalid-embed-syntax
 */
import type { OFMRule, OnErrorCallback } from "../../../../domain/linting/OFMRule.js";
import { updateFence } from "../shared/fenceStateMachine.js";

// Use `g` so matchAll can iterate over every occurrence on a single line.
const EMPTY_EMBED = /!\[\[\s*\]\]/g;
// Detects an unclosed `![[` on a line that has no corresponding `]]`.
const OPEN_BRACKETS = /!\[\[/;

interface InlineSpan {
  readonly start: number;
  readonly end: number;
}

/**
 * Collect the column ranges covered by inline code spans (matched backtick
 * pairs) on a single line. Unbalanced backticks are ignored.
 */
function computeInlineCodeSpans(line: string): readonly InlineSpan[] {
  const spans: InlineSpan[] = [];
  let open: number | null = null;
  for (let col = 1; col <= line.length; col += 1) {
    if (line.charAt(col - 1) !== "`") continue;
    if (open === null) {
      open = col;
    } else {
      spans.push({ start: open, end: col });
      open = null;
    }
  }
  return spans;
}

function isInsideSpan(column: number, spans: readonly InlineSpan[]): boolean {
  return spans.some((s) => column >= s.start && column <= s.end);
}

function reportEmptyEmbeds(
  line: string,
  lineNumber: number,
  spans: readonly InlineSpan[],
  onError: OnErrorCallback,
): void {
  for (const m of line.matchAll(EMPTY_EMBED)) {
    const column = (m.index ?? 0) + 1;
    if (isInsideSpan(column, spans)) continue;
    onError({
      line: lineNumber,
      column,
      message: "Empty embed `![[]]`",
    });
  }
}

function reportUnclosedEmbed(
  line: string,
  lineNumber: number,
  spans: readonly InlineSpan[],
  onError: OnErrorCallback,
): void {
  if (!OPEN_BRACKETS.test(line) || line.includes("]]")) return;
  const column = line.indexOf("![[") + 1;
  if (isInsideSpan(column, spans)) return;
  onError({
    line: lineNumber,
    column: 1,
    message: "Unclosed embed — missing `]]`",
  });
}

/**
 * OFM021 — invalid-embed-syntax.
 *
 * Catches two malformed patterns the parser does not materialise as
 * {@link EmbedNode}s (so OFM020/022 never see them):
 *
 *   1. `![[]]` with a whitespace-only body: fired per occurrence.
 *   2. `![[foo` with no closing `]]` on the same line: fired once per line.
 *
 * The rule tracks fenced code blocks inline and skips them entirely. For
 * single-line false-positive sources — an `![[]]` example inside inline
 * backticks — the match column is checked against inline-code spans on
 * the same line and skipped when it falls inside one.
 *
 * This keeps the rule independent of the extractor's CodeRegionMap,
 * which currently lives in infrastructure/parser and is not exposed via
 * {@link ParseResult}.
 */
export const OFM021Rule: OFMRule = {
  names: ["OFM021", "invalid-embed-syntax"],
  description: "Embed syntax is malformed",
  tags: ["embeds", "syntax"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    let fence: string | null = null;
    parsed.lines.forEach((line, i) => {
      const step = updateFence(line, fence);
      fence = step.fence;
      if (step.skip) return;
      const spans = computeInlineCodeSpans(line);
      reportEmptyEmbeds(line, i + 1, spans, onError);
      reportUnclosedEmbed(line, i + 1, spans, onError);
    });
  },
};
