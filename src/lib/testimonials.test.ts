import { describe, expect, it } from "vitest";
import {
  DEFAULT_TESTIMONIALS_SECTION_INTRO,
  DEFAULT_TESTIMONIALS_SECTION_TITLE,
  parseTestimonialsSectionIntro,
  parseTestimonialsSectionTitle,
} from "@/lib/testimonials";

describe("parseTestimonialsSectionTitle", () => {
  it("accepts the default title", () => {
    expect(parseTestimonialsSectionTitle(DEFAULT_TESTIMONIALS_SECTION_TITLE)).toBe(
      DEFAULT_TESTIMONIALS_SECTION_TITLE,
    );
  });

  it("trims and collapses whitespace", () => {
    expect(parseTestimonialsSectionTitle("  From  the  group  ")).toBe("From the group");
  });

  it("rejects too short or too long titles", () => {
    expect(parseTestimonialsSectionTitle("A")).toBe("invalid");
    expect(parseTestimonialsSectionTitle("x".repeat(81))).toBe("invalid");
  });
});

describe("parseTestimonialsSectionIntro", () => {
  it("accepts the default intro", () => {
    expect(parseTestimonialsSectionIntro(DEFAULT_TESTIMONIALS_SECTION_INTRO)).toBe(
      DEFAULT_TESTIMONIALS_SECTION_INTRO,
    );
  });

  it("rejects too short or too long intros", () => {
    expect(parseTestimonialsSectionIntro("Short")).toBe("invalid");
    expect(parseTestimonialsSectionIntro("x".repeat(281))).toBe("invalid");
  });
});
