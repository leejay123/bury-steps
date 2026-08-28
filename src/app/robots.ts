import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/urls";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private, auth-only, or not meant for search results: signed-in
      // areas, one-off walk share links, and internal API routes.
      disallow: ["/dashboard", "/admin", "/onboarding", "/w/", "/api/"],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
