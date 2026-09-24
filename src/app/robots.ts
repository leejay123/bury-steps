import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/urls";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private, auth-only, or not meant for search results: signed-in
      // areas, one-off walk share links, tokenised email/invite capability
      // URLs (PII in the page body), and internal API routes.
      disallow: [
        "/walks",
        "/admin",
        "/onboarding",
        "/w/",
        "/email-preferences/",
        "/organiser-invite/",
        "/api/",
      ],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
