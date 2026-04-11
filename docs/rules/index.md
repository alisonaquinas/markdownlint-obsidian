---
title: Rule catalog
---

# markdownlint-obsidian rule catalog

Every rule is one file under `src/infrastructure/rules/ofm/<area>/`. Codes are
namespaced by area: `OFM00x` for wikilinks, `OFM06x` for tags, `OFM08x` for
frontmatter, and `OFM9xx` for parser/system errors.

## Wikilinks (OFM001-OFM019)

| Code   | Name                              | Severity | Default  | Fixable |
| ------ | --------------------------------- | -------- | -------- | ------- |
| [[rules/wikilinks/OFM001]] | no-broken-wikilinks          | error    | enabled  | no      |
| [[rules/wikilinks/OFM002]] | invalid-wikilink-format      | error    | enabled  | no      |
| [[rules/wikilinks/OFM003]] | self-link                    | warning  | disabled | no      |
| [[rules/wikilinks/OFM004]] | ambiguous-wikilink-target    | error    | enabled  | no      |
| [[rules/wikilinks/OFM005]] | wikilink-case-mismatch       | warning  | enabled  | yes (Phase 9) |
| [[rules/wikilinks/OFM006]] | empty-wikilink-heading       | error    | enabled  | no      |
| [[rules/wikilinks/OFM007]] | wikilink-block-ref           | warning  | enabled  | no      |

## Frontmatter (OFM080–OFM099)

| Code   | Name                              | Severity | Default  | Fixable |
| ------ | --------------------------------- | -------- | -------- | ------- |
| [[rules/frontmatter/OFM080]] | missing-required-key       | error    | enabled  | no      |
| [[rules/frontmatter/OFM081]] | invalid-date-format        | error    | enabled  | no      |
| [[rules/frontmatter/OFM082]] | unknown-top-level-key      | warning  | disabled | no      |
| [[rules/frontmatter/OFM083]] | invalid-value-type         | error    | enabled  | no      |
| [[rules/frontmatter/OFM084]] | empty-required-key         | error    | enabled  | no      |
| [[rules/frontmatter/OFM085]] | duplicate-frontmatter-key  | error    | enabled  | no      |
| [[rules/frontmatter/OFM086]] | frontmatter-trailing-whitespace | warning | enabled | yes (Phase 9) |
| [[rules/frontmatter/OFM087]] | non-string-tag-entry       | error    | enabled  | no      |

## Tags (OFM060–OFM079)

| Code   | Name                              | Severity | Default  | Fixable |
| ------ | --------------------------------- | -------- | -------- | ------- |
| [[rules/tags/OFM060]] | invalid-tag-format               | error    | enabled  | no      |
| [[rules/tags/OFM061]] | tag-depth-exceeded               | error    | enabled  | no      |
| [[rules/tags/OFM062]] | empty-tag                        | error    | disabled | no      |
| [[rules/tags/OFM063]] | tag-trailing-slash               | error    | enabled  | yes (Phase 9) |
| [[rules/tags/OFM064]] | duplicate-tag                    | warning  | enabled  | no      |
| [[rules/tags/OFM065]] | mixed-case-tag                   | warning  | enabled  | yes (Phase 9) |
| [[rules/tags/OFM066]] | frontmatter-tag-not-in-body      | warning  | disabled | no      |

## System (OFM900–OFM999)

| Code | Name | Description |
| ---- | ---- | ----------- |
| OFM901 | internal-parser-error | Unexpected parser failure outside known categories. |
| OFM902 | frontmatter-parse-error | gray-matter / js-yaml could not parse frontmatter. |
