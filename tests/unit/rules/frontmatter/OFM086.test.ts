import { describe, it, expect } from "bun:test";
import { OFM086Rule } from "../../../../src/infrastructure/rules/ofm/frontmatter/OFM086-trailing-whitespace-in-string.js";
import { runRuleOnSource } from "../helpers/runRuleOnSource.js";

describe("OFM086 frontmatter-trailing-whitespace", () => {
  it("passes when no string has trailing whitespace", async () => {
    const errors = await runRuleOnSource(OFM086Rule, "---\ntitle: Note\nauthor: Alison\n---\nbody");
    expect(errors).toEqual([]);
  });

  it("warns on a top-level trailing-space string", async () => {
    // The trailing whitespace must survive YAML parsing, so we use a quoted scalar.
    // "title" is the first key after the opening "---" (line 1), so it lands on line 2.
    const errors = await runRuleOnSource(OFM086Rule, '---\ntitle: "Note  "\n---\nbody');
    expect(errors).toHaveLength(1);
    expect(errors[0]?.ruleCode).toBe("OFM086");
    expect(errors[0]?.message).toContain("title");
    expect(errors[0]?.line).toBe(2);
  });

  it("walks into nested objects", async () => {
    // "author" is on line 2 of the file (line 1 is "---").
    const errors = await runRuleOnSource(OFM086Rule, '---\nauthor:\n  name: "Alison "\n---\nbody');
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("author.name");
    expect(errors[0]?.line).toBe(2);
    expect(errors[0]?.fix).toBeUndefined();
  });

  it("walks into arrays", async () => {
    // "tags" is on line 2 of the file (line 1 is "---").
    const errors = await runRuleOnSource(
      OFM086Rule,
      '---\ntags:\n  - "first "\n  - clean\n---\nbody',
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("tags.0");
    expect(errors[0]?.line).toBe(2);
    expect(errors[0]?.fix).toBeUndefined();
  });

  it("reports the correct line for a key that is not the first key", async () => {
    // "description" is the second key, on line 3.
    const errors = await runRuleOnSource(
      OFM086Rule,
      '---\ntitle: Clean\ndescription: "Has trailing  "\n---\nbody',
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("description");
    expect(errors[0]?.line).toBe(3);
  });

  it("emits a fix that deletes the trailing whitespace from a top-level string value", async () => {
    // '---\ntitle: "Note  "\n---\nbody'
    // frontmatterRaw = 'title: "Note  "\n'
    // rawLine[0] = 'title: "Note  "' — "Note" starts at 0-based index 8
    // trailing whitespace (2 spaces) starts at column 8+4+1=13 (1-based)
    // trailingCount=2
    const errors = await runRuleOnSource(OFM086Rule, '---\ntitle: "Note  "\n---\nbody');
    expect(errors[0]?.fix).toBeDefined();
    expect(errors[0]?.fix).toMatchObject({
      lineNumber: 2,
      editColumn: 13,
      deleteCount: 2,
      insertText: "",
    });
  });

  it("handles a top-level key whose name is a substring of its value", async () => {
    // rawLine: 'Note: "Note  "' — colonIdx=4, searchFrom=5
    // "Note" in value portion starts at index 7 (after space + quote)
    // editColumn = 7 + 4 + 1 = 12
    const errors = await runRuleOnSource(OFM086Rule, '---\nNote: "Note  "\n---\nbody');
    expect(errors).toHaveLength(1);
    expect(errors[0]?.fix).toBeDefined();
    expect(errors[0]?.fix).toMatchObject({
      lineNumber: 2,
      editColumn: 12,
      deleteCount: 2,
      insertText: "",
    });
  });
});
