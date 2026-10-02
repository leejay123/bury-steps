import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOMEPAGE_SECTION_ORDER,
  normalizeHomepageSectionOrder,
  parseHomepageSectionOrder,
  serializeHomepageSectionOrder,
} from "./homepage-sections";

describe("parseHomepageSectionOrder", () => {
  it("accepts the default order", () => {
    expect(parseHomepageSectionOrder(serializeHomepageSectionOrder(DEFAULT_HOMEPAGE_SECTION_ORDER))).toEqual(
      DEFAULT_HOMEPAGE_SECTION_ORDER,
    );
  });

  it("rejects duplicates or unknown ids", () => {
    expect(parseHomepageSectionOrder("photos,howWalksWork,howWalksWork,memberNotices,testimonials,faqs")).toBe(
      "invalid",
    );
    expect(parseHomepageSectionOrder("hero,photos,howWalksWork,howThisStarted,memberNotices,testimonials")).toBe(
      "invalid",
    );
  });
});

describe("normalizeHomepageSectionOrder", () => {
  it("puts the photo slider first in an order saved before it was a section", () => {
    expect(normalizeHomepageSectionOrder("faqs,howWalksWork,howThisStarted,memberNotices,testimonials")).toEqual([
      "photos",
      "faqs",
      "howWalksWork",
      "howThisStarted",
      "memberNotices",
      "testimonials",
    ]);
  });

  it("drops a section that no longer exists instead of resetting the order", () => {
    expect(
      normalizeHomepageSectionOrder("photos,howWalksWork,howThisStarted,memberNotices,testimonials,walkApps,faqs"),
    ).toEqual(["photos", "howWalksWork", "howThisStarted", "memberNotices", "testimonials", "faqs"]);
  });

  it("falls back to the default for rubbish", () => {
    expect(normalizeHomepageSectionOrder("nope")).toEqual(DEFAULT_HOMEPAGE_SECTION_ORDER);
  });
});
