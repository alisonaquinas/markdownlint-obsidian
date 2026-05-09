---
title: "Installation"
aliases:
  - "Installation"
tags:
  - "docs"
  - "docs/guides"
type: "guide"
status: "current"
updated: 2026-05-09
up: "[[README]]"
---

# Installation

Packages are published only to npmjs.org using trusted publishing
(GitHub Actions OIDC + npm provenance). Token-backed mirrors such as
GitHub Packages and GHCR container images are not published.

## Registry

| Registry | Package name | Auth required | Provenance | When to use |
|---|---|---|---|---|
| npmjs.org | `markdownlint-obsidian-cli` | No (public) | SLSA provenance | Default; use for all installs |

## npmjs.org

```bash
# Global CLI install
npm install -g markdownlint-obsidian-cli

# Or without installing globally
npx markdownlint-obsidian-cli --help
```

### Verifying provenance

After installing, verify that the package was built and signed by this repository's CI:

```bash
npm audit signatures
```

Expected output includes:

```
audited N packages
verified registry signatures
verified attestations
```

A missing `verified attestations` line means the package predates provenance
support or the registry did not record provenance.

## Supply-chain threat model

Provenance attestations prove *where* an artifact came from: they
cryptographically link a tarball digest to a specific source commit and CI
workflow run, recorded in the Sigstore public transparency log. This protects
against typosquatting, account-takeover publishing, and silent post-publish
tampering. Attestations do **not** guarantee the artifact is safe: a
compromised build environment or malicious source commit would still produce a
correctly signed artifact. Use attestations as one layer in a defence-in-depth
strategy alongside dependency pinning and audit tooling.
