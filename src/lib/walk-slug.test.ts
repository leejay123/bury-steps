import { describe, expect, it } from "vitest";
import { slugifyWalkTitle, walkSharePath, walkSlugBase } from "./walk-slug";

describe("slugifyWalkTitle", () => {
  it("hyphenates and lowercases", () => {
    expect(slugifyWalkTitle("Burrs Country Park loop")).toBe("burrs-country-park-loop");
  });

  it("strips accents", () => {
    expect(slugifyWalkTitle("Café walk")).toBe("cafe-walk");
  });
});

describe("walkSlugBase", () => {
  it("uses the first place word only", () => {
    expect(walkSlugBase("Burrs Country Park loop")).toBe("burrs");
  });

  it("skips a leading house number", () => {
    expect(walkSlugBase("5 Fenwick Drive")).toBe("fenwick");
  });

  it("skips small filler words", () => {
    expect(walkSlugBase("The Irwell from Burrs")).toBe("irwell");
  });

  it("falls back when the title has no letters", () => {
    expect(walkSlugBase("!!!")).toBe("walk");
  });
});

describe("walkSharePath", () => {
  it("prefers the readable slug", () => {
    expect(walkSharePath({ token: "ykbh6b76v65d", slug: "burrs" })).toBe("/w/burrs");
  });

  it("falls back to the token before a slug exists", () => {
    expect(walkSharePath({ token: "ykbh6b76v65d", slug: null })).toBe("/w/ykbh6b76v65d");
  });
});
