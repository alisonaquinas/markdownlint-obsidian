/**
 * Maps lint rule codes to the repository's published rule documentation.
 *
 * Built-in OFM and standard Markdown rules get stable documentation URLs.
 * Unknown custom rule codes intentionally return `null` so the extension does
 * not imply that local custom rules have first-party docs.
 *
 * @module fixes/ruleDocs
 */

const REPO_DOCS_URL = "https://github.com/alisonaquinas/markdownlint-obsidian/blob/main/docs/rules";

const OFM_FAMILIES: ReadonlyArray<{
  readonly min: number;
  readonly max: number;
  readonly path: string;
}> = [
  { min: 1, max: 7, path: "wikilinks" },
  { min: 20, max: 25, path: "embeds" },
  { min: 40, max: 44, path: "callouts" },
  { min: 60, max: 66, path: "tags" },
  { min: 80, max: 87, path: "frontmatter" },
  { min: 100, max: 104, path: "block-references" },
  { min: 120, max: 124, path: "highlights" },
  { min: 901, max: 905, path: "system" },
];

export function ruleDocumentationUrl(code: string): string | null {
  if (/^MD\d{3}$/.test(code)) return `${REPO_DOCS_URL}/standard-md/${code}.md`;
  const match = /^OFM(\d{3})$/.exec(code);
  if (match === null) return null;
  const number = Number(match[1]);
  const family = OFM_FAMILIES.find((entry) => number >= entry.min && number <= entry.max);
  return family === undefined ? null : `${REPO_DOCS_URL}/${family.path}/${code}.md`;
}
