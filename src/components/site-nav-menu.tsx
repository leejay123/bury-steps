"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  ChartColumn,
  FileBarChart,
  Footprints,
  History,
  House,
  MessageSquare,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { menuFont } from "@/app/fonts";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { unlockIdleDocument } from "@/components/overlay-root";
import { isNavItemActive, navItems } from "@/components/site-nav-items";
import type { OrganiserPermissions } from "@/lib/organiser-permissions";

const NAV_ICONS: Record<string, LucideIcon> = {
  Home: House,
  Walks: Footprints,
  Notices: Bell,
  Progress: ChartColumn,
  History: History,
  Members: Users,
  Messages: MessageSquare,
  Reports: FileBarChart,
  Settings: SlidersHorizontal,
  Guide: BookOpen,
};

function navLinkClass(active: boolean) {
  return cn(
    "relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
    !active && "hover:bg-muted",
    active && "font-medium text-foreground",
  );
}

function NavIcon({ label }: { label: string }) {
  const Icon = NAV_ICONS[label];
  if (!Icon) return null;
  return <Icon aria-hidden="true" className="size-4 shrink-0" />;
}

function NavLink({
  active,
  className,
  href,
  label,
  onSelect,
}: {
  active: boolean;
  className?: string;
  href: string;
  label: string;
  onSelect?: (el: HTMLAnchorElement) => void;
}) {
  const router = useRouter();
  const pushedOnPress = useRef(false);
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(navLinkClass(active), className)}
      href={href}
      prefetch={true}
      // No prefetch restriction needed here: SiteNavLinks/SiteMobileNavBar
      // (this component's only callers, see site-nav.tsx) render exclusively
      // for already-signed-in users, so a link to a sign-in-required route
      // never hits the redirect-to-sign-in path that caused the Clerk CORS
      // error for signed-out visitors — that only happens via the footer,
      // which shows these links to everyone. See shouldPrefetchNavLink.
      onClick={(event) => {
        unlockIdleDocument();
        onSelect?.(event.currentTarget);
        if (pushedOnPress.current) {
          event.preventDefault();
          pushedOnPress.current = false;
        }
      }}
      onPointerDown={(event) => {
        unlockIdleDocument();
        if (active || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        pushedOnPress.current = true;
        router.push(href);
      }}
    >
      {active ? <span className="absolute inset-0 rounded-md bg-muted" /> : null}
      <span className="relative z-10 inline-flex items-center gap-1.5">
        <NavIcon label={label} />
        {label}
      </span>
    </Link>
  );
}


/** Whether the nav's horizontal scroller has more content hidden past
 * either edge, so callers can fade that edge to hint "there's more to
 * scroll" instead of letting the row just clip mid-label. */
function useScrollEdges(scrollerRef: RefObject<HTMLElement | null>) {
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scroller;
      // 1px slop: browsers can report a fractional px of "scroll left" at
      // rest due to subpixel rounding, which would otherwise flicker the
      // fade on for a row that isn't actually scrollable.
      setEdges({
        start: scrollLeft > 1,
        end: scrollLeft < scrollWidth - clientWidth - 1,
      });
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });
    // Nav items don't change size on their own, but the viewport can
    // (rotation, resizing a desktop window) which flips whether the row
    // overflows at all.
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, [scrollerRef]);

  return edges;
}

/** Fades the scroller's edge toward the surrounding background when there's
 * more content past it — a plain CSS mask on the scroller would fade the
 * links' own background too, so this overlays a matching gradient instead.
 * Not rendered at all rather than just faded to invisible when there's
 * nothing past that edge — the first/last item then has nothing sitting
 * over it at rest.
 *
 * Built with an inline `style` rather than Tailwind's `bg-gradient-to-*`
 * utilities: those compile to `linear-gradient(to left/right in oklab, …)`
 * in Tailwind v4, and Safari has had inconsistent support for the
 * "to left"/"to right in oklab" combination — it was showing the fade on
 * one edge but not the other. A plain gradient in the default (sRGB)
 * color space sidesteps that entirely and is universally supported. */
function ScrollEdgeFade({ side, visible }: { side: "left" | "right"; visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-y-0 z-10 w-8",
        side === "left" ? "left-0" : "right-0",
      )}
      style={{
        backgroundImage: `linear-gradient(to ${side === "left" ? "right" : "left"}, var(--background), transparent)`,
      }}
    />
  );
}

/** Lets a plain vertical mouse wheel scroll this horizontal row — without
 * this, a desktop mouse (no trackpad, no touch) has no way to reach content
 * past either edge once the row overflows: the scrollbar is hidden (by
 * design, to match the rest of the site's horizontal scrollers) and a
 * bare wheel event only moves the page vertically, never this row. Only
 * takes over when the gesture is mostly vertical and the row actually has
 * somewhere to go, so a normal trackpad horizontal swipe (deltaX already
 * doing the work) and page scrolling elsewhere are both left alone. */
