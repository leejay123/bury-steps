"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function navItems(isAdmin: boolean, walksHref: string) {
  return [
    { href: "/", label: "Home" },
    { href: walksHref, label: "Walks" },
    ...(isAdmin
      ? [
          { href: "/admin/members", label: "Members" },
          { href: "/admin/settings", label: "Settings" },
        ]
      : []),
  ];
}

export function isNavItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/walks");
  }
  if (href === "/admin/settings") {
    return pathname.startsWith("/admin/settings") || pathname.startsWith("/admin/homepage");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean) {
  return cn(
    "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
    active && "bg-muted font-medium text-foreground",
  );
}

export function SiteNavLinks({
  isAdmin,
  walksHref,
}: {
  isAdmin: boolean;
  walksHref: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center justify-center gap-1 text-sm md:flex">
      {navItems(isAdmin, walksHref).map((item) => {
        const active = isNavItemActive(pathname, item.href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={navLinkClass(active)}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
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
    const active = scrollerRef.current?.querySelector("[aria-current='page']");
    active?.scrollIntoView({ block: "nearest", inline: "nearest" });
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
            <Link
              aria-current={active ? "page" : undefined}
              className={cn("shrink-0", navLinkClass(active))}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
