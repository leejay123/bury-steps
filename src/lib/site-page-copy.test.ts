import { describe, expect, it } from "vitest";
import {
  defaultContactForm,
  defaultHomeHero,
  defaultHomeSeed,
  seedAppsDesign,
  seedContactDesign,
  seedHomeDesign,
  seedGroupRulesDesign,
  seedHowItWorksDesign,
  seedPrivacyDesign,
  seedTermsDesign,
  seedWalkEssentialsDesign,
  seedWhatToExpectDesign,
} from "./site-page-copy";

describe("site page seeds", () => {
  it("starts the homepage with the hero that cannot be dropped on publish", () => {
    const data = seedHomeDesign(defaultHomeSeed());
    expect(data.content[0]?.type).toBe("HomeHero");
    expect(data.content.some((block) => block.type === "HomeFaq")).toBe(true);
    expect(data.content.some((block) => block.type === "HomeReviews")).toBe(true);
    expect(defaultHomeHero().type).toBe("HomeHero");
  });

  it("keeps the contact form on the contact page", () => {
    const data = seedContactDesign();
    expect(data.content.some((block) => block.type === "ContactHero")).toBe(true);
    expect(data.content.at(-1)?.type).toBe("ContactForm");
    expect(defaultContactForm().type).toBe("ContactForm");
  });

  it("seeds privacy, terms and apps from the live copy", () => {
    expect(seedPrivacyDesign().content[0]?.type).toBe("LegalHero");
    expect(seedPrivacyDesign().content.length).toBeGreaterThan(4);
    expect(seedTermsDesign().content[0]?.props.title).toBe("Terms of Service");
    expect(seedAppsDesign().content.some((block) => block.type === "AppsCard")).toBe(true);
  });

  it("seeds the four guide pages", () => {
    expect(seedHowItWorksDesign().content[0]?.props.docs).toBe("guide");
    expect(seedWhatToExpectDesign({ expectHeading: "What you can expect", expect: ["Friendly"] }).content.some((block) => block.type === "LegalSection")).toBe(true);
    expect(seedGroupRulesDesign({ rulesHeading: "Group rules", rules: [{ title: "Be kind", body: "Always." }] }).content[0]?.props.icon).toBe("rules");
    expect(seedWalkEssentialsDesign().content.some((block) => block.type === "WalkEssentialsList")).toBe(true);
  });
});
