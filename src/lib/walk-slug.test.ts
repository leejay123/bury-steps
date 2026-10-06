import { describe, expect, it } from "vitest";
import { renamedWalkSlug, slugifyWalkTitle, walkSharePath, walkSlugBase, walkSlugCode } from "./walk-slug";

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
    expect(walkSharePath({ token: "ykbh6b76v65d", slug: "burrs-x7k2m9" })).toBe("/w/burrs-x7k2m9");
  });

  it("falls back to the token before a slug exists", () => {
    expect(walkSharePath({ token: "ykbh6b76v65d", slug: null })).toBe("/w/ykbh6b76v65d");
  });
});

describe("walkSlugCode", () => {
  it("reads the random code at the end", () => {
    expect(walkSlugCode("burrs-x7k2m9")).toBe("x7k2m9");
  });

  it("ignores slugs without one", () => {
    expect(walkSlugCode("burrs")).toBeNull();
    expect(walkSlugCode("burrs-lk2j3h4")).toBeNull();
    expect(walkSlugCode("burrs-x7k2m1")).toBeNull();
  });
});

describe("renamedWalkSlug", () => {
  it("swaps the place word and keeps the code, so old links still match", () => {
    expect(renamedWalkSlug("burrs-x7k2m9", "Clarence Park stroll")).toBe("clarence-x7k2m9");
  });

  it("is unchanged when the place word is the same", () => {
    expect(renamedWalkSlug("burrs-x7k2m9", "Burrs loop (shorter)")).toBe("burrs-x7k2m9");
  });

  it("leaves a slug with no code alone", () => {
    expect(renamedWalkSlug("burrs-lk2j3h4", "Clarence")).toBe("burrs-lk2j3h4");
  });
});
