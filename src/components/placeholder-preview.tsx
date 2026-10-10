import type { ReactNode } from "react";
import { holdForPreview, placeholderPreviewMode } from "@/lib/placeholder-preview";

/**
 * Inside a page's <Suspense>, around its content. With "Preview loading
 * placeholders" on in this browser: "always" shows `fallback` (the page's
 * own placeholder) instead of the content; "hold" keeps the placeholder up
 * for a few seconds, then the content arrives as usual — so you can click
 * through to a notice or a walk and see its placeholder too.
 */
export async function PlaceholderPreview({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  const mode = await placeholderPreviewMode();
  if (mode === "always") return fallback;
  if (mode === "hold") await holdForPreview();
  return children;
}
