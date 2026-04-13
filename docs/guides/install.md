# Installation

Three distribution targets are available. Most users should use npmjs.org.

## Registry matrix

| Registry | Package name | Auth required | Provenance | When to use |
|---|---|---|---|---|
| npmjs.org | `markdownlint-obsidian-cli` | No (public) | ✅ SLSA Level 3 | Default; use for all installs |
| npm.pkg.github.com | `@alisonaquinas/markdownlint-obsidian-cli` | Yes (GITHUB_TOKEN or PAT) | ❌ | Mirror when npmjs.org is unavailable |
| ghcr.io | `ghcr.io/alisonaquinas/markdownlint-obsidian` | No (public) | ✅ cosign + SBOM | Container workflows |

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

A missing `verified attestations` line means the package predates provenance support (versions before the Phase 14 release) or the registry did not record provenance.

## GitHub Packages (mirror)

Add to `.npmrc` in your project or home directory:

```
@alisonaquinas:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then install:

```bash
npm install -g @alisonaquinas/markdownlint-obsidian-cli
```

A `GITHUB_TOKEN` with at least `read:packages` scope is required. In GitHub Actions the built-in `GITHUB_TOKEN` works without configuration.

## Docker (ghcr.io)

```bash
# Pull latest
docker pull ghcr.io/alisonaquinas/markdownlint-obsidian:latest

# Lint the current directory
docker run --rm -v "$PWD:/workdir" \
  ghcr.io/alisonaquinas/markdownlint-obsidian:latest \
  "**/*.md"
```

### Pinning by digest (recommended for reproducible CI)

Tags like `:latest` and `:v1.0.0` float. For reproducible builds, pin to a digest:

```bash
# Get the digest of a specific tag
docker inspect --format='{{index .RepoDigests 0}}' \
  ghcr.io/alisonaquinas/markdownlint-obsidian:latest

# Use digest in your workflow
docker run --rm -v "$PWD:/workdir" \
  ghcr.io/alisonaquinas/markdownlint-obsidian@sha256:<digest> \
  "**/*.md"
```

### Verifying the image signature (cosign)

Every image pushed to ghcr.io is signed with [Sigstore cosign](https://github.com/sigstore/cosign) using a keyless GitHub Actions OIDC identity. Verify before use:

```bash
cosign verify \
  --certificate-identity-regexp '^https://github\.com/alisonaquinas/markdownlint-obsidian/' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/alisonaquinas/markdownlint-obsidian:latest
```

A successful verification prints the signing certificate chain and confirms the image was built by this repository's CI workflow.

## Supply-chain threat model

Provenance attestations prove *where* an artifact came from: they cryptographically link a tarball or image digest to a specific source commit and CI workflow run, recorded in the Sigstore public transparency log. This protects against typosquatting (a different package claiming the same name), account-takeover publishing (an attacker pushing under a stolen npm token), and silent post-publish tampering (any modification to the artifact after signing breaks the signature). Attestations do **not** guarantee the artifact is safe: a compromised build environment or malicious source commit would still produce a correctly signed artifact. Use attestations as one layer in a defence-in-depth strategy alongside dependency pinning and audit tooling.
