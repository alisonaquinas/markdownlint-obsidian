import type { Fix } from "./Fix.js";

/** Two fixes whose ranges overlap on the same line. Immutable. */
export interface FixConflict {
  readonly filePath: string;
  /**
   * Rule code of the fix that was applied. Not yet populated — requires Fix to
   * carry a ruleCode field, which is deferred to a future phase.
   */
  readonly ruleA?: string;
  /**
   * Rule code of the fix that was skipped. Not yet populated — see ruleA.
   */
  readonly ruleB?: string;
  readonly first: Fix;
  readonly second: Fix;
  readonly reason: string;
}
