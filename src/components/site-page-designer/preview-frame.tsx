"use client";

import { useEffect, type ReactNode } from "react";
import { PuckFrameStyles } from "@/components/puck-frame-styles";
import type { SitePageKey } from "@/lib/site-page-designs";

/**
 * The designer canvas as the live page: the same centred column with side
 * borders, so the + guide marks land on those edges the way they do on the
 * public site. Only wraps the editor iframe — the live `SitePageRender`
 * already sits in that column.
 */
export function SitePagePreviewFrame({
  children,
  document: frame,
  page,
}: {
  children: ReactNode;
  document?: Document;
  page: SitePageKey;
}) {
  const home = page === "home";

  useEffect(() => {
    if (!frame) return;
    const html = frame.documentElement;
    const parent = window.document.documentElement;
    html.setAttribute("data-design", parent.getAttribute("data-design") ?? "shadcnio");
    html.setAttribute("data-page-kind", home ? "home" : "plain");
    for (const name of ["data-remembered-in", "data-guest-dash"] as const) {
      if (parent.hasAttribute(name)) html.setAttribute(name, parent.getAttribute(name) ?? "");
    }
    const parentStyle = parent.getAttribute("style");
    if (parentStyle) html.setAttribute("style", parentStyle);
    frame.body.classList.add("style-nova", "theme-neutral", "radius-default", "bg-background");
  }, [frame, home]);

  return (
    <PuckFrameStyles document={frame}>
      <div className="style-nova theme-neutral radius-default flex min-h-full w-full flex-1 flex-col overflow-x-clip bg-background">
        <div
          className={
            home
              ? "mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 sm:px-5 lg:max-w-6xl lg:px-6"
              : "mx-auto flex min-h-full w-full max-w-6xl flex-1 flex-col px-4 sm:px-5 lg:px-6"
          }
          data-slot={home ? undefined : "docs-container"}
        >
          <div
            className="relative flex min-h-full flex-1 flex-col border-x outline-none"
            data-slot={home ? undefined : "docs-column"}
            id={home ? "content" : undefined}
          >
            {children}
          </div>
        </div>
      </div>
    </PuckFrameStyles>
  );
}
