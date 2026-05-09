---
title: "Extension ADRs"
aliases:
  - "Extension ADRs"
  - "ADR / Index"
tags:
  - "extension-docs"
  - "extension-docs/adr"
type: "adr-index"
status: "current"
updated: 2026-05-09
up: "[[README]]"
---

# Extension ADRs

Extension-specific Architecture Decision Records.

The initial implementation records these decisions in the architecture,
requirements, and roadmap docs. Dedicated numbered ADR files can be added when
a decision needs a larger permanent record.

## Accepted Decisions

| Decision | Status |
| :--- | :--- |
| In-process core use vs LSP server boundary | Accepted: in-process adapter around bundled core library |
| Workspace trust posture | Accepted: limited mode in untrusted workspaces; custom rules are gated |
| Virtual workspace support | Accepted: file-backed linting first; unsupported schemes report actionable limits |
| Packaging and published VSIX contents | Accepted: bundled CommonJS extension entry; docs and tests excluded from VSIX |
