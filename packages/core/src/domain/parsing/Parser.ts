/**
 * Purpose: Defines the domain-level interface for converting raw Markdown content into a structured {@link ParseResult}.
 *
 * Provides: {@link Parser}
 *
 * Role in system: A Dependency Inversion Point that decouples domain rules from the concrete markdown-it-based parser in `infrastructure/parser/`. The application use case accepts a `Parser` instance injected by the DI root so the domain has zero dependency on any parsing library.
 *
 * @module domain/parsing/Parser
 */
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
