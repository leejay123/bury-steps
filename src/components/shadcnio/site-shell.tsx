"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PanelLeft } from "lucide-react";
import { useClientPathname } from "@/components/client-pathname";
import { EfferdTopTools } from "./efferd-top-tools";
import { Guides } from "./parts";
import type { SearchItem } from "./search-panel";
import { SIDEBAR_KEY, SIDEBAR_TOGGLE_EVENT } from "./sidebar-state";

/**
 * Every page in the shadcn.io design except the homepage, laid out as
 * shadcn.io's dashboard (their markup and classes, used with permission): the
 * header across the top, the sidebar on the left, and the page in their
 * framed column. Only signed-in members get the sidebar (globals.css shows it
 * from html[data-remembered-in], set before the first paint); everyone else,
 * and the legal pages, get the header, the page and the footer.
 *
 * Which page this is isn't read here (that would stop pages with a changing
 * address from being ready-made); the pages mark themselves instead, and
 * shadcnio.css lays the frame out from those marks: the homepage
 * draws its whole own page, the legal pages get no sidebar (PageKindMark sets
 * html[data-page-kind]).
 */
export function ShadcnSiteShell({
  nav,
  sidebar,
  tools,
  search,
  siteName,
  footer,
  children,
}: {
  nav: ReactNode;
  /** Signed-in pages' sidebar (Efferd's app shell 2). */
  sidebar: ReactNode;
  /** Signed-in pages' top bar, right end: the bell and the avatar. */
  tools: ReactNode;
  /** The search's pages and walks (the same as the main header's). */
  search: SearchItem[];
  siteName: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  const path = useClientPathname();
  const [drawer, setDrawer] = useState(false);
  const [drawerPath, setDrawerPath] = useState(path);
  // A new page shuts the phone sidebar.
  if (drawerPath !== path) {
    setDrawerPath(path);
    setDrawer(false);
  }

  useEffect(() => {
    let animating = 0;
    const onToggle = () => {
      if (window.matchMedia("(min-width: 64rem)").matches) {
        const root = document.documentElement;
        const collapsed = root.getAttribute("data-docs-sidebar") !== "collapsed";
        // Only the sidebar animates its width (shadcnio.css, data-sidebar-animating); the page
        // takes its new place at once and glides there from where it was, so it isn't laid
        // out again at every step (that was the lag). Nothing animates on arrival.
        const main = document.querySelector<HTMLElement>('[data-slot="docs-main"]');
        const before = main?.getBoundingClientRect().left ?? 0;
        root.setAttribute("data-sidebar-animating", "");
        window.clearTimeout(animating);
        animating = window.setTimeout(() => root.removeAttribute("data-sidebar-animating"), 260);
        if (collapsed) root.setAttribute("data-docs-sidebar", "collapsed");
        else root.removeAttribute("data-docs-sidebar");
        const after = main?.getBoundingClientRect().left ?? 0;
        if (main && before !== after && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          main.animate([{ transform: `translateX(${before - after}px)` }, { transform: "none" }], {
            duration: 200,
            easing: "linear",
          });
        }
        try {
          if (collapsed) localStorage.setItem(SIDEBAR_KEY, "collapsed");
          else localStorage.removeItem(SIDEBAR_KEY);
        } catch {}
      } else setDrawer((open) => !open);
    };
    // ⌘B / Ctrl+B folds the sidebar, as in Efferd's app shell.
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "b" || !(event.metaKey || event.ctrlKey) || event.altKey) return;
      if (!document.documentElement.hasAttribute("data-remembered-in")) return;
      event.preventDefault();
      onToggle();
    };
    window.addEventListener(SIDEBAR_TOGGLE_EVENT, onToggle);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(SIDEBAR_TOGGLE_EVENT, onToggle);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Each page's head (data-shadcn-top) draws its line across the window (shadcnio.css);
  // the + marks where it meets the column's side lines go in the frame's own layer
  // (docs-marks), which React leaves empty, so nothing on the page itself is touched
  // (writing onto a page's head before React had finished setting it up confused it).
  useEffect(() => {
    const column = document.querySelector<HTMLElement>('[data-slot="docs-column"]');
    const page = column?.querySelector<HTMLElement>('[data-slot="docs-page"]');
    const layer = column?.querySelector<HTMLElement>('[data-slot="docs-marks"]');
    if (!(column && page && layer)) return;
    let frame = 0;
    const place = () => {
      frame = 0;
      const top = column.getBoundingClientRect().top;
      const ys: number[] = [];
      for (const head of page.querySelectorAll<HTMLElement>("[data-shadcn-top]")) {
        const box = head.getBoundingClientRect();
        if (box.width) ys.push(Math.round(box.bottom - top));
      }
      const key = ys.join(",");
      if (layer.dataset.key === key) return;
      layer.dataset.key = key;
      layer.replaceChildren(...ys.flatMap((y) => [plusMark(y, "start"), plusMark(y, "end")]));
    };
    const soon = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    place();
    const resize = new ResizeObserver(soon);
    resize.observe(column);
    const changes = new MutationObserver(soon);
    changes.observe(page, { attributeFilter: ["hidden", "style"], childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      changes.disconnect();
    };
  }, [path]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawer(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  return (
    <div className="style-nova theme-neutral radius-default flex min-h-dvh w-full flex-col" data-shadcnio-shell="">
      <div className="contents lg:fixed lg:inset-x-0 lg:top-0 lg:z-40 lg:block" data-slot="docs-header">
        {nav}
      </div>
      <div
        className="relative min-h-[calc(100svh-var(--header-height))] w-full flex-1 items-start bg-background px-0 [--top-spacing:0] lg:grid lg:h-svh lg:min-h-0 lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] lg:overflow-hidden lg:[--top-spacing:--spacing(8)]"
        data-slot="docs-shell"
      >
        <aside
          aria-label="Dashboard"
          className="z-30 mt-(--header-height) hidden h-[calc(100svh-var(--header-height))] min-h-0 flex-col overflow-hidden border-e bg-chrome lg:col-start-1 lg:row-start-1 lg:flex"
          data-slot="docs-sidebar"
        >
          {sidebar}
        </aside>
        <div
          className="min-h-[calc(100svh-var(--header-height))] min-w-0 bg-background lg:col-start-2 lg:row-start-1 lg:h-svh lg:min-h-0 lg:overflow-y-scroll lg:overscroll-contain lg:pt-(--header-height)"
          data-slot="docs-main"
        >
          {/* Signed-in pages: Efferd's top bar (shown by shadcnio.css). */}
          <header
            className="sticky top-0 z-40 hidden h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/50 md:px-6"
            data-slot="efferd-header"
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-label="Toggle sidebar"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
                onClick={() => window.dispatchEvent(new Event(SIDEBAR_TOGGLE_EVENT))}
                title="Toggle sidebar (⌘B)"
                type="button"
              >
                <PanelLeft aria-hidden />
              </button>
              <span aria-hidden="true" className="mr-2 h-4 w-px shrink-0 bg-border" />
              <nav aria-label="Breadcrumb" className="min-w-0">
                <p className="truncate font-normal text-foreground text-sm" aria-current="page">
                  {pageTitle(path)}
                </p>
              </nav>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="flex items-center gap-2">
                <EfferdTopTools search={search} siteName={siteName} />
              </div>
              {tools}
            </div>
          </header>
          <div className="overflow-x-clip" data-slot="docs-scroll">
            <div
              className="mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-6xl flex-col px-4 sm:px-5 lg:min-h-[calc(100svh-4.5rem)] lg:px-6"
              data-slot="docs-container"
            >
              <div className="relative flex flex-1 flex-col border-x" data-slot="docs-column">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10" data-slot="docs-marks" />
                {/* Pages not yet laid out as shadcn.io sections get their sections' spacing; a page
                    built from their sections fills the column itself (shadcnio.css, from
                    html[data-page-kind]). */}
                <div
                  className="flex flex-col px-5 py-6 md:px-12"
                  data-slot="docs-page"
                  id="main-content"
                >
                  {children}
                </div>
                {/* Members' pages (no footer, as their dashboard): the closing line across the
                    window with its + marks right under the page, then their blank space. Shown by
                    shadcnio.css. */}
                <div className="relative hidden flex-1" data-slot="docs-end">
                  <Guides />
                  <div className="h-16" />
                </div>
                {/* Everyone else: the homepage's footer, inside the column as on the homepage. */}
                <div className="mt-auto" data-slot="docs-footer">{footer}</div>
              </div>
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute bottom-0 z-30 hidden w-2 touch-none lg:block"
          data-slot="docs-sidebar-edge"
          style={{ insetInlineStart: "calc(var(--sidebar-width) - 1px)", top: "var(--header-height)" }}
        />
      </div>
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
    </div>
  );
}

/** One of their + marks, centred where a 1px line crosses the column's side line. */
function plusMark(y: number, side: "start" | "end") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 14 14");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1");
  svg.style.cssText = `position:absolute;width:14px;height:14px;top:${y - 6.5}px;${side === "start" ? "left" : "right"}:-6.5px;color:var(--muted-foreground)`;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M7 0v14M0 7h14");
  svg.append(path);
  return svg;
}

/** The page's name for the top bar, from its address (the sidebar's names). */
const PAGE_TITLES: [string, string][] = [
  ["/overview", "Overview"],
  ["/admin/walks", "Walks"],
  ["/admin/members", "Members"],
  ["/admin/messages", "Messages"],
  ["/admin/reports", "Reports"],
  ["/admin/settings", "Settings"],
  ["/admin/guide", "Guide"],
  ["/walks", "Walks"],
  ["/w/", "Walk"],
  ["/notices", "Notices"],
  ["/progress", "Progress"],
  ["/history", "History"],
  ["/email-preferences", "Email preferences"],
  ["/contact", "Contact"],
  ["/apps", "Walking apps"],
];
function pageTitle(path: string | null) {
  if (!path) return "";
  return PAGE_TITLES.find(([href]) => path === href || path.startsWith(href.endsWith("/") ? href : `${href}/`))?.[1] ?? "";
}
