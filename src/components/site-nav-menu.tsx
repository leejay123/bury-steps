"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { unlockIdleDocument } from "@/components/overlay-root";
import { isNavItemActive, navItems, shouldPrefetchNavLink } from "@/components/site-nav-items";

function navLinkClass(active: boolean) {
  return cn(
    "relative rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
    !active && "hover:bg-muted",
    active && "font-medium text-foreground",
  );
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
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(navLinkClass(active), className)}
      href={href}
      prefetch={shouldPrefetchNavLink(href)}
      onClick={(event) => {
        unlockIdleDocument();
        onSelect?.(event.currentTarget);
      }}
      onPointerDown={() => {
        unlockIdleDocument();
      }}
    >
      {active ? <span className="absolute inset-0 rounded-md bg-muted" /> : null}
      <span className="relative z-10">{label}</span>
    </Link>
  );
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
  walksHref,
}: {
  isAdmin: boolean;
  walksHref: string;
}) {
  const pathname = usePathname();
  const scrollerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = scroller?.querySelector<HTMLElement>("[aria-current='page']");
    if (scroller && active) scrollNavItemIntoView(scroller, active);
  }, [pathname]);

  return (
    <nav
      className="hidden max-w-full items-center justify-center gap-1 overflow-x-auto overscroll-x-contain text-sm [scrollbar-width:none] [-ms-overflow-style:none] md:flex [&::-webkit-scrollbar]:hidden"
      ref={scrollerRef}
    >
      {navItems(isAdmin, walksHref).map((item) => {
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
  );
}

export function SiteMobileNavBar({
  isAdmin,
  walksHref,
}: {
  isAdmin: boolean;
  walksHref: string;
}) {
  const pathname = usePathname();
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = scroller?.querySelector<HTMLElement>("[aria-current='page']");
    if (scroller && active) scrollNavItemIntoView(scroller, active);
  }, [pathname]);

  return (
    <nav aria-label="Site" className="border-t md:hidden">
      <div
        className="flex gap-1 overflow-x-auto overscroll-x-contain px-3 py-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        ref={scrollerRef}
      >
        {navItems(isAdmin, walksHref).map((item) => {
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
      </div>
    </nav>
  );
}
