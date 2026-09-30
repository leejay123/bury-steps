"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
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
import { isNavItemActive } from "@/components/site-nav-items";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
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

export type BottomNavItem = { href: string; label: string; dot?: Promise<boolean> };

function UnreadDot({ unread }: { unread: Promise<boolean> }) {
  return use(unread) ? (
    <span aria-label="New" className="absolute -top-0.5 -right-1 size-2 rounded-full bg-blue-500 ring-2 ring-background" />
  ) : null;
}

/**
 * Phone-only bottom navigation (like Material's Bottom Navigation / an iOS
 * tab bar): up to five main pages as icon + label, the current one on a
 * pill that glides between tabs. Fixed to the bottom with the iPhone home
 * indicator's safe area added underneath; a spacer the same height keeps it
 * from covering the footer. globals.css (html:has([data-bottom-nav])) lifts
 * the back-to-top button, cookie banner and toasts above it.
 */
export function BottomNavBar({ items }: { items: BottomNavItem[] }) {
  const pathname = usePathname();
  if (items.length === 0) return null;

  return (
    <>
      <div aria-hidden className="h-[var(--bottom-nav-offset,0px)] md:hidden" />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-[57] border-t bg-background/85 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] backdrop-blur-xl md:hidden"
        data-bottom-nav=""
      >
        <ul className="mx-auto grid h-15 max-w-md" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const Icon = ICONS[item.label] ?? House;
            return (
              <li className="flex" key={item.href}>
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground active:text-foreground",
                  )}
                  href={item.href}
                >
                  <span className="relative flex h-7 w-14 items-center justify-center">
                    {active ? (
                      <motion.span
                        className="absolute inset-0 rounded-full bg-muted"
                        layoutId="bottom-nav-pill"
                        transition={{ type: "spring", visualDuration: 0.3, bounce: 0.2 }}
                      />
                    ) : null}
                    <span className="relative">
                      <Icon aria-hidden className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                      {item.dot ? (
                        <Suspense fallback={null}>
                          <UnreadDot unread={item.dot} />
                        </Suspense>
                      ) : null}
                    </span>
                  </span>
                  <span className="max-w-full truncate px-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
