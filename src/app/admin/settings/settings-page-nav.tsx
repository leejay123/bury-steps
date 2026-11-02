"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { unlockIdleDocument } from "@/components/overlay-root";
import { findSettingsPage } from "@/lib/settings-pages";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Trail above a settings page's title — All settings › group › this page —
 * like the Walks › walk name trail in the top bar. Worked out from the URL.
 */
export function SettingsBackLink() {
  const pathname = usePathname();
  const found = findSettingsPage(pathname);
  if (!found) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>All settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const { group, page } = found;
  const child = page.children?.find((item) => item.href === pathname);
  const currentTitle = child?.title ?? page.title;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/admin/settings" onClick={() => unlockIdleDocument()}>
              All settings
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <span className={cn("text-muted-foreground", page.danger && "text-destructive")}>
            {group.label}
          </span>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className={cn("truncate", page.danger && "text-destructive")}>
            {currentTitle}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * Tabs across a page that has sibling sub-pages (Site wording's five),
 * so moving between them doesn't mean going back to the table each time.
 * Renders nothing on an ordinary page.
 *
 * Kept quick on phones:
 *  - prefetch={true}: these pages wait for the organiser check, so without
 *    loading them ahead each tap froze on the old page until the server
 *    answered, then jumped. Full prefetch loads the handful of tabs up
 *    front — only here, where they're shown, not site-wide menus.
 *  - The tapped tab highlights straight away (pendingHref) instead of only
 *    once the new page has arrived.
 *  - The current tab is brought into view by scrolling the tab strip
 *    itself sideways. scrollIntoView scrolls every scrollable ancestor in
 *    turn — the page included — which made the page jump on iOS.
 *  - overscroll-x-contain: a sideways swipe that runs out of tabs doesn't
 *    carry on into Safari's back/forward swipe.
 */
export function SettingsSubPageTabs() {
  const pathname = usePathname();
  const siblings = findSettingsPage(pathname)?.page.children;
  const scrollerRef = useRef<HTMLElement>(null);
  const [pending, setPending] = useState<{ href: string; from: string } | null>(null);
  // A tap highlights its tab at once; the highlight falls back to the real
  // URL as soon as navigation lands (or if it never leaves this page).
  const currentHref = pending && pending.from === pathname ? pending.href : pathname;

  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = scroller?.querySelector<HTMLElement>("[aria-current='page']");
    if (!scroller || !active) return;
    // Position within the strip's scrollable content, from on-screen boxes
    // (offsetLeft depends on which ancestor happens to be positioned).
    const left =
      active.getBoundingClientRect().left -
      scroller.getBoundingClientRect().left +
      scroller.scrollLeft;
    const right = left + active.offsetWidth;
    if (left < scroller.scrollLeft) {
      scroller.scrollLeft = left - 8;
    } else if (right > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollLeft = right - scroller.clientWidth + 8;
    }
  }, [pathname]);

  if (!siblings) return null;

  return (
    <nav
      aria-label="Pages in this section"
      className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-edge-bar=""
      data-edge-top=""
      ref={scrollerRef}
    >
      {/* Styled after shadcn studio's Tabs 27: a spring-animated pill slides
          to the tapped tab (these are page links, so no sliding content). */}
      {/* Scoped per page: the pill slides on tap, and the next page's strip
          starts with it already in place instead of replaying the slide. */}
      <LayoutGroup id={`settings-subpage-tabs:${pathname}`}>
      <ul className="inline-flex h-10 min-w-max items-center rounded-lg bg-muted p-1">
        {siblings.map((child) => {
          const active = child.href === currentHref;
          return (
            <li className="relative h-full" key={child.href}>
              {active ? (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-sm bg-background shadow-sm"
                  layoutId="settings-subpage-tab"
                  transition={{ type: "spring", stiffness: 200, damping: 30 }}
                />
              ) : null}
              <Link
                aria-current={child.href === pathname ? "page" : undefined}
                className={cn(
                  "relative z-1 flex h-full touch-manipulation items-center rounded-sm px-3 text-sm font-medium whitespace-nowrap transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                href={child.href}
                onClick={() => {
                  unlockIdleDocument();
                  if (child.href !== pathname) setPending({ href: child.href, from: pathname });
                }}
                prefetch
              >
                {child.title}
              </Link>
            </li>
          );
        })}
      </ul>
      </LayoutGroup>
    </nav>
  );
}
