import MarkdownIt from "markdown-it";
import type { Parser } from "../../domain/parsing/Parser.js";
import { makeParseResult, type ParseResult } from "../../domain/parsing/ParseResult.js";
import { parseFrontmatter } from "./FrontmatterParser.js";
import { buildCodeRegionMap } from "./ofm/CodeRegionMap.js";
import { extractWikilinks } from "./ofm/WikilinkExtractor.js";
import { extractEmbeds } from "./ofm/EmbedExtractor.js";
import { extractCallouts } from "./ofm/CalloutExtractor.js";
import { extractTags } from "./ofm/TagExtractor.js";
import { extractBlockRefs } from "./ofm/BlockRefExtractor.js";
import { extractHighlights } from "./ofm/HighlightExtractor.js";
import { extractComments } from "./ofm/CommentExtractor.js";

/**
 * Build a Parser that combines gray-matter, markdown-it, and OFM extractors.
 * Creates a fresh markdown-it instance per parser factory call.
 */
export function makeMarkdownItParser(): Parser {
  const md = new MarkdownIt({ html: true, linkify: false });
  return {
    parse(filePath: string, content: string): ParseResult {
      return parseOne(md, filePath, content);
    },
  };
}

function parseOne(md: MarkdownIt, filePath: string, content: string): ParseResult {
  const { data, rawFrontmatter, bodyStartLine } = parseFrontmatter(content);
  const body = rawFrontmatter === null ? content : stripFrontmatter(content);
  const lines = body.split(/\r?\n/);
  const codeMap = buildCodeRegionMap(lines);
  const wikilinks = extractWikilinks(lines, codeMap);

  return makeParseResult({
    filePath,
    frontmatter: data,
    frontmatterRaw: rawFrontmatter,
    frontmatterEndLine: rawFrontmatter === null ? 0 : bodyStartLine - 1,
    tokens: md.parse(body, {}),
    wikilinks,
    embeds: extractEmbeds(wikilinks),
    callouts: extractCallouts(lines, codeMap),
    tags: extractTags(lines, codeMap),
    blockRefs: extractBlockRefs(lines, codeMap),
    highlights: extractHighlights(lines, codeMap),
    comments: extractComments(lines),
    raw: body,
    lines,
  });
}

function stripFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match === null ? content : content.slice(match[0].length);
}
