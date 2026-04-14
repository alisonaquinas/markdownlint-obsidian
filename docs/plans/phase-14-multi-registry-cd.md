# Phase 14: Multi-Registry Publishing & Supply-Chain Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.
>
> **Pre-reading:** `docs/plans/phase-12-cd-automation.md` and `docs/plans/phase-13-package-split.md`. This phase extends the CD pipeline those phases established.

**Goal:** Harden the release pipeline and distribute both workspace packages (`markdownlint-obsidian`, `markdownlint-obsidian-cli`) to three registries with cryptographic provenance:

1. **npm registry (npmjs.org)** — primary, with SLSA Level 3 provenance attestations
2. **GitHub Packages npm registry (npm.pkg.github.com)** — secondary mirror under `@alisonaquinas/…` scope
3. **GitHub Container Registry (ghcr.io)** — Docker image signed with cosign (OIDC keyless) + SBOM + build provenance

Also switch the publish tooling from `npm publish` to `bun publish` where safe, so the CD toolchain matches the dev toolchain established in Phase 11.

**Background:** Phase 12 (CD automation) and Phase 13 (package split) landed a working release pipeline: release-please opens PRs, merging a Release PR fans out to `npm-publish`, `action-tag`, and `docker-publish`. Phase 12's "Known gaps / future work" called out three deferred items that this phase closes:

- npm package provenance (`npm publish --provenance`) for supply-chain attestations
- Docker image signing + SBOM for SLSA Build Level 2/3 compliance
- A redundant distribution path so a single-registry outage does not block installs

**Strategy:** Layer new jobs onto the existing `npm-publish.yml` and `docker-publish.yml` workflows rather than rewriting them. Every new publish target must be independently skippable via a workflow input so a partial outage (e.g. GitHub Packages down) does not block the primary npm release.

**Non-goals:**
- Publishing to JSR (jsr.io) — out of scope; revisit if Bun/Deno ecosystems gain meaningful traction for this package.
- Homebrew formula automation — separate distribution channel; revisit after npm provenance is stable.
- Signing the GitHub Action bundle (`action/dist/main.js`) — GitHub Marketplace does not currently verify action signatures; deferred.

---

## File Map

```
.github/
  workflows/
    npm-publish.yml              UPDATED: add --provenance, add GitHub Packages job, switch to bun publish
    docker-publish.yml           UPDATED: cosign sign, SBOM attestation, build provenance
    release-verify.yml           NEW: post-publish smoke tests (pull + install + --version)
packages/
  core/package.json              UPDATED: publishConfig with dual-registry matrix, repository field
  cli/package.json               UPDATED: publishConfig with dual-registry matrix, repository field
docs/
  guides/install.md              NEW: registry matrix, verification commands, provenance audit howto
  guides/ci-integration.md       UPDATED: document signed image pinning (digest pinning)
  adr/
    ADR007-multi-registry.md     NEW: why three registries, why cosign keyless, why bun publish
```

---

## Task 1: ADR007 — multi-registry distribution & signing

**Files:**

- Create: `docs/adr/ADR007-multi-registry.md`

Record the design decisions so future maintainers do not re-debate them.

