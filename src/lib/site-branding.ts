import { FACEBOOK_GROUP_URL as DEFAULT_FACEBOOK_GROUP_URL } from "@/lib/urls";

export const DEFAULT_SITE_NAME = "Bury Steps Walking Group";
export const DEFAULT_SITE_TAGLINE =
  "Sunday afternoons, Bury and the surrounding countryside. No winners, no losers — just people walking together.";
/** Shorter line for browser tabs / share cards when a dedicated meta description is needed. */
export const DEFAULT_SITE_META_DESCRIPTION =
  "Weekly walks around Bury. Sign up, join a walk, clock in.";

export { DEFAULT_FACEBOOK_GROUP_URL };

export const MAX_SITE_NAME = 80;
export const MAX_SITE_TAGLINE = 220;
export const MAX_FACEBOOK_GROUP_URL = 300;

export function parseSiteName(raw: string): string | "invalid" {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > MAX_SITE_NAME) return "invalid";
  return name;
}

export function parseSiteTagline(raw: string): string | "invalid" {
  const tagline = raw.trim().replace(/\s+/g, " ");
  if (tagline.length < 8 || tagline.length > MAX_SITE_TAGLINE) return "invalid";
  return tagline;
}

/**
 * Empty string hides Facebook links. Otherwise must be an https Facebook URL.
 */
export function parseFacebookGroupUrl(raw: string): string | "invalid" {
  const trimmed = raw.trim();
  if (trimmed === "") return "";
  if (trimmed.length > MAX_FACEBOOK_GROUP_URL) return "invalid";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return "invalid";
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "facebook.com" && host !== "m.facebook.com" && host !== "fb.com") {
      return "invalid";
    }
    return url.toString();
  } catch {
    return "invalid";
  }
}

/** Meta description: prefer tagline when short enough, else the default meta line. */
export function siteMetaDescription(tagline: string): string {
  if (tagline.length <= 160) return tagline;
  return DEFAULT_SITE_META_DESCRIPTION;
}
