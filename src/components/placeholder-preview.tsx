import type { ReactNode } from "react";
import { previewingPlaceholders } from "@/lib/placeholder-preview";

/**
 * Inside a page's <Suspense>: shows `fallback` (the page's own placeholder)
 * instead of the content while "Preview loading placeholders" is on in this
 * browser. The content isn't loaded at all then. Rendering the placeholder
 * in place of the content is the usual way to inspect a loading state;
 * it doesn't hold a request open.
 */
export async function PlaceholderPreview({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  return (await previewingPlaceholders()) ? fallback : children;
}
