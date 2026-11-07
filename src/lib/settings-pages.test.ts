import { existsSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { findSettingsPage, SETTINGS_PAGE_GROUPS, settingsHeaderTrail } from "./settings-pages";

const allLinks = SETTINGS_PAGE_GROUPS.flatMap((group) =>
  group.pages.flatMap((page) => [page, ...(page.children ?? [])]),
);

function pageExists(href: string) {
  const rel = href.replace(/^\//, "");
  return (
    existsSync(path.join(process.cwd(), "src/app", rel, "page.tsx")) ||
    existsSync(path.join(process.cwd(), "src/app/(site)", rel, "page.tsx"))
  );
}

describe("settings page registry", () => {
  it("points every row at a page that actually exists", () => {
    for (const link of allLinks) {
      expect(pageExists(link.href), `${link.href} has no page.tsx`).toBe(true);
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

  it("finds a page's group", () => {
    const found = findSettingsPage("/admin/settings/page-designs");
    expect(found?.page.title).toBe("Page designs");
    expect(found?.group.label).toBe("Homepage");
    expect(findSettingsPage("/admin/walks")).toBeNull();
  });

  it("names the top-bar trail from the URL", () => {
    expect(settingsHeaderTrail("/admin/settings")).toBeNull();
    expect(settingsHeaderTrail("/admin/settings/retention")).toEqual({
      group: "How the site works",
      title: "Data retention",
      danger: false,
    });
    expect(settingsHeaderTrail("/admin/settings/reset")?.danger).toBe(true);
  });
});
