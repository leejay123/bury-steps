"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  Footprints,
  History,
  Home,
  LayoutGrid,
  Mail,
  Menu,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useClientPathname } from "@/components/client-pathname";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV_COOKIE, parseRememberedNav, type RememberedNavItem } from "@/lib/remembered-nav";
import { cn } from "@/lib/utils";
import { leaveDashboardView } from "./dashboard-view";

/** Whether <html data-view="dashboard"> is set (it changes when Dashboard / Back to site is pressed). */
function useDashboardView(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-view"] });
      return () => observer.disconnect();
    },
    () => document.documentElement.getAttribute("data-view") === "dashboard",
    () => false,
  );
}

function readMenu(): RememberedNavItem[] {
  const raw = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${NAV_COOKIE}=`))
    ?.slice(NAV_COOKIE.length + 1);
  return parseRememberedNav(raw);
}

const ICONS: Record<string, LucideIcon> = {
  "/": Home,
  "/notices": Bell,
  "/progress": BarChart3,
  "/history": History,
  "/admin/members": Users,
  "/admin/messages": Mail,
  "/admin/reports": ClipboardList,
  "/admin/settings": Settings,
  "/admin/guide": BookOpen,
};
function iconFor(href: string): LucideIcon {
  if (href === "/walks" || href === "/admin/walks") return Footprints;
  return ICONS[href] ?? LayoutGrid;
}

/** The organiser pages go under Manage; everyone's own pages under Pages. */
const MANAGE = ["/admin/members", "/admin/messages", "/admin/reports", "/admin/settings", "/admin/guide"];

function isActive(pathname: string, href: string) {
  if (href === "/" || href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The dashboard frame (a test alongside the normal site): a side menu and a
 * top bar around whichever page is open, in one of four designs after
 * Efferd's dashboards (Settings → Branding → Dashboard design; <html
 * data-dash-design>). Drawn only in the dashboard view; the page itself is
 * the site's own.
 */
export function DashboardShell({ design }: { design: string }) {
  const on = useDashboardView();
  const pathname = useClientPathname() ?? "/";
  // Read only in the browser (the view is never on during the server render).
  const menu = on ? readMenu() : [];
  // The phone menu closes by itself on a page change (it belongs to the page it opened on).
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (next: boolean) => setOpenAt(next ? pathname : null);

  // Signed out (no menu any more): back to the normal site.
  useEffect(() => {
    if (on && menu.length === 0) leaveDashboardView();
  }, [on, menu.length]);

  if (!on) return null;

  const items = [{ href: "/dashboard", label: "Overview" }, ...menu];
  const pages = items.filter((item) => !MANAGE.includes(item.href));
  const manage = items.filter((item) => MANAGE.includes(item.href));
  const current = items.find((item) => isActive(pathname, item.href))?.label ?? "Page";

  const nav = (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3" data-dash-nav="">
      {[
        { label: "Pages", list: pages },
        { label: "Manage", list: manage },
      ].map((group) =>
        group.list.length ? (
          <div className="flex flex-col gap-0.5" key={group.label}>
            <p className="px-2 pb-1 text-xs text-muted-foreground">{group.label}</p>
            {group.list.map((item) => {
              const Icon = iconFor(item.href);
              const active = isActive(pathname, item.href);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active && "bg-muted font-medium text-foreground",
                  )}
                  data-dash-item=""
                  href={item.href}
                  key={item.href}
                >
                  <Icon aria-hidden className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ) : null,
      )}
    </nav>
  );
  const back = (
    <button
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      onClick={leaveDashboardView}
      type="button"
    >
      <ArrowLeft aria-hidden className="size-4" />
      Back to the site
    </button>
  );

  return (
    <div data-dash-shell={design}>
      {/* The side menu (computers and tablets). */}
      <aside
        className="fixed inset-y-0 left-0 z-[70] hidden w-60 flex-col border-r bg-background md:flex"
        data-dash-sidebar=""
      >
        <div className="flex h-14 shrink-0 items-center border-b px-4" data-dash-brand="">
          <Link className="font-semibold tracking-tight" href="/dashboard">
            Bury Steps
          </Link>
        </div>
        {nav}
        <div className="border-t p-3">{back}</div>
      </aside>
      {/* The top bar: the page's name, and the menu on phones. */}
      <header
        className="fixed top-0 right-0 left-0 z-[69] flex h-14 items-center gap-3 border-b bg-background px-4 md:left-60 md:px-6"
        data-dash-topbar=""
      >
        <Sheet onOpenChange={setOpen} open={open}>
          <SheetTrigger asChild>
            <button
              aria-label="Open the dashboard menu"
              className="-ml-1 rounded-md p-1.5 hover:bg-muted md:hidden"
              type="button"
            >
              <Menu aria-hidden className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent className="flex w-72 flex-col gap-0 p-0" side="left">
            <SheetHeader className="h-14 justify-center border-b px-4">
              <SheetTitle>Bury Steps</SheetTitle>
            </SheetHeader>
            {nav}
            <div className="border-t p-3">{back}</div>
          </SheetContent>
        </Sheet>
        <p className="flex min-w-0 items-center gap-2 text-sm">
          <span className="text-muted-foreground">Dashboard</span>
          <span aria-hidden className="text-muted-foreground">
            /
          </span>
          <span className="truncate font-medium">{current}</span>
        </p>
      </header>
    </div>
  );
}
