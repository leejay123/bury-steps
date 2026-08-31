import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOMEPAGE_SECTION_ORDER,
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
    expect(parseHomepageSectionOrder("howWalksWork,howWalksWork,memberNotices,testimonials,faqs")).toBe(
      "invalid",
    );
    expect(parseHomepageSectionOrder("hero,howWalksWork,howThisStarted,memberNotices,testimonials")).toBe(
      "invalid",
    );
  });
});
