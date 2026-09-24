import { existsSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { findSettingsPage, SETTINGS_PAGE_GROUPS, SITE_WORDING_PAGES } from "./settings-pages";

const allLinks = SETTINGS_PAGE_GROUPS.flatMap((group) =>
  group.pages.flatMap((page) => [page, ...(page.children ?? [])]),
);

describe("settings page registry", () => {
  it("points every row at a page that actually exists", () => {
    for (const link of allLinks) {
      const file = path.join(process.cwd(), "src/app", link.href, "page.tsx");
      expect(existsSync(file), `${link.href} has no page.tsx`).toBe(true);
    }
  });

  it("lists every settings page exactly once", () => {
    const hrefs = SETTINGS_PAGE_GROUPS.flatMap((group) => group.pages.map((page) => page.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("keeps Reset on its own in the danger zone", () => {
    const danger = SETTINGS_PAGE_GROUPS.filter((group) => group.pages.some((page) => page.danger));
    expect(danger).toHaveLength(1);
    expect(danger[0].pages.every((page) => page.danger)).toBe(true);
  });

  it("finds a sub-page's parent and group", () => {
    const found = findSettingsPage(SITE_WORDING_PAGES[2].href);
    expect(found?.page.title).toBe("Site wording");
    expect(found?.group.label).toBe("Homepage");
    expect(findSettingsPage("/admin/walks")).toBeNull();
  });
});
