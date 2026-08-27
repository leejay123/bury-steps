"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { restorePagePointerEvents } from "@/components/overlay-root";

export function navItems(isAdmin: boolean, walksHref: string) {
  return [
    { href: "/", label: "Home" },
    { href: walksHref, label: "Walks" },
    ...(isAdmin
      ? [
          { href: "/admin/members", label: "Members" },
          { href: "/admin/reports", label: "Reports" },
          { href: "/admin/settings", label: "Settings" },
          { href: "/admin/guide", label: "Guide" },
        ]
      : [{ href: "/dashboard/history", label: "History" }]),
  ];
}

export function isNavItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
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
}: {
  active: boolean;
  className?: string;
  href: string;
  label: string;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(navLinkClass(active), className)}
      href={href}
      onClick={() => restorePagePointerEvents()}
    >
      {active ? <span className="absolute inset-0 rounded-md bg-muted" /> : null}
      <span className="relative z-10">{label}</span>
    </Link>
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
          <NavLink
            active={active}
            href={item.href}
            key={item.href}
            label={item.label}
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
            <NavLink
              active={active}
              className="shrink-0"
              href={item.href}
              key={item.href}
              label={item.label}
            />
          );
        })}
      </div>
    </nav>
  );
}
