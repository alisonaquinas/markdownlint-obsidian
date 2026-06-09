---
title: "ADR008 — Tag-driven package releases"
aliases:
  - "ADR008 — Tag-driven package releases"
tags:
  - "docs"
  - "docs/adr"
type: "adr"
status: "accepted"
updated: 2026-06-09
up: "[[README]]"
---

# ADR008 — Tag-driven package releases

**Status:** Accepted
**Date:** 2026-06-09
**Supersedes:** Release Please package-release automation from [[ADR006-package-split]]

## Context

The repository previously used Release Please to inspect commits on `main`,
open release PRs, update package changelogs, bump package versions, create
GitHub releases, and fan out to npm publishing.

That model created unwanted bot-authored PRs against `main` and made release
intent implicit. It also hid the actual deployment command behind a generated
PR merge, while package publishing already had clear package-specific tag
names:

- `markdownlint-obsidianvX.Y.Z`
- `markdownlint-obsidian-clivX.Y.Z`

The extension workflow already uses a tag-driven model through `ext-v*` tags.
The npm package workflow should follow the same release-control pattern.

## Decision

Package publishing is driven by explicit git tags, not generated release PRs.

Pushing `markdownlint-obsidianvX.Y.Z` runs the npm publish workflow for
`packages/core`. Pushing `markdownlint-obsidian-clivX.Y.Z` runs the npm publish
workflow for `packages/cli`.

The publish workflow must:

1. route the tag to exactly one package;
2. verify the tag version equals that package's `package.json` version;
3. build both workspace packages;
4. rewrite `workspace:*` dependencies to concrete semver ranges;
5. publish with npm trusted publishing and provenance;
6. create or update the matching GitHub release; and
7. upload the package tarball to that release.

Release Please configuration and workflow files are removed. Changelogs and
package versions are maintained before a release tag is pushed.

## Consequences

- Release intent is explicit: the tag is the deployment command.
- Bot-generated release PRs no longer appear after pushes to `main`.
- A wrong tag version fails before publishing because the workflow validates
  the tag against the package manifest.
- Maintainers must prepare changelogs and package versions before pushing a
  release tag. This is more manual than Release Please, but it keeps release
  control in normal branches and pull requests.
- GitHub releases become outputs of successful tag-driven package publishes,
  not inputs to publishing.

## Related

- [[adr/ADR006-package-split]]
- [[adr/ADR007-multi-registry]]
- [[architecture/npm-packages]]
