"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    href: "/admin",
    label: "Walks",
    active: (pathname: string) => pathname === "/admin" || pathname.startsWith("/admin/walks"),
  },
  {
    href: "/admin/members",
    label: "Members",
    active: (pathname: string) => pathname.startsWith("/admin/members"),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    active: (pathname: string) =>
      pathname.startsWith("/admin/settings") || pathname.startsWith("/admin/homepage"),
  },
  {
    href: "/admin/guide",
    label: "Guide",
    active: (pathname: string) => pathname.startsWith("/admin/guide"),
  },
] as const;

export function AdminSectionTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Organiser"
      className="grid w-full grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4"
    >
      {ITEMS.map((item) => {
        const active = item.active(pathname);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "px-4 py-3 text-center text-sm text-muted-foreground hover:bg-accent/40 hover:text-foreground",
              active ? "bg-muted font-medium text-foreground" : "bg-background",
            )}
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