- [ ] **Write ADR007** covering:
  - **Context:** Phase 12 shipped a single-registry pipeline (npm only; ghcr.io only). The community increasingly asks for supply-chain attestations (SLSA) and registry redundancy.
  - **Decision 1 — npm provenance:** Enable `--provenance` on npm publish. Uses GitHub Actions OIDC token to sign a statement linking the tarball to the source commit and workflow run. Consumers can verify with `npm audit signatures`.
  - **Decision 2 — GitHub Packages mirror:** Publish the same tarball under the `@alisonaquinas/` scope to `npm.pkg.github.com`. Zero additional secrets (uses `GITHUB_TOKEN`). Provides redundancy for users whose network blocks `registry.npmjs.org`.
  - **Decision 3 — cosign keyless for Docker:** Sign ghcr.io images using Sigstore cosign with GitHub OIDC — no long-lived keys to rotate. Verification: `cosign verify --certificate-identity-regexp '…' ghcr.io/…`.
  - **Decision 4 — `bun publish` over `npm publish`:** Bun 1.2+ supports `bun publish --access public --provenance`. Aligns the publish toolchain with the dev toolchain (Phase 11). Fall back to `npm publish` only if a Bun gap is discovered during smoke testing.
  - **Rejected alternatives:**
    - JSR: not yet adopted widely enough to justify a third publish path
    - Signing with a long-lived cosign key: key rotation burden; keyless OIDC is the modern default
    - Unscoped GitHub Packages publish: GitHub Packages requires scoped names for npm; scope `@alisonaquinas/` matches the repo owner
  - **Consequences:**
    - Two npm registries to keep in sync; a publish to npmjs.org but failure on npm.pkg.github.com leaves them drifted until the next release (documented, acceptable)
    - Every release now produces verifiable attestations; consumers can opt in to verification without breaking existing install flows
    - CI matrix grows; publish job runs in ~3–5 minutes longer

---

## Task 2: npm publish with provenance

**Files:**

- Edit: `.github/workflows/npm-publish.yml`
- Edit: `packages/core/package.json`, `packages/cli/package.json`

- [ ] **Add `id-token: write` permission** to the publish job so OIDC token minting works:

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write     # required for npm provenance
```

- [ ] **Switch publish commands to `bun publish --provenance`:**

```yaml
      - name: Publish core (npmjs.org, with provenance)
        if: startsWith(github.event.release.tag_name, 'packages/core')
        run: bun publish --access public --provenance
        working-directory: packages/core
        env:
          NPM_CONFIG_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Publish cli (npmjs.org, with provenance)
        if: startsWith(github.event.release.tag_name, 'packages/cli')
        run: bun publish --access public --provenance
        working-directory: packages/cli
        env:
          NPM_CONFIG_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Verification at implementation time:** Confirm that the installed Bun version (check `setup-bun` version in the workflow) supports `--provenance`. If not, pin `setup-bun` to a version that does, or fall back to `npm publish --provenance` with a toolchain note in ADR007. Use Context7 to check current Bun docs: `bun publish` reference.

- [ ] **Verify each `packages/*/package.json` has a `repository` field** pointing to the GitHub repo — provenance attestation requires it:

```json
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/alisonaquinas/markdownlint-obsidian.git",
    "directory": "packages/core"
  }
}
```

- [ ] **Commit**

```
chore(publish): enable npm provenance via bun publish
```

---

## Task 3: GitHub Packages (npm registry) mirror

**Files:**

- Edit: `.github/workflows/npm-publish.yml`

Publish the same built tarballs to `npm.pkg.github.com` under the repo-owner scope. The published packages there will be named `@alisonaquinas/markdownlint-obsidian` and `@alisonaquinas/markdownlint-obsidian-cli`.

GitHub Packages requires scoped names. Rather than renaming the primary packages, we pack the primary tarball and republish it under a scoped name via a temporary `package.json` patch in the workflow — the source remains a single unscoped package.

- [ ] **Add a second publish job** that runs in parallel to the npmjs.org publish:

