"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { unlockIdleDocument } from "@/components/overlay-root";
import { DataList, DataListBody, DataListGroupHeader, DataListItem } from "@/components/data-list";

export type SettingsGridItem = {
  description: string;
  href: string;
  title: string;
  icon: LucideIcon;
  /** "danger" flags an irreversible/destructive action (e.g. Reset the
   * site) — same red treatment as SettingsSection's danger tone. */
  tone?: "default" | "danger";
};

export type SettingsGridGroup = {
  label: string;
  items: SettingsGridItem[];
};

function SettingsGridRow({ item }: { item: SettingsGridItem }) {
  const danger = item.tone === "danger";
  return (
    <DataListItem className="relative">
      <item.icon
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
