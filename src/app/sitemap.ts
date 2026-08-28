import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/urls";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms-of-service`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
