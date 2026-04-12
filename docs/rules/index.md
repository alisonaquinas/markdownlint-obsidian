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
| [[rules/wikilinks/OFM005]] | wikilink-case-mismatch       | warning  | enabled  | yes |
| [[rules/wikilinks/OFM006]] | empty-wikilink-heading       | error    | enabled  | no      |
| [[rules/wikilinks/OFM007]] | wikilink-block-ref           | warning  | enabled  | no      |

## Embeds (OFM020-OFM039)

| Code   | Name                              | Severity | Default  | Fixable |
| ------ | --------------------------------- | -------- | -------- | ------- |
| [[rules/embeds/OFM020]] | broken-embed                    | error    | enabled  | no      |
| [[rules/embeds/OFM021]] | invalid-embed-syntax            | error    | enabled  | no      |
| [[rules/embeds/OFM022]] | embed-target-missing            | error    | enabled  | no      |
| [[rules/embeds/OFM023]] | embed-size-invalid              | warning  | enabled  | no      |
| [[rules/embeds/OFM024]] | disallowed-embed-extension      | error    | enabled  | no      |
| [[rules/embeds/OFM025]] | embed-size-on-non-image         | warning  | enabled  | no      |

## Callouts (OFM040-OFM059)

| Code   | Name                              | Severity | Default  | Fixable |
| ------ | --------------------------------- | -------- | -------- | ------- |
| [[rules/callouts/OFM040]] | unknown-callout-type          | error    | enabled  | no      |
| [[rules/callouts/OFM041]] | malformed-callout             | error    | enabled  | no      |
| [[rules/callouts/OFM042]] | empty-callout                 | warning  | enabled  | no      |
| [[rules/callouts/OFM043]] | callout-in-list               | warning  | enabled  | no      |
| [[rules/callouts/OFM044]] | callout-fold-disabled         | warning  | enabled  | yes |

## Block references (OFM100-OFM119)

| Code   | Name                              | Severity | Default  | Fixable |
| ------ | --------------------------------- | -------- | -------- | ------- |
| [[rules/block-references/OFM100]] | invalid-block-ref      | error    | enabled  | no      |
| [[rules/block-references/OFM101]] | duplicate-block-id     | error    | enabled  | no      |
| [[rules/block-references/OFM102]] | broken-block-link      | error    | enabled  | no      |
| [[rules/block-references/OFM103]] | block-ref-on-heading   | warning  | enabled  | no      |
| [[rules/block-references/OFM104]] | block-id-case          | warning  | enabled  | yes |

## Highlights and comments (OFM120-OFM139)

| Code   | Name                              | Severity | Default  | Fixable |
| ------ | --------------------------------- | -------- | -------- | ------- |
| [[rules/highlights/OFM120]] | disallowed-highlight        | error    | disabled | no      |
| [[rules/highlights/OFM121]] | disallowed-comment          | error    | disabled | no      |
| [[rules/highlights/OFM122]] | malformed-highlight         | error    | enabled  | no      |
| [[rules/highlights/OFM123]] | nested-highlight            | error    | enabled  | no      |
| [[rules/highlights/OFM124]] | empty-highlight             | warning  | enabled  | yes |

## Frontmatter (OFM080–OFM099)

| Code   | Name                              | Severity | Default  | Fixable |
| ------ | --------------------------------- | -------- | -------- | ------- |
| [[rules/frontmatter/OFM080]] | missing-required-key       | error    | enabled  | no      |
| [[rules/frontmatter/OFM081]] | invalid-date-format        | error    | enabled  | no      |
| [[rules/frontmatter/OFM082]] | unknown-top-level-key      | warning  | disabled | no      |
| [[rules/frontmatter/OFM083]] | invalid-value-type         | error    | enabled  | no      |
| [[rules/frontmatter/OFM084]] | empty-required-key         | error    | enabled  | no      |
| [[rules/frontmatter/OFM085]] | duplicate-frontmatter-key  | error    | enabled  | no      |
| [[rules/frontmatter/OFM086]] | frontmatter-trailing-whitespace | warning | enabled | yes |
| [[rules/frontmatter/OFM087]] | non-string-tag-entry       | error    | enabled  | no      |

## Tags (OFM060–OFM079)

| Code   | Name                              | Severity | Default  | Fixable |
| ------ | --------------------------------- | -------- | -------- | ------- |
| [[rules/tags/OFM060]] | invalid-tag-format               | error    | enabled  | no      |
| [[rules/tags/OFM061]] | tag-depth-exceeded               | error    | enabled  | no      |
| [[rules/tags/OFM062]] | empty-tag                        | error    | disabled | no      |
| [[rules/tags/OFM063]] | tag-trailing-slash               | error    | enabled  | yes |
| [[rules/tags/OFM064]] | duplicate-tag                    | warning  | enabled  | no      |
| [[rules/tags/OFM065]] | mixed-case-tag                   | warning  | enabled  | yes |
| [[rules/tags/OFM066]] | frontmatter-tag-not-in-body      | warning  | disabled | no      |

## System (OFM900–OFM999)

| Code | Name | Description |
| ---- | ---- | ----------- |
| OFM901 | internal-parser-error | Unexpected parser failure outside known categories. |
| OFM902 | frontmatter-parse-error | gray-matter / js-yaml could not parse frontmatter. |
| OFM903 | fix-conflict | Two fixable rules targeted the same character range; the second fix was skipped. |

## Standard markdownlint rules (MD001–MD049)

Phase 7 adopts every upstream markdownlint rule as a first-class rule in
the registry. See the [[rules/standard-md/index|standard-md catalog]]
for the enabled/disabled status of every `MDxxx` code and the
conflict-page links for the rules disabled by default in OFM vaults.
