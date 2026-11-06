import { describe, expect, it } from "vitest";
import {
  editorDesign,
  emptySitePageDesigns,
  ensureContactForm,
  ensureHomeHero,
  isPuckData,
  isSitePageKey,
  pageHasUnpublishedDraft,
  parseSitePageDesigns,
  puckBlock,
  puckPage,
  publishedDesign,
} from "./site-page-designs";

const hero = puckBlock("HomeHero", 1, { kicker: "Hello" });
const about = puckBlock("HomeAbout", 2, { title: "About" });
const form = puckBlock("ContactForm", 1, { steps: ["One"] });

describe("site page designs", () => {
  it("recognises the six public pages", () => {
    expect(isSitePageKey("home")).toBe(true);
    expect(isSitePageKey("privacy")).toBe(true);
    expect(isSitePageKey("walks")).toBe(false);
  });

  it("treats empty or broken JSON as no designs yet", () => {
    expect(parseSitePageDesigns("")).toEqual(emptySitePageDesigns());
    expect(parseSitePageDesigns("not-json")).toEqual(emptySitePageDesigns());
    expect(parseSitePageDesigns("[]")).toEqual(emptySitePageDesigns());
  });

  it("reads draft and published per page, and ignores unknown keys", () => {
    const home = puckPage([hero]);
    const parsed = parseSitePageDesigns(
      JSON.stringify({
        home: { draft: home, published: home },
        extra: { draft: home },
      }),
    );
    expect(parsed.home.published).toEqual(home);
    expect(parsed.about.published).toBeNull();
  });

  it("treats a bare Puck page as both draft and published", () => {
    const home = puckPage([hero]);
    const parsed = parseSitePageDesigns(JSON.stringify({ home }));
    expect(parsed.home.draft).toEqual(home);
    expect(parsed.home.published).toEqual(home);
  });

  it("puts the homepage hero back if it was removed", () => {
    const without = puckPage([about]);
    const next = ensureHomeHero(without, hero);
    expect(next.content[0]?.type).toBe("HomeHero");
    expect(ensureHomeHero(puckPage([hero, about]), hero).content).toHaveLength(2);
  });

  it("puts the contact form back if it was removed", () => {
    const heading = puckBlock("ContactHero", 1, { title: "Contact" });
    const without = puckPage([heading]);
    const next = ensureContactForm(without, form);
    expect(next.content.at(-1)?.type).toBe("ContactForm");
    expect(ensureContactForm(puckPage([heading, form]), form).content).toHaveLength(2);
  });

  it("opens a draft first, then the published copy, then the seed", () => {
    const seed = puckPage([hero]);
    const draft = puckPage([about]);
    const published = puckPage([hero, about]);
    expect(editorDesign({ draft, published }, seed)).toBe(draft);
    expect(editorDesign({ draft: null, published }, seed)).toBe(published);
    expect(editorDesign({ draft: null, published: null }, seed)).toBe(seed);
    expect(publishedDesign({ draft, published: null })).toBeNull();
    expect(isPuckData(seed)).toBe(true);
    expect(isPuckData({ content: "no" })).toBe(false);
  });

  it("treats a draft as unpublished when it differs from the live page", () => {
    const live = puckPage([hero]);
    const draft = puckPage([about]);
    expect(pageHasUnpublishedDraft({ draft, published: live })).toBe(true);
    expect(pageHasUnpublishedDraft({ draft: live, published: live })).toBe(false);
    expect(pageHasUnpublishedDraft({ draft, published: null })).toBe(true);
    expect(pageHasUnpublishedDraft({ draft: null, published: live })).toBe(false);
  });
});
