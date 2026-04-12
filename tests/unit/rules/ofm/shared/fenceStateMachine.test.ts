import { describe, it, expect } from "vitest";
import {
  updateFence,
  stripInlineCode,
} from "../../../../../src/infrastructure/rules/ofm/shared/fenceStateMachine.js";

describe("updateFence", () => {
  describe("backtick fences", () => {
    it("opens a fenced block on a triple-backtick line", () => {
      const result = updateFence("```", null);
      expect(result.fence).toBe("```");
      expect(result.skip).toBe(true);
    });

    it("opens a fenced block on a longer backtick fence", () => {
      const result = updateFence("````", null);
      expect(result.fence).toBe("````");
      expect(result.skip).toBe(true);
    });

    it("closes a backtick fenced block when the same fence token appears", () => {
      const opened = updateFence("```", null);
      const closed = updateFence("```", opened.fence);
      expect(closed.fence).toBeNull();
      expect(closed.skip).toBe(true);
    });
  });

  describe("tilde fences", () => {
    it("opens a fenced block on a triple-tilde line", () => {
      const result = updateFence("~~~", null);
      expect(result.fence).toBe("~~~");
      expect(result.skip).toBe(true);
    });

    it("closes a tilde fenced block when the same fence token appears", () => {
      const opened = updateFence("~~~", null);
      const closed = updateFence("~~~", opened.fence);
      expect(closed.fence).toBeNull();
      expect(closed.skip).toBe(true);
    });
  });

  describe("ignoring fence openers while already inside a fenced block", () => {
    it("does not open a new block while already inside a backtick fence", () => {
      const opened = updateFence("```", null);
      // A second opening fence inside the block should be treated as content
      const _inner = updateFence("```", opened.fence);
      // This actually closes the outer fence (same token closes), so let's
      // test with a *different* token — a backtick fence inside a tilde fence
      const outerOpened = updateFence("~~~", null);
      const innerLine = updateFence("```", outerOpened.fence);
      expect(innerLine.fence).toBe("~~~"); // still inside tilde fence
      expect(innerLine.skip).toBe(true);
    });

    it("stays inside a tilde fence when a backtick fence line is encountered", () => {
      const opened = updateFence("~~~", null);
      const line = updateFence("```javascript", opened.fence);
      expect(line.fence).toBe("~~~");
      expect(line.skip).toBe(true);
    });

    it("stays inside a backtick fence when a regular content line is encountered", () => {
      const opened = updateFence("```", null);
      const line = updateFence("const x = 1;", opened.fence);
      expect(line.fence).toBe("```");
      expect(line.skip).toBe(true);
    });

    it("requires the outer fence to be closed before a new fence can open", () => {
      let fence: string | null = null;

      // Open outer fence
      ({ fence } = updateFence("~~~", fence));
      expect(fence).toBe("~~~");

      // Inner backtick fence line — should NOT open a nested fence
      ({ fence } = updateFence("```", fence));
      expect(fence).toBe("~~~");

      // Close outer tilde fence
      ({ fence } = updateFence("~~~", fence));
      expect(fence).toBeNull();

      // Now a backtick line can open a new fence
      ({ fence } = updateFence("```", fence));
      expect(fence).toBe("```");
    });
  });

  describe("info strings on opening fence lines", () => {
    it("opens a fenced block when an info string follows the backtick fence", () => {
      const result = updateFence("```javascript", null);
      expect(result.fence).toBe("```");
      expect(result.skip).toBe(true);
    });

    it("opens a fenced block when an info string follows the tilde fence", () => {
      const result = updateFence("~~~python", null);
      expect(result.fence).toBe("~~~");
      expect(result.skip).toBe(true);
    });

    it("opens a fenced block with a longer fence and info string", () => {
      const result = updateFence("````typescript", null);
      expect(result.fence).toBe("````");
      expect(result.skip).toBe(true);
    });
  });

  describe("indented fences", () => {
    it("opens a fenced block on an indented fence line", () => {
      const result = updateFence("  ```", null);
      expect(result.fence).toBe("```");
      expect(result.skip).toBe(true);
    });
  });

  describe("non-fence lines", () => {
    it("passes through a normal line with no fence state", () => {
      const result = updateFence("Some normal text", null);
      expect(result.fence).toBeNull();
      expect(result.skip).toBe(false);
    });

    it("passes through an empty line with no fence state", () => {
      const result = updateFence("", null);
      expect(result.fence).toBeNull();
      expect(result.skip).toBe(false);
    });
  });
});

describe("stripInlineCode", () => {
  it("removes a single backtick-delimited span", () => {
    expect(stripInlineCode("Use `foo` here")).toBe("Use  here");
  });

  it("removes multiple inline code spans from one line", () => {
    expect(stripInlineCode("Use `===` or `!==` to compare")).toBe("Use  or  to compare");
  });

  it("returns the line unchanged when there are no backticks", () => {
    expect(stripInlineCode("plain text")).toBe("plain text");
  });

  it("returns the line unchanged for an empty string", () => {
    expect(stripInlineCode("")).toBe("");
  });

  it("removes an inline code span at the start of a line", () => {
    expect(stripInlineCode("`cmd` runs the process")).toBe(" runs the process");
  });

  it("removes an inline code span at the end of a line", () => {
    expect(stripInlineCode("The method is `run`")).toBe("The method is ");
  });

  it("leaves text intact when a single backtick has no closing pair (unbalanced)", () => {
    // One lone backtick — the regex finds no complete pair, so text is unchanged
    expect(stripInlineCode("odd ` backtick here")).toBe("odd ` backtick here");
  });

  it("strips balanced pairs and leaves an unpaired trailing backtick untouched", () => {
    // Two balanced backticks strip the span; the third lone backtick stays
    expect(stripInlineCode("`code` then odd `")).toBe(" then odd `");
  });

  it("handles adjacent code spans correctly", () => {
    expect(stripInlineCode("`a``b`")).toBe("");
  });
});
