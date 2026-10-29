"use client";

import { useLayoutEffect } from "react";

export type PageKind = "home" | "plain" | "sections";

/**
 * Tells the shadcn.io frame what kind of page this is, as a plain label on <html>
 * (html[data-page-kind]): "home" draws its whole own page, "plain" (Terms, Privacy)
 * has no sidebar and keeps the footer, "sections" is built from their sections and
 * fills the column itself. shadcnio.css lays the frame out from the label.
 *
 * A label rather than html:has([data-…]), which made the browser recheck the whole
 * page after every small change and slowed buttons and drawers right down. The
 * inline script sets it while the page is still arriving, so the first paint is
 * right; the effect keeps it right on later page changes (and clears it when React
 * hides or leaves the page).
 */
export function PageKindMark({ kind }: { kind: PageKind }) {
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-page-kind", kind);
    return () => {
      if (html.getAttribute("data-page-kind") === kind) html.removeAttribute("data-page-kind");
    };
  }, [kind]);
  return (
    <script
      dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute("data-page-kind",${JSON.stringify(kind)})` }}
      suppressHydrationWarning
    />
  );
}
