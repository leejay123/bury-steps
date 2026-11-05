"use client";

import { usePathname } from "next/navigation";
import { createElement, type ReactNode } from "react";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  History,
  LayoutDashboard,
  MailCheck,
  MessageSquare,
  Bell,
  Settings,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { SETTINGS_PAGE_ICONS } from "@/components/settings-page-icons";

/** Each dashboard page's icon, the same as its sidebar link's (sidebar-nav.tsx). */
const PAGE_ICONS: [string, LucideIcon][] = [
  ["/overview", LayoutDashboard],
  ["/admin/walks", Calendar],
  ["/walks", Calendar],
  ["/w/", Calendar],
  ["/notices", Bell],
  ["/progress", TrendingUp],
  ["/history", History],
  ["/admin/members", Users],
  ["/admin/messages", MessageSquare],
  ["/admin/reports", ClipboardList],
  ["/admin/settings", Settings],
  ["/email-preferences", MailCheck],
];

function iconFor(path: string | null): LucideIcon {
  if (!path) return BookOpen;
  const settings = Object.entries(SETTINGS_PAGE_ICONS).find(([href]) => path === href || path.startsWith(`${href}/`));
  if (settings) return settings[1];
  return PAGE_ICONS.find(([href]) => path === href || path.startsWith(href.endsWith("/") ? href : `${href}/`))?.[1] ?? BookOpen;
}

/**
 * A page top's title with the page's icon in a small rounded box before it, as on Terms,
 * Privacy and the other plain pages (legal.tsx PlainHero). Icon and first word never part.
 */
export function PageTopTitle({ children }: { children: ReactNode }) {
  const icon_ = iconFor(usePathname());
  const icon = (
    <span
      aria-hidden="true"
      className="me-[0.18em] size-[0.82em] -translate-y-[0.05em] border border-foreground/[0.12] align-middle inline-flex items-center justify-center rounded-[0.24em] bg-background [&_svg]:size-[0.5em] [&_svg]:stroke-[1.5]"
      data-page-top-icon=""
    >
      {createElement(icon_)}
    </span>
  );
  if (typeof children !== "string") {
    return (
      <>
        {icon}
        {children}
      </>
    );
  }
  const [first, ...rest] = children.split(" ");
  return (
    <>
      <span className="whitespace-nowrap">
        {icon}
        {first}
      </span>
      {rest.length ? ` ${rest.join(" ")}` : null}
    </>
  );
}
