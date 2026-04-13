/**
 * Per-vault index of block-reference ids. Built once per LintRun by
 * {@link bootstrapVault} using {@link buildBlockRefIndex} and passed to every
 * rule via {@link RuleParams}. `null` is threaded through when
 * `config.resolve === false`, matching the {@link VaultIndex} contract.
 *
 * Lookups normalise the page key: callers may pass a relative path with or
 * without the `.md` suffix, in either direction, so rules that consume a
 * {@link VaultPath.relative} (which retains `.md`) and rules that derive a
 * path by stripping the extension both resolve against the same entries.
 */
export interface BlockRefIndex {
  /**
   * @param pageRelative - Vault-relative path of the target page (with or
   *                       without the `.md` suffix).
   * @param blockId - The block identifier without the leading `^`.
   * @returns True when the page is indexed and carries a block with that id.
   */
  has(pageRelative: string, blockId: string): boolean;

  /**
   * Return the list of duplicate block ids declared on a single page, in
   * first-duplicate order. Empty when no duplicates exist (or the page is
   * unknown). Consumed by OFM101 for cross-file duplicate reporting when
   * scanning files other than the one currently under lint.
   */
  duplicatesIn(pageRelative: string): readonly string[];

  /** Expose the underlying unique map for introspection and tests. */
  all(): ReadonlyMap<string, ReadonlySet<string>>;
}

/**
 * Compute duplicate ids in a raw list, preserving first-seen order.
 */
function findDuplicates(list: readonly string[]): string[] {
  const seen = new Set<string>();
  const dups: string[] = [];
  for (const id of list) {
    if (seen.has(id)) {
      if (!dups.includes(id)) dups.push(id);
    } else {
      seen.add(id);
    }
  }
  return dups;
}

/**
 * Normalise the raw duplicate map into a page-keyed list, skipping pages
 * that have no duplicates and canonicalising keys through {@link normalize}.
 */
function buildDuplicateMap(raw: ReadonlyMap<string, readonly string[]>): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const [page, list] of raw.entries()) {
    const dups = findDuplicates(list);
    if (dups.length > 0) out.set(normalize(page), dups);
  }
  return out;
}

/**
 * Re-key the unique map through {@link normalize} so lookups answer whether
 * the caller passed the relative path with or without the `.md` suffix.
 */
function normalizeUnique(
  unique: ReadonlyMap<string, ReadonlySet<string>>,
): Map<string, ReadonlySet<string>> {
  const out = new Map<string, ReadonlySet<string>>();
  for (const [page, set] of unique.entries()) {
    out.set(normalize(page), set);
  }
  return out;
}

/**
 * Build a {@link BlockRefIndex} over a pre-extracted collection of block
 * references.
 *
 * @param unique - Map from vault-relative `.md` path to the set of unique
 *                 block ids declared on that page.
 * @param raw    - Optional map from the same key space to the raw (possibly
 *                 duplicate) list of ids. Supplied when callers want the
 *                 index to answer duplicate queries; omitted when only
 *                 existence lookups are required.
 */
export function makeBlockRefIndex(
  unique: ReadonlyMap<string, ReadonlySet<string>>,
  raw: ReadonlyMap<string, readonly string[]> = new Map(),
): BlockRefIndex {
  const duplicatesByPage = buildDuplicateMap(raw);
  const normalizedUnique = normalizeUnique(unique);

  return Object.freeze({
    has(pageRelative: string, blockId: string): boolean {
      return normalizedUnique.get(normalize(pageRelative))?.has(blockId) ?? false;
    },
    duplicatesIn(pageRelative: string): readonly string[] {
      return duplicatesByPage.get(normalize(pageRelative)) ?? [];
    },
    all(): ReadonlyMap<string, ReadonlySet<string>> {
      return normalizedUnique;
    },
  });
}

function normalize(pageRelative: string): string {
  return pageRelative.endsWith(".md") ? pageRelative : `${pageRelative}.md`;
}
