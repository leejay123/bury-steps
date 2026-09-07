import { describe, expect, it } from "vitest";
import { normalizeWhat3Words, what3wordsUrl } from "./what3words";

describe("normalizeWhat3Words", () => {
  it("accepts a bare address", () => {
    expect(normalizeWhat3Words("filled.count.soap")).toBe("filled.count.soap");
  });

  it("lowercases", () => {
    expect(normalizeWhat3Words("Filled.Count.Soap")).toBe("filled.count.soap");
  });

  it("strips the leading /// the what3words app copies", () => {
    expect(normalizeWhat3Words("///filled.count.soap")).toBe("filled.count.soap");
  });

  it("strips a pasted what3words.com link", () => {
    expect(normalizeWhat3Words("https://what3words.com/filled.count.soap")).toBe(
      "filled.count.soap",
    );
    expect(normalizeWhat3Words("what3words.com/filled.count.soap")).toBe("filled.count.soap");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeWhat3Words("  filled.count.soap  ")).toBe("filled.count.soap");
  });

  it("returns null for blank input", () => {
    expect(normalizeWhat3Words("")).toBeNull();
    expect(normalizeWhat3Words(null)).toBeNull();
    expect(normalizeWhat3Words(undefined)).toBeNull();
  });

  it("rejects anything that isn't three dot-separated words", () => {
    expect(normalizeWhat3Words("filled.count")).toBeNull();
    expect(normalizeWhat3Words("filled.count.soap.extra")).toBeNull();
    expect(normalizeWhat3Words("Burrs Country Park")).toBeNull();
    expect(normalizeWhat3Words("BL8 1DA")).toBeNull();
    expect(normalizeWhat3Words("51.519472,-0.17978200")).toBeNull();
  });
});

describe("what3wordsUrl", () => {
  it("builds the free public share link", () => {
    expect(what3wordsUrl("filled.count.soap")).toBe("https://what3words.com/filled.count.soap");
  });
});
