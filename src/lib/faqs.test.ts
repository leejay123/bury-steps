import { describe, expect, it } from "vitest";
import { faqCategorySlug } from "./faqs";

describe("faqCategorySlug", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(faqCategorySlug("On the day")).toBe("on-the-day");
  });

  it("strips accents", () => {
    expect(faqCategorySlug("Café meetups")).toBe("cafe-meetups");
  });

  it("strips punctuation and collapses repeated separators", () => {
    expect(faqCategorySlug("Joining & signing up!!")).toBe("joining-signing-up");
  });

  it("trims leading and trailing hyphens", () => {
    expect(faqCategorySlug("  -- Walks -- ")).toBe("walks");
  });

  it("falls back to a generic slug when nothing usable is left", () => {
    expect(faqCategorySlug("!!!")).toBe("category");
    expect(faqCategorySlug("")).toBe("category");
  });

  it("truncates very long labels", () => {
    const long = "a".repeat(100);
    const slug = faqCategorySlug(long);
    expect(slug.length).toBeLessThanOrEqual(40);
  });
});
