---
title: "vscode-markdownlint Functional Requirements - Test-Derived"
aliases:
  - "vscode-markdownlint Functional Requirements - Test-Derived"
tags:
  - "research/vscode"
  - "research/markdownlint"
  - "requirements/functional"
  - "planguage"
  - "docs"
  - "docs/research"
  - "docs/research/vscode-markdownlint"
type: "research"
status: "current"
updated: 2026-05-04
up: "[[research/vscode-markdownlint/technical-stack]]"
sources:
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/test/metadata-test.mjs
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/test/stringify-error-test.mjs
  - https://github.com/DavidAnson/vscode-markdownlint/blob/main/stringify-error.mjs
---

# Test-Derived Requirements

## Markdownlint.ErrorSerialization

```text
Tag: Markdownlint.ErrorSerialization
Gist: Serialize thrown values and nested errors into deterministic output text.
Ambition: Exceptions from markdownlint-cli2 are understandable and stable when written to the extension output channel or workspace lint terminal.
Scale: Percentage of supported thrown-value shapes whose serialized output matches the unit-test expected string format.
Meter: Node unit test covering null, number, string, object, error-like objects with name/message/stack/cause/errors, native `Error` with cause, and nested `AggregateError`.
Fail: Any covered input shape produces different name, message, stack, cause, errors, indentation, heading removal, or fallback text than expected by the unit tests.
Goal: 100% of covered input shapes match expected serialization.
Stakeholders: Markdown authors, extension maintainers.
Owner: vscode-markdownlint extension.
Source: `test/stringify-error-test.mjs`; `stringify-error.mjs`; `extension.mjs` error handling in `markdownlintWrapper` and `lintWorkspace`.
```

Test trace: [[research/vscode-markdownlint/tests/index#test/stringify-error-test.mjs|stringify-error unit tests]]

## Markdownlint.MetadataConsistency

```text
Tag: Markdownlint.MetadataConsistency
Gist: Keep package, README, changelog, and schema version references consistent with installed markdownlint packages.
Ambition: Published extension metadata points users to documentation matching the bundled lint engine.
Scale: Percentage of version references in package metadata, README, changelog, and schema files that match the installed `markdownlint-cli2` dependency version or installed transitive `markdownlint` version according to the unit-test regexes.
Meter: Node unit test `metadata/version numbers match` reading `package.json`, `CHANGELOG.md`, `README.md`, `markdownlint-cli2-config-schema.json`, `markdownlint-config-schema.json`, and `node_modules/markdownlint/package.json`.
Fail: Any checked version reference differs from the expected package version, or the first changelog major/minor version differs from the extension package major/minor version.
Goal: 100% of checked version references match unit-test expectations.
Stakeholders: Markdown authors, extension maintainers, release maintainers.
Owner: vscode-markdownlint extension.
Source: `test/metadata-test.mjs`.
```

Test trace: [[research/vscode-markdownlint/tests/index#test/metadata-test.mjs|metadata unit test]]
