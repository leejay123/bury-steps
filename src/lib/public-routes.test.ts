import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  APP_TOP_LEVEL_SEGMENTS,
  PUBLIC_ROUTE_PATTERNS,
  isPublicPath,
  isTokenPublicPath,
  isUnknownAppPath,
} from "./public-routes";

describe("PUBLIC_ROUTE_PATTERNS", () => {
  it("keeps email-preference and organiser-invite token links public", () => {
    expect(PUBLIC_ROUTE_PATTERNS).toContain("/email-preferences/(.*)");
    expect(PUBLIC_ROUTE_PATTERNS).toContain("/organiser-invite/(.*)");
  });

  it("does not accidentally make the signed-in preferences hub public", () => {
    // Exact /email-preferences (no trailing segment) is the account-menu
    // page and must still require sign-in. Only the tokenised child routes
    // are public.
    expect(PUBLIC_ROUTE_PATTERNS).not.toContain("/email-preferences");
    expect(PUBLIC_ROUTE_PATTERNS).not.toContain("/email-preferences(.*)");
  });
});

describe("public route matching", () => {
  const at = isPublicPath;

  it("keeps shared walk links public", () => {
    expect(at("/w/abc123")).toBe(true);
    expect(at("/w/abc123/ics")).toBe(true);
  });

  it("keeps members-only pages behind sign-in", () => {
    expect(at("/walks")).toBe(false);
    expect(at("/notices")).toBe(false);
    expect(at("/progress")).toBe(false);
    expect(at("/history")).toBe(false);
    expect(at("/email-preferences")).toBe(false);
    expect(at("/walkies")).toBe(false);
  });

  it("matches whole paths, with or without a trailing slash, in any case", () => {
    expect(at("/")).toBe(true);
    expect(at("/contact")).toBe(true);
    expect(at("/contact/")).toBe(true);
    expect(at("/Contact")).toBe(true);
    expect(at("/contact-us")).toBe(false);
    expect(at("/sign-in/factor-one")).toBe(true);
    expect(at("/email-preferences/abc123")).toBe(true);
    expect(at("/admin/members")).toBe(true);
    expect(at("/robots.txt")).toBe(true);
    expect(at("/robotsxtxt")).toBe(false);
  });
});

describe("isTokenPublicPath", () => {
  it("matches tokenised preference and invite URLs", () => {
    expect(isTokenPublicPath("/email-preferences/abc123")).toBe(true);
    expect(isTokenPublicPath("/email-preferences/newsletter/abc123")).toBe(true);
    expect(isTokenPublicPath("/organiser-invite/abc123")).toBe(true);
  });

  it("rejects the signed-in preferences hub and unrelated paths", () => {
    expect(isTokenPublicPath("/email-preferences")).toBe(false);
    expect(isTokenPublicPath("/email-preferences/")).toBe(false);
    expect(isTokenPublicPath("/organiser-invite")).toBe(false);
    expect(isTokenPublicPath("/walks")).toBe(false);
  });
});

describe("isUnknownAppPath", () => {
  it("lists every top-level page or route in src/app, so none can skip sign-in", () => {
    const appDir = path.join(__dirname, "..", "app");
    const routeFile = /^(page|layout|loading|error|not-found|global-error|template|default)\.(t|j)sx?$/;
    const notRoutes = new Set(["globals.css", "typeset.css", "fonts.ts", "typeset-font.ts"]);
    const segments = fs
      .readdirSync(appDir, { withFileTypes: true })
      .filter((entry) => !routeFile.test(entry.name) && !notRoutes.has(entry.name))
      // Folders as-is; metadata route files by their URL (icon.tsx -> /icon, robots.ts -> /robots.txt).
      .map((entry) => {
        if (entry.isDirectory()) return entry.name;
        const base = entry.name.replace(/\.(t|j)sx?$/, "");
        return { robots: "robots.txt", sitemap: "sitemap.xml", manifest: "manifest.webmanifest" }[base] ?? base;
      });
    for (const segment of segments) {
      expect(APP_TOP_LEVEL_SEGMENTS, `add "${segment}" to APP_TOP_LEVEL_SEGMENTS`).toContain(segment);
    }
  });

  it("is true only for paths that can't be a page", () => {
    expect(isUnknownAppPath("/this-does-not-exist")).toBe(true);
    expect(isUnknownAppPath("/walk")).toBe(true);
    expect(isUnknownAppPath("/")).toBe(false);
    expect(isUnknownAppPath("/walks")).toBe(false);
    expect(isUnknownAppPath("/notices/anything")).toBe(false);
    expect(isUnknownAppPath("/api/site-search")).toBe(false);
    expect(isUnknownAppPath("/history")).toBe(false);
  });
});
