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
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
