import { describe, expect, it } from "vitest";
import { fillPlaceholders, paragraphsFrom } from "./render-template";

describe("fillPlaceholders", () => {
  it("replaces every occurrence of a known token", () => {
    expect(fillPlaceholders("Hi {firstName}, welcome to {siteName}!", {
      firstName: "Jane",
      siteName: "Bury Steps",
    })).toBe("Hi Jane, welcome to Bury Steps!");
  });

  it("leaves an unrecognized token untouched rather than blanking it", () => {
    expect(fillPlaceholders("Hi {typo}", { firstName: "Jane" })).toBe("Hi {typo}");
  });

  it("substitutes an empty string for a token whose value is empty", () => {
    expect(fillPlaceholders("Reason: {reason}", { reason: "" })).toBe("Reason: ");
  });
});

describe("paragraphsFrom", () => {
  it("splits on blank lines and trims each paragraph", () => {
    expect(paragraphsFrom("First paragraph.\n\nSecond paragraph.")).toEqual([
      "First paragraph.",
      "Second paragraph.",
    ]);
  });

  it("drops empty paragraphs from extra blank lines", () => {
    expect(paragraphsFrom("One.\n\n\n\nTwo.")).toEqual(["One.", "Two."]);
  });

  it("returns an empty array for empty text", () => {
    expect(paragraphsFrom("")).toEqual([]);
    expect(paragraphsFrom("   ")).toEqual([]);
  });

  it("returns a single paragraph for text with no blank line", () => {
    expect(paragraphsFrom("Just one line.")).toEqual(["Just one line."]);
  });
});
