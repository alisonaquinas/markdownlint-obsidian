/**
 * 1-based source position, shared by every OFM parse node.
 * Immutable; both line and column must be positive.
 */
export interface SourcePosition {
  readonly line: number;
  readonly column: number;
}

export function makeSourcePosition(line: number, column: number): SourcePosition {
  if (!Number.isInteger(line) || line < 1) {
    throw new Error(`SourcePosition.line must be a positive integer, got ${line}`);
  }
  if (!Number.isInteger(column) || column < 1) {
    throw new Error(`SourcePosition.column must be a positive integer, got ${column}`);
  }
  return Object.freeze({ line, column });
}
