import { describe, expect, it } from "vitest";
import { cleanAnnouncementHref, parseAnnouncementCopy } from "./announcement";

describe("parseAnnouncementCopy", () => {
  it("keeps the usual strip when nothing is saved, or older plain wording", () => {
    expect(parseAnnouncementCopy("", "")).toBeNull();
    expect(parseAnnouncementCopy("Old words", "/x")).toBeNull();
    expect(parseAnnouncementCopy(JSON.stringify({ title: "  " }), "")).toBeNull();
  });

  it("reads their own words and link", () => {
    expect(
      parseAnnouncementCopy(JSON.stringify({ title: "Charity of the Year", line: "Shop for free", linkLabel: "Find out more" }), "/charity-of-the-year"),
    ).toEqual({ title: "Charity of the Year", line: "Shop for free", linkLabel: "Find out more", href: "/charity-of-the-year" });
  });
});

describe("cleanAnnouncementHref", () => {
  it("allows site pages and web addresses only", () => {
    expect(cleanAnnouncementHref("/walks")).toBe("/walks");
    expect(cleanAnnouncementHref("https://www.easyfundraising.org.uk/causes/bury-steps-walking-group")).toBe(
      "https://www.easyfundraising.org.uk/causes/bury-steps-walking-group",
    );
    expect(cleanAnnouncementHref("//evil.example")).toBeNull();
    expect(cleanAnnouncementHref("javascript:alert(1)")).toBeNull();
    expect(cleanAnnouncementHref("")).toBeNull();
  });
});
