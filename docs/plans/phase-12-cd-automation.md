# Phase 12: CD Release Automation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate every manual step from the release process. After merging to `main`, a release PR is opened automatically, merging it publishes to npm, pushes the Docker image, and tags the GitHub Action — all without human intervention beyond approving the release PR.

**Background:** The v0.0.0 test release exposed that the full release process required three manual steps: (1) tagging, (2) creating the GitHub release via `gh release create`, and (3) no npm publish automation at all. Docker publish was the only automated step (triggered by `release published`). This phase closes all remaining gaps.

**Strategy:** Use [release-please](https://github.com/googleapis/release-please) (Google) as the release manager.

- On every push to `main`, release-please opens/updates a "Release PR" that bumps version numbers and updates `CHANGELOG.md` from conventional commit messages.
- Merging the Release PR triggers release-please to create the GitHub release and tag.
- The GitHub release event then fans out to the existing `docker-publish.yml` and two new workflows: `npm-publish.yml` and `action-tag.yml`.

**Why release-please over semantic-release or changesets:**
- PR-based model gives a human review point before the tag is cut (opt-out of full automation if needed).
- Already compatible with the conventional-commits style used throughout this repo (`fix(ci):`, `feat(action):`, etc.).
- Zero runtime secrets needed beyond `GITHUB_TOKEN` (npm token is only needed for the publish step).
- Handles monorepo-style `package.json` version bumping in `action/package.json` via a manifest config.

---

## File Map

```
.github/
  workflows/
    release-please.yml          NEW — opens/merges Release PRs; creates tags + GH releases
    npm-publish.yml             NEW — publishes to npm on release published
    action-tag.yml              NEW — advances major+minor version tags (v1, v1.3) for action users
  release-please-config.json   NEW — release-please package manifest
  .release-please-manifest.json NEW — tracks current versions per package
```

---

## Task 1: Add release-please configuration

**Files:**

- Create: `.github/release-please-config.json`
- Create: `.github/.release-please-manifest.json`

release-please needs to know which packages to manage and where their `package.json` files live.

- [ ] **Create `.github/release-please-config.json`**

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "packages": {
    ".": {
      "release-type": "node",
      "package-name": "markdownlint-obsidian",
      "changelog-path": "CHANGELOG.md",
      "bump-minor-pre-major": true,
      "bump-patch-for-minor-pre-major": true,
      "draft": false,
      "prerelease": false,
      "extra-files": [
        {
          "type": "json",
          "path": "action/package.json",
          "jsonpath": "$.version"
        }
      ]
    }
  },
  "bootstrap-sha": "6d82a51a475944e07c106cdbf0b36d5ced2f1bb5",
  "tag-separator": "",
  "include-component-in-tag": false
}
```

**Notes:**
- `bootstrap-sha` is the merge commit for PR #7 (the first commit on `main` after this plan is written). Set this to the actual HEAD of `main` at implementation time — prevents release-please from backfilling all prior commits.
- `extra-files` keeps `action/package.json` in sync with the root version so action users always get a matching bundle.
- `tag-separator: ""` and `include-component-in-tag: false` produce clean `v1.2.3` tags (not `markdownlint-obsidian-v1.2.3`).

- [ ] **Create `.github/.release-please-manifest.json`**

Seed with the version currently on `main` so release-please knows where to start:

```json
{
  ".": "1.0.0"
}
```

- [ ] **Commit**

```
git add .github/release-please-config.json .github/.release-please-manifest.json
git commit -m "chore(release): add release-please config and manifest"
```

---

## Task 2: release-please workflow

**Files:**

- Create: `.github/workflows/release-please.yml`

This is the core workflow. It runs on every push to `main`.

- [ ] **Create `.github/workflows/release-please.yml`**

```yaml
name: Release Please

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    outputs:
      release_created: ${{ steps.release.outputs.release_created }}
      tag_name: ${{ steps.release.outputs.tag_name }}
      major: ${{ steps.release.outputs.major }}
      minor: ${{ steps.release.outputs.minor }}
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          config-file: .github/release-please-config.json
          manifest-file: .github/.release-please-manifest.json
```

**How it works:**
1. Every push to `main` runs this job.
2. release-please scans new commits since the last release, groups them by type (`feat` → minor bump, `fix`/`perf` → patch, `feat!` or `BREAKING CHANGE` → major).
3. If there are releasable commits it opens (or updates) a single "chore(main): release vX.Y.Z" PR.
4. When that PR is merged, release-please creates the GitHub release and git tag — which fans out to the downstream publish workflows.

- [ ] **Commit**

```
git add .github/workflows/release-please.yml
git commit -m "ci(release): add release-please workflow"
```

---

## Task 3: npm publish workflow

**Files:**

- Create: `.github/workflows/npm-publish.yml`

Publishes to the npm registry whenever a GitHub release is published (which release-please does automatically on Release PR merge).

- [ ] **Add `NPM_TOKEN` secret to the repository**

In GitHub → Settings → Secrets → Actions → New repository secret:
- Name: `NPM_TOKEN`
- Value: an npm Automation token with publish rights for `markdownlint-obsidian`

This is the one secret that cannot be automated — it must be added manually once.

- [ ] **Create `.github/workflows/npm-publish.yml`**

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.3.12"

      - run: bun install --frozen-lockfile

      - name: Build
        run: bun run build

      - name: Publish
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Note:** We use `npm publish` (not `bun publish`) because npm's `--access public` flag and `.npmrc` token injection are more mature. The `NODE_AUTH_TOKEN` env var is the standard mechanism for npmjs.org authentication in CI.

**Dry-run verification before first real release:**
```bash
npm publish --dry-run
```
Expected pack contents: `dist/`, `src/`, `examples/`, `bin/`, `README.md`, `CHANGELOG.md`, `LICENSE`. Verify `action/` and `tests/` are absent (controlled by `files` in `package.json`).

- [ ] **Commit**

```
git add .github/workflows/npm-publish.yml
git commit -m "ci(release): add npm publish workflow"
```

---

## Task 4: GitHub Action version-tag workflow

**Files:**

- Create: `.github/workflows/action-tag.yml`

Action users pin to major version tags like `uses: alisonaquinas/markdownlint-obsidian@v1`. These floating tags must be advanced to the new release commit on every release.

- [ ] **Create `.github/workflows/action-tag.yml`**

```yaml
name: Advance action version tags

