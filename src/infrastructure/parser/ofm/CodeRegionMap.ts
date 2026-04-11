/**
 * Precomputes positions covered by fenced code blocks and inline code spans
 * so OFM extractors can skip them in O(1) lookups.
 *
 * The map is permissive: if any heuristic flags a position as code, every
 * extractor treats it as code.
 */
export interface CodeRegionMap {
  isInCode(line: number, column: number): boolean;
}

const FENCE_PATTERN = /^(\s*)(`{3,}|~{3,})/;

interface InlineSpan {
  readonly line: number;
  readonly start: number;
  readonly end: number;
}

interface ScanState {
  readonly blockLines: Set<number>;
  readonly inline: InlineSpan[];
  fence: string | null;
}

export function buildCodeRegionMap(lines: readonly string[]): CodeRegionMap {
  const state: ScanState = {
    blockLines: new Set<number>(),
    inline: [],
    fence: null,
  };

  for (let i = 0; i < lines.length; i += 1) {
    scanLine(lines[i] ?? "", i + 1, state);
  }

  return {
    isInCode(line, column): boolean {
      if (state.blockLines.has(line)) return true;
      return state.inline.some(
        (span) => span.line === line && column >= span.start && column <= span.end,
      );
    },
  };
}

function scanLine(line: string, lineNumber: number, state: ScanState): void {
  const match = line.match(FENCE_PATTERN);
  if (state.fence !== null) {
    state.blockLines.add(lineNumber);
    if (match !== null && line.trim().startsWith(state.fence)) {
      state.fence = null;
    }
    return;
  }
  if (match !== null) {
    state.fence = match[2] ?? null;
    state.blockLines.add(lineNumber);
    return;
  }
  collectInlineSpans(line, lineNumber, state.inline);
}

function collectInlineSpans(line: string, lineNumber: number, out: InlineSpan[]): void {
  let open: number | null = null;
  for (let col = 1; col <= line.length; col += 1) {
    if (line.charAt(col - 1) !== "`") continue;
    if (open === null) {
      open = col;
    } else {
      out.push({ line: lineNumber, start: open, end: col });
      open = null;
    }
  }
}
