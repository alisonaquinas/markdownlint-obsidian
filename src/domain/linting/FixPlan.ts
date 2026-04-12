import type { Fix } from "./Fix.js";

/** Ordered list of fixes for a single file. Immutable. */
export interface FixPlan {
  readonly filePath: string;
  readonly fixes: readonly Fix[];
}

export function makeFixPlan(filePath: string, fixes: readonly Fix[]): FixPlan {
  return Object.freeze({ filePath, fixes: Object.freeze([...fixes]) });
}
