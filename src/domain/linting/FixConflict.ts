import type { Fix } from "./Fix.js";

/** Two fixes whose ranges overlap on the same line. Immutable. */
export interface FixConflict {
  readonly filePath: string;
  readonly ruleA: string;
  readonly ruleB: string;
  readonly first: Fix;
  readonly second: Fix;
  readonly reason: string;
}
