# Bug: `--fix` is non-convergent and *increases* violations on repeated runs (blank-line rules)

<!-- markdownlint-configure-file { "MD036": false } -->

- **Package:** `markdownlint-obsidian-cli` **1.3.1** (bundles `markdownlint-obsidian` 1.3.1)
- **Reported:** 2026-07-08
- **Severity:** High — `--fix` corrupts formatting and, on real vaults, makes the report monotonically *worse* every pass instead of converging to zero.
- **Environment:** `node:24-alpine` (Node 24.18.0), Linux arm64. Also observed on macOS/Node 24. (A separate Node-25 issue is noted at the end.)

---

## TL;DR

`markdownlint-obsidian --fix` is **not idempotent** and, on non-trivial input, **diverges**: each successive `--fix` pass *adds* blank-line violations rather than removing them, and the tool logs `[fix-conflict] … Overlap on line N (col … vs col …)` while doing so. A single `--fix` is never sufficient, and repeating `--fix` never reaches a fixed point.

A correct fixer must be **convergent** (repeated `--fix` reaches a stable state) and ideally **idempotent** (one pass suffices; a second pass is a no-op).

---

## Impact

On a real docs vault (281 files) the tool went the **wrong way** on every pass after the first:

| Run | Errors | Δ | `fix-conflict` logged |
|-----|-------:|----:|:---:|
| baseline (no `--fix`) | 531 | — | — |
| after `--fix` ×1 | 430 | −101 | 6 |
| after `--fix` ×2 | 510 | **+80** | 6 |
| after `--fix` ×3 | 590 | **+80** | 0 |
| after `--fix` ×4 | 673 | **+83** | 0 |
| after `--fix` ×5 | 755 | **+82** | 0 |
| after `--fix` ×6 | 838 | **+83** | 0 |

Pass 1 removes some issues but leaves conflicts unresolved; from pass 2 on the count climbs by ~80 per pass with no ceiling. The growth is dominated by **`no-multiple-blanks` (MD012)** and **`blanks-around-lists` (MD032)** — i.e. the fixer keeps inserting blank lines it never reconciles.

*(Command used for the table: `markdownlint-obsidian "docs/**/*.md" --config docs/.obsidian-linter.jsonc --fix` repeated, re-measuring with `--output-formatter json` between passes.)*

---

## Minimal reproduction (self-contained)

The trigger is an **indented sub-list attached to a text line ending in `:`**, sandwiched between two prose lines — e.g. the common Gherkin/BDD `**When** … :` / `**Then**` shape. The two fixers that want to insert a blank line at the list's boundaries produce overlapping edits.

**Setup**

```sh
mkdir -p repro/.obsidian            # vault marker; rule execution is gated on it
cd repro
cat > config.jsonc <<'EOF'
{ "config": { "default": true, "MD013": false } }
EOF
printf '# Title\n\n**When** an `OPTIONS` preflight is sent with:\n  - `Origin: https://attacker.example.com`\n  - `Access-Control-Request-Method: PUT`\n**Then** the response omits `Access-Control-Allow-Origin`\n' > bug.md
```

`bug.md` is:

```md
# Title

**When** an `OPTIONS` preflight is sent with:
  - `Origin: https://attacker.example.com`
  - `Access-Control-Request-Method: PUT`
**Then** the response omits `Access-Control-Allow-Origin`
```

**Run** (Node 24; e.g. `docker run --rm -v "$PWD":/w -w /w node:24-alpine sh -c '…'`)

```sh
npm i -g markdownlint-obsidian-cli@1.3.1
count() { markdownlint-obsidian "**/*.md" --config config.jsonc --output-formatter json \
  | node -e "let d=JSON.parse(require('fs').readFileSync(0,'utf8')||'[]');console.log(d.flatMap(f=>f.errors||[]).length)"; }

