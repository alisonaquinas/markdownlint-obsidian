/**
 * Unit tests for {@link classifyEmbed}.
 *
 * @module tests/unit/rules/embeds/shared/EmbedClassifier.test
 */
import { describe, it, expect } from "bun:test";
import { classifyEmbed } from "../../../../../src/infrastructure/rules/ofm/embeds/shared/EmbedClassifier.js";
import type { EmbedNode } from "../../../../../src/domain/parsing/EmbedNode.js";
import { makeSourcePosition } from "../../../../../src/domain/parsing/SourcePosition.js";

function embed(target: string): EmbedNode {
  return Object.freeze({
    target,
    width: null,
    height: null,
    position: makeSourcePosition(1, 1),
    raw: `![[${target}]]`,
  });
}

describe("classifyEmbed", () => {
  it.each([
    ["note.md", "markdown", "md"],
    ["image.png", "image", "png"],
    ["img.JPG", "image", "jpg"],
    ["photo.jpeg", "image", "jpeg"],
    ["scribble.svg", "image", "svg"],
    ["movie.mp4", "video", "mp4"],
    ["clip.webm", "video", "webm"],
    ["jingle.mp3", "audio", "mp3"],
    ["beep.wav", "audio", "wav"],
    ["loop.ogg", "audio", "ogg"],
    ["doc.pdf", "pdf", "pdf"],
    ["script.exe", "unknown", "exe"],
  ])("%s -> %s/%s", (target: string, expectedKind: string, expectedExt: string) => {
    const result = classifyEmbed(embed(target));
    expect(result.kind as string).toBe(expectedKind);
    expect(result.extension as string).toBe(expectedExt);
  });

  it("treats extensionless targets as markdown", () => {
    const result = classifyEmbed(embed("notes/index"));
    expect(result.kind).toBe("markdown");
    expect(result.extension).toBe("md");
  });

  it("treats dotfiles with a leading dot as markdown fallback", () => {
    // `.hidden` has no real extension separator; rule authors should treat
    // this as markdown rather than a file with extension "hidden".
    const result = classifyEmbed(embed(".hidden"));
    expect(result.kind).toBe("markdown");
    expect(result.extension).toBe("md");
  });
});
