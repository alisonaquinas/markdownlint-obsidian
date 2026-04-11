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

export function buildCodeRegionMap(lines: readonly string[]): CodeRegionMap {
  const blockLines = new Set<number>();
  const inline: InlineSpan[] = [];
  let fence: string | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const match = line.match(FENCE_PATTERN);
    if (fence) {
      blockLines.add(i + 1);
      if (match && line.trim().startsWith(fence)) {
        fence = null;
      }
      continue;
    }
    if (match) {
      fence = match[2] ?? null;
      blockLines.add(i + 1);
      continue;
    }
    collectInlineSpans(line, i + 1, inline);
  }

  return {
    isInCode(line, column) {
      if (blockLines.has(line)) return true;
      for (const span of inline) {
        if (span.line === line && column >= span.start && column <= span.end) {
          return true;
        }
      }
      return false;
    },
  };
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