count                                                   # 3  (ul-indent ×2, blanks-around-lists ×1)
markdownlint-obsidian "**/*.md" --config config.jsonc --fix   # logs: [fix-conflict] … Overlap on line 4 (col 1-2 vs col 1)
count                                                   # 1  <-- one pass did NOT fully fix (not idempotent)
markdownlint-obsidian "**/*.md" --config config.jsonc --fix
count                                                   # 0  <-- only clean after a SECOND pass
```

**Observed:** the first `--fix` emits a `fix-conflict` and leaves 1 residual error; a second pass is required to reach 0.

Repeating the same block 5× in one file makes it worse — `16 → 6 → 1` errors across two passes with **5** `fix-conflict` messages on pass 1. Larger, real documents (nested lists, callouts/blockquotes adjacent to lists, `**And**` chains) tip this from "needs 2 passes" into the **unbounded divergence** shown in the Impact table.

---

## Expected vs. actual

- **Expected:** `--fix` reduces the violation count and is convergent; re-running `--fix` on already-fixed output makes **no** changes and reports **0** fixable issues.
- **Actual:** `--fix` is non-idempotent (needs ≥2 passes even on a 6-line file) and, at document/vault scale, **diverges** — the violation count increases without bound, and the tool reports `fix-conflict` overlaps it does not resolve.

---

## Diagnosis / hypothesis

The `[fix-conflict] … Overlap on line N (col 1-2 vs col 1)` logs are the key signal. Around a loose indented sub-list, **multiple blank-line rules request edits at the same (or adjacent) location**:

- `MD032` (blanks-around-lists) / `MD022` (blanks-around-headings) / `MD031` (blanks-around-fences) want to *insert* a blank line at a boundary, and
- `MD012` (no-multiple-blanks) wants to *delete* a blank line at that same boundary.

The fix-application step appears to:

1. Detect the overlapping edit ranges and **skip** one side (hence the `fix-conflict` log) rather than sequencing them, so a pass leaves residual violations (non-idempotent); and
2. On the next pass, re-insert a blank that the conflicting delete never removed — so blanks **accumulate** (`no-multiple-blanks` climbs), which triggers yet more boundary fixes next pass. The insert/delete pair never reconciles → monotonic growth.

Likely root causes to check:

- Fix edits are computed against **stale line/column offsets** (all fixes for a pass planned against the original buffer, then applied without re-basing), so once one edit shifts lines the rest overlap.
- No **single-writer reconciliation** of blank-line rules: insert (MD032/MD022/MD031) and delete (MD012) fixers are allowed to target overlapping ranges instead of being merged into one normalization step.
- Indented sub-lists whose parent is a **paragraph line ending in `:`** (not a list item) are treated as top-level lists for boundary purposes, so the fixer inserts a blank that de-groups them and then re-processes them each pass.

---

## Suggested direction

- Apply fixes **one at a time with buffer re-parse between edits**, or compute all edits then **merge/-resolve overlaps deterministically** (never silently skip on conflict).
- Make blank-line normalization a **single idempotent pass** (collapse the MD012 ↔ MD022/MD031/MD032 interaction) so inserting a required blank cannot create a multiple-blank that a conflicting rule then fails to remove.
- Add a **convergence/idempotency test**: `--fix` then `--fix` again must produce zero further changes and zero remaining fixable issues, on a corpus that includes indented sub-lists under `:`-terminated prose lines, callouts adjacent to lists, and `**When**/**Then**/**And**` blocks.

---

## Workaround (for users)

- **Do not** use `markdownlint-obsidian --fix` on non-trivial docs at present.
- For the standard markdownlint rule subset, `markdownlint-cli2 --fix` (with a config mirroring this engine's effective ruleset — i.e. `default: true` plus the OFM-conflict disables `MD013/MD018/MD028/MD033/MD034/MD041/MD042`) is convergent and idempotent; it reduced the same 281-file corpus from 205 → ~9 in a single stable pass, with the residue being OFM-specific (wikilink) issues that are hand-fixed.

---

## Secondary finding (separate issue, noted for completeness)

On **Node 25** (`v25.6.1`, macOS arm64), `markdownlint-obsidian-cli@1.3.0`/`1.3.1` **silently match zero files** — every invocation (glob *or* explicit single file) returns `[]` with exit 0 and no error, so linting is a silent no-op. `1.1.0` works on the same host. This is dangerous in CI: a runner that upgrades its Node image to 25 would report "clean" while checking nothing. Worth (a) failing loudly when zero files match a provided glob, and (b) declaring a supported Node range / adding a Node-25 CI matrix entry.
