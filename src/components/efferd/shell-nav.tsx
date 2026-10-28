"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import {
  ArrowLeftIcon,
  BarChart3Icon,
  BellIcon,
  BookOpenIcon,
  ClipboardListIcon,
  FootprintsIcon,
  HistoryIcon,
  HomeIcon,
  LayoutGridIcon,
  MailIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import type { RememberedNavItem } from "@/lib/remembered-nav";
import { leaveDashboardView } from "@/components/dashboard/dashboard-view";

/**
 * Feeds Efferd's app shells (the dashboard test) the site's real menu and
 * the signed-in person, in place of their example links and user. Their
 * files read it with useShellNav() where they had fixed lists.
 */
export type ShellNavItem = {
  title: string;
  url: string;
  path: string;
  icon: ReactNode;
  isActive?: boolean;
  subItems?: ShellNavItem[];
};
export type ShellNavGroup = { label?: string; items: ShellNavItem[] };
/** The signed-in person as the browser knows them (their initial and photo, from cookies). */
export type ShellUser = { name: string; email: string; avatar: string; initial: string };

/** The link that leaves the dashboard view (handled below, not a real page). */
export const BACK_TO_SITE = "#back-to-site";

type ShellNav = {
  navGroups: ShellNavGroup[];
  footerNavLinks: ShellNavItem[];
  navLinks: ShellNavItem[];
  user: ShellUser;
  /** The avatar menu's Log out item (needs the site's sign-in code, passed in from the layout). */
  signOut: ReactNode;
};

const ShellNavContext = createContext<ShellNav | null>(null);

const ICONS: Record<string, ReactNode> = {
  "/dashboard": <LayoutGridIcon />,
  "/": <HomeIcon />,
  "/walks": <FootprintsIcon />,
  "/admin/walks": <FootprintsIcon />,
  "/notices": <BellIcon />,
  "/progress": <BarChart3Icon />,
  "/history": <HistoryIcon />,
  "/admin/members": <UsersIcon />,
  "/admin/messages": <MailIcon />,
  "/admin/reports": <ClipboardListIcon />,
  "/admin/settings": <SettingsIcon />,
  "/admin/guide": <BookOpenIcon />,
};
const MANAGE = ["/admin/members", "/admin/messages", "/admin/reports", "/admin/settings"];

function active(pathname: string, href: string) {
  if (href === "/" || href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ShellNavProvider({
  menu,
  pathname,
  user,
  signOut,
  children,
}: {
  menu: RememberedNavItem[];
  pathname: string;
  user: ShellUser;
  signOut: ReactNode;
  children: ReactNode;
}) {
  const item = (href: string, label: string): ShellNavItem => ({
    title: label,
    url: href,
    path: href,
    icon: ICONS[href] ?? <LayoutGridIcon />,
    isActive: active(pathname, href),
  });
  const all = [item("/dashboard", "Overview"), ...menu.map((entry) => item(entry.href, entry.label))];
  const pages = all.filter((entry) => !MANAGE.includes(entry.url) && entry.url !== "/admin/guide");
  const manage = all.filter((entry) => MANAGE.includes(entry.url));
  const guide = all.filter((entry) => entry.url === "/admin/guide");
  const footerNavLinks: ShellNavItem[] = [
    ...guide,
    { title: "Back to the site", url: BACK_TO_SITE, path: BACK_TO_SITE, icon: <ArrowLeftIcon /> },
  ];
  const navGroups: ShellNavGroup[] = [
    { label: "Bury Steps", items: pages },
    ...(manage.length ? [{ label: "Manage", items: manage }] : []),
  ];

  // "Back to the site" anywhere in the shell leaves the dashboard view.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.(`a[href="${BACK_TO_SITE}"]`);
      if (!link) return;
      event.preventDefault();
      leaveDashboardView();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <ShellNavContext.Provider
      value={{ navGroups, footerNavLinks, navLinks: [...pages, ...manage, ...footerNavLinks], user, signOut }}
    >
      {children}
    </ShellNavContext.Provider>
  );
}

export function useShellNav(): ShellNav {
  const value = useContext(ShellNavContext);
  if (!value) throw new Error("useShellNav needs ShellNavProvider");
  return value;
}
