import type { RuleRegistry } from "../../../domain/linting/RuleRegistry.js";
import { frontmatterParseErrorRule } from "./system/FrontmatterParseError.js";
import { OFM080Rule } from "./frontmatter/OFM080-missing-required-key.js";
import { OFM081Rule } from "./frontmatter/OFM081-invalid-date-format.js";
import { OFM082Rule } from "./frontmatter/OFM082-unknown-top-level-key.js";
import { OFM083Rule } from "./frontmatter/OFM083-invalid-value-type.js";
import { OFM084Rule } from "./frontmatter/OFM084-empty-required-key.js";
import { OFM085Rule } from "./frontmatter/OFM085-duplicate-key.js";
import { OFM086Rule } from "./frontmatter/OFM086-trailing-whitespace-in-string.js";
import { OFM087Rule } from "./frontmatter/OFM087-non-string-tag-entry.js";
import { OFM060Rule } from "./tags/OFM060-invalid-tag-format.js";
import { OFM061Rule } from "./tags/OFM061-tag-depth-exceeded.js";
import { OFM062Rule } from "./tags/OFM062-empty-tag.js";
import { OFM063Rule } from "./tags/OFM063-trailing-slash.js";
import { OFM064Rule } from "./tags/OFM064-duplicate-tag.js";
import { OFM065Rule } from "./tags/OFM065-mixed-case-tag.js";
import { OFM066Rule } from "./tags/OFM066-frontmatter-tag-not-in-body.js";
import { OFM001Rule } from "./wikilinks/OFM001-broken-wikilink.js";
import { OFM002Rule } from "./wikilinks/OFM002-invalid-wikilink-format.js";
import { OFM003Rule } from "./wikilinks/OFM003-self-link.js";
import { OFM004Rule } from "./wikilinks/OFM004-ambiguous-target.js";
import { OFM005Rule } from "./wikilinks/OFM005-case-mismatch.js";
import { OFM006Rule } from "./wikilinks/OFM006-empty-heading.js";
import { OFM007Rule } from "./wikilinks/OFM007-block-ref-in-body.js";

const ALL = [
  frontmatterParseErrorRule,
  OFM080Rule,
  OFM081Rule,
  OFM082Rule,
  OFM083Rule,
  OFM084Rule,
  OFM085Rule,
  OFM086Rule,
  OFM087Rule,
  OFM060Rule,
  OFM061Rule,
  OFM062Rule,
  OFM063Rule,
  OFM064Rule,
  OFM065Rule,
  OFM066Rule,
  OFM001Rule,
  OFM002Rule,
  OFM003Rule,
  OFM004Rule,
  OFM005Rule,
  OFM006Rule,
  OFM007Rule,
];

/** Register every built-in OFM rule with a RuleRegistry. */
export function registerBuiltinRules(registry: RuleRegistry): void {
  for (const rule of ALL) registry.register(rule);
}
