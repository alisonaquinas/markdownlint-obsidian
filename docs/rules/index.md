---
title: Rule catalog
---

# markdownlint-obsidian rule catalog

Every rule is one file under `src/infrastructure/rules/ofm/<area>/`. Codes are
namespaced by area: `OFM06x` for tags, `OFM08x` for frontmatter, and `OFM9xx`
for parser/system errors.

## Frontmatter (OFM080–OFM099)

| Code   | Name                              | Severity | Default  | Fixable |
| ------ | --------------------------------- | -------- | -------- | ------- |
| [[frontmatter/OFM080]] | missing-required-key       | error    | enabled  | no      |
| [[frontmatter/OFM081]] | invalid-date-format        | error    | enabled  | no      |
| [[frontmatter/OFM082]] | unknown-top-level-key      | warning  | disabled | no      |
| [[frontmatter/OFM083]] | invalid-value-type         | error    | enabled  | no      |
| [[frontmatter/OFM084]] | empty-required-key         | error    | enabled  | no      |
| [[frontmatter/OFM085]] | duplicate-frontmatter-key  | error    | enabled  | no      |
| [[frontmatter/OFM086]] | frontmatter-trailing-whitespace | warning | enabled | yes (Phase 9) |
| [[frontmatter/OFM087]] | non-string-tag-entry       | error    | enabled  | no      |

## Tags (OFM060–OFM079)

| Code   | Name                              | Severity | Default  | Fixable |
| ------ | --------------------------------- | -------- | -------- | ------- |
| [[tags/OFM060]] | invalid-tag-format               | error    | enabled  | no      |
| [[tags/OFM061]] | tag-depth-exceeded               | error    | enabled  | no      |
| [[tags/OFM062]] | empty-tag                        | error    | disabled | no      |
| [[tags/OFM063]] | tag-trailing-slash               | error    | enabled  | yes (Phase 9) |
| [[tags/OFM064]] | duplicate-tag                    | warning  | enabled  | no      |
| [[tags/OFM065]] | mixed-case-tag                   | warning  | enabled  | yes (Phase 9) |
| [[tags/OFM066]] | frontmatter-tag-not-in-body      | warning  | disabled | no      |

## System (OFM900–OFM999)

| Code | Name | Description |
| ---- | ---- | ----------- |
| OFM901 | internal-parser-error | Unexpected parser failure outside known categories. |
| OFM902 | frontmatter-parse-error | gray-matter / js-yaml could not parse frontmatter. |
