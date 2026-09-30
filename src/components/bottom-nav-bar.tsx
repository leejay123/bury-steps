"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Bell,
  BookOpen,
  ChartColumn,
  Facebook,
  FileText,
  FileBarChart,
  Footprints,
  History,
  House,
  LogIn,
  Mail,
  Menu,
  MessageCircle,
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { isNavItemActive } from "@/components/site-nav-items";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
  // The More sheet's account and site links.
  "Email preferences": Mail,
  "Contact Us": MessageCircle,
  "Facebook group": Facebook,
  "Privacy Policy": ShieldCheck,
  "Terms of Service": FileText,
  // Signed-out visitors' tabs.
  "Sign in": LogIn,
  Join: UserPlus,
};

export type BottomNavItem = { href: string; label: string; dot?: Promise<boolean>; newTab?: boolean };
export type BottomNavGroup = { label: string; items: BottomNavItem[] };

function UnreadDot({ unread }: { unread: Promise<boolean> }) {
  return use(unread) ? (
    <span aria-label="New" className="absolute -top-0.5 -right-1 size-2 rounded-full bg-blue-500 ring-2 ring-background" />
  ) : null;
}

/**
 * A text field (not a tick box or button) on the page itself — the bar
 * steps aside while one has focus. Fields inside a pop-up or drawer (search,
 * forms) don't count: the bar is already behind that overlay's blur, like
 * the rest of the page, so hiding it just made it vanish for no reason.
 */
function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest("[role='dialog'], [role='alertdialog'], [data-slot$='-content']")) return false;
  if (target.isContentEditable || target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) {
    return !["checkbox", "radio", "button", "submit", "reset", "range", "color", "file"].includes(target.type);
  }
  return false;
}

function Tab({
  active,
  children,
  label,
  icon: Icon,
}: {
  active: boolean;
  children?: React.ReactNode;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <>
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
          {children}
        </span>
      </span>
      <span className="max-w-full truncate px-1">{label}</span>
    </>
  );
}

const tabClass = (active: boolean) =>
  cn(
    "relative flex flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
    active ? "text-foreground" : "text-muted-foreground active:text-foreground",
  );

/**
 * Phone-only bottom navigation (like Material's Bottom Navigation / an iOS
 * tab bar), for signed-in people. Four main pages plus More, which slides
 * up a sheet with everything else (the ☰ menu is hidden on phones while
 * this bar is there — globals.css). On a walk day, from when clock-in opens
 * until the walk ends, a round Clock in button takes the middle spot.
 * Steps aside while a text field has focus so the phone keyboard doesn't
 * push it up over the form. Fixed to the bottom with the iPhone home
 * indicator's safe area underneath; a spacer the same height keeps it off
 * the footer, and globals.css (html:has([data-bottom-nav])) lifts the
 * back-to-top button, cookie banner and toasts above it.
 */
export function BottomNavBar({
  tabs,
  more,
  clockIn,
}: {
  tabs: BottomNavItem[];
  more: BottomNavGroup[];
  clockIn: { href: string; title: string } | null;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => setTyping(isTypingTarget(event.target));
    const onFocusOut = () => setTyping(isTypingTarget(document.activeElement));
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  const moreActive = more.some((group) => group.items.some((item) => isNavItemActive(pathname, item.href)));
  const clockInActive = clockIn ? pathname === clockIn.href : false;
  const columns = tabs.length + 1 + (clockIn ? 1 : 0);
  const [before, after] = clockIn ? [tabs.slice(0, 2), tabs.slice(2)] : [tabs, []];

  const renderTab = (item: BottomNavItem) => {
    const active = isNavItemActive(pathname, item.href);
    return (
      <li className="flex" key={item.href}>
        {item.href.startsWith("/") ? (
          <Link aria-current={active ? "page" : undefined} className={tabClass(active)} href={item.href}>
            <Tab active={active} icon={ICONS[item.label] ?? House} label={item.label}>
              {item.dot ? (
                <Suspense fallback={null}>
                  <UnreadDot unread={item.dot} />
                </Suspense>
              ) : null}
            </Tab>
          </Link>
        ) : (
          // Sign in / Join go to the account site — a plain link, not Next's.
          <a className={tabClass(false)} href={item.href}>
            <Tab active={false} icon={ICONS[item.label] ?? House} label={item.label} />
          </a>
        )}
      </li>
    );
  };

  return (
    <>
      <div aria-hidden className="h-[var(--bottom-nav-offset,0px)] md:hidden" />
      <nav
        aria-label="Main"
        className={cn(
          "fixed inset-x-0 bottom-0 z-[57] border-t bg-background/85 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] backdrop-blur-xl transition-transform duration-200 md:hidden",
          typing && "translate-y-full",
        )}
        data-bottom-nav=""
      >
        <ul className="mx-auto grid h-15 max-w-md" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {before.map(renderTab)}
          {clockIn ? (
            <li className="flex items-center justify-center">
              {/* The walk-day action: a raised round button, one tap from anywhere. */}
              <Link
                aria-current={clockInActive ? "page" : undefined}
                aria-label={`Clock in to ${clockIn.title}`}
                className="flex -translate-y-3 touch-manipulation flex-col items-center gap-0.5 text-[11px] font-semibold text-foreground"
                href={clockIn.href}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg ring-4 ring-background">
                  <LogIn aria-hidden className="size-5" />
                </span>
                Clock in
              </Link>
            </li>
          ) : null}
          {after.map(renderTab)}
          <li className="flex">
            <button
              aria-expanded={moreOpen}
              aria-haspopup="dialog"
              className={tabClass(moreActive || moreOpen)}
              onClick={() => setMoreOpen(true)}
              type="button"
            >
              <Tab active={moreActive} icon={Menu} label="More" />
            </button>
          </li>
        </ul>
      </nav>

      <Drawer direction="bottom" onOpenChange={setMoreOpen} open={moreOpen}>
        <DrawerContent data-bottom-nav-sheet="">
          <DrawerHeader className="mb-0 border-b px-5 pt-5 pb-4">
            <DrawerTitle>More</DrawerTitle>
            <DrawerDescription className="sr-only">The rest of the site&apos;s pages</DrawerDescription>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-y-contain px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {more.map((group) =>
              group.items.length ? (
                <div className="flex flex-col gap-1" key={group.label}>
                  <p className="pb-1 text-xs font-medium text-muted-foreground">{group.label}</p>
                  {group.items.map((item) => {
                    const Icon = ICONS[item.label];
                    const active = isNavItemActive(pathname, item.href);
                    const className = cn(
                      "flex items-center gap-3 rounded-lg px-2 py-2.5 text-base font-medium transition-colors active:bg-muted",
                      active && "bg-muted",
                    );
                    const content = (
                      <>
                        {Icon ? <Icon aria-hidden className="size-5 text-muted-foreground" /> : null}
                        {item.label}
                      </>
                    );
                    return item.href.startsWith("/") ? (
                      <Link
                        aria-current={active ? "page" : undefined}
                        className={className}
                        href={item.href}
                        key={item.href}
                        onClick={() => setMoreOpen(false)}
                      >
                        {content}
                      </Link>
                    ) : (
                      <a
                        className={className}
                        href={item.href}
                        key={item.href}
                        {...(item.newTab ? { rel: "noopener noreferrer", target: "_blank" } : {})}
                      >
                        {content}
                      </a>
                    );
                  })}
                </div>
              ) : null,
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
