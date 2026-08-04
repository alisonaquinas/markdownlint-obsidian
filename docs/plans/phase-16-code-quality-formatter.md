---
title: "Phase 16: GitLab Code Quality Formatter"
aliases:
  - "Phase 16: GitLab Code Quality Formatter"
tags:
  - "docs"
  - "docs/plans"
  - "docs/plans/phase-work"
type: "plan"
status: "current"
updated: 2026-08-03
up: "[[roadmap]]"
---

# Phase 16: GitLab Code Quality Formatter

## Goal

Add a CodeClimate-style JSON formatter that lets GitLab process
`markdownlint-obsidian` findings as Code Quality report artifacts.

The formatter must be usable from the CLI, core package formatter registry,
and CI wrappers without changing linting semantics. It should produce a single
JSON array that satisfies GitLab Code Quality import requirements.

## External Baseline

GitLab's current Code Quality docs define the accepted custom report as a
single JSON array. Each finding object must include:

- `description`
- `check_name`
- `fingerprint`
- `severity`
- `location.path`
- `location.lines.begin` or `location.positions.begin.line`

GitLab also states that `location.path` must be relative to the repository and
must not start with `./`; valid severities are `info`, `minor`, `major`,
`critical`, and `blocker`; and the parser does not allow a byte order mark at
the beginning of the file.

Reference:
<https://docs.gitlab.com/ci/testing/code_quality/#code-quality-report-format>

## Non-Goals

- Do not add a separate GitLab CI job template in this phase.
- Do not change rule severity semantics in the domain model.
- Do not change CLI exit codes. Existing behavior remains: errors exit 1,
  warnings alone exit 0.
- Do not remove or repurpose `json`, `junit`, or `sarif`.
- Do not require users to install `markdownlint-cli2-formatter-codequality`.

## Naming

Register the primary formatter as `codeclimate`.

Also register `gitlab-code-quality` as an alias. GitLab calls the artifact a
Code Quality report, while many tools call the JSON shape a CodeClimate report.
Supporting both names avoids forcing users to remember the historical naming.

Update every formatter list to include both accepted names:

- CLI help text in `packages/cli/src/args.ts`;
- public package README formatter list;
- `docs/guides/ci-integration.md`;
- GitHub Action input documentation if the action validates or documents the
  formatter names.

## Output Contract

For every `LintError` in every `LintResult`, emit one object:

```json
{
  "description": "OFM001 no-broken-wikilinks: Broken wikilink target",
  "check_name": "OFM001/no-broken-wikilinks",
  "fingerprint": "<stable hash>",
  "severity": "major",
  "location": {
    "path": "docs/example.md",
    "lines": {
      "begin": 12
    }
  }
}
```

Mapping:

| GitLab field | Source |
| --- | --- |
| `description` | Include `ruleCode`, `ruleName`, and `message`. |
| `check_name` | Stable rule identity: `${ruleCode}/${ruleName}`. |
| `fingerprint` | Deterministic hash of normalized path, line, column, rule code, and message. |
| `severity` | Domain `error` maps to `major`; domain `warning` maps to `minor`. |
| `location.path` | Result `filePath`, normalized to POSIX separators and no leading `./`. |
| `location.lines.begin` | Error `line`. |

The formatter should output pretty-printed JSON with no BOM. `JSON.stringify`
already emits no BOM when the CLI writes the returned string to stdout.

## Fingerprint Policy

Use a Node standard-library hash, not a new dependency.

Input fields:

1. normalized relative path;
2. one-based line;
3. one-based column;
4. rule code;
5. rule message.

This intentionally excludes `ruleName` so cosmetic rule-name changes do not
create unrelated GitLab findings. It includes `message` so two different
violations from the same rule on the same line can remain distinct.

Implementation suggestion:

```typescript
createHash("sha256")
  .update([path, line, column, ruleCode, message].join("\0"))
  .digest("hex");
```

## Path Policy

Formatter input currently only receives `LintResult[]`, not `cwd`. Therefore
the formatter cannot reliably convert arbitrary absolute paths to repository
relative paths without extending the formatter contract.