function useWheelScroll(scrollerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    function onWheel(event: WheelEvent) {
      if (!scroller || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const { scrollLeft, scrollWidth, clientWidth } = scroller;
      const canScroll =
        (event.deltaY < 0 && scrollLeft > 0) ||
        (event.deltaY > 0 && scrollLeft < scrollWidth - clientWidth);
      if (!canScroll) return;
      event.preventDefault();
      scroller.scrollLeft += event.deltaY;
    }

    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
  }, [scrollerRef]);
}

function scrollNavItemIntoView(scroller: HTMLElement, item: HTMLElement) {
  const scrollerBox = scroller.getBoundingClientRect();
  const itemBox = item.getBoundingClientRect();
  const left =
    scroller.scrollLeft +
    (itemBox.left - scrollerBox.left) -
    (scrollerBox.width - itemBox.width) / 2;
  scroller.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
}

export function SiteNavLinks({
  isAdmin,
  permissions,
  progressEnabled,
  walksHref,
}: {
  isAdmin: boolean;
  /** Omitted defaults to full access — see navItems. */
  permissions?: OrganiserPermissions;
  /** Omitted defaults to true — see navItems. */
  progressEnabled?: boolean;
  walksHref: string;
}) {
  const pathname = usePathname();
  const scrollerRef = useRef<HTMLElement>(null);
  const items = navItems(isAdmin, walksHref, permissions, progressEnabled);
  const edges = useScrollEdges(scrollerRef);
  useWheelScroll(scrollerRef);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = scroller?.querySelector<HTMLElement>("[aria-current='page']");
    if (scroller && active) scrollNavItemIntoView(scroller, active);
  }, [pathname]);

  return (
    <div className="relative hidden min-w-0 md:block">
      <ScrollEdgeFade side="left" visible={edges.start} />
      <nav
        className="flex max-w-full items-center justify-center gap-1 overflow-x-auto overscroll-x-contain text-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        ref={scrollerRef}
      >
        {items.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <NavLink
              active={active}
              className="shrink-0"
              href={item.href}
              key={item.href}
              label={item.label}
              onSelect={(el) => {
                const scroller = scrollerRef.current;
                if (scroller) scrollNavItemIntoView(scroller, el);
              }}
            />
          );
        })}
      </nav>
      <ScrollEdgeFade side="right" visible={edges.end} />
    </div>
  );
}

// Mirrors shadcn-ui/ui apps/v4/components/mobile-nav.tsx.
export function SiteMobileMenu({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-mobile-nav=""
          variant="ghost"
          className="relative h-8 touch-manipulation items-center justify-start gap-2.5 p-0! hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 active:bg-transparent pointer-coarse:after:absolute pointer-coarse:after:-inset-2 md:hidden dark:hover:bg-transparent"
        >
          <div className="relative flex h-8 w-4 items-center justify-center">
            <div className="relative size-4">
              <span
                className={cn(
                  "absolute left-0 block h-0.5 w-4 bg-black transition-all duration-100 dark:bg-white",
                  open ? "top-[0.4rem] -rotate-45" : "top-1",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 block h-0.5 w-4 bg-black transition-all duration-100 dark:bg-white",
                  open ? "top-[0.4rem] rotate-45" : "top-2.5",
                )}
              />
            </div>
            <span className="sr-only">Toggle Menu</span>
          </div>
          <span className={cn(menuFont.className, "flex h-8 items-center text-lg leading-none font-medium text-black dark:text-white")}>
            Menu
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(menuFont.className, "h-(--radix-popper-available-height) w-(--radix-popper-available-width) overflow-y-auto rounded-none border-none bg-background/90 p-0 shadow-none backdrop-blur duration-100 [scrollbar-width:none] data-[state=open]:animate-none! [&::-webkit-scrollbar]:hidden")}
        align="start"
        side="bottom"
        alignOffset={-16}
        sideOffset={14}
      >
        <div className="flex flex-col gap-12 overflow-auto px-6 py-6">
          <div className="flex flex-col gap-4">
            <div className="text-sm font-medium text-[oklch(0.556_0_0)] dark:text-[oklch(0.708_0_0)]">Menu</div>
            <div className="flex flex-col gap-3">
              {items.map((item) =>
                item.href.startsWith("/") ? (
                  <Link
                    className="flex items-center gap-2 text-2xl font-medium text-black dark:text-white"
                    href={item.href}
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      setOpen(false);
                    }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    className="flex items-center gap-2 text-2xl font-medium text-black dark:text-white"
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </a>
                ),
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