```yaml
  publish-ghcr-npm:
    runs-on: ubuntu-latest
    needs: publish            # run only after npmjs.org succeeds
    permissions:
      contents: read
      packages: write         # required for GitHub Packages write
    strategy:
      fail-fast: false        # a failure here must NOT fail the primary release
      matrix:
        pkg:
          - { dir: packages/core, tag_prefix: packages/core }
          - { dir: packages/cli,  tag_prefix: packages/cli }
    steps:
      - uses: actions/checkout@v4
        if: startsWith(github.event.release.tag_name, matrix.pkg.tag_prefix)

      - uses: oven-sh/setup-bun@v2
        if: startsWith(github.event.release.tag_name, matrix.pkg.tag_prefix)
        with: { bun-version: "1.3.12" }

      - uses: actions/setup-node@v4
        if: startsWith(github.event.release.tag_name, matrix.pkg.tag_prefix)
        with:
          node-version: "20"
          registry-url: "https://npm.pkg.github.com"
          scope: "@alisonaquinas"

      - name: Build
        if: startsWith(github.event.release.tag_name, matrix.pkg.tag_prefix)
        run: bun install --frozen-lockfile && bun run --filter '*' build

      - name: Rewrite name to scoped form and publish
        if: startsWith(github.event.release.tag_name, matrix.pkg.tag_prefix)
        working-directory: ${{ matrix.pkg.dir }}
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # Back up original name; GitHub Packages requires @scope/name matching repo owner.
          node -e "
            const fs = require('fs');
            const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
            pkg.name = '@alisonaquinas/' + pkg.name;
            fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
          "
          npm publish --access public
```

**Notes:**
- Uses `npm publish` here (not `bun publish`) because Bun's registry token configuration for GitHub Packages is less mature; `actions/setup-node` with `registry-url` + `scope` is the battle-tested path.
- `needs: publish` means the mirror only runs after the primary succeeds — prevents a GitHub-Packages-only publish of a version that failed to land on npmjs.org.
- `fail-fast: false` ensures a GitHub Packages outage does not mark the release as failed.

- [ ] **Verify publish permissions on the repo:** Settings → Actions → General → Workflow permissions must allow `Read and write permissions`. Alternatively the job-level `packages: write` permission (used above) is sufficient.

- [ ] **Commit**

```
ci(publish): mirror npm packages to GitHub Packages registry
```

---

## Task 4: Docker image signing (cosign keyless) + SBOM + provenance

**Files:**

- Edit: `.github/workflows/docker-publish.yml`

Add three hardening layers to the existing Docker publish: signed image, attached SBOM, and build provenance attestation. All use GitHub OIDC — zero long-lived secrets.

- [ ] **Extend `docker-publish.yml`:**

```yaml
name: docker-publish

on:
  release:
    types: [published]

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write       # required for cosign keyless + provenance
      attestations: write   # required for attest-build-provenance
    steps:
      - uses: actions/checkout@v4

      - uses: sigstore/cosign-installer@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile
          push: true
          tags: |
            ghcr.io/alisonaquinas/markdownlint-obsidian:latest
            ghcr.io/alisonaquinas/markdownlint-obsidian:${{ github.event.release.tag_name }}
          sbom: true            # attach SPDX SBOM to the image
          provenance: mode=max  # attach SLSA provenance to the image

      - name: Sign image with cosign (keyless, OIDC)
        env:
          DIGEST: ${{ steps.build.outputs.digest }}
        run: |
          cosign sign --yes \
            "ghcr.io/alisonaquinas/markdownlint-obsidian@${DIGEST}"

      - name: Attest build provenance
        uses: actions/attest-build-provenance@v1
        with:
          subject-name: ghcr.io/alisonaquinas/markdownlint-obsidian
          subject-digest: ${{ steps.build.outputs.digest }}
          push-to-registry: true
```

**Notes:**
- `sbom: true` + `provenance: mode=max` on `docker/build-push-action` produce in-toto attestations attached to the image manifest. Inspectable via `docker buildx imagetools inspect ghcr.io/…`.
- `cosign sign --yes` uses the ambient OIDC token from `id-token: write` — no key material in the repo.
- Signing is per-digest, not per-tag, so `:latest` and `:vX.Y.Z` share a single signature (both point to the same digest).

**Verification (manual, after first signed release):**

```bash
cosign verify \
  --certificate-identity-regexp '^https://github\.com/alisonaquinas/markdownlint-obsidian/' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/alisonaquinas/markdownlint-obsidian:vX.Y.Z
```