Phase 16 should preserve the existing formatter signature and normalize only
what it can safely normalize:

- replace backslashes with `/`;
- remove leading `./`;
- preserve already-relative paths;
- preserve absolute paths rather than guessing.

Document the limitation clearly. The existing CLI normally produces paths
relative to the invocation root for discovered files, which is the intended
GitLab CI usage.

If tests reveal absolute paths in common CLI flows, defer a formatter-context
API extension to a follow-up phase rather than threading `cwd` through every
formatter in this phase.

## Implementation Tasks

### Task 1: Add Unit Tests First

Create `packages/core/tests/unit/formatters/CodeClimateFormatter.test.ts`.

Acceptance:

- one lint error becomes one JSON array item;
- empty results produce `[]`;
- warning maps to `minor`;
- error maps to `major`;
- path separators normalize to `/`;
- leading `./` is stripped;
- fingerprint is deterministic for identical input;
- fingerprint changes when path, line, column, rule code, or message changes;
- output parses as JSON and has no unexpected wrapper object.

### Task 2: Implement Formatter

Create `packages/core/src/infrastructure/formatters/CodeClimateFormatter.ts`.

Acceptance:

- Exports `formatCodeClimate(results: readonly LintResult[]): string`.
- Uses only domain lint data and Node standard library hashing.
- Produces stable field ordering by constructing object literals in the output
  contract order.
- Does not mutate `LintResult` or `LintError`.

### Task 3: Register Formatter Names

Update `FormatterRegistry.ts`.

Acceptance:

- `getFormatter("codeclimate")` returns the new formatter.
- `getFormatter("gitlab-code-quality")` returns the same formatter.
- Unknown formatter behavior remains unchanged (`OFM901`).

### Task 4: Add CLI Integration Coverage

Extend `packages/cli/tests/integration/formatters/formatter-cli.test.ts`.

Acceptance:

- `--output-formatter codeclimate` emits a JSON array with at least one item.
- `--output-formatter gitlab-code-quality` emits the same schema.
- The emitted object includes the GitLab-required fields.
- CLI exit code remains 1 when error-severity findings exist.

### Task 5: Update Public Docs

Update:

- `docs/guides/ci-integration.md`;
- `packages/core/README.md`;
- `README.md`;
- action docs, if they list formatter names.

Acceptance:

- Formatter table documents `codeclimate` and `gitlab-code-quality`.
- GitLab CI example writes `gl-code-quality-report.json`.
- GitLab CI example declares:

```yaml
artifacts:
  reports:
    codequality: gl-code-quality-report.json
```

### Task 6: Add Release Note

Update `CHANGELOG.md` under `[Unreleased]`.

Acceptance:

- Entry names both formatter aliases.
- Entry mentions GitLab Code Quality report artifacts.

### Task 7: Verification

Run:

```bash
bun run typecheck
bun run lint
bun run test
bun run test:dogfood
bun run test:all
```

Acceptance:

- All commands pass.
- Formatter output from a sample vault can be redirected to
  `gl-code-quality-report.json` and parsed by `JSON.parse`.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| GitLab silently drops findings when paths are not repo-relative. | Document relative-path requirement and test CLI-discovered paths. |
| Fingerprints churn across versions. | Pin fingerprint inputs in tests and avoid rule-name/version inputs. |
| Users choose the wrong formatter name. | Support both `codeclimate` and `gitlab-code-quality`. |
| Severity mapping is too coarse. | Start with `error -> major`, `warning -> minor`; document as formatter policy. |
| Existing wrappers reject the new formatter name. | Audit action and docs for hard-coded formatter lists. |

## Definition Of Done

- New formatter and alias are registered and covered by unit tests.
- CLI integration tests cover both formatter names.
- GitLab CI docs show a working `codequality` artifact example.
- Public formatter lists include the new names.
- Changelog has an `[Unreleased]` entry.
- `bun run test:all` and `bun run test:dogfood` pass.
