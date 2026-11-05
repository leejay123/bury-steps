"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { PanelLeft } from "lucide-react";
import { lockBackgroundScroll } from "@/components/overlay-scroll-lock";
import { useClientPathname } from "@/components/client-pathname";
import { IntentLink as Link } from "@/components/intent-link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { EfferdTopTools } from "./efferd-top-tools";
import { SetPageCrumb, type PageCrumb } from "./page-crumb";
import { Guides } from "./parts";
import { SIDEBAR_KEY, SIDEBAR_TOGGLE_EVENT, syncGuestDash } from "./sidebar-state";
import { settingsHeaderTrail } from "@/lib/settings-pages";

/**
 * Every page in the shadcn.io design except the homepage, laid out as
 * shadcn.io's dashboard (their markup and classes, used with permission): the
 * header across the top, the sidebar on the left, and the page in their
 * framed column. Only signed-in members get the sidebar (globals.css shows it
 * from html[data-remembered-in], set before the first paint); everyone else,
 * and the legal pages, get the header, the page and the footer.
 *
 * The homepage is a different layout (`src/app/page.tsx`), so this shell is
 * not on that page at all. Which other page this is isn't read here (that
 * would stop pages with a changing address from being ready-made); the pages
 * mark themselves instead, and shadcnio.css lays the frame out from those
 * marks. Legal pages get no sidebar (PageKindMark sets html[data-page-kind]).
 */
