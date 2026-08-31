import { describe, expect, it } from "vitest";
import {
  parseFacebookGroupUrl,
  parseSiteName,
  parseSiteTagline,
  siteMetaDescription,
} from "@/lib/site-branding";

describe("site branding parsers", () => {
  it("accepts a normal site name and tagline", () => {
    expect(parseSiteName("Bury Steps")).toBe("Bury Steps");
    expect(parseSiteTagline("Sunday walks around Bury.")).toBe("Sunday walks around Bury.");
  });

  it("rejects empty or tiny names", () => {
    expect(parseSiteName("A")).toBe("invalid");
    expect(parseSiteTagline("Short")).toBe("invalid");
  });

  it("accepts Facebook https URLs and blank to hide", () => {
    expect(parseFacebookGroupUrl("https://www.facebook.com/groups/burysteps")).toContain(
      "facebook.com",
    );
    expect(parseFacebookGroupUrl("")).toBe("");
    expect(parseFacebookGroupUrl("https://example.com")).toBe("invalid");
  });

  it("uses the tagline as meta when short enough", () => {
    expect(siteMetaDescription("Weekly walks around Bury.")).toBe("Weekly walks around Bury.");
  });
});
