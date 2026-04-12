import type { OFMRule } from "../../src/public/index.js";

const ALLOWED = new Set(["draft", "review", "published", "archived"]);

/**
 * Require every note to declare a `status` frontmatter key drawn from a
 * fixed vocabulary.
 *
 * Demonstrates: reading frontmatter, emitting a structured error,
 * and surfacing a meaningful message with the allowed values.
 */
const rule: OFMRule = {
  names: ["CUSTOM001", "require-frontmatter-status"],
  description: "Frontmatter must declare `status` as one of: draft, review, published, archived",
  tags: ["custom", "frontmatter"],
  severity: "error",
  fixable: false,
  run({ parsed }, onError) {
    const fm = parsed.frontmatter as Record<string, unknown>;
    const status = fm["status"];
    if (status === undefined) {
      onError({ line: 1, column: 1, message: 'Missing frontmatter key "status"' });
      return;
    }
    if (typeof status !== "string" || !ALLOWED.has(status)) {
      onError({
        line: 1,
        column: 1,
        message: `Frontmatter "status" must be one of: ${[...ALLOWED].join(", ")}. Got: ${JSON.stringify(status)}`,
      });
    }
  },
};

export default rule;