Should print a valid signature block with matching identity.

- [ ] **Commit**

```
ci(docker): sign ghcr images with cosign + attach SBOM and provenance
```

---

## Task 5: Post-publish smoke tests

**Files:**

- Create: `.github/workflows/release-verify.yml`

A new workflow that fires after every release and verifies each publish target is reachable and installable. Catches breakage from outages, permission drift, or format changes — before users hit them.

- [ ] **Create `.github/workflows/release-verify.yml`:**

```yaml
name: Release verify

on:
  release:
    types: [published]

jobs:
  verify-npm:
    runs-on: ubuntu-latest
    needs: []
    # Wait so the npm CDN has propagated the new version.
    steps:
      - name: Sleep 90s for npm CDN propagation
        run: sleep 90

      - uses: actions/setup-node@v4
        with: { node-version: "20" }

      - name: Install cli from npmjs.org and run --version
        if: startsWith(github.event.release.tag_name, 'packages/cli')
        run: |
          VERSION="${GITHUB_REF_NAME#packages/cli}"
          VERSION="${VERSION#v}"
          npm install -g "markdownlint-obsidian-cli@${VERSION}"
          OUT=$(markdownlint-obsidian --version)
          echo "$OUT"
          echo "$OUT" | grep -q "${VERSION}"

      - name: Audit signatures (verifies provenance)
        if: startsWith(github.event.release.tag_name, 'packages/cli')
        run: npm audit signatures --registry=https://registry.npmjs.org

  verify-ghcr-npm:
    runs-on: ubuntu-latest
    steps:
      - name: Sleep 90s
        run: sleep 90

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          registry-url: "https://npm.pkg.github.com"
          scope: "@alisonaquinas"

      - name: Install cli from GitHub Packages
        if: startsWith(github.event.release.tag_name, 'packages/cli')
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          VERSION="${GITHUB_REF_NAME#packages/cli}"
          VERSION="${VERSION#v}"
          npm install -g "@alisonaquinas/markdownlint-obsidian-cli@${VERSION}"
          markdownlint-obsidian --version

  verify-ghcr-docker:
    runs-on: ubuntu-latest
    steps:
      - uses: sigstore/cosign-installer@v3

      - name: Pull and verify signed image
        run: |
          TAG="${{ github.event.release.tag_name }}"
          IMG="ghcr.io/alisonaquinas/markdownlint-obsidian:${TAG}"
          docker pull "$IMG"
          cosign verify \
            --certificate-identity-regexp '^https://github\.com/alisonaquinas/markdownlint-obsidian/' \
            --certificate-oidc-issuer https://token.actions.githubusercontent.com \
            "$IMG"
          docker run --rm "$IMG" --version
```

**Notes:**
- The 90s sleep is pragmatic: npm's CDN has eventual consistency. Without it, `npm install` of the just-published version can 404 intermittently for 30–60 s.
- `npm audit signatures` verifies the provenance statement signed in Task 2 — a failure here means provenance is broken even if publish succeeded.
- Docker verification uses `cosign verify` with the same identity regex consumers will use, so if this fails, so will every end user trying to verify.

- [ ] **Commit**

```
ci(release): add post-publish smoke test workflow
```

---

## Task 6: Consumer-facing install documentation

**Files:**

- Create: `docs/guides/install.md`
- Edit: `docs/guides/ci-integration.md`

Publish multi-registry knowledge so users can pin to whichever distribution matches their threat model.

- [ ] **Create `docs/guides/install.md`:**

Sections:
- **Registry matrix:** table of `npmjs.org | npm.pkg.github.com | ghcr.io` with package names, auth requirements, provenance availability.
- **Verifying npm provenance:** `npm install markdownlint-obsidian-cli && npm audit signatures`.
- **Installing from GitHub Packages:** `.npmrc` setup with `@alisonaquinas:registry=https://npm.pkg.github.com` + `GITHUB_TOKEN` for private CI or PAT for local use.
- **Verifying the Docker image:** cosign verify one-liner, recommended to pin by digest (`@sha256:…`) not tag.
- **Supply-chain threat model:** one paragraph on what attestations protect against (typosquatting, account takeover) and what they do not (compromised build environment → still signs maliciously produced artifacts).

