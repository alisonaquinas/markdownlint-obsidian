import { XMLBuilder } from "fast-xml-parser";
import type { LintResult } from "../../domain/linting/LintResult.js";

interface TestCaseShape {
  "@_name": string;
  "@_classname": string;
  failure?: { "@_message": string; "#text": string };
}

interface TestSuiteShape {
  "@_name": string;
  "@_tests": number;
  "@_failures": number;
  "@_errors": number;
  testcase: TestCaseShape[];
}

const builder = new XMLBuilder({
  ignoreAttributes: false,
  format: true,
  suppressEmptyNode: false,
});

/**
 * Format results as JUnit XML.
 *
 * One `<testsuite>` is emitted per file, with one `<testcase>` per
 * {@link LintResult.errors} entry. Files with no errors still produce a
 * single synthetic passing `<testcase name="clean">` so downstream CI
 * dashboards get a stable suite count even on clean runs.
 *
 * XML escaping is delegated entirely to `fast-xml-parser`'s `XMLBuilder`
 * — callers must not pre-escape `<`, `>`, `&`, `"`, or `'` in messages.
 *
 * @param results - Per-file lint results.
 * @returns A UTF-8 JUnit XML document as a string.
 */
export function formatJUnit(results: readonly LintResult[]): string {
  const suites: TestSuiteShape[] = results.map(toTestSuite);
  const doc = {
    "?xml": { "@_version": "1.0", "@_encoding": "UTF-8" },
    testsuites: { testsuite: suites },
  };
  return builder.build(doc) as string;
}

/** Convert a single {@link LintResult} into a JUnit `<testsuite>` shape. */
function toTestSuite(result: LintResult): TestSuiteShape {
  const cases: TestCaseShape[] = result.errors.map((e) => ({
    "@_name": `${e.ruleCode} ${e.ruleName}`,
    "@_classname": result.filePath,
    failure: {
      "@_message": e.message,
      "#text": `${result.filePath}:${e.line}:${e.column} ${e.ruleCode} ${e.message}`,
    },
  }));
  if (cases.length === 0) {
    cases.push({ "@_name": "clean", "@_classname": result.filePath });
  }
  return {
    "@_name": result.filePath,
    "@_tests": cases.length,
    "@_failures": result.errors.length,
    "@_errors": 0,
    testcase: cases,
  };
}
