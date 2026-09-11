import { describe, expect, it } from "vitest";
import { initials } from "./names";

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Jo Bloggs")).toBe("JB");
  });

  it("uppercases the letters", () => {
    expect(initials("jo bloggs")).toBe("JB");
  });

  it("falls back to an email address, splitting on @ and .", () => {
    expect(initials("jo.bloggs@example.com")).toBe("JB");
  });

  it("uses just one letter for a single word", () => {
    expect(initials("Jo")).toBe("J");
  });

  it("ignores extra words beyond the first two", () => {
    expect(initials("Jo Middle Bloggs")).toBe("JM");
  });

  it("returns an empty string for empty input", () => {
    expect(initials("")).toBe("");
  });
});
