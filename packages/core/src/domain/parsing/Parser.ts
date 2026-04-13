import type { ParseResult } from "./ParseResult.js";

/**
 * Application-facing parser contract. Implementations live in
 * `infrastructure/parser/`. Domain code depends on this interface only.
 */
export interface Parser {
  /**
   * Parse a file's raw content into a ParseResult.
   * Must never throw for syntactically invalid OFM — the extractors are
   * tolerant. May throw for I/O errors at the caller's layer, not here.
   */
  parse(filePath: string, content: string): ParseResult;
}
