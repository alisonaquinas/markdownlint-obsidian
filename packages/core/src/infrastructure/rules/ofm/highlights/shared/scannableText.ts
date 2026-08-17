/**
 * Purpose: Token-stream based extraction of prose text per line, with every
 * non-prose context (code blocks, indented code, HTML, inline code, link and
 * image destinations, wikilink/embed targets) blanked out.
 *
 * Provides: {@link scannableLines}
 *
 * Role in system: Shared helper for highlight rules (OFM122/OFM123). Line-based
 * fence tracking desyncs on real-world content — pasted terminal output with
 * stray fence markers, blockquote-nested fences, four-backtick fences — and
 * misclassifies the lines after the desync point as prose. Scanning the
 * markdown-it token stream instead inherits the parser's exact notion of what
 * is code and what is text.
 *
 * @module infrastructure/rules/ofm/highlights/shared/scannableText
 */

/** Structural slice of markdown-it's Token the scanner relies on. */
interface Tok {
  readonly type: string;
  readonly map: readonly [number, number] | null;
  readonly children: readonly Tok[] | null;
  readonly content: string;
}

const WIKILINK_EMBED = /!?\[\[[^\]\n]*\]\]/g;

/**
 * Reconstruct one string per source line from an inline token's children.
 *
 * Text and text_special contribute their content; code spans, images,
 * autolinks and inline HTML contribute nothing (their raw source frequently
 * contains `==` in operators or base64 payloads that is not prose);
 * soft/hard breaks split lines.
 */
function inlineToLines(children: readonly Tok[]): string[] {
  const lines: string[] = [];
  let current = "";
  for (const child of children) {
    if (child.type === "text" || child.type === "text_special") {
      current += child.content;
    } else if (child.type === "softbreak" || child.type === "hardbreak") {
      lines.push(current);
      current = "";
    }
  }
  lines.push(current);
  return lines;
}

/**
 * Map every prose line (1-based, body coordinates) to its scannable text with
 * non-prose content removed. Lines that are pure code/HTML are absent.
 */
export function scannableLines(tokens: readonly unknown[]): ReadonlyMap<number, string> {
  const out = new Map<number, string>();
  const ts = tokens as readonly Tok[];
  for (let i = 0; i < ts.length; i += 1) {
    const block = ts[i];
    if (block === undefined || block.map === null) continue;
    if (!block.type.endsWith("_open")) continue;
    const inline = ts[i + 1];
    if (inline === undefined || inline.type !== "inline" || inline.children === null) continue;
    const startLine = block.map[0];
    const reconstructed = inlineToLines(inline.children);
    for (let k = 0; k < reconstructed.length; k += 1) {
      const text = (reconstructed[k] ?? "").replace(WIKILINK_EMBED, "");
      if (text.length > 0) {
        out.set(startLine + k + 1, text);
      }
    }
  }
  return out;
}
