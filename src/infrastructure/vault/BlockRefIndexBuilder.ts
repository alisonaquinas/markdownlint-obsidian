import type { Parser } from "../../domain/parsing/Parser.js";
import type { VaultPath } from "../../domain/vault/VaultPath.js";
import { makeBlockRefIndex, type BlockRefIndex } from "../../domain/vault/BlockRefIndex.js";

/**
 * Infrastructure dependencies required to scan a vault for block references.
 *
 * `parser` is the same {@link Parser} instance used by the main lint pass —
 * supplying it via DI keeps extractor behaviour consistent across the index
 * build and the per-file rule runs. `readFile` is a thin async wrapper over
 * the filesystem (in the CLI path it is
 * {@link readMarkdownFile}) so the builder stays testable without touching
 * the real disk.
 */
export interface BlockRefBuildDeps {
  readonly parser: Parser;
  readonly readFile: (absolute: string) => Promise<string>;
}

/**
 * Build a {@link BlockRefIndex} by parsing every file in the vault once and
 * collecting every `blockRef` the extractor surfaces.
 *
 * Parse failures are silently skipped: OFM902 has already surfaced them
 * during the normal lint pass, so we do not want the bootstrap phase to
 * compound the noise by throwing or logging a second time.
 *
 * @param files - Every `.md` file the FileIndex knows about.
 * @param deps  - Shared parser and file reader.
 */
export async function buildBlockRefIndex(
  files: readonly VaultPath[],
  deps: BlockRefBuildDeps,
): Promise<BlockRefIndex> {
  const unique = new Map<string, Set<string>>();
  const raw = new Map<string, string[]>();

  for (const file of files) {
    let parsed;
    try {
      const source = await deps.readFile(file.absolute);
      parsed = deps.parser.parse(file.relative, source);
    } catch {
      continue;
    }
    const rawList: string[] = [];
    const seen = new Set<string>();
    for (const ref of parsed.blockRefs) {
      rawList.push(ref.blockId);
      seen.add(ref.blockId);
    }
    unique.set(file.relative, seen);
    raw.set(file.relative, rawList);
  }

  return makeBlockRefIndex(unique, raw);
}
