import { describe, expect, it } from "vitest";
import { ANNOUNCEMENT_MATCH_JS, announcementShowsOn, serializeAnnouncementPages } from "./announcement-pages";

// eslint-disable-next-line @typescript-eslint/no-implied-eval
const inlineMatch = new Function(`return ${ANNOUNCEMENT_MATCH_JS}`)() as (rule: string, path: string) => boolean;

describe("announcementShowsOn", () => {
  const cases: [string, string, boolean][] = [
    ["all", "/admin/walks", true],
    ["home", "/", true],
    ["home", "/walks", false],
    ["public", "/walks", true],
    ["public", "/admin", false],
    ["public", "/admin/settings", false],
    ["public", "/administer", true],
    ["/walks,/notices", "/walks", true],
    ["/walks,/notices", "/walks/abc", true],
    ["/walks,/notices", "/walkstuff", false],
    ["/walks,/notices", "/", false],
    ["/", "/", true],
    ["/", "/walks", false],
  ];
  it.each(cases)("%s on %s → %s (and the inline copy agrees)", (rule, path, expected) => {
    expect(announcementShowsOn(rule, path)).toBe(expected);
    expect(inlineMatch(rule, path)).toBe(expected);
  });
});

describe("serializeAnnouncementPages", () => {
  it("cleans a typed list", () => {
    expect(serializeAnnouncementPages("pages", " walks/ , /notices, /walks")).toBe("/walks,/notices");
  });
  it("refuses an empty or odd list", () => {
    expect(serializeAnnouncementPages("pages", "")).toBeNull();
    expect(serializeAnnouncementPages("pages", "//evil.com")).toBeNull();
    expect(serializeAnnouncementPages("nope", "")).toBeNull();
  });
});
