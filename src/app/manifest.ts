import type { MetadataRoute } from "next";
import { getSiteTheme } from "@/lib/site-theme";
import { siteMetaDescription } from "@/lib/site-branding";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const theme = await getSiteTheme();
  const shortName =
    theme.siteName.length > 12
      ? theme.siteName.split(/\s+/).slice(0, 2).join(" ")
      : theme.siteName;

  return {
    name: theme.siteName,
    short_name: shortName.slice(0, 24),
    description: siteMetaDescription(theme.siteTagline),
    start_url: "/walks",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    // New file names (not /icon-192.png) on purpose: the old "B" placeholders
    // at those URLs were served with a one-year immutable cache, so phones
    // that fetched them would keep showing the "B". The old paths still serve
    // the logo (public/icon-192.png, icon-512.png) for any phone holding a
    // manifest cached from before the change — a 404 there makes iOS draw a
    // letter "B" on the theme colour instead.
    icons: [
      { src: "/icons/bury-steps-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/bury-steps-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/bury-steps-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
