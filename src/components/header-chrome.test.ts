import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchIcon } from "lucide-react";
import { describe, expect, it } from "vitest";
import { parseRememberedAvatar, parseRememberedUnread } from "@/lib/remembered-nav";
import { NAV_ICON_SVG, SEARCH_ICON_SVG, bellBadgeText, clerkAvatarSources, isClerkImageUrl } from "./header-chrome";
import { NAV_ICONS } from "./nav-icons";
import { navItems } from "./site-nav-items";

/** The inside of the first <svg> in some markup. */
function svgInside(markup: string) {
  return markup.slice(markup.indexOf(">") + 1, markup.lastIndexOf("</svg>"));
}

const PHOTO = "https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2V4YW1wbGUifQ";

describe("header drawn before the page loads", () => {
  it("draws each menu icon exactly as lucide-react does", () => {
    expect(Object.keys(NAV_ICON_SVG).sort()).toEqual(Object.keys(NAV_ICONS).sort());
    for (const [label, Icon] of Object.entries(NAV_ICONS)) {
      expect(NAV_ICON_SVG[label], label).toBe(svgInside(renderToStaticMarkup(createElement(Icon))));
    }
    expect(SEARCH_ICON_SVG).toBe(svgInside(renderToStaticMarkup(createElement(SearchIcon))));
  });

  it("has an icon for every menu link", () => {
    const labels = new Set([...navItems(true, "/admin/walks"), ...navItems(false, "/walks")].map((item) => item.label));
    for (const label of labels) expect(NAV_ICON_SVG[label], label).toBeDefined();
  });

  it("asks for the same sized copies of a Clerk picture as Clerk's avatar", () => {
    expect(clerkAvatarSources(PHOTO)).toEqual({
      src: `${PHOTO}?width=160`,
      srcSet: `${PHOTO}?width=80 1x,${PHOTO}?width=160 2x`,
    });
    expect(clerkAvatarSources("https://example.com/me.png")).toEqual({ src: "https://example.com/me.png" });
  });

  it("only accepts Clerk image links", () => {
    expect(isClerkImageUrl(PHOTO)).toBe(true);
    expect(isClerkImageUrl("http://img.clerk.com/x")).toBe(false);
    expect(isClerkImageUrl("https://img.clerk.com.evil.test/x")).toBe(false);
    expect(isClerkImageUrl('https://img.clerk.com/x"onerror="alert(1)')).toBe(false);
    expect(isClerkImageUrl(`https://img.clerk.com/${"a".repeat(2100)}`)).toBe(false);
    expect(isClerkImageUrl(null)).toBe(false);
  });

  it("shows counts above 9 as 9+, like the bell", () => {
    expect(bellBadgeText(3)).toBe("3");
    expect(bellBadgeText(9)).toBe("9");
    expect(bellBadgeText(12)).toBe("9+");
  });
});

describe("remembered header cookies", () => {
  it("reads the unread count", () => {
    expect(parseRememberedUnread("4")).toBe(4);
    expect(parseRememberedUnread("99")).toBe(99);
    expect(parseRememberedUnread("100")).toBe(0);
    expect(parseRememberedUnread("-1")).toBe(0);
    expect(parseRememberedUnread("x")).toBe(0);
    expect(parseRememberedUnread(undefined)).toBe(0);
  });

  it("reads whose picture it was and the Clerk link", () => {
    expect(parseRememberedAvatar(encodeURIComponent(`user_2abc|${PHOTO}`))).toEqual({ clerkId: "user_2abc", url: PHOTO });
    expect(parseRememberedAvatar(`user_2abc|${PHOTO}`)).toEqual({ clerkId: "user_2abc", url: PHOTO });
    expect(parseRememberedAvatar(encodeURIComponent(PHOTO))).toBeNull();
    expect(parseRememberedAvatar(encodeURIComponent("user_2abc|https://example.com/me.png"))).toBeNull();
    expect(parseRememberedAvatar("%E0%A4%A")).toBeNull();
    expect(parseRememberedAvatar(undefined)).toBeNull();
  });
});
