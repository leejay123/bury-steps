"use client";

import { Fragment } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  ChevronRight,
  ClipboardList,
  HelpCircle,
  ImageIcon,
  Mail,
  Palette,
  Quote,
  RefreshCw,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { unlockIdleDocument } from "@/components/overlay-root";
import { DataList, DataListBody, DataListGroupHeader, DataListItem } from "@/components/data-list";

export type SettingsGridItem = {
  description: string;
  href: string;
  title: string;
  /** "danger" flags an irreversible/destructive action (e.g. Reset the
   * site) — same red treatment as SettingsSection's danger tone. */
  tone?: "default" | "danger";
};

export type SettingsGridGroup = {
  label: string;
  items: SettingsGridItem[];
};

// A React component reference (what an <Icon/> actually is) can't cross
// the server → client boundary as a prop — Next.js can only serialize
// plain data there. So the server-rendered page (page.tsx) sends plain
// hrefs/titles/descriptions, and this client component — which is where
// the icons actually render — looks the icon up by href itself.
const ITEM_ICONS: Record<string, LucideIcon> = {
  "/admin/settings/hero-photos": ImageIcon,
  "/admin/settings/testimonials": Quote,
  "/admin/settings/faqs": HelpCircle,
  "/admin/settings/notices": Bell,
  "/admin/settings/emails": Mail,
  "/admin/settings/subscribers": Users,
  "/admin/settings/display": Palette,
  "/admin/settings/progress": TrendingUp,
  "/admin/settings/cache": RefreshCw,
  "/admin/settings/reset": AlertTriangle,
  "/admin/reports": ClipboardList,
  "/admin/guide": BookOpen,
};

function SettingsGridRow({ item }: { item: SettingsGridItem }) {
  const danger = item.tone === "danger";
  const Icon = ITEM_ICONS[item.href] ?? HelpCircle;
  return (
    <DataListItem className="relative">
      <Icon
        aria-hidden
        className={cn("size-4 shrink-0", danger ? "text-destructive" : "text-muted-foreground")}
      />
      <DataListBody>
        <p className={cn("font-semibold leading-none", danger && "text-destructive")}>
          <Link
            className="after:absolute after:inset-0"
            href={item.href}
            onClick={() => {
              unlockIdleDocument();
            }}
            onPointerDown={() => {
              unlockIdleDocument();
            }}
          >
            {item.title}
          </Link>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
      </DataListBody>
      <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
    </DataListItem>
  );
}

/** Grouped settings list for the hub page — each group gets its own
 * header strip (same DataListGroupHeader used for the grouped Members
 * list), a group with no items is skipped entirely so a viewer only ever
 * sees categories that actually have something in them. */
export function SettingsGrid({ groups }: { groups: SettingsGridGroup[] }) {
  const nonEmpty = groups.filter((group) => group.items.length > 0);
  return (
    <DataList>
      {nonEmpty.map((group) => (
        <Fragment key={group.label}>
          <DataListGroupHeader count={group.items.length} label={group.label} />
          {group.items.map((item) => (
            <SettingsGridRow item={item} key={item.href} />
          ))}
        </Fragment>
      ))}
    </DataList>
  );
}
