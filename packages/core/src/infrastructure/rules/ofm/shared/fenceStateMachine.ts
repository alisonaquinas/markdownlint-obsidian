// Opening or closing fence line (```, ~~~, or longer). Matched against the
// line's leading whitespace so indented fences still close properly.
const FENCE_PATTERN = /^(\s*)(`{3,}|~{3,})/;

/**
 * Result of advancing the fence state machine over a single line.
 * `skip` means the line is either a fence delimiter or inside a code
 * block and should be ignored by callers.
 */
export interface FenceResult {
  readonly fence: string | null;
  readonly skip: boolean;
}

/**
 * Advance a simple fence state machine over one line.
 *
 * Pass the current `fence` state (initially `null`). The returned
 * `FenceResult.fence` value becomes the new state for the next line.
 * When `FenceResult.skip` is `true` the line is either a fence
 * delimiter or sits inside a fenced code block and should be skipped
 * by the calling rule.
 */
export function updateFence(line: string, fence: string | null): FenceResult {
  const fenceMatch = line.match(FENCE_PATTERN);
  if (fence !== null) {
    const closed = fenceMatch !== null && line.trim().startsWith(fence);
    return { fence: closed ? null : fence, skip: true };
  }
  if (fenceMatch !== null) {
    return { fence: fenceMatch[2] ?? null, skip: true };
  }
  return { fence: null, skip: false };
}

/**
 * Strip matched backtick-delimited inline code spans from a line.
 *
 * Content between paired single backticks is removed so that downstream
 * checks (e.g. `==` counting) ignore operators that appear inside
 * documentation-style inline code such as `` `===` ``.
 */
export function stripInlineCode(line: string): string {
  return line.replace(/`[^`\n]*`/g, "");
}