export function ShadcnSiteShell({
  nav,
  sidebar,
  tools,
  footer,
  children,
}: {
  nav: ReactNode;
  /** Signed-in pages' sidebar (Efferd's app shell 2). */
  sidebar: ReactNode;
  /** Signed-in pages' top bar, right end: the bell and the avatar. */
  tools: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const path = useClientPathname();
  const [drawer, setDrawer] = useState(false);
  // The phone drawer's copy of the sidebar is drawn from its first opening, so
  // every page's HTML doesn't carry the sidebar twice.
  const [drawerUsed, setDrawerUsed] = useState(false);
  if (drawer && !drawerUsed) setDrawerUsed(true);
  // The breadcrumb's last step, named by the page (page-crumb.tsx).
  const [crumb, setCrumb] = useState<PageCrumb | null>(null);
  const parent = crumbParent(path);
  const settingsTrail = path ? settingsHeaderTrail(path) : null;
  const [drawerPath, setDrawerPath] = useState(path);
  // A new page shuts the phone sidebar.
  if (drawerPath !== path) {
    setDrawerPath(path);
    setDrawer(false);
  }

  // A visitor gets the dashboard's look on a shared walk page only (sidebar-state.ts).
  useEffect(() => {
    if (path) syncGuestDash(path);
  }, [path]);

  // The dashboard page scrolls in its own box (docs-main), which Next.js doesn't reset as it
  // does the window: a new page opened at the last one's scroll. Back/Forward keep theirs.
  const travelled = useRef(false);
  useEffect(() => {
    const onPop = () => {
      travelled.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const lastPath = useRef(path);
  useLayoutEffect(() => {
    if (lastPath.current === path) return;
    lastPath.current = path;
    if (travelled.current) {
      travelled.current = false;
      return;
    }
    document.querySelector('[data-slot="docs-main"]')?.scrollTo({ top: 0 });
  }, [path]);

  useEffect(() => {
    let animating = 0;
    const onToggle = () => {
      if (window.matchMedia("(min-width: 64rem)").matches) {
        const root = document.documentElement;
        const collapsed = root.getAttribute("data-docs-sidebar") !== "collapsed";
        // The sidebar animates its width; the page takes its new place at once and glides there
        // from where it was, so it isn't laid out again at every step (that was the lag).
        // data-sidebar-animating keeps the labels until the sidebar has narrowed (shadcnio.css).
        const main = document.querySelector<HTMLElement>('[data-slot="docs-main"]');
        const side = document.querySelector<HTMLElement>('[data-slot="docs-sidebar"]');
        const before = main?.getBoundingClientRect().left ?? 0;
        const sideBefore = side?.getBoundingClientRect().width ?? 0;
        root.setAttribute("data-sidebar-animating", "");
        window.clearTimeout(animating);
        animating = window.setTimeout(() => root.removeAttribute("data-sidebar-animating"), 260);
        if (collapsed) root.setAttribute("data-docs-sidebar", "collapsed");
        else root.removeAttribute("data-docs-sidebar");
        const after = main?.getBoundingClientRect().left ?? 0;
        const sideAfter = side?.getBoundingClientRect().width ?? 0;
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          // The sidebar animates its width; the page's edge follows the sidebar's actual edge
          // every frame. (Moving the page by its own animation let the two drift apart by up
          // to 50px mid-way: the page glided on the graphics side while the sidebar's width
          // stepped along with the page's own work, then they snapped together at the end.)
          const timing = { duration: 200, easing: "ease-out" } as const;
          if (side && sideBefore !== sideAfter) {
            const grow = side.animate([{ width: `${sideBefore}px` }, { width: `${sideAfter}px` }], timing);
            if (main && before !== after) {
              const follow = () => {
                const width = side.getBoundingClientRect().width;
                main.style.transform = `translateX(${Math.round(width - sideAfter)}px)`;
                if (grow.playState === "running") requestAnimationFrame(follow);
                else main.style.transform = "";
              };
              follow();
              grow.addEventListener("finish", () => (main.style.transform = ""), { once: true });
              grow.addEventListener("cancel", () => (main.style.transform = ""), { once: true });
            }
          }
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

  // While the phone menu is open the page behind it stays still (the site's overlay lock,
  // as its drawers and dialogs use).
  useEffect(() => {
    if (!drawer) return;
    return lockBackgroundScroll();
  }, [drawer]);

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
        className="relative min-h-[calc(100svh-var(--header-height))] w-full flex-1 items-start bg-background px-0 [--top-spacing:0] lg:grid lg:h-svh lg:min-h-0 lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] lg:overflow-clip lg:[--top-spacing:--spacing(8)]"
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
                  {/* shadcn/ui's breadcrumb: the page's name, or on a page inside a list
                  (one walk, one notice, one member, one settings page) the list as a
                  link, then the page (Walks › Sunday stroll; Walks › History › Sunday stroll). */}
              <Breadcrumb className="min-w-0">
                <BreadcrumbList className="flex-nowrap">
                  {settingsTrail ? (
                    <>
                      <BreadcrumbItem className="shrink-0">
                        <BreadcrumbLink asChild>
                          <Link href="/admin/settings">Settings</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="shrink-0" />
                      <BreadcrumbItem className="shrink-0">
                        <span className="text-muted-foreground">{settingsTrail.group}</span>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="shrink-0" />
                      <BreadcrumbItem className="min-w-0">
                        <BreadcrumbPage className={settingsTrail.danger ? "truncate text-destructive" : "truncate"}>
                          {settingsTrail.title}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  ) : crumb?.trail?.length ? (
                    <>
                      {crumb.trail.map((step, i) => (
                        <Fragment key={`${step.href}:${step.label}`}>
                          {i > 0 ? <BreadcrumbSeparator className="shrink-0" /> : null}
                          <BreadcrumbItem className="shrink-0">
                            <BreadcrumbLink asChild>
                              <Link href={step.href}>{step.label}</Link>
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                        </Fragment>
                      ))}
                      <BreadcrumbSeparator />
                      <BreadcrumbItem className="min-w-0">
                        <BreadcrumbPage className="truncate">{crumb.title}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  ) : parent ? (
                    <>
                      <BreadcrumbItem className="shrink-0">
                        <BreadcrumbLink asChild>
                          <Link href={parent.href}>{parent.label}</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {/* The page's own name joins once the page has named itself (nothing in
                          its place before: it only adds words at the end, so nothing moves). */}
                      {crumb ? (
                        <>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem className="min-w-0">
                            <BreadcrumbPage className="truncate">{crumb.title}</BreadcrumbPage>
                          </BreadcrumbItem>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <BreadcrumbItem className="min-w-0">
                      <BreadcrumbPage className="truncate">{pageTitle(path)}</BreadcrumbPage>
                    </BreadcrumbItem>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <EfferdTopTools />
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
                  <SetPageCrumb value={setCrumb}>{children}</SetPageCrumb>
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
        aria-hidden={drawer ? undefined : true}
        // Slides in and out (the panel and its backdrop animate; hidden from clicks and
        // screen readers while closed, and out of sight once it has slid away).
        className="group/drawer fixed inset-0 z-[60] transition-[visibility] duration-300 data-[state=closed]:invisible lg:hidden"
        data-slot="docs-sidebar-drawer"
        data-state={drawer ? "open" : "closed"}
        inert={!drawer}
      >
        {/* The site's drawer backdrop (dimmed and blurred), fading in as the menu slides in. */}
        <button
          aria-label="Close sidebar"
          className="absolute inset-0 bg-black/30 opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] supports-backdrop-filter:backdrop-blur-sm group-data-[state=open]/drawer:opacity-100"
          onClick={() => setDrawer(false)}
          tabIndex={drawer ? 0 : -1}
          type="button"
        />
        <aside
          aria-label="Dashboard"
          data-overlay-panel=""
          className="relative flex h-full w-[min(18rem,85vw)] -translate-x-full flex-col overflow-hidden overscroll-contain border-e bg-chrome shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-data-[state=open]/drawer:translate-x-0 rtl:translate-x-full motion-reduce:transition-none"
        >
          {drawerUsed ? sidebar : null}
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

/** On a page inside a list (one walk, one notice, one member), the list it belongs to: the breadcrumb's first step. */
function crumbParent(path: string | null) {
  if (path && /^\/admin\/walks\/[^/]+$/.test(path)) return { href: "/admin/walks", label: "Walks" };
  if (path && /^\/w\/[^/]+$/.test(path)) return { href: "/walks", label: "Walks" };
  if (path && /^\/admin\/members\/[^/]+$/.test(path)) return { href: "/admin/members", label: "Members" };
  if (path && /^\/notices\/[^/]+$/.test(path)) return { href: "/notices", label: "Notices" };
  return null;
}
