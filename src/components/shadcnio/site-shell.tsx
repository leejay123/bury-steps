"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SIDEBAR_KEY, SIDEBAR_TOGGLE_EVENT } from "./sidebar-state";

/** Pages that never get the sidebar: the homepage (it draws its own page) and the legal pages. */
const NO_SIDEBAR = ["/privacy-policy", "/terms-of-service", "/privacy", "/sign-in", "/sign-up", "/onboarding"];

/**
 * Every page in the shadcn.io design except the homepage, laid out as
 * shadcn.io's dashboard (their markup and classes, used with permission): the
 * header across the top, the sidebar on the left, and the page in their
 * framed column. Only signed-in members get the sidebar (globals.css shows it
 * from html[data-remembered-in], set before the first paint); everyone else,
 * and the legal pages, get the header, the page and the footer.
 */
export function ShadcnSiteShell({
  nav,
  sidebar,
  footer,
  children,
}: {
  nav: ReactNode;
  sidebar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const path = usePathname() ?? "/";
  const [drawer, setDrawer] = useState(false);
  const [drawerPath, setDrawerPath] = useState(path);
  // A new page shuts the phone sidebar.
  if (drawerPath !== path) {
    setDrawerPath(path);
    setDrawer(false);
  }

  useEffect(() => {
    const onToggle = () => {
      if (window.matchMedia("(min-width: 64rem)").matches) {
        const root = document.documentElement;
        const collapsed = root.getAttribute("data-docs-sidebar") !== "collapsed";
        if (collapsed) root.setAttribute("data-docs-sidebar", "collapsed");
        else root.removeAttribute("data-docs-sidebar");
        try {
          if (collapsed) localStorage.setItem(SIDEBAR_KEY, "collapsed");
          else localStorage.removeItem(SIDEBAR_KEY);
        } catch {}
      } else setDrawer((open) => !open);
    };
    window.addEventListener(SIDEBAR_TOGGLE_EVENT, onToggle);
    return () => window.removeEventListener(SIDEBAR_TOGGLE_EVENT, onToggle);
  }, []);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawer(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  if (path === "/") return <>{children}</>;
  const plain = NO_SIDEBAR.some((p) => path === p || path.startsWith(`${p}/`));

  return (
    <div
      className="style-nova theme-neutral radius-default flex min-h-dvh w-full flex-col"
      data-shadcnio-shell={plain ? "plain" : "docs"}
    >
      <div className="contents lg:fixed lg:inset-x-0 lg:top-0 lg:z-40 lg:block" data-slot="docs-header">
        {nav}
      </div>
      <div
        className="relative min-h-[calc(100svh-var(--header-height))] w-full flex-1 items-start bg-background px-0 [--top-spacing:0] lg:grid lg:h-svh lg:min-h-0 lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] lg:overflow-hidden lg:[--top-spacing:--spacing(8)]"
        data-slot="docs-shell"
      >
        {plain ? null : (
          <aside
            aria-label="Dashboard"
            className="z-30 mt-(--header-height) hidden h-[calc(100svh-var(--header-height))] min-h-0 flex-col overflow-hidden border-e bg-chrome lg:col-start-1 lg:row-start-1 lg:flex"
            data-slot="docs-sidebar"
          >
            {sidebar}
          </aside>
        )}
        <div
          className="min-h-[calc(100svh-var(--header-height))] min-w-0 bg-background lg:col-start-2 lg:row-start-1 lg:h-svh lg:min-h-0 lg:overflow-y-scroll lg:overscroll-contain lg:pt-(--header-height)"
          data-slot="docs-main"
          id="main-content"
        >
          <div className="overflow-x-clip">
            <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-6xl flex-col px-4 sm:px-5 lg:min-h-[calc(100svh-4.5rem)] lg:px-6">
              <div className="flex flex-1 flex-col border-x pb-16 *:last:border-b" data-slot="docs-column">
                {/* Pages not yet laid out as shadcn.io sections get their sections' spacing; a page
                    built from their sections (data-shadcn-page) fills the column itself. */}
                <div className="flex flex-1 flex-col px-5 pt-8 md:px-12 md:pt-10 has-[[data-shadcn-page]]:p-0" data-slot="docs-page">
                  {children}
                </div>
              </div>
            </div>
            <div data-slot="docs-footer">{footer}</div>
          </div>
        </div>
        {plain ? null : (
          <div
            aria-hidden="true"
            className="absolute bottom-0 z-30 hidden w-2 touch-none lg:block"
            data-slot="docs-sidebar-edge"
            style={{ insetInlineStart: "calc(var(--sidebar-width) - 1px)", top: "var(--header-height)" }}
          />
        )}
      </div>
      {plain ? null : (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          data-slot="docs-sidebar-drawer"
          data-state={drawer ? "open" : "closed"}
          hidden={!drawer}
        >
          <button aria-label="Close sidebar" className="absolute inset-0 bg-black/30" onClick={() => setDrawer(false)} type="button" />
          <aside
            aria-label="Dashboard"
            className="relative flex h-full w-[min(18rem,85vw)] flex-col overflow-hidden border-e bg-chrome shadow-xl"
          >
            {sidebar}
          </aside>
        </div>
      )}
    </div>
  );
}
