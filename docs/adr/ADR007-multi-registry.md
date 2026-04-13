# ADR007 — Multi-registry publishing and supply-chain hardening

**Status:** Accepted
**Date:** 2026-04-13
**Context phase:** Phase 14

## Context

Phase 13 split the project into two independently publishable packages (`markdownlint-obsidian` and `markdownlint-obsidian-cli`) living in a Bun workspace monorepo. Phase 14 introduces an automated CD pipeline that publishes both packages on every tagged release.

As the project publishes to a public registry for the first time, two supply-chain concerns arise:

1. **Authenticity.** Consumers have no way to verify that a tarball on `registry.npmjs.org` was produced from a specific commit by the project's own CI — not from a compromised workstation or a tampered artifact.

2. **Availability.** `registry.npmjs.org` experiences periodic outages. Consumers who pin exact versions inside enterprise networks or air-gapped environments need a fallback.

In parallel, the project ships a Docker image to `ghcr.io` for users who run the linter in containers. The same authenticity concern applies: consumers should be able to verify the image was built from a known commit, without the project needing to manage signing keys.

## Decision

### 1. npm provenance via `bun publish --provenance`

Enable npm provenance on every npm publish by passing `--provenance` to `bun publish`.

GitHub Actions provides an OIDC token to the publish job. The npm registry uses that token to generate a signed provenance statement (an in-toto attestation) that records:

- the package name and version,
- the SHA-256 digest of the published tarball,
- the source repository URL and commit SHA, and
- the workflow run URL.

The statement is stored in the npm Transparency Log. Consumers verify it with:

```
npm audit signatures
```

No long-lived secrets are required. The OIDC token is ephemeral and scoped to the single workflow run.

### 2. GitHub Packages npm mirror under `@alisonaquinas/` scope

Publish both packages to `npm.pkg.github.com` as a secondary registry alongside `registry.npmjs.org`.

GitHub Packages uses the repository's `GITHUB_TOKEN` for authentication — no additional secrets need to be provisioned. The packages are published under the `@alisonaquinas/` scope (matching the repository owner), which is a hard requirement of GitHub Packages.

The mirror serves two purposes:

- **Redundancy.** When `registry.npmjs.org` is unavailable, consumers and CI pipelines can fall back to the GitHub Packages endpoint by adding `@alisonaquinas:registry=https://npm.pkg.github.com` to their `.npmrc`.
- **Auditability.** Every published version is linked to the exact GitHub release and commit via the GitHub Packages UI.

### 3. cosign keyless signing for Docker images on `ghcr.io`

Sign every Docker image pushed to `ghcr.io` using Sigstore cosign in keyless mode.

Keyless signing uses GitHub Actions OIDC — the same mechanism as npm provenance — to bind the image digest to the workflow run. No long-lived signing key is generated, stored, or rotated.

Consumers verify a signed image with:

```
cosign verify \
  --certificate-identity-regexp "https://github.com/alisonaquinas/obsidian-linter/.*" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  ghcr.io/alisonaquinas/obsidian-linter:<tag>
```

The verification chain runs entirely through Sigstore's public Rekor transparency log and Fulcio CA — no project-specific key material is involved.

### 4. `bun publish` over `npm publish`

Use `bun publish` (Bun 1.2+) as the publish command throughout the CD pipeline rather than invoking `npm publish`.

Rationale:

- **Toolchain consistency.** Phase 11 migrated the development toolchain to Bun (`bun install`, `bun test`, `bun run build`). Using `bun publish` keeps the entire pipeline within a single runtime, avoiding the need to install Node/npm alongside Bun in CI.
- **Provenance support.** Bun 1.2+ supports `--provenance` and `--access public`, providing feature parity with `npm publish` for the flags needed in this pipeline.
- **Workspace awareness.** `bun publish` respects the monorepo workspace layout and resolves `workspace:*` protocol references correctly before publishing.

If a gap between `bun publish` and `npm publish` behaviour is discovered (e.g. a missing flag, a registry compatibility issue), the affected publish step falls back to `npm publish` with Bun acting only as the package manager for installation.

## Rejected alternatives

**JSR (JavaScript Registry) as primary or secondary registry.**
JSR is not yet widely adopted in the Node/npm ecosystem. Most consumers, tooling integrations (Renovate, Dependabot, `npm audit`), and enterprise proxies target `registry.npmjs.org`. The migration cost and consumer friction outweigh the benefits at this stage.

**Long-lived cosign signing key (non-keyless).**
A long-lived private key requires secure generation, storage (e.g. in a CI secret), rotation policy, and revocation handling. Keyless OIDC signing eliminates all of this while providing stronger guarantees: the identity is bound to the specific GitHub Actions workflow run rather than to whoever holds the key. Long-lived keys are now the non-default option in Sigstore's own documentation.

**Unscoped package names on GitHub Packages.**
GitHub Packages requires that npm packages be published under a scope matching the repository owner (`@alisonaquinas/`). Publishing unscoped names (`markdownlint-obsidian`) is not supported. This is a platform constraint, not a design choice.

## Consequences

- **Two npm registries to keep in sync.** If the publish step for one registry succeeds and the other fails, the two registries will drift. The GitHub Packages mirror job runs with `fail-fast: false` and is deliberately non-blocking: a GitHub Packages outage does not block the primary npm release or the release tag. The failure is logged in the GitHub Actions summary, and consumers relying on the npmjs.org copy are unaffected. Registries may remain out of sync until the next release; this is acceptable and the drift scenario is documented in the Known gaps section of the phase-14 plan.
- **Verifiable attestations on every release.** Every published npm package and Docker image carries a cryptographically verifiable provenance statement. Consumers who do not verify attestations are unaffected — verification is opt-in. Consumers who do verify gain a strong supply-chain guarantee with no additional workflow changes on their side.
- **Slightly larger CI publish job.** The publish job grows by approximately 3–5 minutes: cosign install and image signing (~1 min), second-registry publish (~1–2 min), and provenance generation overhead (~1 min). This is within acceptable CI budget for a release-only job that does not run on every pull request.
- **Scoped names on GitHub Packages.** The secondary registry packages are `@alisonaquinas/markdownlint-obsidian` and `@alisonaquinas/markdownlint-obsidian-cli`, which differ from the primary registry names. Consumers using the mirror must reference the scoped names in their `.npmrc`. This difference is documented in the installation guide.

## Related

- [[plans/phase-14-multi-registry-cd]]
- [[plans/phase-12-cd-automation]]
- [[adr/ADR006-package-split]]
- [[adr/ADR005-node-path-in-domain]]
