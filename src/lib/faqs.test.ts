import { describe, expect, it } from "vitest";
import {
  DEFAULT_FAQ_SECTION_INTRO,
  DEFAULT_FAQ_SECTION_TITLE,
  faqCategorySlug,
  parseFaqSectionIntro,
  parseFaqSectionTitle,
} from "./faqs";

describe("parseFaqSectionTitle", () => {
  it("accepts the default heading", () => {
    expect(parseFaqSectionTitle(DEFAULT_FAQ_SECTION_TITLE)).toBe(DEFAULT_FAQ_SECTION_TITLE);
  });

  it("trims and collapses spaces", () => {
    expect(parseFaqSectionTitle("  Common  questions  ")).toBe("Common questions");
  });

  it("rejects too-short or too-long headings", () => {
    expect(parseFaqSectionTitle("A")).toBe("invalid");
    expect(parseFaqSectionTitle("x".repeat(81))).toBe("invalid");
  });
});

describe("parseFaqSectionIntro", () => {
  it("accepts the default intro", () => {
    expect(parseFaqSectionIntro(DEFAULT_FAQ_SECTION_INTRO)).toBe(DEFAULT_FAQ_SECTION_INTRO);
  });

  it("rejects too-short or too-long intros", () => {
    expect(parseFaqSectionIntro("Short")).toBe("invalid");
    expect(parseFaqSectionIntro("x".repeat(281))).toBe("invalid");
  });
});

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