on:
  release:
    types: [published]

jobs:
  tag:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Advance major and minor tags
        env:
          TAG: ${{ github.event.release.tag_name }}
        run: |
          # TAG is e.g. "v1.3.2"
          MAJOR=$(echo "$TAG" | cut -d. -f1)          # "v1"
          MINOR=$(echo "$TAG" | cut -d. -f1,2)        # "v1.3"

          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          git tag -f "$MAJOR"
          git tag -f "$MINOR"
          git push origin "$MAJOR" --force
          git push origin "$MINOR" --force
```

This lets users write `uses: alisonaquinas/markdownlint-obsidian@v1` and always get the latest v1.x.x without updating their workflow files.

- [ ] **Commit**

```
git add .github/workflows/action-tag.yml
git commit -m "ci(release): add action major/minor tag advancement workflow"
```

---

## Task 5: Rebuild and commit action bundle on release

The action bundle (`action/dist/main.js`) must be up to date before a release is tagged, or the GitHub Action won't work for users who pin to the tag. This is currently verified by the CI drift check. However, the Release PR opened by release-please will bump the version in `action/package.json` — which means the bundle may need to be rebuilt.

**Options (choose one at implementation time):**

**Option A — Regenerate bundle in the Release PR itself (recommended):**
Add a job to `release-please.yml` that detects when the release-please PR is open and re-runs `cd action && bun install && bun run build`, then pushes the updated `action/dist/main.js` to the release branch.

```yaml
  rebuild-action-bundle:
    needs: release-please
    if: needs.release-please.outputs.release_created != 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: release-please--branches--main
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.3.12"

      - run: bun install --frozen-lockfile

      - name: Build root
        run: bun run build

      - name: Rebuild action bundle
        run: |
          cd action
          bun install
          bun run build

      - name: Commit updated bundle if changed
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add action/dist/main.js
          git diff --cached --quiet || git commit -m "chore: rebuild action bundle for release"
          git push
```

**Option B — Always rebuild bundle as part of the release PR review:**
Document in the Release PR template that the reviewer must run `cd action && bun install && bun run build` and push before merging. Lower automation value; not recommended.

- [ ] **Implement Option A** (or document Option B decision in an ADR if Option A proves unreliable).

---

## Task 6: Bootstrap and smoke-test the pipeline

- [ ] **Merge the CD automation changes to `main` via a PR** so release-please sees the first batch of releasable commits.

- [ ] **Verify release-please opens a Release PR** within one minute of the merge. The PR title should follow the pattern `chore(main): release vX.Y.Z`.

- [ ] **Inspect the Release PR contents:**
  - `package.json` version bumped
  - `action/package.json` version bumped (via `extra-files`)
  - `CHANGELOG.md` updated with entries grouped by type

- [ ] **Merge the Release PR** and verify all three downstream jobs fire:
  1. `docker-publish` → image pushed to `ghcr.io/alisonaquinas/markdownlint-obsidian:vX.Y.Z` and `:latest`
  2. `npm-publish` → package visible at `https://www.npmjs.com/package/markdownlint-obsidian`
  3. `action-tag` → `vX`, `vX.Y` floating tags advanced on GitHub

- [ ] **Install from npm and smoke-test:**

```bash
npm install -g markdownlint-obsidian@latest
markdownlint-obsidian --version   # should print the new version
```

- [ ] **Pull and smoke-test the Docker image:**

```bash
docker pull ghcr.io/alisonaquinas/markdownlint-obsidian:latest
docker run --rm ghcr.io/alisonaquinas/markdownlint-obsidian:latest --version
```

---

## Acceptance criteria

| Check | Expected |
|---|---|
| Push to `main` | release-please PR opened/updated within 60 s |
| Merge Release PR | GitHub release and tag created automatically |
| GitHub release created | `docker-publish` fires; image at `ghcr.io/.../markdownlint-obsidian:vX.Y.Z` |
| GitHub release created | `npm-publish` fires; package on npmjs.org |
| GitHub release created | `action-tag` fires; `vX` and `vX.Y` tags advanced |
| No manual steps | Full release requires only: merge PR to `main` → wait → merge Release PR |

---

## Known gaps / future work

- **`NPM_TOKEN` secret** must be added manually once (prerequisite for Task 3).
- **`action/dist/main.js` auto-rebuild** (Task 5 Option A) requires write access to the release branch; test that `GITHUB_TOKEN` permissions are sufficient or that the release-please app token is used instead.
- **Node.js 20 actions deprecation** (logged in execution ledger since Phase 1): `actions/checkout@v4`, `docker/build-push-action@v5`, and `docker/login-action@v3` will need `@v5`/`@v6` upgrades before 2026-09-16.
- **SLSA / provenance**: Consider adding `actions/attest-build-provenance` to the npm and Docker publish steps for supply-chain hardening.