- [ ] **Update `docs/guides/ci-integration.md`:**
- Replace any `ghcr.io/…:latest` examples with digest-pinned examples (`@sha256:…`) and note the tag floats.
- Add a "Verify before use" snippet showing `cosign verify` in a user's own CI pipeline before running the tool.

- [ ] **Commit**

```
docs: add registry matrix and provenance verification guide
```

---

## Task 7: Smoke-test the full pipeline

- [ ] **Create a throwaway release** (e.g. `v0.0.4`) after the workflow changes land on `main`.

- [ ] **Verify all publish targets succeed:**
  - `npm-publish` job → `https://www.npmjs.com/package/markdownlint-obsidian-cli/v/0.0.4` exists with a provenance badge
  - `publish-ghcr-npm` job → `https://github.com/alisonaquinas/markdownlint-obsidian/pkgs/npm/markdownlint-obsidian-cli` lists the version
  - `docker-publish` job → `cosign verify` succeeds against the new tag
  - `release-verify` workflow → all three verify jobs pass

- [ ] **Verify provenance end-to-end:** in a clean directory,

```bash
npm install -g markdownlint-obsidian-cli
npm audit signatures
# expect: "audited X packages, verified registry signatures"
#         "audited X packages, verified attestations"
```

- [ ] **Verify cosign signature end-to-end:**

```bash
cosign verify \
  --certificate-identity-regexp '^https://github\.com/alisonaquinas/markdownlint-obsidian/' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/alisonaquinas/markdownlint-obsidian:v0.0.4
```

If any step fails, fix the underlying workflow issue; do not paper over with `continue-on-error`.

---

## Acceptance criteria

| Check | Expected |
|---|---|
| Release tag on `packages/cli` | `bun publish --provenance` succeeds; npmjs.org shows provenance badge |
| Same release | GitHub Packages mirror `@alisonaquinas/markdownlint-obsidian-cli` reflects the new version within 5 min |
| Same release | ghcr.io image signed; `cosign verify` succeeds against the new tag |
| Same release | ghcr.io image has SBOM and SLSA provenance; `docker buildx imagetools inspect` shows both |
| `release-verify.yml` | All three verify jobs green on every release |
| `npm audit signatures` | Reports verified attestations for installed tarball |
| GitHub Packages outage (simulated by revoking token) | npm.pkg.github.com job fails; npmjs.org publish still succeeds; release marked successful |

---

## Known gaps / future work

- **JSR (jsr.io) publishing** — consider after the Bun/Deno ecosystems show meaningful demand. Would need `jsr.json` per package and ESM-only dist.
- **Homebrew formula** — requested occasionally; could be automated by adding a `homebrew-tap` workflow that updates a formula repo on each release.
- **Sigstore transparency log browsing** — document how to look up a release's attestation on `search.sigstore.dev` so auditors can cross-check without local tooling.
- **Rotating `NPM_TOKEN`** — Automation tokens are long-lived; switch to [npm trusted publishing / OIDC](https://docs.npmjs.com/trusted-publishers) once npm rolls it out for GitHub Actions (in preview at time of writing; verify availability at implementation time via Context7).
- **Node.js 20 actions deprecation** (still open from Phase 1): bump `actions/checkout`, `docker/build-push-action`, `docker/login-action`, `actions/setup-node`, `oven-sh/setup-bun` to their latest majors before 2026-09-16.
- **`markdownlint-obsidian` (library) GitHub Packages mirror** — only the CLI is user-installable end-to-end; the library mirror is nice-to-have but consumers rarely need a GitHub-Packages-scoped library. Revisit if users ask.
